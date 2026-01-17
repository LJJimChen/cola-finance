# Data Model: Asset Management System

## Core Entities

### 1. User
Represents system users with preferences and settings.

```typescript
interface User {
  id: string;              // Unique identifier
  email: string;           // User's email address
  createdAt: Date;         // Account creation timestamp
  updatedAt: Date;         // Last update timestamp
  languagePreference: 'zh' | 'en';  // UI language preference
  themeSetting: 'light' | 'dark';   // Theme preference
  displayCurrency: string; // Preferred currency for display (e.g., 'USD', 'CNY')
  timezone: string;        // User's timezone for display purposes
}
```

### 2. Asset
Represents an individual holding with attributes like symbol, name, quantity, purchase price, current price, currency, and broker source.

```typescript
interface Asset {
  id: string;              // Unique identifier
  userId: string;          // Owner of the asset
  symbol: string;          // Ticker symbol (e.g., AAPL, 000001)
  name: string;            // Full name of the asset
  quantity: number;        // Number of shares/units held
  purchasePrice: number;   // Price at which the asset was purchased (per unit)
  currentPrice: number;    // Current market price (per unit)
  currency: string;        // Currency of the asset (e.g., USD, CNY, EUR)
  brokerSource: string;    // Source broker (e.g., 'eastmoney', 'tiantian', 'xueqiu')
  categoryId?: string;     // Optional category assignment
  createdAt: Date;         // Record creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### 3. Category
Represents a grouping of assets with attributes like name, target allocation percentage, and current allocation percentage.

```typescript
interface Category {
  id: string;              // Unique identifier
  userId: string;          // Owner of the category
  name: string;            // Category name (e.g., 'US Equities', 'Bonds')
  isCustom: boolean;       // True if user-created, false if predefined
  targetAllocation: number; // Target percentage allocation (0-100)
  createdAt: Date;         // Record creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### 4. Portfolio
Represents a collection of assets and categories for a specific user.

```typescript
interface Portfolio {
  id: string;              // Unique identifier
  userId: string;          // Owner of the portfolio
  name: string;            // Portfolio name (e.g., 'Main Portfolio', 'IRA')
  createdAt: Date;         // Record creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### 5. ExchangeRate
Represents currency conversion rates with attributes like from_currency, to_currency, and rate_value.

```typescript
interface ExchangeRate {
  id: string;              // Unique identifier
  fromCurrency: string;    // Source currency code (e.g., 'USD')
  toCurrency: string;      // Target currency code (e.g., 'CNY')
  rateValue: number;       // Conversion rate (from * rateValue = to)
  date: Date;              // Date of the exchange rate
  createdAt: Date;         // Record creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### 6. PortfolioHistory
Represents daily portfolio snapshots with attributes like date, total_value, and daily_return_rate (added to support cumulative return calculations).

```typescript
interface PortfolioHistory {
  id: string;              // Unique identifier
  userId: string;          // Owner of the portfolio
  date: Date;              // Date of the snapshot
  totalValue: number;      // Total portfolio value in user's display currency
  dailyReturnRate: number; // Daily return rate ((today's value - yesterday's value) / yesterday's value)
  createdAt: Date;         // Record creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

## Relationships

### Asset ↔ Category
- An Asset optionally belongs to one Category
- A Category can have many Assets
- Relationship: One-to-Many (optional)

### User ↔ Asset
- A User owns many Assets
- An Asset belongs to one User
- Relationship: One-to-Many

### User ↔ Category
- A User owns many Categories
- A Category belongs to one User
- Relationship: One-to-Many

### User ↔ Portfolio
- A User owns many Portfolios
- A Portfolio belongs to one User
- Relationship: One-to-Many

### ExchangeRate ↔ PortfolioHistory
- ExchangeRates are used to calculate PortfolioHistory values
- Relationship: Used for calculations, not direct foreign key

## Validation Rules

### Asset Validation
- `quantity` must be greater than 0
- `purchasePrice` and `currentPrice` must be greater than or equal to 0
- `currency` must be a valid ISO 4217 currency code
- `brokerSource` must be one of the supported broker sources

### Category Validation
- `targetAllocation` must be between 0 and 100
- `name` must be unique per user
- Predefined categories (`isCustom: false`) cannot be deleted by users

### ExchangeRate Validation
- `rateValue` must be greater than 0
- `fromCurrency` and `toCurrency` must be valid ISO 4217 currency codes
- There should only be one exchange rate per currency pair per date

### PortfolioHistory Validation
- `dailyReturnRate` can be positive or negative
- `totalValue` must be greater than or equal to 0
- There should only be one history record per user per date

## State Transitions

### Asset State Transitions
Assets don't have explicit states, but their prices change over time:
- `currentPrice` is updated regularly based on market data
- Assets can be assigned to different categories over time

### Category State Transitions
Categories don't have explicit states, but their allocations change based on asset performance:
- `targetAllocation` is set by the user
- Actual allocation percentage changes based on portfolio performance

## Indexes

For optimal query performance, the following indexes should be created:

```sql
-- Asset indexes
CREATE INDEX idx_asset_user_id ON assets(user_id);
CREATE INDEX idx_asset_category_id ON assets(category_id);
CREATE INDEX idx_asset_broker_source ON assets(broker_source);

-- Category indexes
CREATE INDEX idx_category_user_id ON categories(user_id);

-- ExchangeRate indexes
CREATE INDEX idx_exchange_rate_currencies_date ON exchange_rates(from_currency, to_currency, date);

-- PortfolioHistory indexes
CREATE INDEX idx_portfolio_history_user_date ON portfolio_history(user_id, date DESC);
```