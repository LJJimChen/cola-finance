import { assets, portfolios } from '../db/schema';
import { eq, and, asc } from 'drizzle-orm';
import type { Asset, CreateAssetRequest } from '@repo/shared-types';
import { toMoney4, toQuantity8, fromQuantity8, fromMoney4 } from '../lib/money';
import type { AppDb } from '../db';
import { PortfolioMetricsService } from './portfolio-metrics-service';

export interface AssetService {
  getAssetsByPortfolio(userId: string, portfolioId: string): Promise<Asset[]>;
  createAsset(userId: string, portfolioId: string, data: CreateAssetRequest): Promise<Asset>;
  updateAsset(userId: string, assetId: string, data: Partial<Asset>): Promise<Asset>;
  deleteAsset(userId: string, assetId: string): Promise<boolean>;
  getAssetById(userId: string, assetId: string): Promise<Asset | null>;
  getAssetsByUser(userId: string): Promise<Asset[]>;
}

function mapAssetRow(row: typeof assets.$inferSelect): Asset {
  return {
    ...row,
    quantity: fromQuantity8(row.quantity8),
    costBasis: fromMoney4(row.costBasis4),
    dailyProfit: fromMoney4(row.dailyProfit4),
    currentPrice: fromMoney4(row.currentPrice4),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } as unknown as Asset;
}

export class AssetServiceImpl implements AssetService {
  constructor(private db: AppDb) {}

  async getAssetsByPortfolio(userId: string, portfolioId: string): Promise<Asset[]> {
    // Verify user owns the portfolio
    const portfolioResult = await this.db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);

    if (portfolioResult.length === 0) {
      throw new Error('Portfolio not found or access denied');
    }

    const assetsResult = await this.db
      .select()
      .from(assets)
      .where(eq(assets.portfolioId, portfolioId))
      .orderBy(asc(assets.name));

    return assetsResult.map(mapAssetRow);
  }

  async getAssetsByUser(userId: string): Promise<Asset[]> {
    const assetsResult = await this.db
      .select({ asset: assets })
      .from(assets)
      .innerJoin(portfolios, eq(assets.portfolioId, portfolios.id))
      .where(eq(portfolios.userId, userId))
      .orderBy(asc(assets.name));

    return assetsResult.map(r => mapAssetRow(r.asset));
  }

  async createAsset(userId: string, portfolioId: string, data: CreateAssetRequest): Promise<Asset> {
    // Verify user owns the portfolio
    const portfolioResult = await this.db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);

    if (portfolioResult.length === 0) {
      throw new Error('Portfolio not found or access denied');
    }

    const [newAsset] = await this.db
      .insert(assets)
      .values({
        id: crypto.randomUUID(),
        portfolioId,
        symbol: data.symbol,
        name: data.name,
        quantity8: toQuantity8(data.quantity),
        costBasis4: toMoney4(data.costBasis),
        dailyProfit4: toMoney4(data.dailyProfit),
        currentPrice4: toMoney4(data.currentPrice),
        currency: data.currency,
        brokerSource: data.brokerSource,
        brokerAccount: data.brokerAccount,
        categoryId: data.categoryId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Recompute metrics
    const metrics = new PortfolioMetricsService(this.db);
    await metrics.recomputeAndPersist(userId, portfolioId);

    return mapAssetRow(newAsset);
  }

  async updateAsset(userId: string, assetId: string, data: Partial<Asset>): Promise<Asset> {
    // Verify user owns the asset via portfolio
    const assetResult = await this.db
      .select({ asset: assets })
      .from(assets)
      .innerJoin(portfolios, eq(assets.portfolioId, portfolios.id))
      .where(and(eq(assets.id, assetId), eq(portfolios.userId, userId)))
      .limit(1);

    if (assetResult.length === 0) {
      throw new Error('Asset not found or access denied');
    }

    const currentAsset = assetResult[0].asset;

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.symbol !== undefined) updateData.symbol = data.symbol;
    if (data.quantity !== undefined) updateData.quantity8 = toQuantity8(data.quantity);
    if (data.costBasis !== undefined) updateData.costBasis4 = toMoney4(data.costBasis);
    if (data.dailyProfit !== undefined) updateData.dailyProfit4 = toMoney4(data.dailyProfit);
    if (data.currentPrice !== undefined) updateData.currentPrice4 = toMoney4(data.currentPrice);
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.brokerSource !== undefined) updateData.brokerSource = data.brokerSource;
    if (data.brokerAccount !== undefined) updateData.brokerAccount = data.brokerAccount;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

    const [updatedAsset] = await this.db
      .update(assets)
      .set(updateData)
      .where(eq(assets.id, assetId))
      .returning();

    // Recompute metrics
    const metrics = new PortfolioMetricsService(this.db);
    await metrics.recomputeAndPersist(userId, currentAsset.portfolioId);

    return mapAssetRow(updatedAsset);
  }

  async deleteAsset(userId: string, assetId: string): Promise<boolean> {
    // Verify user owns the asset via portfolio
    const assetResult = await this.db
      .select({ asset: assets })
      .from(assets)
      .innerJoin(portfolios, eq(assets.portfolioId, portfolios.id))
      .where(and(eq(assets.id, assetId), eq(portfolios.userId, userId)))
      .limit(1);

    if (assetResult.length === 0) {
      throw new Error('Asset not found or access denied');
    }

    const currentAsset = assetResult[0].asset;

    await this.db.delete(assets).where(eq(assets.id, assetId));

    // Recompute metrics
    const metrics = new PortfolioMetricsService(this.db);
    await metrics.recomputeAndPersist(userId, currentAsset.portfolioId);

    return true;
  }

  async getAssetById(userId: string, assetId: string): Promise<Asset | null> {
    const assetResult = await this.db
      .select({ asset: assets })
      .from(assets)
      .innerJoin(portfolios, eq(assets.portfolioId, portfolios.id))
      .where(and(eq(assets.id, assetId), eq(portfolios.userId, userId)))
      .limit(1);

    return assetResult.length > 0 ? (assetResult[0].asset as unknown as Asset) : null;
  }
}

// const assetService = new AssetServiceImpl();
// export { assetService };