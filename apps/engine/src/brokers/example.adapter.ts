/**
 * Example broker adapter
 *
 * Intent: Demonstrate the broker adapter interface implementation
 * Provides a template for implementing real broker adapters
 *
 * Contract:
 * - Implements BrokerAdapter interface
 * - Demonstrates Playwright automation patterns
 * - Simulates broker interactions for testing
 */
import type { Page } from 'playwright'
import type { 
  BrokerAdapter, 
  AuthorizationResult, 
  CollectionResult, 
  CollectedHolding,
  BrokerCredentials 
} from './adapter.interface'

export class ExampleBrokerAdapter implements BrokerAdapter {
  readonly brokerId = 'example'
  readonly version = '1.0.0'

  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Authorize connection to example broker
   *
   * Intent: Simulate broker authorization flow
   * Demonstrates the authorization process with potential verification requirements
   *
   * Input: User credentials
   * Output: Authorization result
   * Side effects: Simulated browser automation
   */
  async authorize(credentials?: BrokerCredentials): Promise<AuthorizationResult> {
    console.log(`ExampleBrokerAdapter: Starting authorization for broker ${this.brokerId}`)

    try {
      // Navigate to example broker login page
      await this.page.goto('https://example-broker.com/login')
      
      // Fill in credentials if provided
      if (credentials?.username) {
        await this.page.fill('#username', credentials.username)
      }
      
      if (credentials?.password) {
        await this.page.fill('#password', credentials.password)
      }
      
      // Click login button
      await this.page.click('#login-button')
      
      // Wait for navigation or specific element to confirm login
      await this.page.waitForURL('**/dashboard**', { timeout: 10000 })
      
      // Check if additional verification is needed (e.g., 2FA, captcha)
      const verificationNeeded = await this.page.$('.verification-required')
      
      if (verificationNeeded) {
        // Simulate verification requirement
        return {
          status: 'needs_verification' as const,
          verification_type: '2fa',
          verification_url: 'https://example-broker.com/verify',
          instructions: 'Please enter the code sent to your phone'
        }
      }
      
      // If we reach here, authorization was successful
      return {
        status: 'success' as const,
        session_data: {
          // Store any necessary session information (not credentials)
          session_id: 'example-session-id',
          account_id: 'example-account-id'
        }
      }
    } catch (error) {
      console.error(`ExampleBrokerAdapter: Authorization failed:`, error)
      
      return {
        status: 'failed' as const,
        error_code: 'AUTHORIZATION_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown authorization error'
      }
    }
  }

  /**
   * Resume authorization after human verification
   *
   * Intent: Continue authorization flow after user completes verification
   *
   * Input: Verification response (e.g., 2FA code)
   * Output: Authorization result
   * Side effects: Browser automation to complete verification
   */
  async completeAuthorization(): Promise<AuthorizationResult> {
    console.log(`ExampleBrokerAdapter: Resuming authorization after verification`)
    
    try {
      // In a real implementation, this would handle the verification completion
      // For example, entering a 2FA code or confirming consent
      
      // Simulate successful completion
      return {
        status: 'success' as const,
        session_data: {
          session_id: 'example-session-id-resumed',
          account_id: 'example-account-id'
        }
      }
    } catch (error) {
      console.error(`ExampleBrokerAdapter: Resume authorization failed:`, error)
      
      return {
        status: 'failed' as const,
        error_code: 'RESUME_AUTHORIZATION_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown resume authorization error'
      }
    }
  }

  /**
   * Collect holdings data from example broker
   *
   * Intent: Fetch and parse current holdings
   *
   * Input: Connection ID (for context)
   * Output: Collection result with holdings data
   * Side effects: Browser automation to navigate to holdings page
   */
  async collectHoldings(connectionId: string): Promise<CollectionResult> {
    console.log(`ExampleBrokerAdapter: Collecting holdings for connection ${connectionId}`)

    try {
      // Navigate to holdings/portfolio page
      await this.page.goto('https://example-broker.com/portfolio')
      
      // Wait for holdings table to load
      await this.page.waitForSelector('.holdings-table', { timeout: 10000 })
      
      // Extract holdings data from the page
      // This is a simplified example - real implementation would parse actual broker data
      const holdings: CollectedHolding[] = []
      
      // Simulate parsing holdings from the page
      // In a real implementation, this would extract data from the broker's HTML
      const mockHoldings = [
        {
          symbol: 'AAPL',
          instrument_type: 'stock' as const,
          instrument_name: 'Apple Inc.',
          quantity: '10',
          currency: 'USD',
          market_value: '1750.00',
          cost_basis: '1500.00',
          unrealized_pnl: '250.00',
          daily_return: '0.025',
          total_return: '0.167'
        },
        {
          symbol: 'MSFT',
          instrument_type: 'stock' as const,
          instrument_name: 'Microsoft Corporation',
          quantity: '5',
          currency: 'USD',
          market_value: '1350.00',
          cost_basis: '1200.00',
          unrealized_pnl: '150.00',
          daily_return: '0.012',
          total_return: '0.125'
        },
        {
          symbol: 'TSLA',
          instrument_type: 'stock' as const,
          instrument_name: 'Tesla Inc.',
          quantity: '2',
          currency: 'USD',
          market_value: '450.00',
          cost_basis: '500.00',
          unrealized_pnl: '-50.00',
          daily_return: '-0.035',
          total_return: '-0.100'
        }
      ]
      
      // Add mock holdings to the result
      holdings.push(...mockHoldings)
      
      // Return the collected holdings
      return {
        holdings,
        failed_holdings: [], // No failed holdings in this example
        partial: false // Complete collection
      }
    } catch (error) {
      console.error(`ExampleBrokerAdapter: Holdings collection failed:`, error)
      
      // Return partial result if some holdings were collected
      return {
        holdings: [], // In a real scenario, we might return partially collected holdings
        failed_holdings: [{
          symbol: 'ALL',
          error_code: 'COLLECTION_ERROR',
          error_message: error instanceof Error ? error.message : 'Unknown collection error'
        }],
        partial: true
      }
    }
  }

  /**
   * Check if session is still valid
   *
   * Intent: Verify authorization hasn't expired
   *
   * Input: None (uses existing page context)
   * Output: Boolean indicating session validity
   * Side effects: Browser navigation (lightweight check)
   */
  async checkSession(): Promise<boolean> {
    console.log(`ExampleBrokerAdapter: Checking session validity`)
    
    try {
      // Navigate to a protected page that would redirect if session is invalid
      await this.page.goto('https://example-broker.com/dashboard')
      
      // Check if we're still on the dashboard (valid session) or redirected to login
      const currentUrl = this.page.url()
      
      if (currentUrl.includes('login')) {
        return false // Session is invalid
      }
      
      return true // Session is valid
    } catch (error) {
      console.error(`ExampleBrokerAdapter: Session check failed:`, error)
      return false // Assume session is invalid if check fails
    }
  }
}