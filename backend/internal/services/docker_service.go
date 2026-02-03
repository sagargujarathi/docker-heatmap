package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"docker-heatmap/internal/config"
	"docker-heatmap/internal/database"
	"docker-heatmap/internal/models"
	"docker-heatmap/internal/utils"

	"gorm.io/gorm"
)

var (
	ErrDockerHubAuthFailed   = errors.New("docker hub authentication failed")
	ErrDockerAccountNotFound = errors.New("docker account not found")
	ErrDockerAccountExists   = errors.New("docker account already connected")
	ErrInvalidDockerToken    = errors.New("invalid docker hub access token")
)

// Use shared HTTP client from utils package
var httpClient = utils.HTTPClient

type DockerHubService struct {
	apiURL string
}

func NewDockerHubService() *DockerHubService {
	return &DockerHubService{
		apiURL: config.AppConfig.DockerHubAPIURL,
	}
}

// parseDockerHubTime parses Docker Hub's date format which includes microseconds
func parseDockerHubTime(dateStr string) (time.Time, error) {
	formats := []string{
		"2006-01-02T15:04:05.999999Z",
		"2006-01-02T15:04:05.999999-07:00",
		time.RFC3339Nano,
		time.RFC3339,
	}

	for _, format := range formats {
		if t, err := time.Parse(format, dateStr); err == nil {
			return t, nil
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse date: %s", dateStr)
}

// ConnectAccount validates and connects a Docker Hub account.
func (s *DockerHubService) ConnectAccount(ctx context.Context, userID uint, dockerUsername, accessToken string) (*models.DockerAccount, error) {
	var account models.DockerAccount

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Check for username conflict
		var conflict models.DockerAccount
		if err := tx.Unscoped().Where("docker_username = ? AND user_id != ?", dockerUsername, userID).First(&conflict).Error; err == nil {
			return errors.New("this Docker username is connected to another account")
		}

		// 2. Clear existing records
		var accountIDs []uint
		tx.Unscoped().Model(&models.DockerAccount{}).Where("user_id = ? OR docker_username = ?", userID, dockerUsername).Pluck("id", &accountIDs)

		if len(accountIDs) > 0 {
			tx.Unscoped().Where("docker_account_id IN ?", accountIDs).Delete(&models.ActivityEvent{})
			tx.Unscoped().Where("id IN ?", accountIDs).Delete(&models.DockerAccount{})
		}

		// 3. Validation
		if err := s.validateUsername(ctx, dockerUsername); err != nil {
			return err
		}
		if _, err := s.login(ctx, dockerUsername, accessToken); err != nil {
			return fmt.Errorf("invalid access token: %w", err)
		}

		// 4. Encrypt and Save
		encryptedToken, iv, err := utils.Encrypt(accessToken)
		if err != nil {
			return err
		}

		account = models.DockerAccount{
			UserID:         userID,
			DockerUsername: dockerUsername,
			EncryptedToken: encryptedToken,
			TokenIV:        iv,
			IsActive:       true,
			AutoRefresh:    true,
		}

		return tx.Create(&account).Error
	})

	if err != nil {
		return nil, err
	}

	// Initial sync
	go func() {
		syncCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()
		s.SyncActivity(syncCtx, account.ID)
	}()

	return &account, nil
}

// SyncActivity syncs Docker Hub activity for an account
func (s *DockerHubService) SyncActivity(ctx context.Context, accountID uint) error {
	var account models.DockerAccount
	if err := database.DB.First(&account, accountID).Error; err != nil {
		return err
	}

	account.SyncInProgress = true
	database.DB.Save(&account)

	defer func() {
		account.SyncInProgress = false
		now := time.Now()
		account.LastSyncAt = &now
		database.DB.Save(&account)
	}()

	pat, err := utils.Decrypt(account.EncryptedToken, account.TokenIV)
	if err != nil {
		return err
	}

	token, err := s.login(ctx, account.DockerUsername, pat)
	if err != nil {
		account.LastSyncError = "Authentication failed"
		return err
	}

	repos, err := s.FetchRepositories(ctx, account.DockerUsername, token)
	if err != nil {
		account.LastSyncError = "Failed to fetch repositories"
		return err
	}

	eventsCreated := 0
	for _, repo := range repos {
		if repo.LastUpdated != "" {
			if t, err := parseDockerHubTime(repo.LastUpdated); err == nil {
				if s.createActivity(&account, models.EventTypePush, t, repo.Name, "") {
					eventsCreated++
				}
			}
		}

		tags, _ := s.FetchTags(ctx, account.DockerUsername, repo.Name, token)
		for _, tag := range tags {
			if tag.TagLastPushed != "" {
				if t, err := parseDockerHubTime(tag.TagLastPushed); err == nil {
					if s.createActivity(&account, models.EventTypePush, t, repo.Name, tag.Name) {
						eventsCreated++
					}
				}
			}
		}
	}

	account.LastSyncError = ""
	return nil
}

func (s *DockerHubService) createActivity(account *models.DockerAccount, eventType models.EventType, eventDate time.Time, repo, tag string) bool {
	normalizedDate := time.Date(eventDate.Year(), eventDate.Month(), eventDate.Day(), 0, 0, 0, 0, time.UTC)

	var existing models.ActivityEvent
	err := database.DB.Where("docker_account_id = ? AND event_date = ? AND repository = ? AND tag = ?",
		account.ID, normalizedDate, repo, tag).First(&existing).Error

	if err == nil {
		existing.Count++
		database.DB.Save(&existing)
		return false
	}

	database.DB.Create(&models.ActivityEvent{
		DockerAccountID: account.ID,
		EventType:       eventType,
		EventDate:       normalizedDate,
		Repository:      repo,
		Tag:             tag,
		Count:           1,
	})
	return true
}

func (s *DockerHubService) GetActivitySummary(dockerUsername string, days int) ([]models.ActivitySummary, error) {
	account, err := s.GetDockerAccountByUsername(dockerUsername)
	if err != nil {
		return nil, err
	}

	startDate := time.Now().UTC().AddDate(0, 0, -days)
	startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, time.UTC)

	var events []models.ActivityEvent
	database.DB.Where("docker_account_id = ? AND event_date >= ?", account.ID, startDate).Find(&events)

	dateMap := make(map[string]*models.ActivitySummary)
	maxCount := 0

	for _, event := range events {
		dateStr := event.EventDate.Format("2006-01-02")
		if _, ok := dateMap[dateStr]; !ok {
			dateMap[dateStr] = &models.ActivitySummary{Date: dateStr}
		}
		dateMap[dateStr].TotalCount += event.Count
		if dateMap[dateStr].TotalCount > maxCount {
			maxCount = dateMap[dateStr].TotalCount
		}
	}

	summaries := make([]models.ActivitySummary, 0, days+1)
	for d := startDate; !d.After(time.Now().UTC()); d = d.AddDate(0, 0, 1) {
		dateStr := d.Format("2006-01-02")
		summary := models.ActivitySummary{Date: dateStr}
		if s, ok := dateMap[dateStr]; ok {
			summary.TotalCount = s.TotalCount
			summary.Level = calculateLevel(s.TotalCount, maxCount)
		}
		summaries = append(summaries, summary)
	}

	return summaries, nil
}

func calculateLevel(count, maxCount int) int {
	if count == 0 || maxCount == 0 {
		return 0
	}
	ratio := float64(count) / float64(maxCount)
	if ratio > 0.75 {
		return 4
	}
	if ratio > 0.5 {
		return 3
	}
	if ratio > 0.25 {
		return 2
	}
	return 1
}

func (s *DockerHubService) GetDockerAccount(userID uint) (*models.DockerAccount, error) {
	var account models.DockerAccount
	if err := database.DB.Where("user_id = ?", userID).First(&account).Error; err != nil {
		return nil, ErrDockerAccountNotFound
	}
	return &account, nil
}

func (s *DockerHubService) GetDockerAccountByUsername(dockerUsername string) (*models.DockerAccount, error) {
	var account models.DockerAccount
	if err := database.DB.Where("docker_username = ?", dockerUsername).First(&account).Error; err != nil {
		return nil, ErrDockerAccountNotFound
	}
	return &account, nil
}

func (s *DockerHubService) DisconnectAccount(userID, accountID uint) error {
	database.DB.Unscoped().Where("docker_account_id = ?", accountID).Delete(&models.ActivityEvent{})
	result := database.DB.Unscoped().Where("id = ? AND user_id = ?", accountID, userID).Delete(&models.DockerAccount{})
	if result.RowsAffected == 0 {
		return ErrDockerAccountNotFound
	}
	return nil
}
