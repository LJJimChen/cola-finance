import { categories, portfolios } from '../db/schema';
import { eq, and, asc } from 'drizzle-orm';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@repo/shared-types';
import type { AppDb } from '../db';

export interface CategoryService {
  getCategoriesByPortfolio(userId: string, portfolioId: string): Promise<Category[]>;
  createCategory(userId: string, portfolioId: string, data: CreateCategoryRequest): Promise<Category>;
  updateCategory(userId: string, categoryId: string, data: UpdateCategoryRequest): Promise<Category>;
  deleteCategory(userId: string, categoryId: string): Promise<boolean>;
  getCategoryById(userId: string, categoryId: string): Promise<Category | null>;
}

function mapCategory(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    // userId: row.userId, // removed
    portfolioId: row.portfolioId,
    name: row.name,
    targetAllocation: row.targetAllocationBps / 100,
    currentAllocation: row.currentAllocationBps / 100,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } as unknown as Category; // Cast because Category type still has userId for now
}

export class CategoryServiceImpl implements CategoryService {
  constructor(private db: AppDb) {}

  async getCategoriesByPortfolio(userId: string, portfolioId: string): Promise<Category[]> {
    const result = await this.db
      .select({
        category: categories
      })
      .from(categories)
      .innerJoin(portfolios, eq(categories.portfolioId, portfolios.id))
      .where(and(eq(portfolios.userId, userId), eq(categories.portfolioId, portfolioId)))
      .orderBy(asc(categories.name));

    return result.map(r => mapCategory(r.category));
  } 

  async createCategory(userId: string, portfolioId: string, data: CreateCategoryRequest): Promise<Category> {
    // Verify portfolio belongs to user
    const portfolio = await this.db.query.portfolios.findFirst({
        where: and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId))
    });

    if (!portfolio) {
        throw new Error('Portfolio not found or access denied');
    }

    // Check for duplicate name
    const existing = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.portfolioId, portfolioId), eq(categories.name, data.name)))
      .limit(1);

    if (existing.length > 0) {
      throw new Error(`Category with name "${data.name}" already exists in this portfolio`);
    }

    const [newCategory] = await this.db
      .insert(categories)
      .values({
        id: crypto.randomUUID(),
        portfolioId,
        name: data.name,
        targetAllocationBps: Math.round((data.targetAllocation ?? 0) * 100),
        currentAllocationBps: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return mapCategory(newCategory);
  }

  async updateCategory(userId: string, categoryId: string, data: UpdateCategoryRequest): Promise<Category> {
    // Verify user owns the category via portfolio
    const result = await this.db
      .select({ category: categories })
      .from(categories)
      .innerJoin(portfolios, eq(categories.portfolioId, portfolios.id))
      .where(and(eq(categories.id, categoryId), eq(portfolios.userId, userId)))
      .limit(1);

    if (result.length === 0) {
      throw new Error('Category not found or access denied');
    }

    const currentCategory = result[0].category;

    // Check for duplicate name if name is changing
    if (data.name && data.name !== currentCategory.name) {
      const existing = await this.db
        .select()
        .from(categories)
        .where(and(
          eq(categories.portfolioId, currentCategory.portfolioId), 
          eq(categories.name, data.name)
        ))
        .limit(1);

      if (existing.length > 0) {
        throw new Error(`Category with name "${data.name}" already exists in this portfolio`);
      }
    }

    const [updatedCategory] = await this.db
      .update(categories)
      .set({
        ...(data.name ? { name: data.name } : {}),
        ...(data.targetAllocation !== undefined ? { targetAllocationBps: Math.round(data.targetAllocation * 100) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, categoryId))
      .returning();

    return mapCategory(updatedCategory);
  }

  async deleteCategory(userId: string, categoryId: string): Promise<boolean> {
    // Verify user owns the category via portfolio
    const result = await this.db
      .select({ category: categories })
      .from(categories)
      .innerJoin(portfolios, eq(categories.portfolioId, portfolios.id))
      .where(and(eq(categories.id, categoryId), eq(portfolios.userId, userId)))
      .limit(1);

    if (result.length === 0) {
      throw new Error('Category not found or access denied');
    }

    await this.db.delete(categories).where(eq(categories.id, categoryId));

    return true;
  }

  async getCategoryById(userId: string, categoryId: string): Promise<Category | null> {
    const result = await this.db
      .select({ category: categories })
      .from(categories)
      .innerJoin(portfolios, eq(categories.portfolioId, portfolios.id))
      .where(and(eq(categories.id, categoryId), eq(portfolios.userId, userId)))
      .limit(1);

    return result.length > 0 ? mapCategory(result[0].category) : null;
  }
}

// Create a singleton instance
// const categoryService = new CategoryServiceImpl();

// export { categoryService };