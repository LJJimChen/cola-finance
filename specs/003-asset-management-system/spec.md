# Feature Specification: Asset Management System

**Feature Branch**: `003-asset-management-system`
**Created**: 2026-01-18
**Status**: Draft
**Input**: User description: "Asset Management System Requirements (EN) - This system aggregates user holdings across multiple platforms, calculates performance, visualizes allocation by category and currency, and supports category-level rebalancing decisions. Product goals: mobile-first responsive UI, PWA support, bilingual (ZH/EN), data-driven with a carefully designed database schema."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Dashboard Overview (Priority: P1)

As an investor, I want to see an overview of my portfolio including total value, daily profit, and annual return so that I can quickly assess my investment performance.

**Why this priority**: This is the primary value proposition of the system - giving users a quick snapshot of their portfolio health.

**Independent Test**: Can be fully tested by logging in and viewing the dashboard, which delivers immediate value by showing portfolio metrics.

**Acceptance Scenarios**:

1. **Given** the user is logged in and has portfolio data, **When** opening Dashboard, **Then** show totals, daily profit, annual return, charts, and allocation
2. **Given** holdings span multiple currencies, **When** selecting a display currency in Settings, **Then** Dashboard values are converted and displayed (computed in backend service)

---

### User Story 2 - Portfolio Management (Priority: P1)

As an investor, I want to view my assets organized by category with allocation percentages, profit amounts, and yields so that I can understand my investment distribution.

**Why this priority**: Essential for users to see how their investments are distributed across different asset classes.

**Independent Test**: Can be fully tested by navigating to the Portfolio page and viewing categorized assets, which delivers value by showing asset distribution.

**Acceptance Scenarios**:

1. **Given** portfolio data exists, **When** opening Portfolio, **Then** assets are grouped by category with %/profit/yield and holdings list

---

### User Story 3 - Asset Rebalancing (Priority: P2)

As an investor, I want to set target allocation percentages for categories and see deviations from targets so that I can make informed rebalancing decisions.

**Why this priority**: Important for portfolio optimization but secondary to basic viewing capabilities.

**Independent Test**: Can be tested by setting target allocations and viewing deviations/recommendations.

**Acceptance Scenarios**:

1. **Given** current category allocations exist, **When** setting target allocation percentages, **Then** show deviations from targets
2. **Given** deviations exist, **When** viewing recommendations, **Then** provide category-level actions/amount suggestions (no execution)

---

### User Story 4 - Multi-language Support (Priority: P1)

As a user, I want to switch between Chinese and English interfaces so that I can use the system in my preferred language.

**Why this priority**: Critical for reaching the target market which includes Chinese speakers.

**Independent Test**: Can be tested by switching languages and verifying the UI updates appropriately.

**Acceptance Scenarios**:

1. **Given** ZH/EN is supported, **When** switching language, **Then** the whole UI switches within 1 second without reload

### Edge Cases

- What happens when exchange rates are missing for a particular currency?
- How does system handle zero or negative asset values?
- What occurs when there's insufficient cash for rebalancing recommendations?
- How does the system behave with extremely large datasets (10,000+ assets)?
- What happens with inconsistent broker data formats?
- How does the system handle missing i18n strings?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST aggregate user asset data from multiple broker platforms using a standardized schema (mock data)
- **FR-002**: System MUST calculate/display asset profits using cost basis (broker-provided average cost)
- **FR-003**: System MUST convert values to the user-selected display currency in the backend service using stored exchange rates
- **FR-004**: Users MUST be able to categorize assets (e.g., US equities, China equities, Asia-Pacific equities, commodities, dividend income, bonds)
- **FR-005**: System MUST calculate and display allocation percentage, profit amount, and yield by category
- **FR-006**: Users MUST be able to set target allocation percentages and view deviation from targets
- **FR-007**: System MUST provide category-level rebalancing recommendations (no trade execution)
- **FR-008**: System MUST provide predefined categories for users to choose from
- **FR-009**: Users MUST be able to create custom categories and assign assets to them
- **FR-010**: System MUST display historical trends of total assets and returns
- **FR-011**: System MUST support ZH/EN language switching with incremental i18n JSON strings
- **FR-012**: System MUST store daily exchange rates for major currencies quoted against CNY and retain them forever
- **FR-013**: System MUST provide a mobile-first responsive design
- **FR-014**: System MUST implement a PWA
- **FR-015**: System MUST use the backend service as the sole API boundary for the frontend
- **FR-016**: Database MUST serve as the authoritative source of truth for financial facts and state
- **FR-017**: System MUST provide mock data implementation for broker data (broker integrations are out of scope)
- **FR-018**: System MUST implement the pages: Welcome, Login, Sign Up, Dashboard, Portfolio, Analysis, Rebalance, Notification Center, Settings
- **FR-019**: System MUST provide Settings for theme selection and display currency preference
- **FR-020**: System MUST support responsive layout across screen sizes
- **FR-021**: System MUST store daily portfolio profits to enable cumulative return statistics (sum of all Assets' daily profit)
- **FR-022**: System MUST compute cumulative returns via the product formula using daily profit ratios
- **FR-023**: System MUST compute/store portfolio snapshots multiple times per day (e.g., hourly)
- **FR-024**: System MUST continue profit calculations on weekends and holidays based on last known values
- **FR-025**: System MUST use UTC for internal calculations and store timestamps in UTC
- **FR-026**: System MUST convert timestamps to the user's selected time zone (or account default) for presentation
- **FR-027**: System MUST store only base-currency (CNY) pre-calculated values in PortfolioHistory
- **FR-028**: System MUST update snapshots multiple times per day to reflect current asset values
- **FR-029**: PortfolioHistory MUST include total_value_cny, daily_profit_cny, current_total_profit_cny
- **FR-030**: System MUST store monetary values with 4 decimal places precision
- **FR-031**: System MUST include broker-provided asset-level daily profit rather than calculating it
- **FR-032**: System MUST store cost basis and daily profit in Asset instead of purchase price
- **FR-033**: Asset entity MUST represent an Asset Position (current holding state)
- **FR-034**: System MUST differentiate asset-level daily profit and portfolio-level daily profit
- **FR-035**: Cost basis MUST come from broker data as the average acquisition cost of the position
- **FR-036**: PortfolioHistory MUST store dailyProfit (daily_profit_cny), not daily_return_rate or dailyReturn
- **FR-037**: PortfolioHistory MUST be stored in CNY as the base currency
- **FR-038**: System MUST NOT persist display-currency converted values; conversion is computed on-demand in the backend service

### Key Entities *(include if feature involves data)*

- **User**: Represents a system user with language preference, theme settings, and display currency preference
- **Asset**: Represents a position (not transactions), including symbol, name, quantity, cost_basis (broker-provided average cost), daily_profit (broker-provided per-asset daily P/L), current_price, currency, broker_source
- **Category**: Represents a grouping of assets with name, target allocation percentage, and current allocation percentage
- **Portfolio**: Represents a user's collection of assets and categories
- **PortfolioHistory**: Contains authoritative snapshots with timestamp (UTC), total_value_cny, daily_profit_cny, current_total_profit_cny (CNY only)
- **ExchangeRate**: Contains immutable daily FX facts quoted to CNY, retained forever

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Dashboard key metrics load within 3 seconds
- **SC-002**: System supports at least 10,000 assets per user with responsive UI
- **SC-003**: Conversion accuracy maintained to 4 decimals
- **SC-004**: 95% of users can reach Portfolio and view allocation within 2 minutes after first login
- **SC-005**: Rebalancing recommendations are produced within 5 seconds
- **SC-006**: Language switching completes within 1 second without reload
- **SC-007**: Mobile usability across 320px–768px widths
- **SC-008**: 99.5% uptime for Dashboard and Portfolio viewing features
- **SC-009**: 95% success rate for custom category creation and assignment
- **SC-010**: Charts support time ranges from 1 day to 10 years
- **SC-011**: Daily profit calculations/storage meet 99.9% reliability
- **SC-012**: Cumulative return product formula meets 99.9% mathematical accuracy
- **SC-013**: Hourly updates during market hours with 99.5% availability
- **SC-014**: Continuous return calculations with consistent values on non-trading days
- **SC-015**: 100% UTC consistency internally; correct time zone conversion for presentation
