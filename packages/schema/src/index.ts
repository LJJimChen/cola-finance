/**
 * Schema package entry point
 * 
 * Intent: Export all shared types and contracts for use across apps
 * Ensures type safety across frontend, BFF, and Engine boundaries
 * 
 * Contract:
 * - All entity types exported from entities/
 * - All task types exported from tasks/
 * - All API contracts exported from api/
 * - Zod schemas for runtime validation
 */

export const SCHEMA_VERSION = '0.1.0'

// Entity types
export * from './entities/user'
export * from './entities/broker'
export * from './entities/holding'

// Task types
export * from './tasks/authorization-task'
export * from './tasks/collection-task'

// API contracts will be added in T016
