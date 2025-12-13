# Praetorium

![Homescreen screenshot](.github/home.png)

Praetorium is a self-hosted start page ("application hub") for your homelab/server. It’s designed to be configured from the UI: add apps + bookmarks, pin favourites, theme it, and keep everything behind optional authentication.

## Acknowledgements / Upstream

This repository is a fork.

- Original project: `pawelmalak/praetorium` (the upstream that introduced Praetorium)
- Design inspiration: [SUI](https://github.com/jeroenpardon/sui)

Upstream docs and changelog history may be referenced in this README where the behaviour matches.

## What’s new in this fork

This fork focuses on **App Categories** and category-aware integrations.

- **App categories (first-class)**: apps can be assigned to categories via `categoryId`, with a dedicated Categories API.
- **Ordering + pinning for categories**: categories have `orderId`, can be pinned, and respect the instance ordering setting.
- **Docker integration: category-aware**: Docker labels can specify `praetorium.category`; unknown categories are created automatically.

## Features

- Create, update, delete your applications and bookmarks from the UI
- Pin favourites to the home screen
- Search bar with local filtering and web providers
- Authentication to protect settings
- Customization: themes, custom CSS
- Weather widget
- Integrations: Docker labels, Kubernetes ingress annotations

## Quick start

### Docker (build locally)

This repo includes Dockerfiles under `.docker/`.

```sh
docker build -t praetorium -f .docker/Dockerfile .

docker run \
  -p 5005:5005 \
  -v /path/to/host/data:/app/data \
  -e PASSWORD=praetorium_password \
  praetorium
```

Optional (required for Docker integration): mount the Docker socket.

```sh
docker run \
  -p 5005:5005 \
  -v /path/to/host/data:/app/data \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e PASSWORD=praetorium_password \
  praetorium
```

### Docker Compose

You can start from `.docker/docker-compose.yml`. A minimal example that builds locally:

```yaml
version: '3.6'

services:
  praetorium:
    build:
      context: .
      dockerfile: .docker/Dockerfile
    container_name: praetorium
    ports:
      - 5005:5005
    volumes:
      - /path/to/host/data:/app/data
      # - /var/run/docker.sock:/var/run/docker.sock # optional but required for Docker integration
    environment:
      - PASSWORD=praetorium_password
    restart: unless-stopped
```

### Local development (no Docker)

```sh
npm run dev-init
npm run dev
```

## Configuration

Praetorium reads environment variables (see `.env` for defaults in this repo).

Common variables:

- `PORT`: backend port (default `5005`)
- `PASSWORD`: password used for authentication
- `SECRET`: JWT signing secret
- `NODE_ENV`: `development` or `production`

Data persistence:

- SQLite DB: `./data/db.sqlite`
- Additional config/assets: `./data/*`

## Usage

### Authentication

See upstream docs: <https://github.com/pawelmalak/praetorium/wiki/Authentication>

### Search bar

Example: `/g what is docker` (prefix selects a provider). More details: <https://github.com/pawelmalak/praetorium/wiki/Search-bar>

### Weather

1. Get an API key from <https://www.weatherapi.com/>
2. Find your latitude/longitude
3. Enter it in settings and save

### Docker integration labels

Each container can provide labels like:

```yml
labels:
  - praetorium.type=application # "app" works too
  - praetorium.name=My container
  - praetorium.url=https://example.com
  - praetorium.category=My category # Optional; if missing defaults to "Docker"
  - praetorium.icon=icon-name # Optional; default "docker"
  - praetorium.order=1 # Optional; default 500 (lower shows first)
```

Multiple apps per container are supported by separating values with `;`.

### Kubernetes integration annotations

Ingress annotations example:

```yml
metadata:
  annotations:
    praetorium.pawelmalak/type: application # "app" works too
    praetorium.pawelmalak/name: My app
    praetorium.pawelmalak/url: https://example.com
    praetorium.pawelmalak/category: My category # Optional; default "Kubernetes"
    praetorium.pawelmalak/icon: icon-name # Optional
    praetorium.pawelmalak/order: "1" # Optional
```

## Screenshots

![Apps screenshot](.github/apps.png)

![Bookmarks screenshot](.github/bookmarks.png)

![Settings screenshot](.github/settings.png)

![Themes screenshot](.github/themes.png)

## Roadmap (ideas)

These are potential future improvements (not guarantees). If you want one, open an issue and we can prioritize.

- Category UX polish: faster bulk-assign and reorder flows
- Category permissions: per-category visibility rules for guest mode
- Import/export: backup/restore of apps/bookmarks/categories as a single bundle
- Integrations: richer label/annotation support (descriptions, public/private, icons)
- Observability: clearer integration health + last sync status for Docker/Kubernetes
