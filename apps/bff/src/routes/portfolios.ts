import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, asc, eq } from 'drizzle-orm';
import type { Asset, Category, Portfolio } from '@repo/shared-types';
import { requireAuth } from '../middleware/auth';
import { assets, categories, portfolios, portfolioHistories } from '../db/schema';
import { nowIsoUtc } from '../lib/time';
import { fromMoney4, toMoney4 } from '../lib/money';
import { PortfolioViewService } from '../services/portfolio-view-service';

const createPortfolioSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updatePortfolioSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(1),
  targetAllocation: z.number().min(0).max(100).optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  targetAllocation: z.number().min(0).max(100).optional(),
});

const createAssetSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().positive(),
  costBasis: z.number().nonnegative(),
  dailyProfit: z.number(),
  currentPrice: z.number().positive(),
  currency: z.string().length(3),
  brokerSource: z.string().min(1),
  brokerAccount: z.string().min(1),
  categoryId: z.string().optional(),
});

function portfolioRowToApi(row: typeof portfolios.$inferSelect): Portfolio {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description ?? undefined,
    totalValueCny: fromMoney4(row.totalValueCny4),
    dailyProfitCny: fromMoney4(row.dailyProfitCny4),
    currentTotalProfitCny: fromMoney4(row.currentTotalProfitCny4),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function categoryRowToApi(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    // userId: row.userId,
    portfolioId: row.portfolioId,
    name: row.name,
    targetAllocation: row.targetAllocationBps / 100,
    currentAllocation: row.currentAllocationBps / 100,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } as unknown as Category;
}

function assetRowToApi(row: typeof assets.$inferSelect): Asset {
  return {
    id: row.id,
    // userId: row.userId,
    portfolioId: row.portfolioId,
    categoryId: row.categoryId ?? undefined,
    symbol: row.symbol,
    name: row.name,
    quantity: row.quantity,
    costBasis: fromMoney4(row.costBasis4),
    dailyProfit: fromMoney4(row.dailyProfit4),
    currentPrice: fromMoney4(row.currentPrice4),
    currency: row.currency,
    brokerSource: row.brokerSource,
    brokerAccount: row.brokerAccount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } as unknown as Asset;
}

export const portfolioRoutes = new Hono<{
  Variables: {
    db: import('../db').AppDb;
    auth: import('../middleware/auth').AuthContext;
  };
}>();

portfolioRoutes.use('*', requireAuth());

portfolioRoutes.get('/', async (c) => {
  const { userId } = c.get('auth');
  let rows = await c.get('db').select().from(portfolios).where(eq(portfolios.userId, userId)).orderBy(asc(portfolios.name));

  // Lazy creation: If user has no portfolios, create a default one
  if (rows.length === 0) {
    const now = nowIsoUtc();
    const defaultPortfolioId = crypto.randomUUID();
    
    const [newPortfolio] = await c
      .get('db')
      .insert(portfolios)
      .values({
        id: defaultPortfolioId,
        userId,
        name: 'Default Portfolio',
        description: 'Automatically created default portfolio',
        totalValueCny4: 0,
        dailyProfitCny4: 0,
        currentTotalProfitCny4: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await c.get('db').insert(portfolioHistories).values({
      id: crypto.randomUUID(),
      portfolioId: defaultPortfolioId,
      timestampUtc: now,
      totalValueCny4: 0,
      dailyProfitCny4: 0,
      currentTotalProfitCny4: 0,
    });

    rows = [newPortfolio];
  }

  return c.json(rows.map(portfolioRowToApi));
});

portfolioRoutes.post('/', zValidator('json', createPortfolioSchema), async (c) => {
  const { userId } = c.get('auth');
  const input = c.req.valid('json');
  const now = nowIsoUtc();

  const [row] = await c
    .get('db')
    .insert(portfolios)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: input.name,
      description: input.description,
      totalValueCny4: 0,
      dailyProfitCny4: 0,
      currentTotalProfitCny4: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await c.get('db').insert(portfolioHistories).values({
    id: crypto.randomUUID(),
    portfolioId: row.id,
    timestampUtc: now,
    totalValueCny4: 0,
    dailyProfitCny4: 0,
    currentTotalProfitCny4: 0,
  });

  return c.json(portfolioRowToApi(row));
});

portfolioRoutes.get('/:portfolioId', async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const rows = await c
    .get('db')
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
    .limit(1);

  if (rows.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Portfolio not found' } }, 404);
  }
  return c.json(portfolioRowToApi(rows[0]));
});

portfolioRoutes.put('/:portfolioId', zValidator('json', updatePortfolioSchema), async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const input = c.req.valid('json');
  const now = nowIsoUtc();

  const updated = await c
    .get('db')
    .update(portfolios)
    .set({ ...input, updatedAt: now })
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
    .returning();

  if (updated.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Portfolio not found' } }, 404);
  }

  return c.json(portfolioRowToApi(updated[0]));
});

portfolioRoutes.delete('/:portfolioId', async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');

  const owned = await c
    .get('db')
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
    .limit(1);
  if (owned.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Portfolio not found' } }, 404);
  }

  await c.get('db').delete(assets).where(eq(assets.portfolioId, portfolioId));
  await c.get('db').delete(categories).where(eq(categories.portfolioId, portfolioId));
  await c.get('db').delete(portfolioHistories).where(eq(portfolioHistories.portfolioId, portfolioId));
  await c.get('db').delete(portfolios).where(eq(portfolios.id, portfolioId));

  return c.json({ success: true });
});

portfolioRoutes.get('/:portfolioId/assets', async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  
  // Verify portfolio ownership first
  const owned = await c
    .get('db')
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
    .limit(1);

  if (owned.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Portfolio not found' } }, 404);
  }

  const rows = await c
    .get('db')
    .select()
    .from(assets)
    .where(eq(assets.portfolioId, portfolioId))
    .orderBy(asc(assets.name));
  return c.json(rows.map(assetRowToApi));
});

portfolioRoutes.post('/:portfolioId/assets', zValidator('json', createAssetSchema), async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const input = c.req.valid('json');
  const now = nowIsoUtc();

  const owned = await c
    .get('db')
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
    .limit(1);
  if (owned.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Portfolio not found' } }, 404);
  }

  const [row] = await c
    .get('db')
    .insert(assets)
    .values({
      id: crypto.randomUUID(),
      portfolioId,
      categoryId: input.categoryId,
      symbol: input.symbol,
      name: input.name,
      quantity: input.quantity,
      costBasis4: toMoney4(input.costBasis),
      dailyProfit4: toMoney4(input.dailyProfit),
      currentPrice4: toMoney4(input.currentPrice),
      currency: input.currency,
      brokerSource: input.brokerSource,
      brokerAccount: input.brokerAccount,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return c.json(assetRowToApi(row));
});

portfolioRoutes.get('/:portfolioId/categories', async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  
  // Verify portfolio ownership first
  const owned = await c
    .get('db')
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
    .limit(1);

  if (owned.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Portfolio not found' } }, 404);
  }

  const rows = await c
    .get('db')
    .select()
    .from(categories)
    .where(eq(categories.portfolioId, portfolioId))
    .orderBy(asc(categories.name));
  return c.json(rows.map(categoryRowToApi));
});

portfolioRoutes.post('/:portfolioId/categories', zValidator('json', createCategorySchema), async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const input = c.req.valid('json');
  const now = nowIsoUtc();

  const owned = await c
    .get('db')
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
    .limit(1);
  if (owned.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Portfolio not found' } }, 404);
  }

  const [row] = await c
    .get('db')
    .insert(categories)
    .values({
      id: crypto.randomUUID(),
      portfolioId,
      name: input.name,
      targetAllocationBps: Math.round((input.targetAllocation ?? 0) * 100),
      currentAllocationBps: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return c.json(categoryRowToApi(row));
});

portfolioRoutes.get('/:portfolioId/dashboard', async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const displayCurrency = c.req.query('displayCurrency') ?? 'CNY';
  const service = new PortfolioViewService(c.get('db'));
  const data = await service.getDashboard(userId, portfolioId, displayCurrency);
  return c.json(data);
});

portfolioRoutes.get('/:portfolioId/allocation', async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const displayCurrency = c.req.query('displayCurrency') ?? 'CNY';
  const service = new PortfolioViewService(c.get('db'));
  const data = await service.getAllocation(userId, portfolioId, displayCurrency);
  return c.json(data);
});

portfolioRoutes.get('/:portfolioId/rebalance', async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const service = new PortfolioViewService(c.get('db'));
  const data = await service.getRebalance(userId, portfolioId);
  return c.json(data);
});

export const categoryRoutes = new Hono<{
  Variables: {
    db: import('../db').AppDb;
    auth: import('../middleware/auth').AuthContext;
  };
}>();

categoryRoutes.use('*', requireAuth());

categoryRoutes.put('/:categoryId', zValidator('json', updateCategorySchema), async (c) => {
  const { userId } = c.get('auth');
  const categoryId = c.req.param('categoryId');
  const input = c.req.valid('json');
  const now = nowIsoUtc();

  const owned = await c
    .get('db')
    .select({ id: categories.id })
    .from(categories)
    .innerJoin(portfolios, eq(categories.portfolioId, portfolios.id))
    .where(and(eq(categories.id, categoryId), eq(portfolios.userId, userId)))
    .limit(1);

  if (owned.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Category not found' } }, 404);
  }

  const updated = await c
    .get('db')
    .update(categories)
    .set({
      ...(input.name ? { name: input.name } : {}),
      ...(typeof input.targetAllocation === 'number' ? { targetAllocationBps: Math.round(input.targetAllocation * 100) } : {}),
      updatedAt: now,
    })
    .where(eq(categories.id, categoryId))
    .returning();

  if (updated.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Category not found' } }, 404);
  }

  return c.json(categoryRowToApi(updated[0]));
});

categoryRoutes.delete('/:categoryId', async (c) => {
  const { userId } = c.get('auth');
  const categoryId = c.req.param('categoryId');

  const owned = await c
    .get('db')
    .select({ id: categories.id })
    .from(categories)
    .innerJoin(portfolios, eq(categories.portfolioId, portfolios.id))
    .where(and(eq(categories.id, categoryId), eq(portfolios.userId, userId)))
    .limit(1);
  if (owned.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Category not found' } }, 404);
  }

  await c.get('db').update(assets).set({ categoryId: null, updatedAt: nowIsoUtc() }).where(eq(assets.categoryId, categoryId));
  await c.get('db').delete(categories).where(eq(categories.id, categoryId));
  return c.json({ success: true });
});

