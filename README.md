# Praetorium

![Homescreen screenshot](.github/home.png)

Praetorium is a self-hosted start page ("application hub") for your homelab/server. It’s designed to be configured from the UI: add apps + bookmarks, pin favourites, theme it, and keep everything behind optional authentication.

## Acknowledgements / Upstream

This repository is a fork of `fdarveau/praetorium`, which itself was a fork of the original project.

- Original project: `pawelmalak/praetorium` (the upstream that introduced Praetorium)
- Intermediate fork: `fdarveau/praetorium`
- Design inspiration: [SUI](https://github.com/jeroenpardon/sui)

> **Note:** The old `ghcr.io/fdarveau/praetorium` container image is no longer accessible. This fork builds locally and does not depend on any external registry.

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

### Docker Compose (recommended)

The easiest way to run Praetorium:

```sh
# Set your password and start (pulls from GitHub Container Registry)
export PRAETORIUM_PASSWORD="your-secure-password"
curl -O https://raw.githubusercontent.com/AliasNoob/Praetorium/master/.docker/docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d
```

Access Praetorium at `http://localhost:5005`

#### Upgrading

Praetorium uses semantic versioning. Upgrades are safe and non-destructive:

```sh
# Option 1: Update to latest
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Option 2: Pin to a specific version
export PRAETORIUM_TAG=v2.4.0
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

**What happens during an upgrade:**
- Your data volume (`praetorium_data`) is preserved
- Database migrations run automatically on startup
- A backup is created in `/app/data/db_backups/` before migrations

**Rollback to a previous version:**
```sh
export PRAETORIUM_TAG=v2.3.1  # or whatever version you want
docker compose -f docker-compose.prod.yml up -d
```

#### Configuration options

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `PRAETORIUM_PASSWORD` | `changeme` | **Required.** Authentication password |
| `PRAETORIUM_PORT` | `5005` | Host port mapping |
| `PRAETORIUM_TAG` | `latest` | Docker image tag (e.g., `v2.4.0`, `2.4`, `latest`) |
| `BASE_URL` | - | External URL for reverse proxy setups |

#### Using Docker secrets (more secure)

For production, use Docker secrets instead of environment variables:

```sh
# Create secrets directory and password file
mkdir -p secrets
echo "your-secure-password" > secrets/password.txt
chmod 600 secrets/password.txt
```

Then uncomment the secrets sections in `docker-compose.yml` and change `PASSWORD` to `PASSWORD_FILE`.

#### Portainer deployment

1. Create a new Stack from the compose file
2. Add environment variable: `PRAETORIUM_PASSWORD=your-secure-password`
3. Optionally set `PRAETORIUM_PORT` if 5005 is in use
4. Deploy the stack

### Docker (build locally)

If you prefer to build from source (for development or customization):

```sh
# Clone the repo
git clone https://github.com/AliasNoob/Praetorium.git
cd praetorium

# Build and run
docker compose -f .docker/docker-compose.yml up -d --build
```

Or build manually:

```sh
# Build the image
docker build -t praetorium -f .docker/Dockerfile .

# Run with a named volume (recommended)
docker run -d \
  --name praetorium \
  -p 5005:5005 \
  -v praetorium_data:/app/data \
  -e PASSWORD=your-secure-password \
  praetorium
```

#### With Docker integration

To enable Docker container discovery, mount the Docker socket:

```sh
docker run -d \
  --name praetorium \
  -p 5005:5005 \
  -v praetorium_data:/app/data \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e PASSWORD=your-secure-password \
  praetorium
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
- Start Page Command Center: One page to rule them all Ability to launch Desktop applications / Scripts
- Calander & Todo Integrations
- Notes & News Integrations
- AI Integrations 
