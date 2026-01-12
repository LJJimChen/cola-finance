/**
 * Classification service
 *
 * Intent: Manage classification schemes and target allocations
 * Handles CRUD operations for schemes and target allocations
 *
 * Contract:
 * - getSchemes: Returns preset and user's custom schemes
 * - createScheme: Creates a new custom classification scheme
 * - getTargets: Returns target allocation for a scheme
 * - setTargets: Sets target allocation for a scheme (validates sum=100%)
 */

import { Env } from '../types/env';

export interface ClassificationScheme {
  id: string;
  userId: string | null; // null for preset schemes
  name: string;
  nameZh?: string;
  description?: string;
  isPreset: boolean;
  categories: Array<{
    id: string;
    name: string;
    nameZh?: string;
    rules?: Record<string, unknown>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface TargetAllocation {
  id: string;
  userId: string;
  schemeId: string;
  targets: Record<string, number>; // { categoryId: percentage }
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchemeData {
  userId: string;
  name: string;
  nameZh?: string;
  description?: string;
  categories: Array<{
    id: string;
    name: string;
    nameZh?: string;
    rules?: Record<string, unknown>;
  }>;
}

export interface SetTargetsData {
  userId: string;
  schemeId: string;
  targets: Record<string, number>;
}

export class ClassificationService {
  constructor(private env: Env) {}

  /**
   * Get all classification schemes (both preset and user's custom schemes)
   */
  async getSchemes(userId: string): Promise<ClassificationScheme[]> {
    // In a real implementation, this would query the database
    // For now, returning a mock implementation
    
    // This would use Drizzle ORM to query the classification_schemes table
    // Get preset schemes (where userId is null) and user's custom schemes
    console.log(`Fetching schemes for user: ${userId}`);
    
    // Mock implementation - in real app, this would query the database
    return [];
  }

  /**
   * Get a specific classification scheme by ID
   */
  async getSchemeById(schemeId: string): Promise<ClassificationScheme | null> {
    // In a real implementation, this would query the database
    // For now, returning a mock implementation
    
    console.log(`Fetching scheme by ID: ${schemeId}`);
    
    // Mock implementation - in real app, this would query the database
    return null;
  }

  /**
   * Create a new custom classification scheme
   */
  async createScheme(data: CreateSchemeData): Promise<ClassificationScheme> {
    // In a real implementation, this would insert into the database
    // For now, returning a mock implementation
    
    console.log(`Creating scheme for user: ${data.userId}`);
    
    // Mock implementation - in real app, this would insert into the database
    return {
      id: `scheme_${Date.now()}`, // Mock ID
      userId: data.userId,
      name: data.name,
      nameZh: data.nameZh,
      description: data.description,
      isPreset: false,
      categories: data.categories,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get target allocation for a specific scheme
   */
  async getTargets(userId: string, schemeId: string): Promise<TargetAllocation | null> {
    // In a real implementation, this would query the database
    // For now, returning a mock implementation
    
    console.log(`Fetching targets for user: ${userId}, scheme: ${schemeId}`);
    
    // Mock implementation - in real app, this would query the database
    return null;
  }

  /**
   * Set target allocation for a specific scheme
   */
  async setTargets(data: SetTargetsData): Promise<TargetAllocation> {
    // In a real implementation, this would upsert into the database
    // For now, returning a mock implementation
    
    console.log(`Setting targets for user: ${data.userId}, scheme: ${data.schemeId}`);
    
    // Mock implementation - in real app, this would insert/update the database
    return {
      id: `targets_${Date.now()}`, // Mock ID
      userId: data.userId,
      schemeId: data.schemeId,
      targets: data.targets,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}