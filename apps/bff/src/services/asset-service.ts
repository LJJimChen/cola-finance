import { db } from '../db';
import { assets, portfolios } from '../db/schema';
import { eq, and, asc } from 'drizzle-orm';
import type { Asset, CreateAssetRequest } from '@repo/shared-types';
import { toMoney4 } from '../lib/money';

export interface AssetService {
  getAssetsByPortfolio(userId: string, portfolioId: string): Promise<Asset[]>;
  createAsset(userId: string, portfolioId: string, data: CreateAssetRequest): Promise<Asset>;
  updateAsset(userId: string, assetId: string, data: Partial<Asset>): Promise<Asset>;
  deleteAsset(userId: string, assetId: string): Promise<boolean>;
  getAssetById(userId: string, assetId: string): Promise<Asset | null>;
}

export class AssetServiceImpl implements AssetService {
  async getAssetsByPortfolio(userId: string, portfolioId: string): Promise<Asset[]> {
    // Verify user owns the portfolio
    const portfolioResult = await db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);

    if (portfolioResult.length === 0) {
      throw new Error('Portfolio not found or access denied');
    }

    const assetsResult = await db
      .select()
      .from(assets)
      .where(eq(assets.portfolioId, portfolioId))
      .orderBy(asc(assets.name));

    return assetsResult as unknown as Asset[];
  }

  async getAssetsByUser(userId: string): Promise<Asset[]> {
    const assetsResult = await db
      .select({ asset: assets })
      .from(assets)
      .innerJoin(portfolios, eq(assets.portfolioId, portfolios.id))
      .where(eq(portfolios.userId, userId))
      .orderBy(asc(assets.name));

    return assetsResult.map(r => r.asset as unknown as Asset);
  }

  async createAsset(userId: string, portfolioId: string, data: CreateAssetRequest): Promise<Asset> {
    // Verify user owns the portfolio
    const portfolioResult = await db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);

    if (portfolioResult.length === 0) {
      throw new Error('Portfolio not found or access denied');
    }

    const [newAsset] = await db
      .insert(assets)
      .values({
        portfolioId,
        symbol: data.symbol,
        name: data.name,
        quantity: data.quantity,
        costBasis4: toMoney4(data.costBasis),
        dailyProfit4: toMoney4(data.dailyProfit),
        currentPrice4: toMoney4(data.currentPrice),
        currency: data.currency,
        brokerSource: data.brokerSource,
        brokerAccount: data.brokerAccount,
        categoryId: data.categoryId,
      })
      .returning();

    return newAsset as unknown as Asset;
  }

  async updateAsset(userId: string, assetId: string, data: Partial<Asset>): Promise<Asset> {
    // Verify user owns the asset via portfolio
    const assetResult = await db
      .select({ asset: assets })
      .from(assets)
      .innerJoin(portfolios, eq(assets.portfolioId, portfolios.id))
      .where(and(eq(assets.id, assetId), eq(portfolios.userId, userId)))
      .limit(1);

    if (assetResult.length === 0) {
      throw new Error('Asset not found or access denied');
    }

    const [updatedAsset] = await db
      .update(assets)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(assets.id, assetId))
      .returning();

    return updatedAsset as unknown as Asset;
  }

  async deleteAsset(userId: string, assetId: string): Promise<boolean> {
    // Verify user owns the asset via portfolio
    const assetResult = await db
      .select({ id: assets.id })
      .from(assets)
      .innerJoin(portfolios, eq(assets.portfolioId, portfolios.id))
      .where(and(eq(assets.id, assetId), eq(portfolios.userId, userId)))
      .limit(1);

    if (assetResult.length === 0) {
      throw new Error('Asset not found or access denied');
    }

    await db.delete(assets).where(eq(assets.id, assetId));

    return true;
  }

  async getAssetById(userId: string, assetId: string): Promise<Asset | null> {
    const result = await db
      .select({ asset: assets })
      .from(assets)
      .innerJoin(portfolios, eq(assets.portfolioId, portfolios.id))
      .where(and(eq(assets.id, assetId), eq(portfolios.userId, userId)))
      .limit(1);

    return result.length > 0 ? (result[0].asset as unknown as Asset) : null;
  }
}

// Create a singleton instance
const assetService = new AssetServiceImpl();

export { assetService };