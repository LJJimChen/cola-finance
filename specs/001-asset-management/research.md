# Research: Asset Management System (MVP)

**Date**: 2026-01-11  
**Feature**: 001-asset-management  
**Status**: Complete

## Overview

This document consolidates research findings for technical unknowns identified during planning. All "NEEDS CLARIFICATION" items from Technical Context are resolved below.

---

## 1. Testing Strategy

### Decision

Use **Vitest** as the unified testing framework across all packages (web, bff, engine), with Playwright for E2E tests.

### Rationale

- **Vitest** is Vite-native, fast, TypeScript-first, and works in both Node.js and Cloudflare Workers environments
- Provides built-in support for React Testing Library, MSW (Mock Service Worker), and component testing
- **Cloudflare Workers compatibility**: Vitest can use the `@cloudflare/workers-types` and test against Workers runtime
- **xstate integration**: Official `@xstate/test` utilities work seamlessly with Vitest
- **Playwright**: Best-in-class E2E testing, already used in Engine for browser automation

### Testing Framework Breakdown

| Package | Unit Tests | Integration Tests | E2E Tests |
|---------|-----------|-------------------|-----------|
| **web** | Vitest + React Testing Library | Vitest + MSW | Playwright |
| **bff** | Vitest + `unstable_dev` (Wrangler) | Vitest + real D1 (local) | Playwright |
| **engine** | Vitest | Vitest + Fastify `inject()` | Playwright |
| **schema** | Vitest (type validation) | N/A | N/A |

### Key Testing Patterns

1. **React Components with TanStack Query**:
   - Use `@tanstack/react-query` test utilities to wrap components with `QueryClientProvider`
   - Mock API responses with MSW (Mock Service Worker)
   - Example:
     ```typescript
     import { renderWithClient } from '@testing-library/react'
     import { QueryClient } from '@tanstack/react-query'
     
     test('renders portfolio', async () => {
       const queryClient = new QueryClient()
       render(<Portfolio />, { wrapper: createWrapper(queryClient) })
       // assertions
     })
     ```

2. **Cloudflare Workers (Hono) Routes**:
   - Use Wrangler's `unstable_dev` API to spin up local Workers runtime
   - Test against real D1 database (local SQLite)
   - Example:
     ```typescript
     import { unstable_dev } from 'wrangler'
     
     describe('BFF API', () => {
       let worker: UnstableDevWorker
       beforeAll(async () => {
         worker = await unstable_dev('src/index.ts', { local: true })
       })
       
       it('GET /portfolio returns 200', async () => {
         const resp = await worker.fetch('/portfolio')
         expect(resp.status).toBe(200)
       })
     })
     ```

3. **xstate State Machines**:
   - Use `@xstate/test` for model-based testing (generates test paths automatically)
   - Example:
     ```typescript
     import { createModel } from '@xstate/test'
     import { authorizationMachine } from './authorization.machine'
     
     const model = createModel(authorizationMachine)
     model.getSimplePathPlans().forEach(plan => {
       describe(plan.description, () => {
         plan.paths.forEach(path => {
           it(path.description, async () => {
             await path.test(/* context */)
           })
         })
       })
     })
     ```

4. **Playwright-based Browser Automation**:
   - Test Playwright adapters in isolation (unit tests with mocked `page` object)
   - Integration tests use real Playwright against test broker sandboxes (if available)
   - Example:
     ```typescript
     import { test, expect } from 'vitest'
     import { createMockPage } from './test-utils'
     import { FutuBrokerAdapter } from './futu.adapter'
     
     test('FutuBrokerAdapter.authorize() navigates correctly', async () => {
       const mockPage = createMockPage()
       const adapter = new FutuBrokerAdapter(mockPage)
       await adapter.authorize({ username: 'test' })
       expect(mockPage.goto).toHaveBeenCalledWith('https://futu.com/login')
     })
     ```

### Test Organization

```
apps/
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Portfolio.tsx
│   │   │   └── Portfolio.test.tsx       # Co-located unit tests
│   │   └── routes/
│   │       └── portfolio.test.tsx
│   └── tests/
│       └── e2e/
│           └── portfolio.spec.ts         # Playwright E2E
├── bff/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── portfolio.ts
│   │   │   └── portfolio.test.ts        # Co-located route tests
│   │   └── services/
│   │       └── portfolio.service.test.ts
│   └── tests/
│       └── integration/
│           └── api.test.ts               # Full API integration
├── engine/
│   ├── src/
│   │   ├── brokers/
│   │   │   └── futu.adapter.test.ts     # Co-located unit tests
│   │   └── tasks/
│   │       └── authorization.machine.test.ts
│   └── tests/
│       └── integration/
│           └── task-execution.test.ts
```

**Naming Convention**: `*.test.ts` for unit/integration, `*.spec.ts` for E2E

### Special Considerations

1. **Cloudflare Workers Environment**:
   - Use `wrangler dev` with `--local` flag for local D1 database
   - Environment variables via `.dev.vars` file (not `.env`)
   - Cannot use Node.js-specific APIs (fs, path, etc.) in BFF code

2. **Vitest Configuration** (monorepo):
   - Workspace config at root: `vitest.workspace.ts`
   - Each package has own `vitest.config.ts` for package-specific setup
   - Shared test utilities in `packages/test-utils/`

3. **CI/CD**:
   - Run tests in parallel per package: `pnpm test --workspace`
   - Use GitHub Actions with Cloudflare Pages for deployment previews
   - E2E tests run only on staging/production deployments

### Alternatives Considered

- **Jest**: Slower than Vitest, less Vite-native, requires more configuration
- **AVA**: Good for Node.js but no React/browser support
- **Testing Library alone**: Not a test runner, requires Jest/Vitest underneath

---

## 2. Broker Authorization Pattern

### Decision

Use **BFF-issued short-lived JWT delegation tokens** with a **resumable state machine** pattern for human-in-the-loop flows.

### Rationale

- **No credential storage**: BFF never sees broker credentials; Engine orchestrates authorization via browser automation
- **Short-lived tokens**: BFF issues 5-minute JWT tokens that Engine validates before executing tasks
- **Resumable flows**: xstate state machines persist task state in D1, allowing pauses for user verification (captcha, 2FA)
- **Clear separation**: BFF controls policy (who can authorize, rate limits), Engine controls execution (browser automation)

### Authorization Flow

```
┌─────────┐                ┌─────────┐                ┌─────────┐
│ Frontend│                │   BFF   │                │  Engine │
└────┬────┘                └────┬────┘                └────┬────┘
     │                          │                          │
     │ 1. POST /brokers/connect │                          │
     ├─────────────────────────>│                          │
     │                          │ 2. Create AuthTask in D1 │
     │                          ├─────────┐                │
     │                          │         │                │
     │                          │<────────┘                │
     │                          │ 3. Generate 5-min JWT    │
     │                          ├─────────┐                │
     │                          │         │                │
     │                          │<────────┘                │
     │ 4. { taskId, token }     │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │ 5. POST /engine/authorize (with JWT)                │
     ├─────────────────────────────────────────────────────>│
     │                          │                          │ 6. Validate JWT
     │                          │                          ├─────────┐
     │                          │                          │         │
     │                          │                          │<────────┘
     │                          │                          │ 7. Start state machine
     │                          │                          ├─────────┐
     │                          │                          │         │
     │                          │                          │<────────┘
     │                          │                          │ 8a. If captcha needed:
     │                          │                          │     Pause + return URL
     │ 9. { status: 'needs_verification', url: '...' }     │
     │<─────────────────────────────────────────────────────┤
     │                          │                          │
     │ 10. User completes captcha in browser               │
     ├─────────────────────────────────────────────────────>│
     │                          │                          │ 11. Resume state machine
     │                          │                          ├─────────┐
     │                          │                          │         │
     │                          │                          │<────────┘
     │ 12. Poll GET /tasks/:id for status (every 2-5s)    │
     ├─────────────────────────────────────────────────────>│
     │                          │                          │
     │ 13. { status: 'completed', connection_id: '...' }   │
     │<─────────────────────────────────────────────────────┤
     │                          │                          │
```

### Token Structure

**JWT Claims**:
```json
{
  "iss": "bff.cola-finance.app",
  "sub": "user_12345",
  "aud": "engine.cola-finance.internal",
  "exp": 1672531200,  // 5 minutes from issuance
  "iat": 1672530900,
  "task_id": "auth_task_67890",
  "task_type": "broker_authorization",
  "broker_id": "futu"
}
```

**Validation Rules**:
- Engine MUST verify `aud`, `exp`, `iat`, `iss` fields
- Engine MUST check that `task_id` exists in D1 and is in `pending` or `paused` state
- Engine MUST reject expired tokens (no grace period)
- Engine MUST rate-limit token usage (1 token per task, no reuse)

### State Persistence Strategy

**What to Store** (in D1 `authorization_tasks` table):
```typescript
interface AuthorizationTask {
  id: string                    // Primary key
  user_id: string               // Foreign key to users table
  broker_id: string             // Which broker (e.g., 'futu', 'tiger')
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'failed'
  state_snapshot: string        // JSON-serialized xstate state
  created_at: string            // ISO timestamp
  updated_at: string            // ISO timestamp
  expires_at: string            // Task expiration (e.g., 1 hour)
  
  // Human-in-the-loop fields
  verification_url?: string     // URL for user to complete verification
  verification_type?: 'captcha' | '2fa' | 'consent'
  
  // Result fields
  connection_id?: string        // Created broker_connection ID (on success)
  error_code?: string           // Error code (on failure)
  error_message?: string        // Human-readable error (on failure)
}
```

**What NOT to Store**:
- ❌ Broker usernames/passwords
- ❌ Session cookies or auth tokens from broker sites
- ❌ Detailed browser automation logs (only store summary)

**Ephemeral State** (in Engine memory only):
- Playwright browser context and page objects
- Temporary files (screenshots, downloads)
- In-flight HTTP requests to broker APIs

### Security Considerations

1. **Token Rotation**: Each task gets a fresh token; tokens cannot be reused
2. **Token Binding**: Token is bound to specific `task_id` and `user_id`
3. **Replay Protection**: Engine marks tokens as "consumed" in D1 after first use
4. **Network Isolation**: Engine API is not exposed to public internet; only accessible via internal network or VPN
5. **Audit Logging**: All authorization attempts logged with timestamp, user_id, broker_id, outcome
6. **Rate Limiting**: BFF enforces per-user rate limits (e.g., 5 authorization attempts per hour)

### Alternatives Considered

- **OAuth 2.0 Device Flow**: Requires broker support for OAuth (most brokers don't support this)
- **Proxy Credentials**: User enters credentials in frontend, frontend proxies to Engine (violates "no credential storage" and increases attack surface)
- **Long-lived Tokens**: Higher risk if Engine is compromised; 5-minute window minimizes exposure

---

## 3. Currency Conversion API

### Decision

Use **ExchangeRate-API.com** with **24-hour caching in Cloudflare KV** and **multi-tier fallback**.

### Rationale

- **Best free tier for MVP**: 1,500 requests/month (vs 1,000 for Open Exchange Rates, 300 for CurrencyAPI)
- **Cloudflare Workers compatible**: Simple HTTP/JSON API, no Node.js dependencies
- **CNY support**: Explicitly supports both CNY (onshore) and CNH (offshore) yuan
- **Smooth upgrade path**: $10/month for 30K requests + hourly updates (vs $12/mo for Open Exchange Rates)
- **Proven reliability**: >99.99% uptime, 15+ years in operation

### API Comparison

| API | Free Tier | Update Frequency | Currencies | CNY Support | Monthly Cost (Paid) |
|-----|-----------|------------------|------------|-------------|---------------------|
| **ExchangeRate-API** ✅ | 1,500 req/mo | Daily | 161+ | ✅ Yes (CNY & CNH) | $10 (30K req, hourly) |
| Open Exchange Rates | 1,000 req/mo | Hourly | 200+ | ✅ Yes | $12 (100K req, hourly) |
| CurrencyAPI.com | 300 req/mo | 60 seconds | 170+ | ✅ Yes | $7.99 (basic features) |
| ExchangeRate.host | 100 req/mo | Real-time | 168 | ✅ Yes | Expensive |
| FreeCurrencyAPI.com | 1,000 req/mo | Daily | 32 only | ⚠️ Limited | No commercial use |

### Caching Strategy

**Architecture**:
```
┌──────────┐     ┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│ Frontend │────>│ BFF (Worker)│────>│ Cloudflare KV   │────>│ ExchangeRate│
│          │     │             │     │ (24h TTL cache) │     │ API         │
└──────────┘     └─────────────┘     └─────────────────┘     └─────────────┘
                        │                                            │
                        ▼                                            │
                   ┌─────────┐                                       │
                   │ D1 (DB) │<──────────────────────────────────────┘
                   └─────────┘     Daily persistence for USD/CNY, HKD/CNY only

```

**Cache Key Format**: 
- Cloudflare KV: `rates:YYYY-MM-DD:all` (full rate sheet from API)
- Database: Individual records with `(base_currency, target_currency, rate_date)` for USD/CNY and HKD/CNY only

**Persistence Strategy**:
- **USD/CNY and HKD/CNY**: Stored daily in database table `exchange_rates` with `rate_date` field
- **All other pairs** (EUR/CNY, JPY/CNY, etc.): Retrieved from Cloudflare KV cache (24h TTL), not persisted in DB
- **Rationale**: Major currency pairs need historical accuracy for trend analysis; minor pairs can use latest rates

**TTL Settings**:
- **Cloudflare KV**: 24 hours (matches free tier daily update frequency)
- **Database records**: Retained for 1 year (cleanup job deletes older records)

**Request Reduction**:
```
MVP Scale (10 users, 10 portfolio views/day):
- Without caching: 100 conversions/day = 3,000 API calls/month ❌ Exceeds free tier
- With caching: 1 API call/day (refresh cache once) = 30 API calls/month ✅ Well within free tier
```

**Historical Snapshot Behavior**:
- When calculating portfolio value for date `2026-01-01`:
  - USD holdings: Convert using `exchange_rates` record where `rate_date = '2026-01-01'` and `base_currency = 'USD'`
  - HKD holdings: Convert using `exchange_rates` record where `rate_date = '2026-01-01'` and `base_currency = 'HKD'`
  - EUR holdings: Convert using latest cached rate from Cloudflare KV (historical accuracy not guaranteed for non-major pairs)

### Fallback & Staleness Handling

**Multi-tier Fallback Chain**:
```
1. ✅ Primary Cache (fresh, <24h old) → Use immediately
2. ⬇️ Primary API (ExchangeRate-API) → Fetch if cache miss
3. ⚠️ Stale Cache (24h-7 days old) → Use with warning indicator
4. ⬇️ Fallback API (Open Exchange Rates free tier) → Last resort
5. 🔴 Previous Day Rate → If all else fails, use yesterday's rate + disable new conversions
```

**Staleness Indicators** (UI):
- **Fresh** (<24h): Normal display
- **Stale** (24h-48h): Show "⚠️ Rates from [date]" badge
- **Very Stale** (>48h): Show warning banner + disable new conversions until rates refresh

**Implementation** (BFF):
```typescript
async function getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
  const today = new Date().toISOString().split('T')[0]
  const cacheKey = `rates:${today}:${baseCurrency}`
  
  // Try cache first
  const cached = await env.EXCHANGE_RATE_KV.get(cacheKey, 'json')
  if (cached && isFresh(cached)) {
    return cached
  }
  
  // Try API
  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${env.EXCHANGE_API_KEY}/latest/${baseCurrency}`
    )
    if (!response.ok) throw new Error('API request failed')
    
    const data = await response.json()
    await env.EXCHANGE_RATE_KV.put(cacheKey, JSON.stringify(data), {
      expirationTtl: 86400  // 24 hours
    })
    return data
  } catch (error) {
    // Fallback to stale cache
    if (cached) {
      return { ...cached, stale: true }
    }
    
    // Try fallback API (Open Exchange Rates)
    return await fetchFromFallbackAPI(baseCurrency)
  }
}

function isFresh(data: any): boolean {
  const timestamp = new Date(data.time_last_update_unix * 1000)
  const hoursSinceUpdate = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60)
  return hoursSinceUpdate < 24
}
```

### Alternatives Considered

- **Open Exchange Rates**: Better currency coverage (200+ vs 161) but lower free tier (1,000 vs 1,500 req/mo) and more expensive ($12 vs $10/mo)
- **CurrencyAPI.com**: Only 300 req/mo free tier, insufficient for MVP
- **FreeCurrencyAPI.com**: Only 32 currencies, no commercial use allowed

---

## Summary of Resolved Unknowns

| Unknown | Decision | Rationale |
|---------|----------|-----------|
| **Testing Framework** | Vitest + Playwright | Fast, TypeScript-first, Cloudflare Workers compatible, unified across monorepo |
| **Authorization Pattern** | BFF-issued JWT delegation tokens + xstate state machines | No credential storage, resumable human-in-the-loop flows, clear BFF/Engine separation |
| **Currency API** | ExchangeRate-API.com + Cloudflare KV caching | Best free tier (1,500 req/mo), CNY support, smooth upgrade path, proven reliability |

All technical context items are now resolved and ready for Phase 1 (data model + contracts design).
