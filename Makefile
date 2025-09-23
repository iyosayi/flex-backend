.PHONY: help build up down logs dev clean

# Default target
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the Docker images
	docker-compose build

up: ## Start the API in production mode
	docker-compose up -d

dev: ## Start the API in development mode with hot reload
	docker-compose --profile dev up flex-api-dev

down: ## Stop all containers
	docker-compose down

logs: ## View container logs
	docker-compose logs -f

restart: ## Restart the API
	docker-compose restart

clean: ## Stop containers and remove volumes
	docker-compose down -v

rebuild: ## Rebuild and start containers
	docker-compose up --build -d

status: ## Show container status
	docker-compose ps
