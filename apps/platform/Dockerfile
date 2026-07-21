# Step 1: Build the Vite application
FROM node:24-slim AS builder
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
ENV SKIP_ENV_VALIDATION=1

# Copy the entire repository for workspace context
COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache bun install

# Build the storefront package
RUN bun run build --filter @mumzo/platform
ENV SKIP_ENV_VALIDATION=

# Step 2: Serve using Nginx
FROM nginx:alpine
COPY --from=builder /app/apps/platform/dist /usr/share/nginx/html

# Copy Nginx template to handle HTML5 client-side routing and dynamic Railway PORT variable
COPY apps/platform/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
