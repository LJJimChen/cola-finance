/**
 * Holding entity type definitions
 * 
 * Intent: Define Holding and HoldingSnapshot entity structures
 * Holdings represent positions in instruments (stocks, funds, bonds, etc.)
 * 
 * Contract:
 * - Holding: Current position with quantity, valuation, and performance
 * - HoldingSnapshot: Historical point-in-time snapshot for trend analysis
 * - Composite key: (broker_connection_id, symbol, currency)
 * - All monetary values stored as decimal strings to avoid floating-point errors
 */
import { z } from 'zod'

/**
 * Instrument type classification
 */
export const InstrumentTypeSchema = z.enum([
  'stock',
  'fund',
  'bond',
  'cash',
  'crypto',
  'other',
])

export type InstrumentType = z.infer<typeof InstrumentTypeSchema>

/**
 * Decimal string schema
 * 
 * Used for all monetary values to avoid floating-point precision issues
 * Examples: "1234.5678", "0.0001", "1000000.00"
 */
export const DecimalStringSchema = z.string().regex(/^-?\d+(\.\d+)?$/)

/**
 * Holding entity schema
 * 
 * Represents a position in an instrument
 * Identity: Composite key (broker_connection_id, symbol, currency)
 */
export const HoldingSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  connection_id: z.string().uuid(),

  // Instrument identification
  symbol: z.string(),
  instrument_type: InstrumentTypeSchema,
  instrument_name: z.string(),
  instrument_name_zh: z.string().nullable(),

  // Position details
  quantity: DecimalStringSchema,
  currency: z.string().length(3), // ISO 4217 code

  // Valuation (as of last collection)
  market_value: DecimalStringSchema,
  cost_basis: DecimalStringSchema.nullable(),
  unrealized_pnl: DecimalStringSchema.nullable(),

  // Performance (if available)
  daily_return: DecimalStringSchema.nullable(), // Percentage in decimal form (e.g., "0.0523" = 5.23%)
  total_return: DecimalStringSchema.nullable(),

  // Classification
  category: z.string().nullable(),

  // Metadata
  last_updated_at: z.string().datetime(),
  is_stale: z.boolean(),

  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type Holding = z.infer<typeof HoldingSchema>

/**
 * HoldingSnapshot entity schema
 * 
 * Historical snapshot of holding for performance tracking
 * Used to calculate time-series performance metrics
 */
export const HoldingSnapshotSchema = z.object({
  id: z.string().uuid(),
  holding_id: z.string().uuid(),
  user_id: z.string().uuid(), // Denormalized for query performance

  // Snapshot values (at time of snapshot)
  quantity: DecimalStringSchema,
  market_value: DecimalStringSchema,
  cost_basis: DecimalStringSchema.nullable(),
  currency: z.string().length(3),

  snapshot_at: z.string().datetime(),
  created_at: z.string().datetime(),
})

export type HoldingSnapshot = z.infer<typeof HoldingSnapshotSchema>

/**
 * Portfolio summary aggregation
 */
export const PortfolioSummarySchema = z.object({
  total_value: DecimalStringSchema,
  total_cost_basis: DecimalStringSchema,
  total_unrealized_pnl: DecimalStringSchema,
  daily_return: DecimalStringSchema.nullable(),
  currency: z.string().length(3),
  holdings_count: z.number().int(),
  last_updated_at: z.string().datetime(),
  has_stale_data: z.boolean(),
})

export type PortfolioSummary = z.infer<typeof PortfolioSummarySchema>
