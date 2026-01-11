/**
 * Vitest configuration for Engine
 * 
 * Intent: Configure test runner for Node.js service with Playwright
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.ts'],
  },
})
