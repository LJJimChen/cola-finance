import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AdapterFactory,
  type FetchAssetsResult,
  type FetchedAsset,
  type DailyAssets,
} from '@cola-finance/platform-adapters';
import { createDecipheriv, createHash } from 'crypto';
import { AccountStatus, SnapshotStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';

function toDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  return new Date(Date.UTC(year, month - 1, day));
}

interface HoldingInput {
  accountId: string;
  symbol: string;
  name?: string;
  quantity: number;
  price: number;
  costPrice: number;
  marketValue: number;
  dayProfit?: number;
  currency: string;
}

const credentialsKey = createHash('sha256')
  .update(process.env.CREDENTIALS_SECRET || 'dev-credentials-secret')
  .digest();

function decryptCredentials(encryptedBase64: string): string {
  const buf = Buffer.from(encryptedBase64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', credentialsKey, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
}

function decodeCredentials(
  encryptedBase64: string | null,
): Record<string, unknown> {
  if (!encryptedBase64) {
    return {};
  }
  let decrypted: string;
  try {
    decrypted = decryptCredentials(encryptedBase64);
  } catch {
    return {};
  }
  try {
    const parsed = JSON.parse(decrypted) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { raw: decrypted };
  } catch {
    return { raw: decrypted };
  }
}

@Injectable()
export class SnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  // Run every 6 hours by default, or 4 times a day.
  // Using NestJS Schedule @Cron instead of setInterval
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleCron() {
    console.log('Running scheduled snapshot generation...');
    await this.runScheduledSnapshots();
  }

  private async runScheduledSnapshots() {
    // Iterate all users
    const users = await this.prisma.appUser.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    for (const user of users) {
      try {
        await this.generateForUser(user.id);
      } catch (err) {
        console.error(`Failed to generate snapshot for user ${user.id}:`, err);
      }
    }
  }

  async generateForUser(userId: string) {
    const user = await this.prisma.appUser.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return;
    }
    const accounts = await this.prisma.platformAccount.findMany({
      where: { userId },
    });
    const holdings: HoldingInput[] = [];
    for (const account of accounts) {
      const adapter = AdapterFactory.getAdapter(account.platform);
      const creds = decodeCredentials(account.credentials ?? null);
      const result: FetchAssetsResult = await adapter.fetchAssets(creds);
      if (!result.ok) {
        const nextStatus =
          result.reason === 'NEED_2FA' || result.reason === 'NEED_CAPTCHA'
            ? AccountStatus.NeedVerify
            : result.reason === 'INVALID_CREDENTIALS'
              ? AccountStatus.Unauthorized
              : AccountStatus.Error;
        if (account.status !== nextStatus) {
          await this.prisma.platformAccount.update({
            where: { id: account.id },
            data: { status: nextStatus },
          });
        }
        continue;
      }
      if (account.status !== AccountStatus.Connected) {
        await this.prisma.platformAccount.update({
          where: { id: account.id },
          data: { status: AccountStatus.Connected },
        });
      }
      const assets: FetchedAsset[] = result.assets;
      holdings.push(
        ...assets.map((asset) => ({
          accountId: account.id,
          symbol: asset.symbol,
          name: asset.name,
          quantity: asset.quantity,
          price: asset.price,
          costPrice: asset.costPrice,
          marketValue: asset.marketValue,
          dayProfit: asset.dayProfit || 0,
          currency: asset.currency,
        })),
      );
    }

    const today = this.resolveBusinessDate(user.timezone);
    const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const dayProfit = 0;
    const totalProfit = 0;
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.dailySnapshot.findUnique({
        where: { userId_date: { userId, date: today } },
      });
      if (existing) {
        await tx.assetPosition.deleteMany({
          where: { snapshotId: existing.id },
        });
        await tx.dailySnapshot.update({
          where: { id: existing.id },
          data: {
            timestamp: new Date(),
            totalValue,
            dayProfit,
            totalProfit,
            status: SnapshotStatus.OK,
            holdings: {
              create: holdings.map((h) => ({
                accountId: h.accountId,
                symbol: h.symbol,
                name: h.name,
                quantity: h.quantity,
                price: h.price,
                costPrice: h.costPrice,
                marketValue: h.marketValue,
                dayProfit: h.dayProfit || 0,
                currency: h.currency,
              })),
            },
          },
        });
      } else {
        await tx.dailySnapshot.create({
          data: {
            userId,
            date: today,
            totalValue,
            dayProfit,
            totalProfit,
            status: SnapshotStatus.OK,
            holdings: {
              create: holdings.map((h) => ({
                accountId: h.accountId,
                symbol: h.symbol,
                quantity: h.quantity,
                price: h.price,
                costPrice: h.costPrice,
                marketValue: h.marketValue,
                dayProfit: h.dayProfit || 0,
                currency: h.currency,
              })),
            },
          },
        });
      }
    });

    await this.recalculateProfits(userId);
  }

  async backfillSnapshots(
    userId: string,
    accountId: string,
    history: DailyAssets[],
  ) {
    // Sort history by date
    const sortedHistory = [...history].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    // Process in chunks
    const CHUNK_SIZE = 10;

    // We need to pass previous day's total value to calculate profit
    // But since we are doing parallel chunks, calculating precise dayProfit locally is hard if we don't query previous day.
    // However, `processBackfillDay` runs in a transaction.
    // To calculate dayProfit correctly: dayProfit = currentTotal - (prevTotal + netInflow)
    // For backfill, assuming no deposits/withdrawals, dayProfit = currentTotal - prevTotal.
    // Since we might be updating an existing snapshot or creating new, we need to know the *user's* total value for previous day.

    // Let's simplify:
    // 1. Insert all data with dayProfit = 0 first.
    // 2. Then run a pass to recalculate dayProfit and totalProfit for the affected range?
    // Or just try to calculate it on the fly if we process sequentially?

    // Sequential processing is safer for dayProfit calculation chain.
    // But slow for 1000+ days.

    // Let's keep parallel insertion for speed, but then trigger a recalculation job?
    // Or, we can query the previous day snapshot inside `processBackfillDay`.

    for (let i = 0; i < sortedHistory.length; i += CHUNK_SIZE) {
      const chunk = sortedHistory.slice(i, i + CHUNK_SIZE);
      // We must run these sequentially if we want to rely on previous day data being present?
      // Actually, if we use Promise.all, they run in parallel.
      // Let's just insert data first (as currently implemented).
      await Promise.all(
        chunk.map((dayData) =>
          this.processBackfillDay(userId, accountId, dayData),
        ),
      );
    }

    // After backfill, we should trigger a profit recalculation for the user
    await this.recalculateProfits(userId);
  }

  private async recalculateProfits(userId: string) {
    const snapshots = await this.prisma.dailySnapshot.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    let prevTotal = 0;
    let firstTotal = 0;

    for (const [index, snapshot] of snapshots.entries()) {
      const currentTotal = Number(snapshot.totalValue);

      if (index === 0) {
        firstTotal = currentTotal;
        prevTotal = currentTotal;
        // Day 0 profit is 0 usually, or just total value if we consider it all "gain" from nothing?
        // Usually 0.
        await this.prisma.dailySnapshot.update({
          where: { id: snapshot.id },
          data: { dayProfit: 0, totalProfit: 0 },
        });
        continue;
      }

      const dayProfit = currentTotal - prevTotal;
      const totalProfit = currentTotal - firstTotal; // Simple Total Return

      await this.prisma.dailySnapshot.update({
        where: { id: snapshot.id },
        data: { dayProfit, totalProfit },
      });

      prevTotal = currentTotal;
    }
  }

  private async processBackfillDay(
    userId: string,
    accountId: string,
    dayData: DailyAssets,
  ) {
    const { date, assets } = dayData;

    const holdings: HoldingInput[] = assets.map((asset) => ({
      accountId,
      symbol: asset.symbol,
      name: asset.name,
      quantity: asset.quantity,
      price: asset.price,
      costPrice: asset.costPrice,
      marketValue: asset.marketValue,
      dayProfit: asset.dayProfit || 0,
      currency: asset.currency,
    }));

    const dayTotalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.dailySnapshot.findUnique({
        where: { userId_date: { userId, date: toDateOnly(date) } },
        include: { holdings: true },
      });

      if (existing) {
        // Remove existing holdings for this account on this day
        await tx.assetPosition.deleteMany({
          where: { snapshotId: existing.id, accountId },
        });

        // Create new holdings
        if (holdings.length > 0) {
          await tx.assetPosition.createMany({
            data: holdings.map((h) => ({
              snapshotId: existing.id,
              accountId: h.accountId,
              symbol: h.symbol,
              name: h.name,
              quantity: h.quantity,
              price: h.price,
              costPrice: h.costPrice,
              marketValue: h.marketValue,
              dayProfit: h.dayProfit || 0,
              currency: h.currency,
            })),
          });
        }

        // Recalculate snapshot totals
        const otherHoldings = existing.holdings.filter(
          (h) => h.accountId !== accountId,
        );
        const otherTotal = otherHoldings.reduce(
          (sum, h) => sum + Number(h.marketValue),
          0,
        );
        const newTotal = otherTotal + dayTotalValue;

        await tx.dailySnapshot.update({
          where: { id: existing.id },
          data: {
            totalValue: newTotal,
            timestamp: new Date(),
          },
        });
      } else {
        // Create new snapshot
        await tx.dailySnapshot.create({
          data: {
            userId,
            date: toDateOnly(date),
            totalValue: dayTotalValue,
            dayProfit: 0,
            totalProfit: 0,
            status: SnapshotStatus.OK,
            holdings: {
              create: holdings.map((h) => ({
                accountId: h.accountId,
                symbol: h.symbol,
                name: h.name,
                quantity: h.quantity,
                price: h.price,
                costPrice: h.costPrice,
                marketValue: h.marketValue,
                dayProfit: h.dayProfit || 0,
                currency: h.currency,
              })),
            },
          },
        });
      }
    });
  }

  private resolveBusinessDate(timezone?: string): Date {
    const now = new Date();
    if (!timezone) {
      const iso = now.toISOString().split('T')[0];
      return toDateOnly(iso);
    }

    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const formatted = formatter.format(now);
      return toDateOnly(formatted);
    } catch {
      const fallback = now.toISOString().split('T')[0];
      return toDateOnly(fallback);
    }
  }
}
