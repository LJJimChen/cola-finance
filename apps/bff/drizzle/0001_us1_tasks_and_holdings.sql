-- US1 database schema: authorization tasks, collection tasks, holdings, holding snapshots

CREATE TABLE IF NOT EXISTS authorization_tasks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  user_id TEXT NOT NULL,
  broker_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  state_snapshot TEXT NOT NULL,
  verification_url TEXT,
  verification_type TEXT,
  connection_id TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE RESTRICT,
  FOREIGN KEY (connection_id) REFERENCES broker_connections(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_tasks_status ON authorization_tasks (status);
CREATE INDEX IF NOT EXISTS idx_auth_tasks_expires ON authorization_tasks (expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_tasks_user_broker ON authorization_tasks (user_id, broker_id);

CREATE TABLE IF NOT EXISTS collection_tasks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  user_id TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  state_snapshot TEXT NOT NULL,
  holdings_collected INTEGER NOT NULL DEFAULT 0,
  holdings_failed INTEGER NOT NULL DEFAULT 0,
  partial_reason TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (connection_id) REFERENCES broker_connections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collection_tasks_status ON collection_tasks (status);
CREATE INDEX IF NOT EXISTS idx_collection_tasks_user_created ON collection_tasks (user_id, created_at);

CREATE TABLE IF NOT EXISTS holdings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  user_id TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  instrument_type TEXT NOT NULL,
  instrument_name TEXT NOT NULL,
  instrument_name_zh TEXT,
  quantity TEXT NOT NULL,
  currency TEXT NOT NULL,
  market_value TEXT NOT NULL,
  cost_basis TEXT,
  unrealized_pnl TEXT,
  daily_return TEXT,
  total_return TEXT,
  category TEXT,
  last_updated_at TEXT NOT NULL,
  is_stale INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (connection_id) REFERENCES broker_connections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_holdings_user_symbol ON holdings (user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_holdings_user_category ON holdings (user_id, category);
CREATE INDEX IF NOT EXISTS idx_holdings_connection ON holdings (connection_id);

CREATE TABLE IF NOT EXISTS holding_snapshots (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  holding_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  quantity TEXT NOT NULL,
  market_value TEXT NOT NULL,
  cost_basis TEXT,
  currency TEXT NOT NULL,
  snapshot_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (holding_id) REFERENCES holdings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_holding_snapshot ON holding_snapshots (holding_id, snapshot_at);
CREATE INDEX IF NOT EXISTS idx_user_snapshot ON holding_snapshots (user_id, snapshot_at);
