# Asset Management System Requirements (EN)

## 1. Background & Goals

- This system aggregates user holdings across multiple platforms, calculates performance, visualizes allocation by category and currency, and supports category-level rebalancing decisions.
- Product goals: mobile-first responsive UI, PWA support, bilingual (ZH/EN), data-driven with a carefully designed database schema.
- UI design reference: br/ui/designs

## 2. Scope & Out of Scope

### In Scope

- Multi-broker portfolio aggregation for display (using mock data)
- Unified asset schema persisted in the database
- Asset/portfolio performance tracking and charts
- Category grouping and allocation visualization (preset + custom categories)
- Category-level target allocation, deviation metrics, and rebalancing recommendations (no trade execution)
- Display currency preference and conversion (computed in the BFF)
- ZH/EN i18n

### Out of Scope

- Broker connectivity and data ingestion/collection (explicitly not implemented; mock data only)

## 3. System Shape & Architectural Principles

- Architecture: Web App (PWA) + BFF + Serverless
- API boundary: the BFF is the only API boundary exposed to the frontend
- Source of truth: the database is the single authoritative source for all financial facts/state

### Pre-calculation Principle (Key)

- Persist financial facts (e.g., total value, daily profit, cumulative profit)
- Do not persist display preferences (e.g., converted display currencies); compute on-demand in the BFF and shape view models
- Use a single persistence base currency: CNY (RMB) only

## 4. Key Data Entities

- User: language preference, theme settings, display currency preference
- Asset: a position (not transactions), including symbol, name, quantity, cost_basis (broker-provided average cost), daily_profit (broker-provided per-asset daily P/L), current_price, currency, broker_source
- Category: name, target allocation percentage, current allocation percentage
- Portfolio: user’s collection of assets and categories
- PortfolioHistory: authoritative snapshots with timestamp (UTC), total_value_cny, daily_profit_cny, current_total_profit_cny (CNY only)
- ExchangeRate: immutable daily FX facts quoted to CNY, retained forever

## 5. Currency & FX Model (Final Constraints)

- Persistence: store financial facts in CNY only
- Conversion: computed on-demand in the BFF and never written back to the database
- FX storage: daily rates for major currencies quoted against CNY (e.g., USD→CNY, HKD→CNY), retained forever
- Conversion formula (CNY → target currency)
  - convertedValue = value_cny / exchangeRate[targetCurrency]

## 6. Calculation & Time Rules

- Portfolio daily profit: daily_profit_cny = Σ(all Assets' daily_profit_cny)
- Daily profit ratio (for cumulative return): ri = daily_profit_cny / previous_day_total_value_cny
- Cumulative return: (1 + r₁) × (1 + r₂) × ... × (1 + rn) - 1
- Snapshot frequency: multiple times per day (e.g., hourly)
- Weekends/holidays: continue calculations based on last known values
- Time handling: store and compute in UTC; convert to user-selected or account default time zone for presentation
- Precision: store monetary values with 4 decimal places

## 7. Functional Requirements (FR)

- FR-001: The system MUST aggregate user asset data from multiple broker platforms using a standardized schema (mock data)
- FR-002: The system MUST calculate/display asset profits using cost basis (broker-provided average cost)
- FR-003: The system MUST convert values to the user-selected display currency in the BFF using stored exchange rates
- FR-004: Users MUST be able to categorize assets (e.g., US equities, China equities, Asia-Pacific equities, commodities, dividend income, bonds)
- FR-005: The system MUST calculate and display allocation percentage, profit amount, and yield by category
- FR-006: Users MUST be able to set target allocation percentages and view deviation from targets
- FR-007: The system MUST provide category-level rebalancing recommendations (no trade execution)
- FR-008: The system MUST provide predefined categories for users to choose from
- FR-009: Users MUST be able to create custom categories and assign assets to them
- FR-010: The system MUST display historical trends of total assets and returns
- FR-011: The system MUST support ZH/EN language switching with incremental i18n JSON strings
- FR-012: The system MUST store daily exchange rates for major currencies quoted against CNY and retain them forever
- FR-013: The system MUST provide a mobile-first responsive design
- FR-014: The system MUST implement a PWA
- FR-015: The system MUST use the BFF as the sole API boundary for the frontend
- FR-016: The database MUST serve as the authoritative source of truth for financial facts and state
- FR-017: The system MUST provide mock data implementation for broker data (broker integrations are out of scope)
- FR-018: The system MUST implement the pages: Welcome, Login, Sign Up, Dashboard, Portfolio, Analysis, Rebalance, Notification Center, Settings
- FR-019: The system MUST provide Settings for theme selection and display currency preference
- FR-020: The system MUST support responsive layout across screen sizes
- FR-021: The system MUST store daily portfolio profits to enable cumulative return statistics (sum of all Assets' daily profit)
- FR-022: The system MUST compute cumulative returns via the product formula using daily profit ratios
- FR-023: The system MUST compute/store portfolio snapshots multiple times per day (e.g., hourly)
- FR-024: The system MUST continue profit calculations on weekends and holidays based on last known values
- FR-025: The system MUST use UTC for internal calculations and store timestamps in UTC
- FR-026: The system MUST convert timestamps to the user's selected time zone (or account default) for presentation
- FR-027: The system MUST store only base-currency (CNY) pre-calculated values in PortfolioHistory
- FR-028: The system MUST update snapshots multiple times per day to reflect current asset values
- FR-029: PortfolioHistory MUST include total_value_cny, daily_profit_cny, current_total_profit_cny
- FR-030: The system MUST store monetary values with 4 decimal places precision
- FR-031: The system MUST include broker-provided asset-level daily profit rather than calculating it
- FR-032: The system MUST store cost basis and daily profit in Asset instead of purchase price
- FR-033: The Asset entity MUST represent an Asset Position (current holding state)
- FR-034: The system MUST differentiate asset-level daily profit and portfolio-level daily profit
- FR-035: Cost basis MUST come from broker data as the average acquisition cost of the position
- FR-036: PortfolioHistory MUST store dailyProfit (daily_profit_cny), not daily_return_rate or dailyReturn
- FR-037: PortfolioHistory MUST be stored in CNY as the base currency
- FR-038: The system MUST NOT persist display-currency converted values; conversion is computed on-demand in the BFF

## 8. Pages & Key Content (Minimum Set)

- Welcome
- Login / Sign Up
- Dashboard (P1): total value, daily profit, annual return, performance charts, allocation charts
- Portfolio (P1): totals, category list, holdings per category
- Analysis: risk/return or performance metrics (can start minimal)
- Rebalance (P2): targets, deviations, category-level recommendations (no execution)
- Notification Center (can start minimal)
- Settings (P1): theme, display currency, language switch

## 9. User Stories & Acceptance Scenarios (P1/P2)

### US-1 Dashboard Overview (P1)

- Given the user is logged in and has portfolio data; When opening Dashboard; Then show totals, daily profit, annual return, charts, and allocation
- Given holdings span multiple currencies; When selecting a display currency in Settings; Then Dashboard values are converted and displayed (computed in BFF)

### US-2 Portfolio Management (P1)

- Given portfolio data exists; When opening Portfolio; Then assets are grouped by category with %/profit/yield and holdings list

### US-3 Asset Rebalancing (P2)

- Given current category allocations exist; When setting target allocation percentages; Then show deviations from targets
- Given deviations exist; When viewing recommendations; Then provide category-level actions/amount suggestions (no execution)

### US-4 Currency Conversion (P2)

- Given exchange rates exist; When switching display currency; Then conversions are accurate to 4 decimals

### US-7 Multi-language Support (P1)

- Given ZH/EN is supported; When switching language; Then the whole UI switches within 1 second without reload

## 10. Edge Cases (Expected Handling)

- Missing exchange rates: graceful degradation with clear messaging and cached/static fallback where possible
- Zero or negative asset values: display safely; avoid calculation crashes (define zero-denominator behavior for ratios)
- Insufficient cash for rebalancing: communicate infeasibility; still provide theoretical guidance
- Extremely large datasets: keep the UI responsive (see success criteria)
- Inconsistent broker data: normalize to unified schema and flag anomalies when needed
- Missing i18n strings: fallback behavior that does not block rendering

## 11. Non-functional Requirements / Success Criteria

- SC-001: Dashboard key metrics load within 3 seconds
- SC-002: Support at least 10,000 assets per user with responsive UI
- SC-003: Conversion accuracy maintained to 4 decimals
- SC-004: 95% of users can reach Portfolio and view allocation within 2 minutes after first login
- SC-005: Rebalancing recommendations are produced within 5 seconds
- SC-006: Language switching completes within 1 second without reload
- SC-007: Mobile usability across 320px–768px widths
- SC-008: 99.5% uptime for Dashboard and Portfolio viewing features
- SC-009: 95% success rate for custom category creation and assignment
- SC-010: Charts support time ranges from 1 day to 10 years
- SC-011: Daily profit calculations/storage meet 99.9% reliability
- SC-012: Cumulative return product formula meets 99.9% mathematical accuracy
- SC-013: Hourly updates during market hours with 99.5% availability
- SC-014: Continuous return calculations with consistent values on non-trading days
- SC-015: 100% UTC consistency internally; correct time zone conversion for presentation
