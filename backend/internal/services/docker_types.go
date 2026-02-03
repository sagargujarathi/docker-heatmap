package services

// DockerHubRepository represents a repository from Docker Hub API
type DockerHubRepository struct {
	Name        string `json:"name"`
	Namespace   string `json:"namespace"`
	Description string `json:"description"`
	LastUpdated string `json:"last_updated"`
	PullCount   int64  `json:"pull_count"`
	StarCount   int    `json:"star_count"`
	IsPrivate   bool   `json:"is_private"`
}

// DockerHubTag represents a tag from Docker Hub API
type DockerHubTag struct {
	Name          string `json:"name"`
	LastUpdated   string `json:"last_updated"`
	TagLastPushed string `json:"tag_last_pushed"`
	Digest        string `json:"digest"`
}

// dockerAccountSyncInfo contains data needed for background sync
type dockerAccountSyncInfo struct {
	ID             uint
	DockerUsername string
	AccessToken    string
}
