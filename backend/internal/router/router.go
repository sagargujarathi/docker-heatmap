package router

import (
	"docker-heatmap/internal/config"
	"docker-heatmap/internal/handlers"
	"docker-heatmap/internal/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func SetupRouter() *fiber.App {
	app := fiber.New(fiber.Config{
		ErrorHandler: customErrorHandler,
		AppName:      "Docker Heatmap API",
	})

	// Global middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${method} ${path} ${latency}\n",
	}))

	// CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins:     config.AppConfig.FrontendURL,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"service": "docker-heatmap-api",
		})
	})

	// API routes
	api := app.Group("/api")
	api.Use(middleware.EnforceJSONMiddleware())

	// Initialize handlers
	authHandler := handlers.NewAuthHandler()
	dockerHandler := handlers.NewDockerHandler()
	heatmapHandler := handlers.NewHeatmapHandler()
	userHandler := handlers.NewUserHandler()

	// Public routes (with rate limiting)
	public := api.Group("")
	public.Use(middleware.PublicRateLimitMiddleware())

	// SVG and JSON endpoints (public, embeddable)
	public.Get("/heatmap/:username", heatmapHandler.GetHeatmapSVG)
	public.Get("/heatmap/:username.svg", heatmapHandler.GetHeatmapSVG)
	public.Get("/activity/:username", heatmapHandler.GetActivityJSON)
	public.Get("/activity/:username.json", heatmapHandler.GetActivityJSON)
	public.Get("/profile/:username", heatmapHandler.GetProfilePage)
	public.Get("/themes", heatmapHandler.GetAvailableThemes)

	// Auth routes (strict rate limiting)
	auth := api.Group("/auth")
	auth.Use(middleware.StrictRateLimitMiddleware())
	auth.Get("/github", authHandler.InitiateGitHubAuth)
	auth.Get("/github/callback", authHandler.GitHubCallback)

	// Protected routes (require authentication)
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware())
	protected.Use(middleware.APIRateLimitMiddleware())

	// User routes
	protected.Get("/user/me", userHandler.GetProfile)
	protected.Put("/user/me", userHandler.UpdateProfile)
	protected.Get("/user/embed", userHandler.GetEmbedCode)
	protected.Post("/auth/logout", authHandler.Logout)

	// Docker routes
	protected.Post("/docker/connect", dockerHandler.ConnectDocker)
	protected.Get("/docker/account", dockerHandler.GetDockerAccount)
	protected.Delete("/docker/disconnect", dockerHandler.DisconnectDocker)
	protected.Post("/docker/sync", dockerHandler.SyncDockerActivity)

	return app
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	return c.Status(code).JSON(fiber.Map{
		"error": err.Error(),
	})
}
