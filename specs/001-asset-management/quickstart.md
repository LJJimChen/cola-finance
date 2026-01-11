# Quickstart: Asset Management System (MVP)

**Date**: 2026-01-11  
**Feature**: 001-asset-management  
**Branch**: `001-asset-management`

## Overview

This quickstart guide helps developers get the Asset Management System running locally and understand the core workflows. The system is a pnpm monorepo with three main packages: `web` (frontend), `bff` (Cloudflare Workers backend), and `engine` (Node.js service).

---

## Prerequisites

**Required**:
- Node.js 20+ (check: `node -v`)
- pnpm 8+ (install: `npm install -g pnpm`)
- Git (check: `git --version`)

**Optional** (for development):
- Wrangler CLI (Cloudflare Workers): `npm install -g wrangler`
- Playwright browsers: Will be installed automatically

---

## Quick Start (5 minutes)

### 1. Clone and Install

```bash
# Clone repository (or checkout feature branch)
git clone <repo-url>
cd cola-finance-sp
git checkout 001-asset-management

# Install all dependencies
pnpm install

# Install Playwright browsers (for Engine)
cd apps/engine
pnpm exec playwright install
cd ../..
```

### 2. Configure Environment

**BFF** (`.dev.vars` in `apps/bff/`):
```bash
# apps/bff/.dev.vars
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-dev-secret-key-change-in-production"
ENGINE_API_URL="http://localhost:3000"
EXCHANGE_API_KEY="get-free-key-from-exchangerate-api.com"
```

**Engine** (`.env` in `apps/engine/`):
```bash
# apps/engine/.env
PORT=3000
JWT_SECRET="your-dev-secret-key-change-in-production"
DATABASE_URL="file:../bff/dev.db"  # Share DB with BFF in dev
```

**Web** (`.env` in `apps/web/`):
```bash
# apps/web/.env
VITE_BFF_API_URL="http://localhost:8787"
```

### 3. Initialize Database

```bash
# Run migrations (from repo root)
cd apps/bff
pnpm db:migrate
pnpm db:seed  # Seeds preset classification schemes and brokers
cd ../..
```

### 4. Start Development Servers

**Option A: Run all services in parallel** (recommended):
```bash
# From repo root
pnpm dev
```

This starts:
- **Web**: http://localhost:5173 (Vite dev server)
- **BFF**: http://localhost:8787 (Wrangler dev server)
- **Engine**: http://localhost:3000 (Fastify server)

**Option B: Run services individually** (separate terminals):
```bash
# Terminal 1: BFF
cd apps/bff
pnpm dev

# Terminal 2: Engine
cd apps/engine
pnpm dev

# Terminal 3: Web
cd apps/web
pnpm dev
```

### 5. Access the Application

Open http://localhost:5173 in your browser.

**First-time setup**:
1. Sign up with email/password
2. Select display language (English/中文)
3. You'll be redirected to the dashboard

---

## Core User Flows

### Flow 1: Connect a Broker

**Goal**: Connect a broker account and see portfolio data.

**Steps**:
1. Navigate to "Brokers" page
2. Click "Connect" on a supported broker (e.g., Futu)
3. **Frontend** creates an authorization task via `POST /brokers/{brokerId}/connect`
4. **BFF** returns `{ task_id, token }` (5-minute JWT)
5. **Frontend** calls Engine API `POST /authorize` with token
6. **Engine** starts browser automation (Playwright)
7. **If verification needed**: Engine pauses and returns `{ status: 'paused', verification_url }`
8. **Frontend** displays verification URL to user (e.g., "Complete captcha at [link]")
9. User completes verification in new tab
10. **Frontend** polls `GET /tasks/{taskId}` every 2-5 seconds
11. **Engine** resumes after verification, completes authorization
12. **BFF** returns `{ status: 'completed', connection_id }`
13. **Frontend** updates UI: broker now shows as "Connected"

**Expected outcome**: Broker connection appears in "My Connections" list with status "Active".

---

### Flow 2: Refresh Portfolio

**Goal**: Fetch latest holdings and performance data.

**Steps**:
1. Navigate to "Portfolio" page
2. Click "Refresh" button (or system triggers automatic refresh)
3. **Frontend** calls `POST /brokers/connections/{connectionId}/refresh`
4. **BFF** creates a collection task, calls Engine `POST /collect`
5. **Engine** uses Playwright to scrape holdings from broker site
6. **Engine** saves holdings to database (D1)
7. **Frontend** polls `GET /tasks/{taskId}` for status updates
8. **On completion**: Frontend refetches `GET /portfolio` and `GET /portfolio/holdings`
9. **Frontend** updates portfolio summary and holdings list

**Expected outcome**: Portfolio displays updated holdings, total value, and returns.

---

### Flow 3: Set Target Allocation & Preview Rebalance

**Goal**: Define target allocation by category and see rebalance suggestions.

**Steps**:
1. Navigate to "Rebalance" page
2. Select a classification scheme (e.g., "Asset Class")
3. Set target weights per category (e.g., Stocks: 60%, Bonds: 30%, Cash: 10%)
4. **Frontend** validates that weights sum to 100%
5. **Frontend** calls `PUT /classification/schemes/{schemeId}/targets` with targets
6. **BFF** validates and saves targets to database
7. **Frontend** calls `GET /classification/schemes/{schemeId}/rebalance-preview`
8. **BFF** computes:
   - Current allocation (from holdings)
   - Drift (current - target)
   - Adjustments (buy/sell amounts per category)
9. **Frontend** displays rebalance preview:
   - Current vs Target chart
   - Drift indicators (red/green)
   - Suggested adjustments (e.g., "Buy $5,892 in Stocks")

**Expected outcome**: User sees clear category-level rebalance suggestions.

---

## Key Concepts

### Architecture Boundaries

```
┌──────────┐        ┌──────────┐        ┌──────────┐
│ Frontend │ HTTPS  │   BFF    │ Internal│  Engine  │
│ (React)  │───────>│(Workers) │<───────>│(Node.js) │
└──────────┘        └────┬─────┘        └──────────┘
                         │
                         ▼
                    ┌─────────┐
                    │    D1   │
                    │(SQLite) │
                    └─────────┘
```

**Rules**:
- Frontend ONLY calls BFF (never Engine directly)
- BFF issues short-lived tokens (5 min) for Engine
- Database (D1) is single source of truth

### Task Lifecycle

**Authorization Tasks**:
```
pending → in_progress → [paused] → completed
                    │              │
                    └───> failed <─┘
```

**Collection Tasks**:
```
pending → in_progress → completed
                    │   │
                    │   └─> partial (some holdings failed)
                    └─────> failed (zero holdings collected)
```

**Polling Pattern**:
- Frontend polls `GET /tasks/{taskId}` every 2-5 seconds
- Stops polling when status reaches terminal state (`completed`, `failed`, `expired`)
- Uses TanStack Query with `refetchInterval` for automatic polling

### Currency Normalization

**Flow**:
1. Holdings stored in original currency (e.g., AAPL in USD, 00700.HK in HKD)
2. User selects display currency (e.g., CNY)
3. BFF fetches exchange rates from cache (Cloudflare KV) or API (ExchangeRate-API.com)
4. BFF converts all holdings to display currency: `value_in_display = value_original × rate`
5. Frontend displays normalized totals and per-holding values

**Caching**:
- Exchange rates cached 24 hours in Cloudflare KV
- Cache key: `rates:YYYY-MM-DD:USD`
- Stale data (>24h) marked with warning indicator

---

## Testing

### Run All Tests

```bash
# From repo root
pnpm test
```

### Run Tests by Package

```bash
# Frontend (React components)
cd apps/web
pnpm test

# BFF (API routes)
cd packages/bff
pnpm test

# Engine (Broker adapters, state machines)
cd apps/engine
pnpm test
```

### E2E Tests

```bash
# From repo root
pnpm test:e2e

# Runs Playwright tests against local dev servers
# Requires all services running (pnpm dev)
```

---

## Common Issues

### Issue: "Database locked" error

**Cause**: Multiple processes trying to write to SQLite simultaneously.

**Fix**: Use separate databases for BFF and Engine in production. In dev, ensure only one process writes at a time.

### Issue: Authorization task expires (5 minutes)

**Cause**: User took >5 minutes to complete verification.

**Fix**: Restart authorization flow. Consider increasing token lifetime in dev (`.dev.vars`).

### Issue: Playwright browser not found

**Cause**: Playwright browsers not installed.

**Fix**:
```bash
cd apps/engine
pnpm exec playwright install
```

### Issue: Exchange rate API returns 429 (rate limit)

**Cause**: Exceeded free tier (1,500 requests/month).

**Fix**: Check cache is working (should only fetch once per day). If needed, upgrade to Pro tier ($10/mo).

---

## Next Steps

After getting the system running:

1. **Read the design docs**:
   - [data-model.md](./data-model.md) - Database schema and entities
   - [contracts/bff-api.openapi.yaml](./contracts/bff-api.openapi.yaml) - BFF API spec
   - [research.md](./research.md) - Technical decisions and alternatives

2. **Implement a broker adapter**:
   - See `apps/engine/src/brokers/example.adapter.ts` for template
   - Use Adapter pattern to support new brokers
   - Test with `apps/engine/src/brokers/*.test.ts`

3. **Add a classification scheme**:
   - Create preset scheme in `apps/bff/src/db/seeds.ts`
   - Define categories and auto-classification rules

4. **Customize the UI**:
   - Frontend uses shadcn/ui components (Tailwind CSS)
   - Modify `apps/web/src/components/` for UI changes
   - Use TanStack Router for adding new routes

---

## Architecture Highlights

### Monorepo Structure

```
apps/
├── web/          # React + Vite frontend (PWA)
├── bff/          # Cloudflare Workers backend
└── engine/       # Node.js service (browser automation)

packages/
└── schema/       # Shared types & OpenAPI specs
```

**Why monorepo?**
- Share types between frontend/backend without duplicating code
- Single `pnpm install` for all packages
- Atomic commits across multiple packages

### Key Technologies

| Package | Framework | Key Libraries |
|---------|-----------|---------------|
| **web** | React + Vite | TanStack Router, TanStack Query, shadcn/ui, ky, react-hook-form, zod |
| **bff** | Hono (Cloudflare Workers) | Drizzle ORM, Better Auth, zod |
| **engine** | Fastify (Node.js) | Playwright, xstate, Drizzle ORM |

### Constitution Compliance

This system follows the project constitution (`.specify/memory/constitution.md`):
- ✅ **Type safety**: TypeScript everywhere, no `any` types
- ✅ **Clear boundaries**: Frontend → BFF → Engine (no cross-boundary leakage)
- ✅ **Explicit state**: xstate for task state machines (no implicit state)
- ✅ **No magic**: All authorization flows explicit, no credential storage
- ✅ **Database as truth**: D1 is single source of truth, forward-only migrations
- ✅ **Defensive errors**: All errors carry actionable context, no swallowed errors

---

## Support

**Issues**: File issues at `<repo-url>/issues`  
**Docs**: See `specs/001-asset-management/` for full design docs  
**Architecture**: See `br/techstack.md` for technology decisions
