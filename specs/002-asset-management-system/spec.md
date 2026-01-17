# Feature Specification: Asset Management System

**Feature Branch**: `002-asset-management-system`
**Created**: 2026-01-15
**Status**: Draft
**Input**: User description: "📘 资产管理系统 Frontend+BFF # 这个系统是什么？ 一个用于聚合用户在不同资产平台持仓数据、统一计算资产收益、按分类和币种展示资产结构、并辅助用户做资产配置再平衡的智能资产管理系统。要求 mobile first, responsive design。 ## 基础功能需求 - 源数据来自多个不同的broker，例如 东方财富证券，天天基金，雪球基金，盈透证券，嘉信理财 - 不同平台的数据在数据库中采用同一种数据结构存储 - 可以查看每个资产的收益 - 可以把不同币种的资产转换成目标币种 - 用户可以对资产分类，显示资产百分比，收益额，收益率，比如说 美股权益，中概股权益，亚太权益，其他权益类，商品，股息红利类，债券 - 用户可以选择某一种分类，然后设置不同分类的目标占比，系统会帮用户统计当前资产的偏离程度，可以查再平衡应该如何调仓，再平衡只针对分类，不针对具体资产 - 系统预设几种分类，用户可以根据自己的资产情况选择不同的分类。 - 用户也可以添加自定义分类 - 总资产走势图 - 收益率走势图 ## 重要事项 - 项目搭建初期就需要支持中英文切换 - 数据库 schema 设计非常重要，因为这是一个数据驱动的应用系统 - 数据库中可以按天存储汇率，但是只存储常见货币的汇率，比如美元/人民币，港币/人民币 ## 非项目功能,不需要考虑实现 - 连接broker - broker数据采集. 不需要关注broker的数据如何采集聚合的问题，因为当前项目的核心需求是实现数据库设计，bff 的api设计已及前端页面的数据展示. 所以数据部分请通过 mock data 实现. ## 基础前端页面 以下是一些基础页面，可以按照实际需求继续补充 1. Welcome 2. Login 3. Sign up 4. Dashboard, 包含资产总额，日收益，年收益，收益率走势图，资产分类占比图 5. Portfolio,包含资产总额，资产分类，资产分类下的所有持仓 6. Analysis,风险收益分析或绩效指标页面。、 7. reblance, 资产再平衡页面 8. notification,消息通知中心 9. Settings,主题设置，显示币种 UI设计请参考 br\ui\designs # 系统架构 - Web App- PWA - BFF -Serverless ## 核心设计原则 - BFF 是唯一对前端暴露的 API 边界 - 数据库是状态与结果的唯一权威来源"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dashboard Overview (Priority: P1)

As an investor, I want to see my total assets, daily profits, annual returns, and asset allocation charts on a single dashboard so that I can quickly assess my portfolio's performance.

**Why this priority**: This is the most critical view that provides users with an immediate understanding of their financial position and is the entry point for deeper analysis.

**Independent Test**: Can be fully tested by displaying mock portfolio data and verifying that all key metrics (total assets, daily profits, annual returns) and charts are displayed correctly, delivering immediate value to users.

**Acceptance Scenarios**:

1. **Given** user has logged in and has portfolio data, **When** user navigates to the dashboard, **Then** the dashboard displays total assets, daily profits, annual returns, and asset allocation charts.
2. **Given** user has portfolio data in multiple currencies, **When** user selects target currency in settings, **Then** dashboard values are converted and displayed in the selected currency.

---

### User Story 2 - Portfolio Management (Priority: P1)

As an investor, I want to view my assets organized by categories (e.g., US Equities, Chinese Equities, Bonds) so that I can understand the composition of my portfolio.

**Why this priority**: Essential for users to understand their portfolio structure and make informed decisions about rebalancing.

**Independent Test**: Can be fully tested by displaying mock portfolio data grouped by categories, showing asset percentages, profits, and yields, delivering value by organizing complex data into understandable views.

**Acceptance Scenarios**:

1. **Given** user has portfolio data, **When** user navigates to the portfolio page, **Then** assets are displayed grouped by categories with percentages, profits, and yields.
2. **Given** user has assets in multiple currencies, **When** user selects target currency, **Then** all values are converted to the selected currency.

---

### User Story 3 - Asset Rebalancing (Priority: P2)

As an investor, I want to set target allocations for different categories and see how my current portfolio deviates from these targets so that I can make informed decisions about rebalancing.

**Why this priority**: Critical for helping users maintain their desired investment strategy and risk profile over time.

**Independent Test**: Can be fully tested by allowing users to set target allocations and calculating deviation metrics, delivering value by providing actionable insights for portfolio adjustments.

**Acceptance Scenarios**:

1. **Given** user has portfolio data and category allocations, **When** user sets target allocation percentages, **Then** system calculates and displays deviation from targets.
2. **Given** user has deviation from target allocations, **When** user views rebalance recommendations, **Then** system suggests specific actions to achieve target allocations.

---

### User Story 4 - Currency Conversion (Priority: P2)

As an investor with assets in multiple currencies, I want to convert all my holdings to a target currency so that I can view my total wealth in a single currency.

**Why this priority**: Important for users with international investments to understand their total wealth in their preferred currency.

**Independent Test**: Can be fully tested by converting mock assets in different currencies to a target currency using stored exchange rates with backend calculations based on user's preferred currency, delivering value by providing unified wealth visibility.

**Acceptance Scenarios**:

1. **Given** user has assets in multiple currencies, **When** user selects target currency, **Then** all asset values are converted to the target currency using current exchange rates with backend calculations.
2. **Given** exchange rates are available in the system, **When** user requests conversion, **Then** accurate conversions are performed using the latest rates with backend calculations based on user's preferred currency.

---

### User Story 5 - Custom Categories (Priority: P3)

As an investor, I want to create custom asset categories so that I can organize my portfolio according to my personal investment strategy.

**Why this priority**: Enhances flexibility for users who want to organize their portfolios in ways that differ from preset categories.

**Independent Test**: Can be fully tested by allowing users to create, modify, and assign assets to custom categories, delivering value by providing personalized portfolio organization.

**Acceptance Scenarios**:

1. **Given** user wants to create a custom category, **When** user enters category name and details, **Then** the new category is saved and available for asset assignment.
2. **Given** user has created custom categories, **When** user assigns assets to these categories, **Then** assets appear under the custom categories in portfolio views.

---

### User Story 6 - Performance Tracking (Priority: P2)

As an investor, I want to view historical trends of my total assets and returns so that I can evaluate my investment performance over time.

**Why this priority**: Essential for investors to understand their long-term performance and make strategic decisions.

**Independent Test**: Can be fully tested by displaying historical data in chart form, delivering value by providing visual insights into performance trends.

**Acceptance Scenarios**:

1. **Given** user has historical portfolio data, **When** user views performance charts, **Then** charts display total assets and returns over time.
2. **Given** user selects different time periods, **When** user interacts with charts, **Then** charts update to show data for the selected time period.

---

### User Story 7 - Multi-language Support (Priority: P1)

As a user, I want to switch between Chinese and English interfaces so that I can use the system in my preferred language.

**Why this priority**: Critical for accessibility and user experience as specified in the requirements.

**Independent Test**: Can be fully tested by switching between languages and verifying that all interface elements are properly translated with i18n strings added incrementally during UI development, delivering value by making the system accessible to a wider audience.

**Acceptance Scenarios**:

1. **Given** system supports multiple languages, **When** user selects language preference, **Then** entire interface is displayed in the selected language.
2. **Given** user has selected a language, **When** user navigates through the application, **Then** all new screens appear in the selected language with translations added as needed during development.

---

### Edge Cases

- What happens when exchange rates are unavailable for certain currency pairs?
- How does the system handle assets with zero or negative values?
- What happens when a user tries to rebalance with insufficient cash?
- How does the system handle extremely large datasets for performance?
- What happens when the system receives inconsistent data from different brokers?
- How does the system handle assets with zero or negative daily profits?
- What happens when the backend cannot calculate currency conversions based on user's preferred currency?
- What happens when a UI element needs translation but the corresponding i18n string hasn't been added yet?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST aggregate user asset data from multiple broker platforms (e.g., East Money Securities, TianTian Fund, XueQiu Fund, Interactive Brokers, Charles Schwab) using a standardized data structure
- **FR-002**: System MUST calculate individual asset profits for each holding using cost basis instead of purchase price
- **FR-003**: System MUST convert assets in different currencies to a target currency using stored exchange rates, with conversions calculated in the backend based on the user's preferred currency when requested
- **FR-004**: Users MUST be able to categorize assets (e.g., US Equities, Chinese Equities, Asia-Pacific Equities, Commodities, Dividend Income, Bonds)
- **FR-005**: System MUST calculate and display asset percentages, profits, and yields by category
- **FR-006**: Users MUST be able to set target allocation percentages for categories and view deviation from targets
- **FR-007**: System MUST provide rebalancing recommendations based on category-level allocations
- **FR-008**: System MUST provide predefined asset categories for users to choose from
- **FR-009**: Users MUST be able to create custom asset categories
- **FR-010**: System MUST display historical trends of total assets and returns
- **FR-011**: System MUST support Chinese and English language switching with i18n strings added incrementally to JSON files as needed during UI development
- **FR-012**: System MUST store daily exchange rates for major currencies (USD/CNY, HKD/CNY)
- **FR-013**: System MUST provide responsive design that works on mobile devices
- **FR-014**: System MUST implement a PWA (Progressive Web App) architecture
- **FR-015**: System MUST use BFF (Backend for Frontend) as the sole API boundary for frontend
- **FR-016**: Database MUST serve as the authoritative source for all data and state
- **FR-017**: System MUST provide mock data implementation for broker data since direct broker connections are out of scope
- **FR-018**: System MUST implement the specified UI pages: Welcome, Login, Sign Up, Dashboard, Portfolio, Analysis, Rebalance, Notification Center, and Settings
- **FR-019**: System MUST provide Settings page for theme selection and currency display preferences
- **FR-020**: System MUST provide mobile-first responsive design that adapts to different screen sizes
- **FR-021**: System MUST calculate and store daily portfolio profits to enable cumulative return statistics (calculated as (today's value - yesterday's value))
- **FR-022**: System MUST calculate cumulative returns using the product formula: (1 + r₁) × (1 + r₂) × ... × (1 + rn) - 1 where ri represents daily profit ratios (daily profit / previous day's total value)
- **FR-023**: System MUST calculate and store portfolio profits multiple times per day (e.g., hourly) to provide up-to-date performance metrics
- **FR-024**: System MUST continue calculating profits based on the last known values on weekends and holidays when markets are closed
- **FR-025**: System MUST use UTC for all internal calculations and store all timestamps in UTC
- **FR-026**: System MUST convert timestamps to the user's selected time zone or account default time zone for presentation
- **FR-027**: System MUST store pre-calculated currency-converted values (total assets, daily profit, current total profit) in daily portfolio snapshots for performance optimization
- **FR-028**: System MUST update daily portfolio snapshots multiple times per day to reflect current asset values
- **FR-029**: System MUST include separate fields for currency-converted total assets, daily profit, and current total profit in portfolio history records
- **FR-030**: System MUST store currency-converted values with 4 decimal places precision
- **FR-031**: System MUST include daily profit from broker data rather than calculating it
- **FR-032**: System MUST store cost basis and daily profit in the Asset entity instead of purchase price
- **FR-033**: System MUST treat Asset entity as the Asset Position with cost basis and daily profit attributes
- **FR-034**: System MUST differentiate between daily profit for individual assets and daily profit for overall portfolio
- **FR-035**: System MUST obtain cost basis from broker data representing the average cost of acquiring the asset position
- **FR-036**: System MUST store dailyProfit in the PortfolioHistory entity instead of daily_return_rate or dailyReturn
- **FR-037**: System MUST store all PortfolioHistory values in RMB (CNY) as the base currency
- **FR-038**: System MUST pre-calculate all possible currency conversions in the backend for display in other currencies

### Key Entities *(include if feature involves data)*

- **Asset**: Represents an individual holding (also referred to as Asset Position) with attributes like symbol, name, quantity, cost_basis (provided by broker data, representing average cost of acquiring the position), daily_profit (for individual asset), current price, currency, and broker source
- **Category**: Represents a grouping of assets with attributes like name, target allocation percentage, and current allocation percentage
- **Portfolio**: Represents a collection of assets and categories for a specific user
- **ExchangeRate**: Represents currency conversion rates with attributes like from_currency, to_currency, and rate_value. Used by the backend to calculate conversions based on user's preferred currency when requested.
- **User**: Represents system users with attributes like language preference, theme settings, and currency display preferences. Language translations use incremental i18n approach with strings added to JSON files as needed during UI development.
- **PortfolioHistory**: Represents daily portfolio snapshots with attributes like date, total_value (in RMB/CNY), and dailyProfit (added to support cumulative return calculations). Pre-calculated currency-converted values (total assets, daily profit, current total profit) are stored for performance optimization. Includes separate fields for currency-converted total assets, daily profit (for overall portfolio, included from broker data), and current total profit with 4 decimal places precision. All values are stored in RMB (CNY) as the base currency. The backend pre-calculates all possible currency conversions for display in other currencies.

## Clarifications

### Session 2026-01-15

- Q: How should the system handle failures when external services (like exchange rate providers) are unavailable? → A: Gracefully degrade functionality, showing cached or static data where possible
- Q: For the Asset entity, which additional attributes should be included beyond the basic ones mentioned? → A: Only include the basic attributes already mentioned (symbol, name, quantity, cost_basis, daily_profit, current price, currency, broker source), replacing purchase price with cost basis and daily profit
- Q: Should the rebalancing feature only provide recommendations without executing actual trades? → A: Yes, rebalancing only shows users how to perform rebalancing, without executing trades
- Q: How should the system handle empty states (e.g., when a user has no assets yet)? → A: Display a simple message indicating no data is available
- Q: For how long should the system store historical exchange rates? → A: Keep forever

### Session 2026-01-16

- Q: How should daily profits be calculated and stored to enable cumulative return statistics? → A: Store daily portfolio profits (calculated as (today's value - yesterday's value)), with daily profit ratios calculated as (daily profit / previous day's total value) for cumulative return calculations
- Q: How should cumulative returns be calculated and displayed in the system? → A: Calculate cumulative returns using the product formula: (1 + r₁) × (1 + r₂) × ... × (1 + rn) - 1
- Q: How often should daily profits be calculated and stored? → A: Multiple times per day (e.g., hourly)
- Q: How should the system handle profit calculations on weekends and holidays when markets are closed? → A: Continue calculating profits based on the last known values
- Q: How should the system handle time zones for profit calculations and reporting? → A: Use UTC for all internal calculations and store timestamps in UTC, with conversion to user-selected or account default time zone for presentation

### Session 2026-01-17

- Q: Should the daily asset snapshots store pre-calculated currency-converted values or calculate them on-the-fly? → A: Store pre-calculated values in the database for performance optimization
- Q: How frequently are the daily asset snapshots updated? → A: Daily snapshots are updated multiple times per day
- Q: How should the currency-converted values (total assets, daily profit, current total profit) be stored? → A: Store these three specific pre-calculated values separately in the PortfolioHistory entity
- Q: What precision should be used for currency-converted values (total assets, daily profit, current total profit)? → A: 4 decimal places precision
- Q: How should daily profit be calculated for the currency-converted values? → A: Daily profit is included in broker data rather than calculated
- Q: What attributes should the Asset entity include instead of purchase price? → A: Store cost basis and daily profit instead of purchase price in the Asset entity
- Q: What does "Asset Position" refer to in the context? → A: Asset Position refers to the current state of the Asset entity
- Q: What's the difference between daily profit in the Asset entity and in the PortfolioHistory entity? → A: Daily profit in Asset entity is for individual asset; daily profit in PortfolioHistory is for overall portfolio
- Q: How is the cost basis in the Asset entity determined? → A: Cost basis is provided by the broker data and represents the average cost of acquiring the asset position
- Q: What should the PortfolioHistory entity store instead of daily_return_rate? → A: Change PortfolioHistory to store dailyReturn instead of daily_return_rate
- Q: What currency should the PortfolioHistory entity be priced in? → A: Specify that PortfolioHistory is priced in RMB (CNY) as the base currency
- Q: How should currency conversion work when the frontend needs to display in other currencies? → A: Have the backend pre-calculate all possible currency conversions
- Q: Should PortfolioHistory use dailyReturn or dailyProfit? → A: Use daily Profit, remove daily return and daily return rate
- Q: How should cumulative returns be calculated with daily profits? → A: Clarify that cumulative returns are still calculated using the product formula but based on daily profit ratios
- Q: How should currency conversion be calculated when the frontend needs to display in other currencies? → A: Backend pre-calculation - The backend calculates conversions using user's preferred currency when requested
- Q: How should i18n strings be added to JSON files for multi-language support? → A: Incremental addition - Add i18n strings to JSON files as needed during UI development

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view their total assets, daily profits, and annual returns on the dashboard within 3 seconds of page load
- **SC-002**: System supports at least 10,000 assets per user while maintaining responsive UI performance
- **SC-003**: Currency conversion accuracy is maintained to 4 decimal places for all supported currency pairs
- **SC-004**: 95% of users can successfully navigate to their portfolio and view asset allocation within 2 minutes of first login
- **SC-005**: Rebalancing recommendations are calculated and displayed within 5 seconds of requesting them
- **SC-006**: Language switching between Chinese and English completes within 1 second without page reload
- **SC-007**: Mobile interface is usable on screen sizes ranging from 320px to 768px width
- **SC-008**: System achieves 99.5% uptime for the dashboard and portfolio viewing features
- **SC-009**: Users can create custom categories and assign assets to them with 95% success rate
- **SC-010**: Historical data charts load and display correctly for time ranges from 1 day to 10 years
- **SC-011**: Daily portfolio returns are calculated and stored accurately with 99.9% reliability
- **SC-012**: Cumulative returns are calculated using the product formula with 99.9% mathematical accuracy
- **SC-013**: Portfolio returns are updated at least hourly during market hours with 99.5% system availability
- **SC-014**: System maintains continuous return calculations with consistent values on non-trading days (weekends and holidays)
- **SC-015**: All internal timestamp operations use UTC with 100% consistency, and user-facing displays correctly convert to local time zones