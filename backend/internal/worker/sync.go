package worker

import (
	"context"
	"log"
	"time"

	"docker-heatmap/internal/database"
	"docker-heatmap/internal/models"
	"docker-heatmap/internal/services"

	"github.com/robfig/cron/v3"
)

type SyncWorker struct {
	cron          *cron.Cron
	dockerService *services.DockerHubService
}

func NewSyncWorker() *SyncWorker {
	return &SyncWorker{
		cron:          cron.New(),
		dockerService: services.NewDockerHubService(),
	}
}

// Start begins the background sync worker
func (w *SyncWorker) Start() {
	log.Println("Starting sync worker...")

	// Run cleanup daily at midnight
	if _, err := w.cron.AddFunc("0 0 * * *", w.cleanupOldData); err != nil {
		log.Printf("Failed to add cleanup cron job: %v", err)
	}

	// Run scheduled sync for all accounts every 6 hours
	if _, err := w.cron.AddFunc("0 */6 * * *", w.syncAllAccounts); err != nil {
		log.Printf("Failed to add scheduled sync cron job: %v", err)
	}

	w.cron.Start()
	log.Println("Sync worker started - (scheduled sync every 6 hours)")
}

// Stop gracefully stops the worker
func (w *SyncWorker) Stop() {
	log.Println("Stopping sync worker...")
	ctx := w.cron.Stop()
	<-ctx.Done()
	log.Println("Sync worker stopped")
}

// syncAllAccounts syncs activity for all active Docker accounts
func (w *SyncWorker) syncAllAccounts() {
	log.Println("Starting scheduled sync for all accounts...")

	var accounts []models.DockerAccount
	err := database.DB.Where("is_active = ? AND auto_refresh = ?", true, true).Find(&accounts).Error
	if err != nil {
		log.Printf("Failed to fetch accounts: %v", err)
		return
	}

	log.Printf("Found %d accounts to sync", len(accounts))

	for _, account := range accounts {
		// Skip if sync is already in progress
		if account.SyncInProgress {
			log.Printf("Skipping account %s - sync already in progress", account.DockerUsername)
			continue
		}

		// Check if we synced recently (within last 4 hours)
		if account.LastSyncAt != nil && time.Since(*account.LastSyncAt) < 4*time.Hour {
			log.Printf("Skipping account %s - synced recently", account.DockerUsername)
			continue
		}

		log.Printf("Syncing account: %s", account.DockerUsername)

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		err := w.dockerService.SyncActivity(ctx, account.ID)
		cancel()

		if err != nil {
			log.Printf("Failed to sync account %s: %v", account.DockerUsername, err)
		} else {
			log.Printf("Successfully synced account: %s", account.DockerUsername)
		}

		// Small delay between accounts to avoid rate limiting
		time.Sleep(2 * time.Second)
	}

	log.Println("Scheduled sync completed")
}

// cleanupOldData removes activity data older than 1 year
func (w *SyncWorker) cleanupOldData() {
	log.Println("Starting cleanup of old activity data...")

	cutoff := time.Now().AddDate(-1, 0, 0) // 1 year ago
	result := database.DB.Where("event_date < ?", cutoff).Delete(&models.ActivityEvent{})

	if result.Error != nil {
		log.Printf("Failed to cleanup old data: %v", result.Error)
		return
	}

	log.Printf("Cleaned up %d old activity records", result.RowsAffected)
}

// SyncSingleAccount syncs a specific account (for manual triggers)
func (w *SyncWorker) SyncSingleAccount(accountID uint) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()
	return w.dockerService.SyncActivity(ctx, accountID)
}
