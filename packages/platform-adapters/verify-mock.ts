
import { MockAdapter } from './src/adapters/mock-adapter';

async function verify() {
  const adapter = new MockAdapter();
  console.log('🔍 开始验证 MockAdapter...\n');

  // 1. 验证默认情况（今天/最新数据）
  console.log('1️⃣  测试：默认情况（最新数据）');
  const resDefault = await adapter.fetchAssets({});
  if (resDefault.ok) {
    console.log(`✅ 获取成功，共持有 ${resDefault.assets.length} 个资产`);
    // 打印前两个作为示例
    resDefault.assets.slice(0, 2).forEach(a => {
      console.log(`   - ${a.name} (${a.symbol}): 价格 ${a.price}, 市值 ${a.marketValue}`);
    });
  } else {
    console.error('❌ 获取失败:', resDefault.reason);
  }

  // 2. 验证历史日期
  const historyDate = '2025-04-17';
  console.log(`\n2️⃣  测试：历史日期 (${historyDate})`);
  const resHistory = await adapter.fetchAssets({ date: historyDate });
  if (resHistory.ok) {
    console.log(`✅ 获取成功，共持有 ${resHistory.assets.length} 个资产`);
    const asset = resHistory.assets.find(a => a.symbol === '159202'); // 恒生互联网科技ETF
    if (asset) {
      console.log(`   - 恒生互联网科技ETF: 价格应接近 0.975 (实际: ${asset.price})`);
    }
  }

  // 3. 验证未来日期（应保持最后价格）
  const futureDate = '2030-01-01';
  console.log(`\n3️⃣  测试：未来日期 (${futureDate})`);
  const resFuture = await adapter.fetchAssets({ date: futureDate });
  if (resFuture.ok) {
    console.log(`✅ 获取成功，共持有 ${resFuture.assets.length} 个资产`);
    const asset = resFuture.assets.find(a => a.symbol === '159202');
    if (asset) {
      console.log(`   - 恒生互联网科技ETF: 价格应保持最新收盘价 (实际: ${asset.price})`);
    }
  }

  // 4. 验证早期日期（数据开始前）
  const earlyDate = '2020-01-01';
  console.log(`\n4️⃣  测试：早期日期 (${earlyDate})`);
  const resEarly = await adapter.fetchAssets({ date: earlyDate });
  if (resEarly.ok) {
    console.log(`✅ 获取成功，共持有 ${resEarly.assets.length} 个资产`);
    console.log('   (预期数量应该很少，因为大部分ETF在2020年还未上市或无数据)');
  }

  console.log('\n✨ 验证完成');
}

verify().catch(console.error);
