# Database Design Notes

This document outlines the design principles and decisions for the Cola Finance BFF database schema.

## Core Principles

1.  **Integer Precision (No Floating Point)**:
    - All monetary values are stored as **Integers** with fixed precision.
    - **Money**: `x10000` (4 decimal places). Suffix: `...4` (e.g., `total_value_cny4`).
    - **Quantities & Rates**: `x100,000,000` (8 decimal places). Suffix: `...8` (e.g., `quantity8`, `rate8`).
    - *Reason*: Eliminates floating-point arithmetic errors, essential for financial accuracy.

2.  **Unified Time Representation**:
    - All time fields are stored as **Integers** (Unix Timestamp in milliseconds).
    - *Reason*:
        - **Efficiency**: Faster sorting and indexing compared to ISO8601 strings.
        - **Consistency**: Eliminates timezone parsing ambiguity at the DB layer.
        - **Compatibility**: Maps directly to JavaScript `Date` objects in the application layer.

3.  **Referential Integrity**:
    - Foreign keys are enforced with `ON DELETE CASCADE` where appropriate.
    - Example: Deleting a `Portfolio` automatically deletes all its `Categories` and `Assets`.

## Schema Key Decisions

### 1. Time Fields (`integer` vs `text`)
- **Decision**: Changed all `created_at`, `updated_at`, `date`, `timestamp` fields to `integer` (timestamp mode in Drizzle).
- **Previous State**: Mixed usage of ISO strings and integers.
- **Benefit**:
    - Simplifies range queries (e.g., `WHERE timestamp >= ? AND timestamp <= ?`).
    - Reduces storage size.
    - Enforces a single source of truth for time handling.

### 2. Asset Quantity (`quantity8`)
- **Decision**: Replaced `quantity` (REAL) with `quantity8` (INTEGER).
- **Reason**:
    - `REAL` (floating point) is risky for exact position tracking.
    - 8 decimal places (x10^8) supports:
        - Cryptocurrencies (e.g., 0.00000001 BTC).
        - Fractional shares (e.g., 0.05 AAPL).
        - Fine-grained ETF units.

### 3. Exchange Rates Unique Index
- **Decision**: Added unique index on `(source_currency, target_currency, date)`.
- **Reason**:
    - Ensures only one exchange rate exists per currency pair per day.
    - Enables safe `INSERT OR REPLACE` or "Upsert" logic.
    - Prevents data duplication bugs during seeding or external API fetching.

### 4. Derived Data & Performance
- **Strategy**: Denormalize heavy aggregate data onto parent tables.
    - `portfolios` table stores `total_value_cny4`, `daily_profit_cny4`.
    - `categories` table stores `current_allocation_bps`.
- **Trade-off**:
    - **Write**: Slower. Requires re-calculation on every Asset modification (handled by `PortfolioMetricsService`).
    - **Read**: Extremely fast. Dashboard loads O(1) without joining/aggregating thousands of assets.
- **Consistency**: Re-computation is transactional to ensure derived data never drifts from source truth.

## Application Layer Compatibility
- **DTOs**: API responses convert these integers back to standard JSON numbers (floats) for frontend consumption.
- **Services**: All internal math uses the integer helpers (`src/lib/money.ts`).

## Future Proofing
- **Multi-Currency**: Schema supports `currency` per asset.
- **Historical Backtesting**: `portfolio_histories` table captures daily snapshots, enabling TWR (Time-Weighted Return) calculations.
