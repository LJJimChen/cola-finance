# Quick Start for Cloudflare Deployment

This guide will help you deploy the Cola Finance application (both backend and frontend) to Cloudflare.

## Prerequisites

- **Cloudflare Account**: [Sign up here](https://dash.cloudflare.com/sign-up) if you don't have one.
- **Wrangler CLI**: Installed globally or via `npx` (included in project dependencies).

## 1. Login to Cloudflare

Authenticate Wrangler with your Cloudflare account:

```bash
npx wrangler login
```

This will open a browser window to authorize Wrangler.

## 2. Backend (BFF) Deployment

The backend is a Cloudflare Worker using D1 for the database.

### Step 2.1: Create D1 Database

If you haven't created the database on Cloudflare yet:

```bash
npx wrangler d1 create cola-finance-db
```

**Important**: Copy the `database_id` from the output.

### Step 2.2: Configure `wrangler.jsonc`

Open `apps/bff/wrangler.jsonc` and update the `database_id` with the one you just created:

```jsonc
	"d1_databases": [
		{
			"binding": "DB",
			"database_name": "cola-finance-db",
			"database_id": "YOUR_DATABASE_ID_HERE", // Update this
			"migrations_dir": "drizzle"
		}
	],
```

### Step 2.3: Set Production Secrets

You need to set the `BETTER_AUTH_SECRET` and other secrets for the production worker.

```bash
# Navigate to the BFF directory
cd apps/bff

# Set the auth secret (use a strong random string)
npx wrangler secret put BETTER_AUTH_SECRET
```

Enter the secret value when prompted.

### Step 2.4: Apply Database Migrations

Apply the database schema to the production D1 database:

```bash
# Make sure you are in apps/bff
pnpm d1:migrate:prod
```

### Step 2.5: Deploy the Worker

Deploy the BFF worker to Cloudflare:

```bash
pnpm deploy
```

Once deployed, note the worker URL (e.g., `https://cola-finance-bff.your-subdomain.workers.dev`).

## 3. Frontend (Web) Deployment

The frontend is a React application that can be deployed to Cloudflare Pages.

### Step 3.1: Build the Frontend

First, you need to build the static assets. You must provide the backend URL as an environment variable during the build or configure it in the Cloudflare Pages dashboard later.

```bash
# From the project root
# Replace VITE_API_BASE_URL with your actual deployed BFF URL
VITE_API_BASE_URL=https://cola-finance-bff.your-subdomain.workers.dev pnpm --filter web build
```

*Note: If you use a `.env` file for the frontend, make sure `VITE_API_BASE_URL` points to your production backend.*

### Step 3.2: Deploy to Cloudflare Pages

You can deploy directly using Wrangler:

```bash
# Deploy the 'dist' folder from apps/web
npx wrangler pages deploy apps/web/dist --project-name cola-finance-web
```

Follow the prompts to create the project if it doesn't exist.

## 4. Final Configuration

After deploying the frontend, you might need to update the backend's allowed origins if you have CORS configured.

1.  Get your frontend URL (e.g., `https://cola-finance-web.pages.dev`).
2.  Update `BETTER_AUTH_URL` and `BETTER_AUTH_TRUSTED_ORIGINS` in the backend if necessary (usually handled via secrets or env vars).

```bash
cd apps/bff
npx wrangler secret put BETTER_AUTH_URL
# Enter: https://cola-finance-web.pages.dev

npx wrangler secret put BETTER_AUTH_TRUSTED_ORIGINS
# Enter: https://cola-finance-web.pages.dev
```

Redeploy the backend if you updated secrets:

```bash
pnpm deploy
```

Now your Cola Finance application should be live!
