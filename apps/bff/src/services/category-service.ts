import { db } from '../db';
import { categories } from '../db/schema';
import { eq, and, asc } from 'drizzle-orm';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@repo/shared-types';

export interface CategoryService {
  getCategoriesByUser(userId: string): Promise<Category[]>;
  createCategory(userId: string, data: CreateCategoryRequest): Promise<Category>;
  updateCategory(userId: string, categoryId: string, data: UpdateCategoryRequest): Promise<Category>;
  deleteCategory(userId: string, categoryId: string): Promise<boolean>;
  getCategoryById(userId: string, categoryId: string): Promise<Category | null>;
}

export class CategoryServiceImpl implements CategoryService {
  async getCategoriesByUser(userId: string): Promise<Category[]> {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(asc(categories.name));

    return result as unknown as Category[];
  }

  async createCategory(userId: string, data: CreateCategoryRequest): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values({
        userId,
        name: data.name,
        targetAllocation: data.targetAllocation ?? 0,
      })
      .returning();

    return newCategory as unknown as Category;
  }

  async updateCategory(userId: string, categoryId: string, data: UpdateCategoryRequest): Promise<Category> {
    // Verify user owns the category
    const categoryResult = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);

    if (categoryResult.length === 0) {
      throw new Error('Category not found or access denied');
    }

    const [updatedCategory] = await db
      .update(categories)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .returning();

    return updatedCategory as unknown as Category;
  }

  async deleteCategory(userId: string, categoryId: string): Promise<boolean> {
    // Verify user owns the category
    const categoryResult = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);

    if (categoryResult.length === 0) {
      throw new Error('Category not found or access denied');
    }

    await db.delete(categories).where(eq(categories.id, categoryId));

    return true;
  }

  async getCategoryById(userId: string, categoryId: string): Promise<Category | null> {
    const result = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);

    return result.length > 0 ? (result[0] as unknown as Category) : null;
  }
}

// Create a singleton instance
const categoryService = new CategoryServiceImpl();

export { categoryService };