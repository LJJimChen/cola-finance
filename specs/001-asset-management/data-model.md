# Data Model: Asset Management System (MVP)

**Date**: 2026-01-11  
**Feature**: 001-asset-management  
**Database**: Cloudflare D1 (SQLite)  
**ORM**: Drizzle ORM

## Overview

This document defines the core entities, relationships, validation rules, and state transitions for the Asset Management System. The database schema is the single source of truth (Constitution Principle #11).

---

## Entity-Relationship Diagram

```
┌─────────┐         ┌──────────────────┐         ┌─────────┐
│  User   │1      n │ BrokerConnection │n      1 │ Broker  │
│         ├─────────┤                  ├─────────┤         │
└────┬────┘         └────────┬─────────┘         └─────────┘
     │                       │
     │1                      │1
     │                       │
     │n                      │n
     │              ┌────────┴──────────┐
     │              │                   │
┌────┴──────────┐   │         ┌─────────┴─────────┐
│ Classification│   │         │ AuthorizationTask │
│    Scheme     │   │         │                   │
└───────────────┘   │         └───────────────────┘
                    │
                    │1
                    │
                    │n
            ┌───────┴────────┐         ┌──────────────┐
            │    Holding     │         │ CollectionTask│
            │                │         │               │
            └───────┬────────┘         └───────────────┘
                    │1
                    │
                    │n
            ┌───────┴────────┐
            │HoldingSnapshot │
            │                │
            └────────────────┘

┌───────────────┐         ┌──────────────┐
│TargetAllocation│       │ ExchangeRate │
│               │         │              │
└───────────────┘         └──────────────┘

┌───────────────────┐
│RebalancePreview   │
│                   │
└───────────────────┘
```

---

## Core Entities

### 1. User

**Purpose**: Represents a person using the system; owns broker connections, preferences, and portfolios.

**Fields**:
```typescript
interface User {
  id: string                      // UUID, primary key
  email: string                   // Unique, required, validated
  email_verified: boolean         // Default false
  password_hash: string           // bcrypt hash, nullable (supports OAuth later)
  display_name: string | null     // Optional display name
  locale: 'en' | 'zh'             // Language preference (default auto-detected)
  display_currency: string        // ISO 4217 code (e.g., 'USD', 'CNY'), default 'USD'
  created_at: string              // ISO timestamp
  updated_at: string              // ISO timestamp
  last_login_at: string | null    // ISO timestamp
}
```

**Validation Rules**:
- `email` MUST match regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- `locale` MUST be one of: `['en', 'zh']`
- `display_currency` MUST be valid ISO 4217 code (validated against supported currencies list)
- `password_hash` MUST NOT be exposed in any API response

**Indexes**:
- Primary key: `id`
- Unique index: `email`

---

### 2. Broker

**Purpose**: Represents a supported external platform (e.g., securities broker / fund platform).

**Fields**:
```typescript
interface Broker {
  id: string                      // Slug (e.g., 'futu', 'tiger'), primary key
  name: string                    // Display name (e.g., 'Futu Securities')
  name_zh: string                 // Chinese display name (e.g., '富途证券')
  logo_url: string                // CDN URL to broker logo
  supported: boolean              // Whether broker is currently supported (default true)
  adapter_version: string         // Version of Engine adapter (e.g., '1.0.0')
  requires_verification: boolean  // Whether broker typically requires human-in-the-loop (default false)
  created_at: string              // ISO timestamp
  updated_at: string              // ISO timestamp
}
```

**Validation Rules**:
- `id` MUST be lowercase alphanumeric + hyphens only (slug format)
- `adapter_version` MUST follow semver (e.g., '1.0.0', '2.3.1-beta')

**Indexes**:
- Primary key: `id`

**Seed Data** (MVP):
```typescript
const brokers: Broker[] = [
  {
    id: 'futu',
    name: 'Futu Securities',
    name_zh: '富途证券',
    logo_url: 'https://cdn.cola-finance.app/logos/futu.png',
    supported: true,
    adapter_version: '1.0.0',
    requires_verification: true,
    created_at: '2026-01-11T00:00:00Z',
    updated_at: '2026-01-11T00:00:00Z'
  }
  // Add more brokers as adapters are implemented
]
```

---

### 3. BrokerConnection

**Purpose**: A user's authorized relationship to a broker used for data access.

**Fields**:
```typescript
interface BrokerConnection {
  id: string                      // UUID, primary key
  user_id: string                 // Foreign key to User.id
  broker_id: string               // Foreign key to Broker.id
  status: 'active' | 'expired' | 'revoked' | 'failed'  // Connection status
  
  // Authorization metadata (NO credentials stored)
  authorized_at: string           // ISO timestamp when connection was established
  expires_at: string | null       // ISO timestamp (if broker authorization expires)
  last_refresh_at: string | null  // ISO timestamp of last successful data collection
  
  // Error tracking
  consecutive_failures: number    // Count of consecutive failed refresh attempts (default 0)
  last_error_code: string | null  // Error code from last failed refresh
  last_error_message: string | null // Human-readable error message
  
  created_at: string              // ISO timestamp
  updated_at: string              // ISO timestamp
}
```

**Validation Rules**:
- `status` MUST be one of: `['active', 'expired', 'revoked', 'failed']`
- `consecutive_failures` MUST be >= 0
- A user MAY have multiple connections to the same broker (e.g., different accounts)
- `expires_at` MUST be > `authorized_at` (if not null)

**Indexes**:
- Primary key: `id`
- Foreign key: `user_id` (references User.id, cascade delete)
- Foreign key: `broker_id` (references Broker.id, restrict delete)
- Composite index: `(user_id, broker_id)` for fast lookup

**State Transitions**:
```
                    ┌─────────┐
                    │  active │
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐      ┌─────────┐     ┌─────────┐
   │ expired │      │ revoked │     │ failed  │
   └─────────┘      └─────────┘     └────┬────┘
        │                                 │
        │                                 │
        └────────────> Re-authorize <─────┘
                       (creates new connection)
```

**Business Rules**:
- `consecutive_failures` >= 3: Automatically mark connection as `failed`
- `expires_at` < current_time: Automatically mark connection as `expired`
- User-initiated revocation: Mark connection as `revoked`

---

### 4. AuthorizationTask

**Purpose**: A user-visible process for establishing/renewing a broker connection, including human-in-the-loop states.

**Fields**:
```typescript
interface AuthorizationTask {
  id: string                      // UUID, primary key
  user_id: string                 // Foreign key to User.id
  broker_id: string               // Foreign key to Broker.id
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'failed' | 'expired'
  
  // State machine snapshot (xstate)
  state_snapshot: string          // JSON-serialized xstate state (TEXT column)
  
  // Human-in-the-loop fields
  verification_url: string | null // URL for user to complete verification (e.g., captcha)
  verification_type: 'captcha' | '2fa' | 'consent' | null
  
  // Result fields
  connection_id: string | null    // Foreign key to BrokerConnection.id (on success)
  error_code: string | null       // Error code (on failure)
  error_message: string | null    // Human-readable error (on failure)
  
  // Timestamps
  created_at: string              // ISO timestamp
  updated_at: string              // ISO timestamp
  expires_at: string              // Task expiration (1 hour from creation)
  completed_at: string | null     // ISO timestamp when task reached terminal state
}
```

**Validation Rules**:
- `status` MUST be one of: `['pending', 'in_progress', 'paused', 'completed', 'failed', 'expired']`
- `verification_type` MUST be one of: `['captcha', '2fa', 'consent', null]`
- `expires_at` MUST be > `created_at`
- `state_snapshot` MUST be valid JSON
- `connection_id` MUST be set if `status === 'completed'`
- `error_code` and `error_message` MUST be set if `status === 'failed'`

**Indexes**:
- Primary key: `id`
- Foreign key: `user_id` (references User.id, cascade delete)
- Foreign key: `broker_id` (references Broker.id, restrict delete)
- Foreign key: `connection_id` (references BrokerConnection.id, set null on delete)
- Index: `status` for fast task queue queries
- Index: `expires_at` for cleanup jobs

**State Transitions** (xstate-managed):
```
┌─────────┐     ┌────────────┐     ┌────────┐
│ pending ├────>│in_progress ├────>│paused  │
└─────────┘     └──────┬─────┘     └───┬────┘
                       │               │
                       │               │ (after user verification)
                       │               │
                       ▼               ▼
                 ┌─────────────────────────┐
                 │      completed          │
                 └─────────────────────────┘
                       │
                       ▼
                 ┌─────────┐     ┌─────────┐
                 │ failed  │  or │ expired │
                 └─────────┘     └─────────┘
```

**Business Rules**:
- Tasks older than `expires_at` MUST be automatically marked as `expired`
- Tasks in `paused` state for >5 minutes MUST be marked as `expired`
- Only one `pending` or `in_progress` task per (user_id, broker_id) at a time

---

### 5. CollectionTask

**Purpose**: A user-visible process for refreshing holdings/performance data from a broker connection.

**Fields**:
```typescript
interface CollectionTask {
  id: string                      // UUID, primary key
  user_id: string                 // Foreign key to User.id
  connection_id: string           // Foreign key to BrokerConnection.id
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'partial'
  
  // State machine snapshot (xstate)
  state_snapshot: string          // JSON-serialized xstate state (TEXT column)
  
  // Result metadata
  holdings_collected: number      // Count of holdings collected (default 0)
  holdings_failed: number         // Count of holdings that failed to collect (default 0)
  partial_reason: string | null   // Why collection was partial (e.g., 'broker API timeout')
  
  // Error tracking
  error_code: string | null       // Error code (on failure)
  error_message: string | null    // Human-readable error (on failure)
  
  // Timestamps
  created_at: string              // ISO timestamp
  updated_at: string              // ISO timestamp
  completed_at: string | null     // ISO timestamp when task reached terminal state
}
```

**Validation Rules**:
- `status` MUST be one of: `['pending', 'in_progress', 'completed', 'failed', 'partial']`
- `holdings_collected` >= 0
- `holdings_failed` >= 0
- `partial_reason` MUST be set if `status === 'partial'`
- `error_code` and `error_message` MUST be set if `status === 'failed'`

**Indexes**:
- Primary key: `id`
- Foreign key: `user_id` (references User.id, cascade delete)
- Foreign key: `connection_id` (references BrokerConnection.id, cascade delete)
- Index: `status` for task queue queries
- Index: `(user_id, created_at)` for user task history

**State Transitions**:
```
┌─────────┐     ┌────────────┐     ┌───────────┐
│ pending ├────>│in_progress ├────>│ completed │
└─────────┘     └──────┬─────┘     └───────────┘
                       │
                       ├────────────┐
                       │            │
                       ▼            ▼
                 ┌─────────┐  ┌─────────┐
                 │ failed  │  │ partial │
                 └─────────┘  └─────────┘
```

**Business Rules**:
- `status === 'partial'`: Some holdings collected successfully, others failed
- `status === 'failed'`: Zero holdings collected
- If `connection_id` becomes `expired` or `failed` during collection, task MUST fail

---

### 6. Holding

**Purpose**: A position in an instrument with quantity, currency, and valuation metadata.

**Fields**:
```typescript
interface Holding {
  id: string                      // UUID, primary key
  user_id: string                 // Foreign key to User.id
  connection_id: string           // Foreign key to BrokerConnection.id
  
  // Instrument identification
  symbol: string                  // Ticker/symbol (e.g., 'AAPL', '00700.HK')
  instrument_type: 'stock' | 'fund' | 'bond' | 'cash' | 'crypto' | 'other'
  instrument_name: string         // Display name (e.g., 'Apple Inc.')
  instrument_name_zh: string | null // Chinese name (if available)
  
  // Position details
  quantity: string                // Decimal string (to avoid floating-point errors)
  currency: string                // ISO 4217 code (e.g., 'USD', 'HKD', 'CNY')
  
  // Valuation (as of last collection)
  market_value: string            // Decimal string, in `currency`
  cost_basis: string | null       // Decimal string, in `currency` (if available)
  unrealized_pnl: string | null   // Decimal string, in `currency` (market_value - cost_basis)
  
  // Performance (if available)
  daily_return: string | null     // Decimal string, percentage (e.g., '0.0523' for 5.23%)
  total_return: string | null     // Decimal string, percentage
  
  // Classification (user-assigned or auto-detected)
  category: string | null         // Category from classification scheme (e.g., 'US Stocks')
  
  // Metadata
  last_updated_at: string         // ISO timestamp of last collection
  is_stale: boolean               // Whether data is >24h old (default false)
  
  created_at: string              // ISO timestamp
  updated_at: string              // ISO timestamp
}
```

**Validation Rules**:
- `quantity`, `market_value`, `cost_basis`, `unrealized_pnl` MUST be valid decimal strings
- `daily_return`, `total_return` MUST be decimal strings (percentages in decimal form)
- `instrument_type` MUST be one of: `['stock', 'fund', 'bond', 'cash', 'crypto', 'other']`
- `currency` MUST be valid ISO 4217 code
- `is_stale` = true if `last_updated_at` is >24 hours ago

**Indexes**:
- Primary key: `id`
- Foreign key: `user_id` (references User.id, cascade delete)
- Foreign key: `connection_id` (references BrokerConnection.id, cascade delete)
- Index: `(user_id, symbol)` for fast lookup
- Index: `(user_id, category)` for category aggregations

**Business Rules**:
- `unrealized_pnl = market_value - cost_basis` (if cost_basis available)
- `is_stale = true` if `last_updated_at` < (current_time - 24 hours)
- Holdings with `currency !== user.display_currency` require conversion for portfolio display

---

### 7. HoldingSnapshot

**Purpose**: Historical snapshots of holdings for performance tracking and trend analysis.

**Fields**:
```typescript
interface HoldingSnapshot {
  id: string                      // UUID, primary key
  holding_id: string              // Foreign key to Holding.id
  user_id: string                 // Foreign key to User.id (denormalized for query performance)
  
  // Snapshot values (at time of snapshot)
  quantity: string                // Decimal string
  market_value: string            // Decimal string
  cost_basis: string | null       // Decimal string
  currency: string                // ISO 4217 code
  
  snapshot_at: string             // ISO timestamp when snapshot was taken
  created_at: string              // ISO timestamp
}
```

**Validation Rules**:
- `snapshot_at` MUST be <= `created_at`
- `quantity`, `market_value`, `cost_basis` MUST be valid decimal strings

**Indexes**:
- Primary key: `id`
- Foreign key: `holding_id` (references Holding.id, cascade delete)
- Foreign key: `user_id` (references User.id, cascade delete)
- Composite index: `(holding_id, snapshot_at)` for time-series queries
- Index: `(user_id, snapshot_at)` for portfolio-wide historical views

**Business Rules**:
- Snapshots taken daily at midnight UTC (cron job)
- Snapshots retained for 1 year (configurable)
- Used to calculate performance metrics (e.g., 7-day return, 30-day return)

---

### 8. ClassificationScheme

**Purpose**: A set of categories and mapping rules for grouping holdings.

**Fields**:
```typescript
interface ClassificationScheme {
  id: string                      // UUID, primary key
  user_id: string | null          // Foreign key to User.id (null = preset scheme)
  name: string                    // Display name (e.g., 'Asset Class')
  name_zh: string | null          // Chinese display name
  description: string | null      // Optional description
  is_preset: boolean              // Whether this is a system preset (default false)
  
  // Categories (JSON array of category definitions)
  categories: string              // JSON: [{ id, name, name_zh, rules }]
  
  created_at: string              // ISO timestamp
  updated_at: string              // ISO timestamp
}
```

**Validation Rules**:
- `categories` MUST be valid JSON array
- Each category MUST have: `{ id: string, name: string, name_zh?: string, rules?: object }`
- Preset schemes MUST have `user_id === null` and `is_preset === true`

**Indexes**:
- Primary key: `id`
- Foreign key: `user_id` (references User.id, cascade delete, nullable)
- Index: `is_preset` for listing preset schemes

**Seed Data** (Preset Scheme):
```typescript
const assetClassScheme: ClassificationScheme = {
  id: 'preset_asset_class',
  user_id: null,
  name: 'Asset Class',
  name_zh: '资产类别',
  description: 'Classify holdings by asset class (stocks, bonds, cash, etc.)',
  is_preset: true,
  categories: JSON.stringify([
    { id: 'stocks', name: 'Stocks', name_zh: '股票' },
    { id: 'bonds', name: 'Bonds', name_zh: '债券' },
    { id: 'funds', name: 'Funds', name_zh: '基金' },
    { id: 'cash', name: 'Cash', name_zh: '现金' },
    { id: 'crypto', name: 'Crypto', name_zh: '加密货币' },
    { id: 'other', name: 'Other', name_zh: '其他' }
  ]),
  created_at: '2026-01-11T00:00:00Z',
  updated_at: '2026-01-11T00:00:00Z'
}
```

---

### 9. TargetAllocation

**Purpose**: Desired weights by category under a given classification scheme.

**Fields**:
```typescript
interface TargetAllocation {
  id: string                      // UUID, primary key
  user_id: string                 // Foreign key to User.id
  scheme_id: string               // Foreign key to ClassificationScheme.id
  
  // Targets (JSON object: { category_id: weight_percentage })
  targets: string                 // JSON: { "stocks": 60, "bonds": 30, "cash": 10 }
  
  created_at: string              // ISO timestamp
  updated_at: string              // ISO timestamp
}
```

**Validation Rules**:
- `targets` MUST be valid JSON object
- All weights MUST be decimal numbers >= 0 and <= 100
- Sum of all weights MUST equal exactly 100
- All category IDs MUST exist in the referenced `ClassificationScheme.categories`

**Indexes**:
- Primary key: `id`
- Foreign key: `user_id` (references User.id, cascade delete)
- Foreign key: `scheme_id` (references ClassificationScheme.id, cascade delete)
- Unique composite index: `(user_id, scheme_id)` (one target allocation per scheme per user)

**Business Rules**:
- User MUST NOT save targets unless sum === 100% (enforced by BFF validation)

---

### 10. RebalancePreview

**Purpose**: Computed drift and suggested category-level adjustments.

**Fields**:
```typescript
interface RebalancePreview {
  id: string                      // UUID, primary key
  user_id: string                 // Foreign key to User.id
  scheme_id: string               // Foreign key to ClassificationScheme.id
  target_id: string               // Foreign key to TargetAllocation.id
  
  // Computed results (JSON)
  current_allocation: string      // JSON: { category_id: percentage }
  drift: string                   // JSON: { category_id: drift_percentage }
  adjustments: string             // JSON: [{ category, action: 'buy'|'sell', amount }]
  
  // Metadata
  portfolio_value: string         // Decimal string, total portfolio value in display_currency
  display_currency: string        // ISO 4217 code
  computed_at: string             // ISO timestamp when preview was generated
  
  created_at: string              // ISO timestamp
}
```

**Validation Rules**:
- `current_allocation`, `drift`, `adjustments` MUST be valid JSON
- `portfolio_value` MUST be valid decimal string
- `computed_at` MUST be <= `created_at`

**Indexes**:
- Primary key: `id`
- Foreign key: `user_id` (references User.id, cascade delete)
- Foreign key: `scheme_id` (references ClassificationScheme.id, cascade delete)
- Foreign key: `target_id` (references TargetAllocation.id, cascade delete)
- Index: `(user_id, computed_at)` for retrieving latest preview

**Business Rules**:
- Previews are ephemeral (deleted after 7 days)
- Recomputed on-demand when user requests preview
- `drift` = `target_allocation - current_allocation` (per category)

---

### 11. ExchangeRate

**Purpose**: Currency conversion values used for normalization. Only USD/CNY and HKD/CNY pairs are stored historically (one record per day). All other currency pairs use the latest available rate.

**Fields**:
```typescript
interface ExchangeRate {
  id: string                      // UUID, primary key
  base_currency: string           // ISO 4217 code (currently only 'USD' or 'HKD')
  target_currency: string         // ISO 4217 code (currently only 'CNY')
  rate: string                    // Decimal string (e.g., '7.2345')
  
  rate_date: string               // ISO date (YYYY-MM-DD) when this rate is effective
  fetched_at: string              // ISO timestamp when rate was fetched from API
  source: string                  // Source API (e.g., 'exchangerate-api.com')
  
  created_at: string              // ISO timestamp
  updated_at: string              // ISO timestamp
}
```

**Validation Rules**:
- `rate` MUST be valid decimal string > 0
- `base_currency` MUST be one of: `['USD', 'HKD']` (for MVP; expandable for other pairs if needed)
- `target_currency` MUST be `'CNY'`
- `base_currency` !== `target_currency`
- `rate_date` MUST be in format YYYY-MM-DD
- Only one record per (base_currency, target_currency, rate_date) combination

**Indexes**:
- Primary key: `id`
- Unique composite index: `(base_currency, target_currency, rate_date)` for fast daily lookup
- Index: `rate_date` DESC for fetching latest rates
- Index: `fetched_at` for cleanup jobs

**Business Rules**:
- **Historical persistence**: Only USD/CNY and HKD/CNY pairs are stored daily for historical accuracy in trend analysis
- **Other currency pairs**: All other conversions (e.g., EUR/CNY, JPY/CNY) use the latest cached rate from ExchangeRate API (not stored in database)
- **Snapshot calculations**: When calculating historical portfolio snapshots, use the rate from `rate_date` matching the snapshot date for USD/CNY and HKD/CNY; use latest rate for all others
- **Data retention**: Rates older than 1 year are deleted (cleanup job) to manage storage
- **Cache strategy**: Latest rates for non-persisted pairs cached in Cloudflare KV (24h TTL), DB is fallback for USD/CNY and HKD/CNY only
- **Daily fetch**: System fetches and stores USD/CNY and HKD/CNY rates once daily (cron job at midnight UTC)

**Rationale**:
- USD and HKD are the most common currencies in target markets (Hong Kong/China securities)
- Storing only critical pairs reduces storage costs and simplifies maintenance
- Historical accuracy for major pairs (USD/CNY, HKD/CNY) is more important than for minor pairs
- For other pairs, accepting recalculation with latest rates is an acceptable tradeoff

---

## Summary

| Entity | Purpose | Key Relationships |
|--------|---------|-------------------|
| **User** | System user | Owns BrokerConnections, Holdings, ClassificationSchemes |
| **Broker** | Supported broker platform | Referenced by BrokerConnections |
| **BrokerConnection** | Authorized broker link | Belongs to User + Broker; has Holdings |
| **AuthorizationTask** | Broker authorization process | Belongs to User; creates BrokerConnection |
| **CollectionTask** | Data refresh process | Belongs to User + BrokerConnection; updates Holdings |
| **Holding** | Portfolio position | Belongs to User + BrokerConnection; has HoldingSnapshots |
| **HoldingSnapshot** | Historical holding data | Belongs to Holding |
| **ClassificationScheme** | Category definition | Belongs to User (or preset) |
| **TargetAllocation** | Desired category weights | Belongs to User + ClassificationScheme |
| **RebalancePreview** | Computed rebalance plan | Belongs to User + ClassificationScheme + TargetAllocation |
| **ExchangeRate** | Currency conversion rate | Global reference data |

All entities adhere to Constitution principles: explicit boundaries, defensive validation, forward-only migrations, and the database as the single source of truth.
