import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthedRequest = Request & {
  user: {
    userId: string;
  };
};

type TrendRange = '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';
type UpsertAssetCategoryBody = {
  symbol: string;
  category: string;
};

function resolveTrendStartDate(range: TrendRange): Date {
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
      break;
    case 'ALL': {
      const allStart = new Date(0);
      return allStart;
    }
  }

  start.setHours(0, 0, 0, 0);
  return start;
}

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard/summary')
  async summary(@Req() req: AuthedRequest) {
    const snapshots = await this.prisma.dailySnapshot.findMany({
      where: { userId: req.user.userId },
      orderBy: [{ date: 'desc' }, { timestamp: 'desc' }],
      take: 1,
    });
    const snapshot = snapshots[0];
    if (!snapshot) {
      return {
        totalValue: 0,
        dayProfit: 0,
        totalProfit: 0,
        lastUpdated: null,
      };
    }
    return {
      totalValue: snapshot.totalValue,
      dayProfit: snapshot.dayProfit,
      totalProfit: snapshot.totalProfit,
      lastUpdated: snapshot.timestamp,
    };
  }

  @Get('history/trend')
  async historyTrend(
    @Req() req: AuthedRequest,
    @Query('range') range?: TrendRange,
  ) {
    const startDate = resolveTrendStartDate(range ?? '1M');
    const snapshots = await this.prisma.dailySnapshot.findMany({
      where: {
        userId: req.user.userId,
        date: { gte: startDate },
      },
      orderBy: [{ date: 'asc' }, { timestamp: 'asc' }],
    });

    return snapshots.map((s) => {
      const raw = String(s.date);
      const date = raw.split('T')[0];
      return {
        date,
        totalValue: Number(s.totalValue),
        dayProfit: Number(s.dayProfit),
        totalProfit: Number(s.totalProfit),
      };
    });
  }

  @Get('assets')
  async assets(@Req() req: AuthedRequest, @Query('limit') limit?: string) {
    const snapshots = await this.prisma.dailySnapshot.findMany({
      where: { userId: req.user.userId },
      orderBy: [{ date: 'desc' }, { timestamp: 'desc' }],
      take: 1,
    });
    const snapshot = snapshots[0];
    if (!snapshot) {
      return [];
    }
    const holdings = await this.prisma.assetPosition.findMany({
      where: { snapshotId: snapshot.id },
      take: limit ? Number(limit) : undefined,
      include: {
        account: true,
      },
    });
    return holdings;
  }

  @Get('asset-categories')
  async assetCategories(@Req() req: AuthedRequest) {
    return this.prisma.assetCategory.findMany({
      where: { userId: req.user.userId },
      orderBy: { symbol: 'asc' },
    });
  }

  @Post('asset-categories')
  async upsertAssetCategory(
    @Req() req: AuthedRequest,
    @Body() body: UpsertAssetCategoryBody,
  ) {
    const symbol = body.symbol?.trim();
    const category = body.category?.trim();
    if (!symbol || !category) {
      return { ok: false };
    }
    await this.prisma.assetCategory.upsert({
      where: {
        userId_symbol: {
          userId: req.user.userId,
          symbol,
        },
      },
      create: {
        userId: req.user.userId,
        symbol,
        category,
      },
      update: {
        category,
      },
    });
    return { ok: true };
  }
}
