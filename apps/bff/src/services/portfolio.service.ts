/**
 * Portfolio service
 *
 * Intent: Handle portfolio data aggregation and retrieval
 * Provides functions to get portfolio summary and holdings
 *
 * Contract:
 * - getPortfolioSummary: Returns aggregated portfolio data (total value, returns)
 * - getHoldings: Returns individual holdings with original currency values
 */
import { eq, and, gte } from 'drizzle-orm'
import type { D1Database } from '@cloudflare/workers-types'
import { holdings } from '../db/schema/holdings'
import { brokerConnections } from '../db/schema/broker-connections'

/**
 * Portfolio summary data structure
 */
interface PortfolioSummary {
  total_value: string
  total_value_usd: string
  total_holdings: number
  last_updated_at: string | null
  connections_count: number
  active_connections_count: number
}

/**
 * Holding data structure
 */
interface Holding {
  id: string
  symbol: string
  instrument_name: string
  instrument_name_zh: string | null
  quantity: string
  currency: string
  market_value: string
  cost_basis: string | null
  unrealized_pnl: string | null
  daily_return: string | null
  total_return: string | null
  category: string | null
  last_updated_at: string
  is_stale: boolean
  connection_id: string
  connection_name: string
}

/**
 * Get portfolio summary for a user
 *
 * Intent: Aggregate portfolio data including total value and connection stats
 *
 * Input: Database connection, user ID
 * Output: Portfolio summary object
 * Side effects: None
 */
export async function getPortfolioSummary(
  db: D1Database,
  userId: string
): Promise<PortfolioSummary> {
  // Get total value of all holdings in original currency
  const totalValueResult = await db
    .prepare(
      `
      SELECT 
        SUM(CAST(market_value AS REAL)) as total_value,
        COUNT(*) as total_holdings,
        MAX(last_updated_at) as last_updated_at
      FROM holdings 
      WHERE user_id = ?
      `
    )
    .bind(userId)
    .first()

  // Get connection stats
  const connectionStatsResult = await db
    .prepare(
      `
      SELECT 
        COUNT(*) as connections_count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_connections_count
      FROM broker_connections 
      WHERE user_id = ?
      `
    )
    .bind(userId)
    .first()

  // For MVP, we'll return the total value in the original currency
  // In a real implementation, we would convert to a standard currency like USD
  const totalValue = totalValueResult?.total_value || '0'
  const totalHoldings = parseInt(totalValueResult?.total_holdings || '0')
  const lastUpdatedAt = totalValueResult?.last_updated_at || null

  const connectionsCount = parseInt(connectionStatsResult?.connections_count || '0')
  const activeConnectionsCount = parseInt(connectionStatsResult?.active_connections_count || '0')

  return {
    total_value: totalValue.toString(),
    total_value_usd: totalValue.toString(), // In MVP, we're using original currency value
    total_holdings: totalHoldings,
    last_updated_at: lastUpdatedAt,
    connections_count: connectionsCount,
    active_connections_count: activeConnectionsCount,
  }
}

/**
 * Get holdings for a user
 *
 * Intent: Retrieve individual holdings with original currency values
 *
 * Input: Database connection, user ID
 * Output: Array of holding objects
 * Side effects: None
 */
export async function getHoldings(
  db: D1Database,
  userId: string
): Promise<Holding[]> {
  const result = await db
    .prepare(
      `
      SELECT 
        h.id,
        h.symbol,
        h.instrument_name,
        h.instrument_name_zh,
        h.quantity,
        h.currency,
        h.market_value,
        h.cost_basis,
        h.unrealized_pnl,
        h.daily_return,
        h.total_return,
        h.category,
        h.last_updated_at,
        h.is_stale,
        h.connection_id,
        b.name as connection_name
      FROM holdings h
      JOIN broker_connections bc ON h.connection_id = bc.id
      JOIN brokers b ON bc.broker_id = b.id
      WHERE h.user_id = ?
      ORDER BY CAST(h.market_value AS REAL) DESC
      `
    )
    .bind(userId)
    .all()

  return result.results.map(row => ({
    id: row.id,
    symbol: row.symbol,
    instrument_name: row.instrument_name,
    instrument_name_zh: row.instrument_name_zh,
    quantity: row.quantity,
    currency: row.currency,
    market_value: row.market_value,
    cost_basis: row.cost_basis,
    unrealized_pnl: row.unrealized_pnl,
    daily_return: row.daily_return,
    total_return: row.total_return,
    category: row.category,
    last_updated_at: row.last_updated_at,
    is_stale: Boolean(row.is_stale),
    connection_id: row.connection_id,
    connection_name: row.connection_name,
  }))
}