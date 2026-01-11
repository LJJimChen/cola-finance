/**
 * Vitest workspace configuration
 * 
 * Intent: Configure Vitest for monorepo testing
 * Enables running tests across all packages with a single command
 */
import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'apps/web/vitest.config.ts',
  'apps/bff/vitest.config.ts',
  'apps/engine/vitest.config.ts',
  'packages/schema/vitest.config.ts',
])
