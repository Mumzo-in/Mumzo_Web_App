# Railway Deployment Guide for Mumzo

This guide describes how to deploy the Mumzo monorepo (Hono API backend + Vite Admin and Platform static SPAs) to **Railway** (`railway.app`).

---

## 🛠️ Step 1: Install Railway CLI & Log In

The CLI allows you to log in, link local code, run migrations directly against the remote database, and deploy manually.

1. **Install CLI**:
   ```bash
   npm i -g @railway/cli
   ```
2. **Log In**:
   ```bash
   railway login
   ```
   *This opens a browser window to authenticate your terminal.*

---

## 💾 Step 2: Provision PostgreSQL Database

1. Go to the [Railway Dashboard](https://railway.app/).
2. Click **New Project** ➔ **Provision PostgreSQL**.
3. Railway will spin up a database and automatically create a `DATABASE_URL` environment variable inside your project.

---

## ⚙️ Step 3: Deploy the Hono API Server (`@mumzo/server`)

You will link the same GitHub repository to multiple services in Railway, using different **Root Directories**.

1. Click **New** ➔ **GitHub Repo** ➔ Select your `mumzo_app` repository.
2. Once the service is created, go to **Settings** and configure:
   * **Service Name**: `mumzo-api`
   * **Root Directory**: `apps/server` *(This tells Railway to build from the server folder context)*
   * **Build Command**: `bun install && bun run build`
   * **Start Command**: `bun run start` *(Runs `bun run dist/index.mjs`)*
3. Go to the **Variables** tab and reference the database:
   * Click **New Variable** ➔ Select **Reference Value** ➔ Reference `DATABASE_URL` from the PostgreSQL service.
   * Add other required variables (e.g., `BETTER_AUTH_SECRET`, `PORT`).

---

## 🖥️ Step 4: Deploy the Storefront PWA (`apps/platform`)

We will deploy both the PWA and the Admin panel as **Railway Static Services** to avoid paying for running container memory 24/7.

1. Click **New** ➔ **GitHub Repo** ➔ Select your `mumzo_app` repository.
2. Under **Settings** configure:
   * **Service Name**: `storefront-pwa`
   * **Root Directory**: `apps/platform`
   * **Build Command**: `bun install && bun run build`
   * **Output Directory**: `dist` *(Railway detects this and hosts it as static assets for free)*
3. Under **Variables** add:
   * `VITE_API_URL`: Points to your `mumzo-api` Railway URL (e.g., `https://mumzo-api.up.railway.app`).

---

## 🔑 Step 5: Deploy the Admin Panel (`apps/admin`)

1. Click **New** ➔ **GitHub Repo** ➔ Select your `mumzo_app` repository.
2. Under **Settings** configure:
   * **Service Name**: `admin-panel`
   * **Root Directory**: `apps/admin`
   * **Build Command**: `bun install && bun run build`
   * **Output Directory**: `dist`
3. Under **Variables** add:
   * `VITE_API_URL`: Points to your `mumzo-api` Railway URL.

---

## 🚀 Step 6: Push Database Schema & Migration

Before the API server can serve requests, you must push your Drizzle schema and seed the initial roles.

1. In your local terminal, navigate to the monorepo root.
2. Link your local project directory to your remote Railway project:
   ```bash
   railway link
   ```
3. Run the database push command tunneled through Railway's remote environment variables:
   ```bash
   railway run bun run db:push
   ```
4. Run the database seeds to populate the default RBAC roles:
   ```bash
   railway run bun run seed
   ```
   *This connects to the remote Postgres instance securely using the CLI and synchronizes your models.*
