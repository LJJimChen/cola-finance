import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  async getTrend(userId: string, range: string) {
    const now = new Date();
    const start = new Date(now.getTime());

    switch (range) {
      case '1M':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3M':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6M':
        start.setMonth(start.getMonth() - 6);
        break;
      case '1Y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'YTD':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'ALL':
        start.setTime(0);
        break;
      default:
        start.setMonth(start.getMonth() - 1);
    }

    start.setHours(0, 0, 0, 0);
    const startDate = start;

    const snapshots = await this.prisma.dailySnapshot.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    return snapshots.map((s) => {
      const date =
        s.date instanceof Date
          ? s.date.toISOString().split('T')[0]
          : String(s.date);
      return {
        date,
        totalValue: Number(s.totalValue),
        dayProfit: Number(s.dayProfit),
        totalProfit: Number(s.totalProfit),
      };
    });
  }

  async getRebalance(userId: string) {
    // 1. Get latest snapshot
    const snapshot = await this.prisma.dailySnapshot.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
      include: { holdings: true },
    });

    if (!snapshot) {
      return { totalValue: 0, categories: [] };
    }

    const totalValue = Number(snapshot.totalValue);
    if (totalValue === 0) {
      return { totalValue: 0, categories: [] };
    }

    // 2. Get asset categories
    const categoryMappings = await this.prisma.assetCategory.findMany({
      where: { userId },
    });
    const symbolToCategory = new Map<string, string>();
    for (const m of categoryMappings) {
      symbolToCategory.set(m.symbol, m.category);
    }

    // 3. Aggregate current holdings by category
    const currentMap = new Map<string, number>();
    for (const h of snapshot.holdings) {
      const cat = symbolToCategory.get(h.symbol) || 'Unclassified';
      const val = currentMap.get(cat) || 0;
      currentMap.set(cat, val + Number(h.marketValue));
    }

    // 4. Get target allocation
    const targets = await this.prisma.allocationConfig.findMany({
      where: { userId },
    });
    const targetMap = new Map<string, number>();
    for (const t of targets) {
      targetMap.set(t.category, Number(t.percentage));
    }

    // 5. Build result
    // Union of all categories found in current holdings and targets
    const allCategories = new Set([...currentMap.keys(), ...targetMap.keys()]);
    const result: {
      category: string;
      currentAmount: number;
      currentPercent: number;
      targetPercent: number;
      targetAmount: number;
      diffAmount: number;
      action: 'BUY' | 'SELL' | 'HOLD';
    }[] = [];

    for (const cat of allCategories) {
      const currentAmount = currentMap.get(cat) || 0;
      const currentPercent = (currentAmount / totalValue) * 100;
      const targetPercent = targetMap.get(cat) || 0;
      const targetAmount = (targetPercent / 100) * totalValue;
      const diffAmount = targetAmount - currentAmount;

      result.push({
        category: cat,
        currentAmount,
        currentPercent,
        targetPercent,
        targetAmount,
        diffAmount,
        action: diffAmount > 0 ? 'BUY' : diffAmount < 0 ? 'SELL' : 'HOLD',
      });
    }

    return {
      totalValue,
      categories: result.sort((a, b) => b.currentPercent - a.currentPercent),
    };
  }

  async updateTargets(
    userId: string,
    targets: { category: string; percentage: number }[],
  ) {
    await this.prisma.$transaction(async (tx) => {
      // Clear existing configs? Or just upsert?
      // Usually full replace is easier for "Save" button
      await tx.allocationConfig.deleteMany({
        where: { userId },
      });
      if (targets.length > 0) {
        await tx.allocationConfig.createMany({
          data: targets.map((t) => ({
            userId,
            category: t.category,
            percentage: t.percentage,
          })),
        });
      }
    });
    return { ok: true };
  }
}
