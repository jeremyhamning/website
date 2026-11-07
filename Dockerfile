# --- Stage 1: build the static site ---
# Debian-based (glibc) rather than alpine: TypeScript 7's native tsc binary
# and Vite's native deps are most reliable on glibc.
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Install deps first so this layer is cached until package*.json changes
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: serve dist/ with Caddy (no node in the final image) ---
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
