# Data Model: Asset Management System

## Overview

This document defines the data model for the asset management system, including entities, their relationships, and validation rules derived from the functional requirements.

## Core Entities

### User
Represents a system user with preferences and settings.

**Fields:**
- `id` (string, primary key): Unique identifier for the user
- `email` (string): User's email address
- `language` (string): Preferred language ('zh' or 'en')
- `theme` (string): UI theme preference ('light', 'dark', or 'system')
- `displayCurrency` (string): Default currency for display (e.g., 'USD', 'CNY', 'HKD')
- `createdAt` (timestamp): Account creation time (UTC)
- `updatedAt` (timestamp): Last update time (UTC)

**Validation:**
- Email must be a valid email format
- Language must be one of the supported languages
- Display currency must be one of the supported currencies

### Asset
Represents an individual holding (Asset Position) with cost basis and daily profit information.

**Fields:**
- `id` (string, primary key): Unique identifier for the asset
- `userId` (string, foreign key): Reference to the owning user
- `symbol` (string): Asset symbol (e.g., AAPL, 000001.SZ)
- `name` (string): Full name of the asset
- `quantity` (decimal): Number of shares/units held
- `costBasis` (decimal): Average cost of acquiring the position (provided by broker)
- `dailyProfit` (decimal): Daily profit for the individual asset
- `currentPrice` (decimal): Current market price
- `currency` (string): Currency of the asset (e.g., USD, CNY)
- `brokerSource` (string): Source broker (e.g., 'eastmoney', 'tiantian', 'xueqiu')
- `categoryId` (string, foreign key): Reference to the assigned category
- `createdAt` (timestamp): Creation time (UTC)
- `updatedAt` (timestamp): Last update time (UTC)

**Validation:**
- Quantity must be positive
- Cost basis must be non-negative
- Current price must be non-negative
- Currency must be one of the supported currencies
- Broker source must be one of the registered brokers

### Category
Represents a grouping of assets with target allocation percentages.

**Fields:**
- `id` (string, primary key): Unique identifier for the category
- `userId` (string, foreign key): Reference to the owning user
- `name` (string): Category name (e.g., 'US Equities', 'Chinese Equities')
- `targetAllocation` (decimal): Target percentage allocation (0-100)
- `createdAt` (timestamp): Creation time (UTC)
- `updatedAt` (timestamp): Last update time (UTC)

**Validation:**
- Name must be unique per user
- Target allocation must be between 0 and 100

### ExchangeRate
Represents currency conversion rates used for calculations.

**Fields:**
- `id` (string, primary key): Unique identifier for the exchange rate
- `date` (date): Date of the exchange rate (UTC)
- `fromCurrency` (string): Source currency code (e.g., USD)
- `toCurrency` (string): Target currency code (e.g., CNY) - always CNY for base rates
- `rateValue` (decimal): Conversion rate
- `createdAt` (timestamp): Creation time (UTC)

**Validation:**
- From and to currencies must be valid currency codes
- Rate value must be positive
- Date must be current or past
- To currency must be CNY for base rates

### PortfolioHistory
Represents authoritative portfolio snapshots with base-currency values.

**Fields:**
- `id` (string, primary key): Unique identifier for the portfolio history record
- `userId` (string, foreign key): Reference to the owning user
- `date` (date): Date of the snapshot (UTC)
- `totalValueCNY` (decimal): Total portfolio value in CNY (base currency)
- `dailyProfitCNY` (decimal): Daily profit for the overall portfolio in CNY
- `currentTotalProfitCNY` (decimal): Total accumulated profit in CNY
- `createdAt` (timestamp): Creation time (UTC)

**Validation:**
- Date must be current or past
- All monetary values must have 4 decimal places precision
- All monetary values must be non-negative

## Relationships

1. **User → Asset**: One-to-many (one user owns many assets)
2. **User → Category**: One-to-many (one user creates many categories)
3. **User → PortfolioHistory**: One-to-many (one user has many portfolio history records)
4. **Category → Asset**: One-to-many (one category contains many assets)
5. **ExchangeRate**: Independent entity with no direct relationships

## Constraints

1. **Portfolio Balance**: The sum of all asset values for a user should equal the total value in PortfolioHistory (after currency conversion)
2. **Category Allocation**: The sum of target allocations for all categories of a user should not exceed 100%
3. **Currency Consistency**: All values within an asset record should be in the same currency unless converted
4. **Daily Snapshots**: Only one PortfolioHistory record per user per date
5. **Cost Basis Integrity**: Cost basis should not change once set (except for splits or corporate actions)
6. **Base Currency**: All PortfolioHistory values are stored in CNY (RMB) as the base currency

## Indexes

1. `assets.userId` - For efficient user asset retrieval
2. `assets.categoryId` - For efficient category-based queries
3. `categories.userId` - For efficient user category retrieval
4. `portfolioHistories.userId` - For efficient user portfolio history retrieval
5. `portfolioHistories.date` - For efficient date-based queries
6. `exchangeRates.fromCurrency, exchangeRates.toCurrency, exchangeRates.date` - For efficient exchange rate lookup