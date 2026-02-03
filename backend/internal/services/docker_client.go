package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
)

// login exchanges a PAT for a JWT token
func (s *DockerHubService) login(ctx context.Context, username, pat string) (string, error) {
	if pat == "" {
		return "", errors.New("PAT is required for login")
	}

	url := fmt.Sprintf("%s/users/login", s.apiURL)

	payload := map[string]string{
		"username": username,
		"password": pat,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("login request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return "", ErrInvalidDockerToken
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("docker hub login returned status %d", resp.StatusCode)
	}

	var loginResp struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&loginResp); err != nil {
		return "", fmt.Errorf("failed to decode login response: %w", err)
	}

	if loginResp.Token == "" {
		return "", errors.New("no token received from Docker Hub")
	}

	return loginResp.Token, nil
}

// validateUsername checks if a Docker Hub username exists
func (s *DockerHubService) validateUsername(ctx context.Context, username string) error {
	url := fmt.Sprintf("%s/users/%s", s.apiURL, username)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return err
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return errors.New("docker hub username not found")
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("docker hub returned status %d", resp.StatusCode)
	}

	return nil
}

// FetchRepositories fetches repositories for a Docker Hub user
func (s *DockerHubService) FetchRepositories(ctx context.Context, username, token string) ([]DockerHubRepository, error) {
	url := fmt.Sprintf("%s/repositories/%s/?page_size=100", s.apiURL, username)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	if token != "" {
		req.Header.Set("Authorization", "JWT "+token)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		log.Printf("Failed to fetch repos: %d - %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("failed to fetch repositories: status %d", resp.StatusCode)
	}

	var result struct {
		Results []DockerHubRepository `json:"results"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result.Results, nil
}

// FetchTags fetches tags for a specific repository
func (s *DockerHubService) FetchTags(ctx context.Context, username, repoName, token string) ([]DockerHubTag, error) {
	url := fmt.Sprintf("%s/repositories/%s/%s/tags?page_size=100", s.apiURL, username, repoName)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	if token != "" {
		req.Header.Set("Authorization", "JWT "+token)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch tags: status %d", resp.StatusCode)
	}

	var result struct {
		Results []DockerHubTag `json:"results"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result.Results, nil
}
