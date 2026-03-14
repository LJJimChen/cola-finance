BEGIN TRANSACTION;

CREATE TEMP TABLE _tmp_portfolio_map (
  old_id TEXT PRIMARY KEY,
  new_id TEXT NOT NULL
);

INSERT INTO _tmp_portfolio_map (old_id, new_id)
SELECT id, lower(hex(randomblob(16)))
FROM portfolios
WHERE user_id = '@TEMPLATE_USER_ID@';

CREATE TEMP TABLE _tmp_category_map (
  old_id TEXT PRIMARY KEY,
  new_id TEXT NOT NULL
);

INSERT INTO _tmp_category_map (old_id, new_id)
SELECT c.id, lower(hex(randomblob(16)))
FROM categories c
JOIN _tmp_portfolio_map pm ON pm.old_id = c.portfolio_id;

INSERT INTO portfolios (
  id,
  user_id,
  name,
  description,
  total_value_cny4,
  daily_profit_cny4,
  current_total_profit_cny4,
  created_at,
  updated_at
)
SELECT
  pm.new_id,
  '@NEW_USER_ID@',
  p.name,
  p.description,
  p.total_value_cny4,
  p.daily_profit_cny4,
  p.current_total_profit_cny4,
  p.created_at,
  p.updated_at
FROM portfolios p
JOIN _tmp_portfolio_map pm ON pm.old_id = p.id
WHERE p.user_id = '@TEMPLATE_USER_ID@';

INSERT INTO categories (
  id,
  portfolio_id,
  name,
  target_allocation_bps,
  current_allocation_bps,
  created_at,
  updated_at
)
SELECT
  cm.new_id,
  pm.new_id,
  c.name,
  c.target_allocation_bps,
  c.current_allocation_bps,
  c.created_at,
  c.updated_at
FROM categories c
JOIN _tmp_category_map cm ON cm.old_id = c.id
JOIN _tmp_portfolio_map pm ON pm.old_id = c.portfolio_id;

INSERT INTO assets (
  id,
  portfolio_id,
  category_id,
  symbol,
  name,
  quantity8,
  cost_basis4,
  daily_profit4,
  current_price4,
  currency,
  broker_source,
  broker_account,
  created_at,
  updated_at
)
SELECT
  lower(hex(randomblob(16))),
  pm.new_id,
  cm.new_id,
  a.symbol,
  a.name,
  a.quantity8,
  a.cost_basis4,
  a.daily_profit4,
  a.current_price4,
  a.currency,
  a.broker_source,
  a.broker_account,
  a.created_at,
  a.updated_at
FROM assets a
LEFT JOIN _tmp_category_map cm ON cm.old_id = a.category_id
JOIN _tmp_portfolio_map pm ON pm.old_id = a.portfolio_id;

INSERT INTO portfolio_histories (
  id,
  portfolio_id,
  timestamp,
  total_value_cny4,
  daily_profit_cny4,
  current_total_profit_cny4
)
SELECT
  lower(hex(randomblob(16))),
  pm.new_id,
  h.timestamp,
  h.total_value_cny4,
  h.daily_profit_cny4,
  h.current_total_profit_cny4
FROM portfolio_histories h
JOIN _tmp_portfolio_map pm ON pm.old_id = h.portfolio_id;

DROP TABLE _tmp_category_map;
DROP TABLE _tmp_portfolio_map;

COMMIT;

