import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 查询最近的 5 条日快照数据 (DailySnapshot)...');
  const snapshots = await prisma.dailySnapshot.findMany({
    orderBy: { date: 'desc' },
    take: 5,
    include: { holdings: true }
  });
  
  if (snapshots.length === 0) {
      console.log('⚠️  暂无快照数据');
      return;
  }

  console.log(`✅ 找到 ${snapshots.length} 条快照:`);
  snapshots.forEach(s => {
    console.log(`\n📅 日期: ${s.date}`);
    console.log(`   💰 总资产: ${s.totalValue}`);
    console.log(`   📊 持仓数: ${s.holdings.length}`);
    if (s.holdings.length > 0) {
        console.log(`   📝 持仓示例 (前3个):`);
        s.holdings.slice(0, 3).forEach(h => {
             console.log(`      - ${h.symbol}: ${h.quantity}股 @ ${h.price} (市值: ${h.marketValue})`);
        });
    }
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
