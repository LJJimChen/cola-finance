/**
 * Vitest configuration for schema package
 * 
 * Intent: Configure test runner for type validation tests
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
})
