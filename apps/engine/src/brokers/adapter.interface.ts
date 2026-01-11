/**
 * Broker adapter interface
 * 
 * Intent: Define contract for broker-specific automation adapters
 * Each broker (Schwab, 天天基金, etc.) implements this interface
 * 
 * Contract:
 * - authorize(): Complete broker authorization flow
 * - collectHoldings(): Fetch and parse holdings data
 * - Adapters handle broker-specific HTML/API interactions
 * - All adapters return standardized data structures
 * - Constitution: No credentials stored, only session management
 */
import type { BrowserContext } from 'playwright'

/**
 * Authorization result
 * 
 * - success: Authorization completed successfully
 * - needs_verification: Human-in-the-loop required (captcha, 2FA)
 * - failed: Authorization failed permanently
 */
export type AuthorizationResult =
  | {
      status: 'success'
      session_data?: Record<string, unknown> // Ephemeral session info (NOT credentials)
    }
  | {
      status: 'needs_verification'
      verification_type: 'captcha' | '2fa' | 'consent'
      verification_url: string
      instructions?: string
    }
  | {
      status: 'failed'
      error_code: string
      error_message: string
    }

/**
 * Holdings collection result
 */
export type CollectionResult = {
  holdings: CollectedHolding[]
  failed_holdings: FailedHolding[]
  partial: boolean // true if some holdings failed to collect
}

/**
 * Collected holding data (raw from broker)
 */
export interface CollectedHolding {
  symbol: string
  instrument_type: 'stock' | 'fund' | 'bond' | 'cash' | 'crypto' | 'other'
  instrument_name: string
  instrument_name_zh?: string
  quantity: string // Decimal string
  currency: string // ISO 4217 code
  market_value: string // Decimal string
  cost_basis?: string // Decimal string
  unrealized_pnl?: string // Decimal string
  daily_return?: string // Percentage in decimal form
  total_return?: string // Percentage in decimal form
}

/**
 * Failed holding (partial collection)
 */
export interface FailedHolding {
  symbol: string
  error_code: string
  error_message: string
}

/**
 * Broker adapter interface
 * 
 * All broker-specific implementations must implement this interface
 */
export interface BrokerAdapter {
  /**
   * Broker identifier (must match Broker.id in database)
   */
  readonly brokerId: string

  /**
   * Adapter version (semver)
   */
  readonly version: string

  /**
   * Authorize connection to broker
   * 
   * Intent: Complete broker authorization flow
   * May require human-in-the-loop (captcha, 2FA)
   * 
   * Input: Browser context, user credentials (NOT stored)
   * Output: Authorization result
   * Side effects: Browser automation, session creation
   */
  authorize(
    context: BrowserContext,
    credentials: BrokerCredentials
  ): Promise<AuthorizationResult>

  /**
   * Resume authorization after human verification
   * 
   * Intent: Continue authorization flow after user completes verification
   * 
   * Input: Browser context, verification response
   * Output: Authorization result
   * Side effects: Browser automation
   */
  resumeAuthorization(
    context: BrowserContext,
    verificationResponse: unknown
  ): Promise<AuthorizationResult>

  /**
   * Collect holdings data from broker
   * 
   * Intent: Fetch and parse current holdings
   * 
   * Input: Browser context (with active session)
   * Output: Collection result with holdings data
   * Side effects: Browser automation, HTTP requests to broker
   */
  collectHoldings(context: BrowserContext): Promise<CollectionResult>

  /**
   * Check if session is still valid
   * 
   * Intent: Verify authorization hasn't expired
   * 
   * Input: Browser context
   * Output: Boolean indicating session validity
   * Side effects: Browser navigation (lightweight check)
   */
  checkSession(context: BrowserContext): Promise<boolean>
}

/**
 * Broker credentials (ephemeral, NOT stored)
 * 
 * These are provided by user at authorization time only
 * Constitution: NO credentials stored in database or logs
 */
export interface BrokerCredentials {
  username?: string
  password?: string
  account_number?: string
  [key: string]: string | undefined
}
