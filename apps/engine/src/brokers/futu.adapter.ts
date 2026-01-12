/**
 * Futu broker adapter
 *
 * Intent: Implement broker adapter for Futu Securities (富途证券)
 * Handles authentication and data collection for Futu accounts
 *
 * Contract:
 * - Implements BrokerAdapter interface
 * - Handles Futu-specific login flow
 * - Supports captcha verification
 * - Extracts holdings data from Futu platform
 */
import type { Page } from 'playwright'
import type { 
  BrokerAdapter, 
  AuthorizationResult, 
  CollectionResult, 
  CollectedHolding,
  BrokerCredentials 
} from './adapter.interface'

export class FutuBrokerAdapter implements BrokerAdapter {
  readonly brokerId = 'futu'
  readonly version = '1.0.0'

  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Authorize connection to Futu broker
   *
   * Intent: Complete Futu authorization flow
   * Handles login with potential captcha verification
   *
   * Input: User credentials
   * Output: Authorization result
   * Side effects: Browser automation for Futu login
   */
  async authorize(credentials?: BrokerCredentials): Promise<AuthorizationResult> {
    console.log(`FutuBrokerAdapter: Starting authorization for broker ${this.brokerId}`)

    try {
      // Navigate to Futu login page
      await this.page.goto('https://www.futu.com/en-US/login')
      
      // Wait for the page to load
      await this.page.waitForSelector('#login-form', { timeout: 10000 })
      
      // Fill in credentials if provided
      if (credentials?.username) {
        await this.page.fill('input[name="account"]', credentials.username)
      }
      
      if (credentials?.password) {
        await this.page.fill('input[name="password"]', credentials.password)
      }
      
      // Check if captcha is required (common for Futu)
      const captchaElement = await this.page.$('.captcha-container')
      
      if (captchaElement) {
        // Futu requires captcha verification
        return {
          status: 'needs_verification' as const,
          verification_type: 'captcha',
          verification_url: this.page.url(),
          instructions: 'Please complete the captcha verification on the page'
        }
      }
      
      // Click login button
      await this.page.click('button[type="submit"]')
      
      // Wait for navigation to dashboard or portfolio page
      await this.page.waitForURL('**/dashboard**', { timeout: 15000 })
        .catch(() => {
          // If dashboard URL doesn't match, wait for portfolio page
          return this.page.waitForURL('**/portfolio**', { timeout: 10000 })
        })
      
      // Check if additional verification is needed (e.g., 2FA)
      const twoFactorElement = await this.page.$('.two-factor-auth')
      
      if (twoFactorElement) {
        return {
          status: 'needs_verification' as const,
          verification_type: '2fa',
          verification_url: this.page.url(),
          instructions: 'Please enter the 2FA code sent to your device'
        }
      }
      
      // If we reach here, authorization was successful
      return {
        status: 'success' as const,
        session_data: {
          // Store any necessary session information (not credentials)
          session_id: 'futu-session-id',
          account_id: 'futu-account-id'
        }
      }
    } catch (error) {
      console.error(`FutuBrokerAdapter: Authorization failed:`, error)
      
      // Check if the error is related to security verification
      const pageContent = await this.page.content()
      
      if (pageContent.includes('security') || pageContent.includes('verification')) {
        return {
          status: 'needs_verification' as const,
          verification_type: 'consent',
          verification_url: this.page.url(),
          instructions: 'Please complete the security verification on the page'
        }
      }
      
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
   * Input: None (uses existing page context)
   * Output: Authorization result
   * Side effects: Browser automation to complete verification
   */
  async completeAuthorization(): Promise<AuthorizationResult> {
    console.log(`FutuBrokerAdapter: Resuming authorization after verification`)
    
    try {
      // Wait for the page to update after user verification
      await this.page.waitForURL('**/dashboard**', { timeout: 15000 })
        .catch(() => {
          // If dashboard URL doesn't match, wait for portfolio page
          return this.page.waitForURL('**/portfolio**', { timeout: 10000 })
        })
      
      // Check if we're on the expected page after verification
      const currentUrl = this.page.url()
      
      if (currentUrl.includes('dashboard') || currentUrl.includes('portfolio')) {
        // Verification was successful
        return {
          status: 'success' as const,
          session_data: {
            session_id: 'futu-session-id-resumed',
            account_id: 'futu-account-id'
          }
        }
      } else {
        // Verification may not have completed successfully
        return {
          status: 'failed' as const,
          error_code: 'VERIFICATION_INCOMPLETE',
          error_message: 'Verification did not complete successfully'
        }
      }
    } catch (error) {
      console.error(`FutuBrokerAdapter: Resume authorization failed:`, error)
      
      return {
        status: 'failed' as const,
        error_code: 'RESUME_AUTHORIZATION_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown resume authorization error'
      }
    }
  }

  /**
   * Collect holdings data from Futu broker
   *
   * Intent: Fetch and parse current holdings from Futu platform
   *
   * Input: Connection ID (for context)
   * Output: Collection result with holdings data
   * Side effects: Browser automation to navigate to holdings page
   */
  async collectHoldings(connectionId: string): Promise<CollectionResult> {
    console.log(`FutuBrokerAdapter: Collecting holdings for connection ${connectionId}`)

    try {
      // Navigate to portfolio/holdings page
      await this.page.goto('https://www.futu.com/en-US/portfolio/holdings')
      
      // Wait for holdings table to load
      await this.page.waitForSelector('.holdings-table', { timeout: 15000 })
      
      // Extract holdings data from the page
      const holdings: CollectedHolding[] = []
      
      // Get all holding rows from the table
      const holdingRows = await this.page.$$('.holdings-table tbody tr')
      
      for (const row of holdingRows) {
        try {
          // Extract data from each row
          const symbol = await row.$eval('.symbol', el => el.textContent?.trim() || '')
          const instrumentName = await row.$eval('.instrument-name', el => el.textContent?.trim() || '')
          const quantity = await row.$eval('.quantity', el => el.textContent?.trim() || '')
          const currency = await row.$eval('.currency', el => el.textContent?.trim() || '')
          const marketValue = await row.$eval('.market-value', el => el.textContent?.trim() || '')
          
          // Determine instrument type based on symbol or other indicators
          let instrumentType: 'stock' | 'fund' | 'bond' | 'cash' | 'crypto' | 'other' = 'stock'
          if (symbol.toLowerCase().includes('fund')) {
            instrumentType = 'fund'
          } else if (symbol.toLowerCase().includes('bond')) {
            instrumentType = 'bond'
          }
          
          // Create holding object
          const holding: CollectedHolding = {
            symbol,
            instrument_type: instrumentType,
            instrument_name: instrumentName,
            quantity,
            currency,
            market_value: marketValue,
            // Additional fields that might be available
            cost_basis: await row.$eval('.cost-basis', el => el.textContent?.trim() || undefined).catch(() => undefined),
            unrealized_pnl: await row.$eval('.unrealized-pnl', el => el.textContent?.trim() || undefined).catch(() => undefined),
            daily_return: await row.$eval('.daily-return', el => el.textContent?.trim() || undefined).catch(() => undefined),
            total_return: await row.$eval('.total-return', el => el.textContent?.trim() || undefined).catch(() => undefined)
          }
          
          holdings.push(holding)
        } catch (rowError) {
          console.error(`FutuBrokerAdapter: Error processing holding row:`, rowError)
          // Continue with other rows
        }
      }
      
      // Return the collected holdings
      return {
        holdings,
        failed_holdings: [], // No failed holdings in this example
        partial: false // Complete collection
      }
    } catch (error) {
      console.error(`FutuBrokerAdapter: Holdings collection failed:`, error)
      
      // Try to return any holdings that were partially collected
      try {
        // Attempt to collect whatever holdings are available
        const holdings: CollectedHolding[] = []
        const holdingRows = await this.page.$$('.holdings-table tbody tr')
        
        for (const row of holdingRows) {
          try {
            const symbol = await row.$eval('.symbol', el => el.textContent?.trim() || '')
            const instrumentName = await row.$eval('.instrument-name', el => el.textContent?.trim() || '')
            const quantity = await row.$eval('.quantity', el => el.textContent?.trim() || '')
            const currency = await row.$eval('.currency', el => el.textContent?.trim() || '')
            const marketValue = await row.$eval('.market-value', el => el.textContent?.trim() || '')
            
            holdings.push({
              symbol,
              instrument_type: 'stock',
              instrument_name: instrumentName,
              quantity,
              currency,
              market_value: marketValue
            })
          } catch (partialRowError) {
            console.error(`FutuBrokerAdapter: Error processing partial holding row:`, partialRowError)
          }
        }
        
        if (holdings.length > 0) {
          // Some holdings were collected successfully
          return {
            holdings,
            failed_holdings: [{
              symbol: 'MULTIPLE',
              error_code: 'PARTIAL_COLLECTION_ERROR',
              error_message: error instanceof Error ? error.message : 'Error during partial collection'
            }],
            partial: true
          }
        }
      } catch (partialError) {
        console.error(`FutuBrokerAdapter: Error during partial collection attempt:`, partialError)
      }
      
      // Return failure result if no holdings could be collected
      return {
        holdings: [], 
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
   * Intent: Verify Futu authorization hasn't expired
   *
   * Input: None (uses existing page context)
   * Output: Boolean indicating session validity
   * Side effects: Browser navigation (lightweight check)
   */
  async checkSession(): Promise<boolean> {
    console.log(`FutuBrokerAdapter: Checking session validity`)
    
    try {
      // Navigate to a protected page that would redirect if session is invalid
      await this.page.goto('https://www.futu.com/en-US/portfolio/overview', { timeout: 10000 })
      
      // Check if we're still on the portfolio page (valid session) or redirected to login
      const currentUrl = this.page.url()
      
      if (currentUrl.includes('login') || currentUrl.includes('auth')) {
        return false // Session is invalid
      }
      
      // Additional check: look for elements that should be present when logged in
      const dashboardElement = await this.page.$('.dashboard-content, .portfolio-overview, .account-summary').catch(() => null)
      
      if (!dashboardElement) {
        return false // Session appears to be invalid
      }
      
      return true // Session is valid
    } catch (error) {
      console.error(`FutuBrokerAdapter: Session check failed:`, error)
      return false // Assume session is invalid if check fails
    }
  }
}