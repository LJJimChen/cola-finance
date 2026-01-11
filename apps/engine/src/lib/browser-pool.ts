/**
 * Playwright browser pool management
 * 
 * Intent: Manage persistent browser contexts for broker automation
 * Provides context isolation and resource cleanup
 * 
 * Contract:
 * - One browser instance per Engine process
 * - Context per task (isolated sessions)
 * - Automatic cleanup of old contexts
 * - Headless mode configurable via env var
 */
import { chromium, type Browser, type BrowserContext } from 'playwright'

/**
 * Browser pool singleton
 * 
 * Manages a single browser instance with multiple contexts
 */
class BrowserPool {
  private browser: Browser | null = null
  private contexts: Map<string, BrowserContext> = new Map()

  /**
   * Initialize browser instance
   * 
   * Intent: Launch Chromium browser for Playwright automation
   * 
   * Input: None
   * Output: None
   * Side effects: Launches browser process
   */
  async initialize(): Promise<void> {
    if (this.browser) {
      return // Already initialized
    }

    const headless = process.env.PLAYWRIGHT_HEADLESS !== 'false'
    const timeout = parseInt(process.env.PLAYWRIGHT_BROWSER_TIMEOUT || '30000', 10)

    this.browser = await chromium.launch({
      headless,
      timeout,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })

    console.log(`✅ Browser initialized (headless: ${headless})`)
  }

  /**
   * Get or create browser context for task
   * 
   * Intent: Create isolated browser context for task execution
   * Each task gets its own context (cookies, storage, etc.)
   * 
   * Input: Task ID
   * Output: Browser context
   * Side effects: Creates new context if not exists
   */
  async getContext(taskId: string): Promise<BrowserContext> {
    if (!this.browser) {
      await this.initialize()
    }

    if (this.contexts.has(taskId)) {
      return this.contexts.get(taskId)!
    }

    const context = await this.browser!.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/New_York',
    })

    this.contexts.set(taskId, context)
    return context
  }

  /**
   * Close and clean up context for task
   * 
   * Intent: Release resources when task completes
   * 
   * Input: Task ID
   * Output: None
   * Side effects: Closes browser context, removes from pool
   */
  async closeContext(taskId: string): Promise<void> {
    const context = this.contexts.get(taskId)

    if (context) {
      await context.close()
      this.contexts.delete(taskId)
    }
  }

  /**
   * Close all contexts and browser
   * 
   * Intent: Clean shutdown of browser pool
   * 
   * Input: None
   * Output: None
   * Side effects: Closes all contexts and browser process
   */
  async shutdown(): Promise<void> {
    // Close all contexts
    for (const [taskId, context] of this.contexts.entries()) {
      await context.close()
      this.contexts.delete(taskId)
    }

    // Close browser
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }

    console.log('✅ Browser pool shutdown complete')
  }

  /**
   * Get pool status
   * 
   * Intent: Return current state of browser pool (for health checks)
   */
  getStatus() {
    return {
      initialized: this.browser !== null,
      active_contexts: this.contexts.size,
    }
  }
}

// Export singleton instance
export const browserPool = new BrowserPool()

// Graceful shutdown on process exit
process.on('SIGTERM', async () => {
  await browserPool.shutdown()
})

process.on('SIGINT', async () => {
  await browserPool.shutdown()
  process.exit(0)
})
