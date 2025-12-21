
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding history data...');
  const users = await prisma.appUser.findMany();
  
  for (const user of users) {
    console.log(`Processing user ${user.username}...`);
    
    // Get latest snapshot
    const latest = await prisma.dailySnapshot.findFirst({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    });

    if (!latest) {
      console.log('No latest snapshot found, skipping.');
      continue;
    }

    const today = new Date();
    const baseValue = Number(latest.totalValue);
    
    // Generate for last 90 days
    let count = 0;
    for (let i = 1; i <= 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const exists = await prisma.dailySnapshot.findUnique({
        where: { userId_date: { userId: user.id, date: dateStr } },
      });

      if (exists) {
        continue;
      }

      // Random variation +/- 5%
      const variation = 1 + (Math.random() * 0.1 - 0.05); 
      const totalValue = baseValue * (0.8 + (Math.random() * 0.4)); // Variate around base value

      await prisma.dailySnapshot.create({
        data: {
          userId: user.id,
          date: dateStr,
          totalValue,
          dayProfit: (Math.random() * 2000) - 1000,
          totalProfit: (Math.random() * 10000) - 2000,
          status: 'OK',
        },
      });
      count++;
    }
    console.log(`Created ${count} snapshots for user ${user.username}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
