import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { requireAuth } from '../middleware/auth';
import { PortfolioServiceImpl } from '../services/portfolio-service';
import { CategoryServiceImpl } from '../services/category-service';
import { AssetServiceImpl } from '../services/asset-service';
import { PortfolioViewService } from '../services/portfolio-view-service';
import { AppError } from '../lib/errors';

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

export const portfolioRoutes = new Hono<{
  Variables: {
    db: import('../db').AppDb;
    auth: import('../middleware/auth').AuthContext;
  };
}>();

portfolioRoutes.use('*', requireAuth());

portfolioRoutes.get('/', async (c) => {
  const { userId } = c.get('auth');
  const service = new PortfolioServiceImpl(c.get('db'));
  const portfolios = await service.getPortfolios(userId);
  return c.json(portfolios);
});

portfolioRoutes.post('/', zValidator('json', createPortfolioSchema), async (c) => {
  const { userId } = c.get('auth');
  const input = c.req.valid('json');
  const service = new PortfolioServiceImpl(c.get('db'));
  const portfolio = await service.createPortfolio(userId, input);
  return c.json(portfolio);
});

portfolioRoutes.get('/:portfolioId', async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const service = new PortfolioServiceImpl(c.get('db'));
  
  try {
    const portfolio = await service.getPortfolio(userId, portfolioId);
    return c.json(portfolio);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json(error.toResponse(), error.status as ContentfulStatusCode);
    }
    throw error;
  }
});

portfolioRoutes.put('/:portfolioId', zValidator('json', updatePortfolioSchema), async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const input = c.req.valid('json');
  const service = new PortfolioServiceImpl(c.get('db'));

  try {
    const portfolio = await service.updatePortfolio(userId, portfolioId, input);
    return c.json(portfolio);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json(error.toResponse(), error.status as ContentfulStatusCode);
    }
    throw error;
  }
});

portfolioRoutes.delete('/:portfolioId', async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const service = new PortfolioServiceImpl(c.get('db'));

  try {
    await service.deletePortfolio(userId, portfolioId);
    return c.json({ success: true });
  } catch (error) {
    if (error instanceof AppError) {
      return c.json(error.toResponse(), error.status as ContentfulStatusCode);
    }
    throw error;
  }
});

portfolioRoutes.get('/:portfolioId/assets', async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const service = new AssetServiceImpl(c.get('db'));

  try {
    const assets = await service.getAssetsByPortfolio(userId, portfolioId);
    return c.json(assets);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json(error.toResponse(), error.status as ContentfulStatusCode);
    }
    throw error;
  }
});

portfolioRoutes.post('/:portfolioId/assets', zValidator('json', createAssetSchema), async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const input = c.req.valid('json');
  const service = new AssetServiceImpl(c.get('db'));

  try {
    const asset = await service.createAsset(userId, portfolioId, input);
    return c.json(asset);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json(error.toResponse(), error.status as ContentfulStatusCode);
    }
    throw error;
  }
});

portfolioRoutes.get('/:portfolioId/categories', async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const service = new CategoryServiceImpl(c.get('db'));
  
  // Note: getCategoriesByPortfolio returns empty array if not found or no categories, 
  // but let's check ownership implicitly via logic if possible, or just return empty list.
  // Actually the service doesn't throw if portfolio doesn't exist, it just returns empty list.
  // But original code checked ownership.
  // Let's rely on service behavior. If strict check needed, service should do it.
  // The service implementation:
  // .innerJoin(portfolios, ...) .where(and(eq(portfolios.userId, userId), eq(categories.portfolioId, portfolioId)))
  // If portfolio doesn't exist or not owned, it returns empty list.
  // Original code returned 404 if portfolio not found.
  // To match original behavior, we might need a separate check or update service.
  // For now, I'll assume empty list is acceptable or I should check portfolio existence first using PortfolioService.
  
  const portfolioService = new PortfolioServiceImpl(c.get('db'));
  try {
    await portfolioService.getPortfolio(userId, portfolioId);
  } catch (e) {
    if (e instanceof AppError) {
      return c.json(e.toResponse(), e.status as ContentfulStatusCode);
    }
    return c.json({ error: { code: 'NOT_FOUND', message: 'Portfolio not found' } }, 404);
  }

  const categories = await service.getCategoriesByPortfolio(userId, portfolioId);
  return c.json(categories);
});

portfolioRoutes.post('/:portfolioId/categories', zValidator('json', createCategorySchema), async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const input = c.req.valid('json');
  const service = new CategoryServiceImpl(c.get('db'));

  try {
    const category = await service.createCategory(userId, portfolioId, input);
    return c.json(category);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json(error.toResponse(), error.status as ContentfulStatusCode);
    }
    throw error;
  }
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
  const service = new CategoryServiceImpl(c.get('db'));

  try {
    const category = await service.updateCategory(userId, categoryId, input);
    return c.json(category);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json(error.toResponse(), error.status as ContentfulStatusCode);
    }
    throw error;
  }
});

categoryRoutes.delete('/:categoryId', async (c) => {
  const { userId } = c.get('auth');
  const categoryId = c.req.param('categoryId');
  const service = new CategoryServiceImpl(c.get('db'));

  try {
    await service.deleteCategory(userId, categoryId);
    return c.json({ success: true });
  } catch (error) {
    if (error instanceof AppError) {
      return c.json(error.toResponse(), error.status as ContentfulStatusCode);
    }
    throw error;
  }
});

