.PHONY: help build up down logs restart clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker image
	docker-compose build

up: ## Start containers
	docker-compose up -d

down: ## Stop containers
	docker-compose down

logs: ## View logs
	docker-compose logs -f oauth-server

restart: ## Restart containers
	docker-compose restart

clean: ## Remove containers and volumes
	docker-compose down -v

dev: ## Start in development mode (with logs)
	docker-compose up

rebuild: ## Rebuild and restart
	docker-compose up --build --force-recreate -d

