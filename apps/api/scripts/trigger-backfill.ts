import { PrismaClient } from '@cola-finance/db';
import { MockAdapter } from '@cola-finance/platform-adapters';
import { DailyAssets } from '@cola-finance/platform-adapters';

// Standalone script to manually trigger backfill
// Run with: npx tsx scripts/trigger-backfill.ts

const prisma = new PrismaClient();
const adapter = new MockAdapter();

// Copied logic from SnapshotService to run standalone
async function processBackfillDay(userId: string, accountId: string, dayData: DailyAssets) {
    const { date, assets } = dayData;
    
    const holdings = assets.map(asset => ({
      accountId,
      symbol: asset.symbol,
      quantity: asset.quantity,
      price: asset.price,
      costPrice: asset.costPrice,
      marketValue: asset.marketValue,
    }));

    const dayTotalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.dailySnapshot.findUnique({
        where: { userId_date: { userId, date } },
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
              data: holdings.map(h => ({
                snapshotId: existing.id,
                accountId: h.accountId,
                symbol: h.symbol,
                quantity: h.quantity,
                price: h.price,
                costPrice: h.costPrice,
                marketValue: h.marketValue,
                dayProfit: 0,
              })),
            });
        }
        
        // Recalculate snapshot totals
        const otherHoldings = existing.holdings.filter(h => h.accountId !== accountId);
        const otherTotal = otherHoldings.reduce((sum, h) => sum + Number(h.marketValue), 0);
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
            date,
            totalValue: dayTotalValue,
            dayProfit: 0,
            totalProfit: 0,
            status: 'OK',
            holdings: {
              create: holdings.map(h => ({
                accountId: h.accountId,
                symbol: h.symbol,
                quantity: h.quantity,
                price: h.price,
                costPrice: h.costPrice,
                marketValue: h.marketValue,
                dayProfit: 0,
              })),
            },
          },
        });
      }
    });
}

async function main() {
  console.log('🚀 Starting manual backfill...');

  // 1. Find connected Mock accounts
  const accounts = await prisma.platformAccount.findMany({
    where: { platform: 'MOCK' },
  });

  if (accounts.length === 0) {
      console.log('No Mock accounts found.');
      return;
  }

  console.log(`Found ${accounts.length} Mock accounts.`);

  for (const account of accounts) {
    console.log(`\n📦 Processing account: ${account.name} (${account.id})...`);
    
    if (!adapter.fetchHistory) {
        console.error('Adapter fetchHistory not implemented');
        continue;
    }

    const res = await adapter.fetchHistory({});
    if (!res.ok) {
        console.error('Failed to fetch history:', res.reason);
        continue;
    }

    const history = res.history;
    console.log(`   Fetched ${history.length} days of history.`);
    
    // Sort
    const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));

    // Batch Process
    const CHUNK_SIZE = 20;
    let processed = 0;
    
    const startTime = Date.now();

    for (let i = 0; i < sortedHistory.length; i += CHUNK_SIZE) {
        const chunk = sortedHistory.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(day => processBackfillDay(account.userId, account.id, day)));
        
        processed += chunk.length;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        process.stdout.write(`\r   ⏳ Progress: ${processed}/${sortedHistory.length} days (Elapsed: ${elapsed}s)`);
    }
    console.log('\n   ✅ Completed.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
