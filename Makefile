.PHONY: help up upd down build seed db logs logs-api logs-web ps reset clean db-shell migrate studio

## Show available commands
help:
	@echo ""
	@echo "🗺️  AnchorMap GIS — Make Commands"
	@echo "================================="
	@echo "  make up          Build + start all services"
	@echo "  make upd         Build + start (detached/background)"
	@echo "  make down        Stop all services"
	@echo "  make build       Rebuild all Docker images"
	@echo "  make seed        Run database seed (categories + admin user)"
	@echo "  make db          Start only the database"
	@echo "  make logs        Follow all service logs"
	@echo "  make logs-api    Follow API logs"
	@echo "  make logs-web    Follow Web logs"
	@echo "  make ps          Show running containers"
	@echo "  make reset       Stop + delete volumes (fresh database)"
	@echo "  make clean       Remove all containers, images, volumes"
	@echo "  make db-shell    Open PostgreSQL shell"
	@echo "  make migrate     Run pending migrations"
	@echo "  make studio      Open Prisma Studio"
	@echo ""

## Build and start all services
up:
	docker compose up --build

## Build and start in background
upd:
	docker compose up --build -d

## Stop all services
down:
	docker compose down

## Rebuild all Docker images
build:
	docker compose build --no-cache

## Run database seed
seed:
	docker compose --profile seed run --rm seed

## Start only the database container
db:
	docker compose up db -d

## Follow all service logs
logs:
	docker compose logs -f

## Follow API logs
logs-api:
	docker compose logs -f api

## Follow Web logs
logs-web:
	docker compose logs -f web

## Show running containers
ps:
	docker compose ps

## Stop and delete all volumes (fresh database start)
reset:
	docker compose down -v

## Remove all containers, images, and volumes
clean:
	docker compose down -v --rmi all --remove-orphans

## Open PostgreSQL shell
db-shell:
	docker compose exec db psql -U postgres -d ankara_gis

## Run pending database migrations
migrate:
	docker compose exec api npx prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma

## Open Prisma Studio (visual database browser)
studio:
	npx prisma studio --schema=packages/database/prisma/schema.prisma
