/**
 * Vitest configuration for BFF
 * 
 * Intent: Configure test runner for Cloudflare Workers environment
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.ts'],
  },
})
