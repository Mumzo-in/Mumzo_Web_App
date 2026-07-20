# Railway Pricing & Costing Plan for Mumzo

This document details the cost estimation for deploying the Mumzo platform on **Railway** (`railway.app`).

Railway uses a **pay-as-you-go resource usage model**, billing you per second for the exact amount of CPU and RAM your active containers consume, plus database disk storage.

---

## 1. How Railway Billing Works

* **vCPU**: $0.00001416 per second (~$36.70 per 1 vCPU running 24/7 for a month).
* **RAM**: $0.00000277 per GB per second (~$7.20 per 1 GB RAM running 24/7 for a month).
* **Network Egress**: First 100 GB/month is free, then $0.10 per GB.
* **Disk (Postgres)**: First 1 GB is free, then $0.25 per GB per month.

---

## 2. Resource & Cost Estimates by Scale Tiers

All services run within a single Railway Project, sharing the resource pool.

### Tier 1: MVP / Development (1k MAU)
Designed for low cost, running on shared developer resources. Since frontends are static Single Page Applications (SPA), they build for free and cost $0 to host as static assets.

| Service | CPU / RAM Allocation | Active Time | Monthly Cost |
|---|---|---|---|
| **Storefront SPA** (`apps/platform`) | Static Hosting (CDN) | 24/7 | **$0.00** |
| **Admin Panel SPA** (`apps/admin`) | Static Hosting (CDN) | 24/7 | **$0.00** |
| **Hono API Server** (`apps/server`) | 0.1 vCPU / 512MB RAM | 24/7 | **$7.27** |
| **PostgreSQL Database** | 0.1 vCPU / 512MB RAM | 24/7 | **$7.27** |
| **Redis Cache** | 0.05 vCPU / 256MB RAM | 24/7 | **$3.64** |
| **Database Storage** | 1 GB SSD | N/A | **$0.00** (Free Tier) |
| **Total Estimated Cost** | | | **~$18.18 / month** |

*Note: In local development or staging, services can be set to "sleep" when idle, which drops the MVP cost down even lower (often under $10/mo).*

---

### Tier 2: Production Growth (10k MAU)
Dedicated resources to handle steady traffic spikes, daily snapshots, and fast database lookups.

| Service | CPU / RAM Allocation | Active Time | Monthly Cost |
|---|---|---|---|
| **Storefront SPA** (`apps/platform`) | Static Hosting (CDN) | 24/7 | **$0.00** |
| **Admin Panel SPA** (`apps/admin`) | Static Hosting (CDN) | 24/7 | **$0.00** |
| **Hono API Server** (`apps/server`) | 0.25 vCPU / 1GB RAM | 24/7 | **$16.37** |
| **PostgreSQL Database** | 0.50 vCPU / 2GB RAM | 24/7 | **$32.74** |
| **Redis Cache** | 0.10 vCPU / 512MB RAM | 24/7 | **$7.27** |
| **Database Storage** | 10 GB SSD | N/A | **$2.25** ($0.25/GB after 1GB) |
| **Total Estimated Cost** | | | **~$58.63 / month** |

---

### Tier 3: High Scale (100k MAU)
Production-grade deployment. The Hono API uses autoscaling replicas (minimum 2, maximum 4) to handle high concurrent delivery traffic.

| Service | CPU / RAM Allocation | Active Time | Monthly Cost |
|---|---|---|---|
| **Storefront SPA** (`apps/platform`) | Static Hosting (CDN) | 24/7 | **$0.00** |
| **Admin Panel SPA** (`apps/admin`) | Static Hosting (CDN) | 24/7 | **$0.00** |
| **Hono API Server** (2x Replicas) | 2x (0.5 vCPU / 2GB RAM) | 24/7 | **$65.48** |
| **PostgreSQL Database** | 1.0 vCPU / 4GB RAM | 24/7 | **$65.48** |
| **Redis Cache** | 0.25 vCPU / 1GB RAM | 24/7 | **$16.37** |
| **Database Storage** | 50 GB SSD | N/A | **$12.25** |
| **Network Egress** | ~200 GB | N/A | **$10.00** |
| **Total Estimated Cost** | | | **~$169.58 / month** |

---

## 3. Cost Optimization Tips on Railway

1. **Leverage Static Hosting for SPAs**:
   Configure the storefront and admin panel build commands in Railway to export static files (`dist` folder). Since static sites do not run container memory 24/7, they are completely free on Railway.
2. **Setup Auto-scaling Boundaries**:
   Define strict memory and CPU limits on the Hono server container so it scales up only when traffic surges and scales back down during off-peak night hours.
3. **Use Neon/R2 for Extreme File/DB Storage**:
   If your product media grows to hundreds of gigabytes, keep database storage on Neon or media uploads on Cloudflare R2, while keeping Hono, Redis, and Frontends on Railway to bypass disk costs.

---

## 4. Managed Services Comparison

### PostgreSQL: How does Railway compare to RDS / Supabase?
* **It is closer to Amazon RDS**: Railway provisions a dedicated, containerized PostgreSQL engine running on a fast SSD. It includes automatic daily snapshots, health metrics, and direct standard TCP access (port `5432`). It is raw, high-performance Postgres.
* **It is NOT like Supabase**: It does not include built-in OAuth tables, REST API generators (PostgREST), or real-time WebSockets wrappers. Since you are building a custom backend (Hono + Better Auth), you **do not need** Supabase's wrappers. Standard, clean Postgres (like Railway's or RDS) is preferred.

### Blob/Object Storage on Railway
Railway does not provide a native first-party "S3/Blob Storage" service. You have two modern options:

1. **Option A: Run MinIO on Railway (S3-Compatible)**:
   * **What**: MinIO is an open-source S3 clone. You can provision it with one click inside Railway and attach a persistent disk.
   * **Pros**: Everything remains in one dashboard, billed on your unified Railway invoice.
   * **Cons**: You must pay for the container resources (vCPU/RAM) and persistent storage space. No global CDN caching.
2. **Option B: Use Cloudflare R2 (Recommended)**:
   * **What**: A serverless, S3-compatible storage engine.
   * **Pros**: **$0 egress fees**. You only pay for active storage ($0.015/GB/mo), meaning serving product images to customer devices is completely free.
   * **Cons**: Hosted separately from Railway, but highly recommended for cost efficiency.
