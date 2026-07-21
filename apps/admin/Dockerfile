# Step 1: Build the Vite application
FROM node:24-slim AS builder
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
ENV SKIP_ENV_VALIDATION=1

# Copy the entire repository for workspace context
COPY . .
RUN bun install

# Build the admin package
RUN bun run build --filter @mumzo/admin
ENV SKIP_ENV_VALIDATION=

# Step 2: Serve using Nginx
FROM nginx:alpine
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html

# Copy Nginx template to handle HTML5 client-side routing and dynamic Railway PORT variable
COPY apps/admin/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
