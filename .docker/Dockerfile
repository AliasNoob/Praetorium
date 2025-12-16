# =============================================================================
# Praetorium Dockerfile - Multi-stage optimized build
# =============================================================================
# Build locally:  docker build -t praetorium -f .docker/Dockerfile .
# Run:            docker run -p 5005:5005 -v praetorium_data:/app/data praetorium
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build the React client
# -----------------------------------------------------------------------------
FROM node:22-alpine AS client-builder

WORKDIR /build

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy only package files first (better layer caching)
COPY client/package*.json ./

# Install ALL dependencies (need devDependencies for build)
RUN npm ci

# Copy client source and build
COPY client/ ./
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Install production server dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS server-deps

WORKDIR /deps

# Install build dependencies for native modules (sqlite3, etc.)
RUN apk add --no-cache python3 make g++

# Copy only package files first
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# -----------------------------------------------------------------------------
# Stage 3: Final runtime image
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runtime

LABEL org.opencontainers.image.title="Praetorium"
LABEL org.opencontainers.image.description="Self-hosted start page for your homelab"
LABEL org.opencontainers.image.source="https://github.com/adavenport/praetorium"

WORKDIR /app

# Copy production node_modules from server-deps stage
COPY --from=server-deps /deps/node_modules ./node_modules

# Copy built client from client-builder stage
COPY --from=client-builder /build/build ./public

# Copy server source files
COPY package*.json ./
COPY server.js api.js Socket.js Sockets.js ./
COPY controllers/ ./controllers/
COPY db/ ./db/
COPY middleware/ ./middleware/
COPY models/ ./models/
COPY routes/ ./routes/
COPY utils/ ./utils/

# Create data directory
RUN mkdir -p ./data

# Expose default port
EXPOSE 5005

# Environment defaults (PASSWORD should be overridden at runtime!)
ENV NODE_ENV=production
# NOTE: Do NOT set PASSWORD here - pass it via environment or secrets at runtime

# Healthcheck to verify the server is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5005/api/config || exit 1

# Update permissions and set default user to "node" for rootless operation
RUN chown -R node:node /app
USER node

CMD ["node", "server.js"]