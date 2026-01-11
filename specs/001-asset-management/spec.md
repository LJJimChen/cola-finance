# Feature Specification: Asset Management System (MVP)

**Feature Branch**: `001-asset-management`  
**Created**: 2026-01-11  
**Status**: Draft  
**Input**: User description: "Multi-broker asset aggregation and portfolio analysis system (mobile-first) with secure authorization (no broker credential storage), yields/returns, currency normalization, classification, and category-level rebalance preview."

## Clarifications

### Session 2026-01-11

- Q: What is the lifetime for Engine Access Tokens used in human-in-the-loop authorization flows? → A: 5 minutes
- Q: How should language selection work for internationalization (Chinese/English)? → A: User-selectable with system default (auto-detect browser/OS locale, user can override anytime)
- Q: When background tasks (authorization, collection) complete, how should the UI update? → A: Portfolio view refresh without full page reload (SPA pattern, updates only affected UI sections)
- Q: What happens if the user creates targets that do not sum to 100%? → A: Block submission if not 100% (strict validation; user cannot save until sum equals 100%)
- Q: How should the frontend receive real-time task status updates? → A: Short polling (frontend polls BFF every 2-5 seconds)
- Q: What is the monorepo directory structure for application and shared packages? → A: apps/** for deployable applications (web, bff, engine) and packages/** for shared libraries (schema, types, utilities)
- Q: Should exchange rates be persisted in database? When doing trend analysis, which exchange rate should be used for historical snapshots? → A: Maintain an exchange rate table storing one daily record for USD/CNY and HKD/CNY pairs only; for all other currency pairs, always use the latest exchange rate for calculations (including historical trend analysis)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect broker + view portfolio (Priority: P1)

A user securely connects one supported broker account and can view a consolidated portfolio
summary and holdings.

**Why this priority**: Without a trusted, up-to-date portfolio view, all other analysis and
rebalancing features have no usable foundation.

**Independent Test**: Using a test/dummy broker account (or a broker sandbox if available), a
user completes the authorization flow, triggers a portfolio refresh, and sees a portfolio
summary and holdings list.

**Acceptance Scenarios**:

1. **Given** a signed-in user with no connected brokers, **When** the user starts a broker
   connection and completes authorization, **Then** the system records the broker connection
   and shows it as connected.
2. **Given** a connected broker, **When** the user requests a portfolio refresh, **Then** the
   system updates holdings and shows an updated portfolio summary.
3. **Given** an authorization flow that requires user verification (e.g., captcha / 2FA),
   **When** the system cannot proceed automatically, **Then** the user is guided to complete
   the required step and the session resumes after completion.

---

### User Story 2 - Normalize portfolio to a display currency (Priority: P2)

A user selects a display currency and sees portfolio totals and per-holding values normalized
to that currency.

**Why this priority**: Users hold assets in multiple currencies; normalization is required to
understand true allocation, performance, and drift.

**Independent Test**: With a portfolio containing at least two currencies, the user switches
the display currency and sees totals and holdings values update consistently.

**Acceptance Scenarios**:

1. **Given** a portfolio with assets in multiple currencies, **When** the user selects a
   display currency, **Then** the system shows normalized totals and per-asset values in the
   selected currency.
2. **Given** missing or stale conversion data, **When** the user requests normalization,
   **Then** the system shows clearly which values are estimated/unavailable and preserves the
   last known consistent portfolio view.

---

### User Story 3 - Classify holdings + rebalance preview (category-level) (Priority: P3)

A user selects a classification scheme, configures target allocation by category, and views a
rebalance preview that shows current vs target allocation and drift.

**Why this priority**: Rebalancing is the primary decision-support feature; category-level
rebalancing keeps the system understandable and reduces overfitting to specific holdings.

**Independent Test**: With any portfolio and a classification scheme, the user sets target
weights and receives a rebalance preview that highlights drift and suggested category-level
adjustments.

**Acceptance Scenarios**:

1. **Given** a portfolio and a selected classification scheme, **When** the user assigns
   categories to holdings (or accepts defaults), **Then** the system shows category
   percentages and performance summaries.
2. **Given** target weights for categories, **When** the user requests a rebalance preview,
   **Then** the system shows current allocation, target allocation, and drift per category.
3. **Given** the system produces a rebalance preview, **When** the user reviews it, **Then**
   the preview expresses adjustments only at the category level (not per individual holding).

---

### Edge Cases

- What happens when a broker authorization expires during a refresh? → System MUST detect expiration, mark the task as requiring re-authorization, and prompt the user to reconnect.
- What happens when a broker is temporarily unavailable or returns partial data? → System MUST mark the refresh as "partial" and clearly indicate which holdings are stale or missing.
- How does the system handle holdings with unknown currency or missing price data? → System MUST display holdings with unknown currency in their original currency and flag them as unable to normalize.
- How does the system behave when exchange rate data is missing for a currency pair? → System MUST preserve the last known conversion rate and flag the data as stale, or display holdings in their original currency if no historical rate exists.
- What happens if the user creates targets that do not sum to 100%? → System MUST block submission and display validation error until targets sum to exactly 100%.
- How does the system handle duplicate holdings or inconsistent identifiers across brokers? → System MUST use a broker-specific holding identifier and treat cross-broker duplicates as separate holdings unless explicitly merged by the user.
- What happens when the user has no holdings (empty portfolio)? → System MUST display an empty state message and disable rebalance preview until holdings exist.
- How are historical portfolio values calculated when exchange rates change? → For USD/CNY and HKD/CNY pairs, the system uses the historical daily rate from the snapshot date. For all other currency pairs, the system uses the latest available rate, which may cause historical values to fluctuate when rates change.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to sign up and sign in to access their portfolio data.
- **FR-002**: System MUST allow a signed-in user to connect at least one supported broker.
- **FR-003**: System MUST support an authorization flow that does not require storing broker
  usernames/passwords.
- **FR-004**: System MUST support cases where authorization requires user verification
  (human-in-the-loop) and MUST expose a clear user-visible task status. Engine Access Tokens
  for human-in-the-loop sessions MUST have a 5-minute lifetime.
- **FR-005**: System MUST allow a user to trigger a portfolio refresh and view the refresh
  status. When background tasks (authorization or collection) complete, the UI MUST update
  the portfolio view without requiring a full page reload. The frontend MUST poll the BFF
  for task status updates at intervals of 2-5 seconds while tasks are in progress.
- **FR-006**: System MUST store and present holdings and a portfolio summary for each user.
- **FR-007**: System MUST compute and display portfolio and per-asset performance metrics
  (at minimum: current value and returns over at least one time window).
- **FR-008**: System MUST allow a user to select a display currency and MUST normalize totals
  and holding values to that currency when conversion data exists.
- **FR-009**: System MUST provide at least one preset classification scheme and MUST allow a
  user to create a custom scheme.
- **FR-010**: System MUST allow a user to define target allocation weights by category. The
  system MUST validate that the sum of all target weights equals exactly 100% and MUST block
  submission until this condition is met.
- **FR-011**: System MUST generate a rebalance preview that reports drift by category and
  proposed category-level adjustments.
- **FR-012**: System MUST provide clear, user-facing error states for failed authorization,
  failed refresh, and partial data.
- **FR-013**: System MUST support Chinese and English locales. On first access, the system
  MUST auto-detect the user's browser/OS locale and display content accordingly. Users MUST
  be able to manually override the language selection at any time, and the preference MUST
  be persisted.

### Key Entities *(include if feature involves data)*

- **User**: Person using the system; owns broker connections, preferences (including language
  preference), and portfolios.
- **Broker**: A supported external platform (e.g., securities broker / fund platform).
- **Broker Connection**: A user’s authorized relationship to a broker used for data access.
- **Authorization Task**: A user-visible process for establishing/renewing a broker
  connection, including human-in-the-loop states. When human verification is required,
  Engine generates a task-bound access token valid for 5 minutes.
- **Collection Task**: A user-visible process for refreshing holdings/performance data.
- **Holding**: A position in an instrument with quantity, currency, and valuation metadata.
- **Portfolio Snapshot**: A point-in-time aggregation of holdings and computed totals.
- **Classification Scheme**: A set of categories and mapping rules for grouping holdings.
- **Target Allocation**: Desired weights by category under a given classification scheme.
- **Rebalance Preview**: Computed drift and suggested category-level adjustments.
- **Exchange Rate**: Currency conversion values used for normalization. The system stores daily historical rates for USD/CNY and HKD/CNY pairs only. All other currency conversions use the latest available rate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can connect a broker and see an initial portfolio view within
  10 minutes.
- **SC-002**: After a refresh request, the user can see an updated portfolio status and final
  outcome (success/failed/partial) without ambiguity.
- **SC-003**: For portfolios containing multiple currencies, a user can switch display
  currency and receive a consistent normalized portfolio view.
- **SC-004**: A user can configure target allocation by category and obtain a rebalance
  preview that clearly shows drift for every category.
