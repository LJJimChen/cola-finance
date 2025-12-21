import { MockAdapter } from './src/adapters/mock-adapter';

async function verify() {
  const adapter = new MockAdapter();
  console.log('🔍 开始验证 MockAdapter fetchHistory...\n');

  if (!adapter.fetchHistory) {
    console.error('❌ fetchHistory not implemented');
    return;
  }

  const res = await adapter.fetchHistory({});
  if (res.ok) {
    console.log(`✅ 获取成功，共获取 ${res.history.length} 天的历史数据`);
    if (res.history.length > 0) {
        const first = res.history[0];
        const last = res.history[res.history.length - 1];
        console.log(`   📅 第一天: ${first.date}, 资产数: ${first.assets.length}`);
        console.log(`   📅 最后一天: ${last.date}, 资产数: ${last.assets.length}`);
        
        // Sample check
        const sampleDate = '2025-04-17';
        const sample = res.history.find(d => d.date === sampleDate);
        if (sample) {
             console.log(`   🔎 ${sampleDate} 数据检查:`);
             sample.assets.forEach(a => {
                 console.log(`      - ${a.name}: ${a.price}`);
             });
        }
    }
  } else {
    console.error('❌ 获取失败:', res.reason);
  }
}

verify().catch(console.error);
