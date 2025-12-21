import * as fs from 'fs';
import * as path from 'path';
import {
  FetchedAsset,
  FetchAssetsResult,
  FetchHistoryResult,
  IPlatformAdapter,
  PlatformType,
  DailyAssets,
} from '../types';

export class MockAdapter implements IPlatformAdapter {
  platform: PlatformType = "MOCK";
  name = 'Mock Broker';

  async fetchHistory(credentials: Record<string, unknown>): Promise<FetchHistoryResult> {
     // Simulate 2FA requirement if username is "2fa_user"
    if (credentials?.username === '2fa_user' && !credentials?._2fa_verified) {
      return {
        ok: false,
        reason: 'NEED_2FA',
      };
    }

    const mockDataDir = path.resolve(__dirname, '../mock-data');
    if (!fs.existsSync(mockDataDir)) {
      return { ok: true, history: [] };
    }

    const files = fs.readdirSync(mockDataDir).filter(f => f.endsWith('.csv'));
    
    // Parse all files first
    const assetData: Array<{
      symbol: string;
      name: string;
      records: Array<{ date: string; close: number }>;
    }> = [];

    const allDates = new Set<string>();

    for (const file of files) {
      try {
        const filename = path.basename(file, '.csv');
        const parts = filename.split('_');
        if (parts.length < 2) continue;
        
        const symbol = parts[0];
        const name = parts[1];
        
        const content = fs.readFileSync(path.join(mockDataDir, file), 'utf-8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        
        const dataLines = lines.slice(1);
        if (dataLines.length === 0) continue;

        const records = dataLines.map(line => {
          const cols = line.split(',');
          return {
            date: cols[0], // Format: YYYY-MM-DD
            close: parseFloat(cols[2])
          };
        }).filter(r => !isNaN(r.close) && r.date);

        if (records.length === 0) continue;

        // Sort records by date
        records.sort((a, b) => a.date.localeCompare(b.date));
        
        records.forEach(r => allDates.add(r.date));

        assetData.push({ symbol, name, records });
      } catch (err) {
        console.error(`Error processing mock file ${file}:`, err);
      }
    }

    const sortedDates = Array.from(allDates).sort();
    const history: DailyAssets[] = [];

    for (const date of sortedDates) {
      const assets: FetchedAsset[] = [];
      
      for (const asset of assetData) {
        // Same logic as fetchAssets: find last record <= date
        // But also check if date < first record (not held yet)
        const firstDate = asset.records[0].date;
        if (date < firstDate) continue;

        // Find last record <= date
        // Since records are sorted, we can iterate backwards or use findLast (if available) or slice().reverse().find()
        // Or simply iterate because mock data is small.
        let validRecord: { date: string; close: number } | undefined;
        
        // Optimization: since we iterate dates in order, we could maintain index, but simple search is fine for mock.
        for (let i = asset.records.length - 1; i >= 0; i--) {
          if (asset.records[i].date <= date) {
            validRecord = asset.records[i];
            break;
          }
        }

        if (validRecord) {
           const quantity = 10000;
           const costPrice = asset.records[0].close;
           const price = validRecord.close;
           
           assets.push({
             symbol: asset.symbol,
             name: asset.name,
             quantity,
             price,
             costPrice,
             currency: 'CNY',
             marketValue: price * quantity,
           });
        }
      }

      if (assets.length > 0) {
        history.push({ date, assets });
      }
    }

    return { ok: true, history };
  }

  async fetchAssets(credentials: Record<string, unknown>): Promise<FetchAssetsResult> {
    // Simulate 2FA requirement if username is "2fa_user"
    if (credentials?.username === '2fa_user' && !credentials?._2fa_verified) {
      return {
        ok: false,
        reason: 'NEED_2FA',
        metadata: { sessionId: 'mock-session-id' },
      };
    }

    const assets: FetchedAsset[] = [];
    // Resolve mock-data directory relative to this file
    // Assuming structure: packages/platform-adapters/src/adapters/mock-adapter.ts
    // and data in: packages/platform-adapters/src/mock-data
    const mockDataDir = path.resolve(__dirname, '../mock-data');

    if (!fs.existsSync(mockDataDir)) {
      console.warn(`Mock data directory not found at ${mockDataDir}`);
      return { ok: true, assets: [] };
    }

    const files = fs.readdirSync(mockDataDir).filter(f => f.endsWith('.csv'));
    // Use provided date or default to today
    const targetDate = (credentials?.date as string) || new Date().toISOString().split('T')[0];

    for (const file of files) {
      try {
        const filename = path.basename(file, '.csv');
        const parts = filename.split('_');
        if (parts.length < 2) continue;
        
        const symbol = parts[0];
        const name = parts[1];
        
        const content = fs.readFileSync(path.join(mockDataDir, file), 'utf-8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        
        // Skip header
        const dataLines = lines.slice(1);
        if (dataLines.length === 0) continue;

        const records = dataLines.map(line => {
          const cols = line.split(',');
          return {
            date: cols[0], // Format: YYYY-MM-DD
            close: parseFloat(cols[2])
          };
        }).filter(r => !isNaN(r.close) && r.date);

        if (records.length === 0) continue;

        // Sort by date ascending
        records.sort((a, b) => a.date.localeCompare(b.date));

        const firstDate = records[0].date;

        // If queried date is before the first available data, assume asset not held yet
        if (targetDate < firstDate) continue;

        // Find the snapshot for the target date
        // Logic: Use the record on the target date, or the last available record before it.
        // If targetDate > last available date, use the last available record (keep price consistent).
        let price = records[records.length - 1].close;
        
        // Find the last record where date <= targetDate
        const validRecord = records.slice().reverse().find(r => r.date <= targetDate);
        
        if (validRecord) {
          price = validRecord.close;
        }
        
        // Initial holding assumptions
        const quantity = 10000;
        const costPrice = records[0].close;

        assets.push({
          symbol,
          name,
          quantity,
          price,
          costPrice,
          currency: 'CNY', // Assuming CNY for these CSVs
          marketValue: price * quantity,
        });
      } catch (err) {
        console.error(`Error processing mock file ${file}:`, err);
      }
    }

    return { ok: true, assets };
  }

  async submitChallenge(sessionId: string, challengeResponse: string): Promise<FetchAssetsResult> {
    if (sessionId === 'mock-session-id' && challengeResponse === '123456') {
      return this.fetchAssets({ username: '2fa_user', _2fa_verified: true });
    }
    return {
      ok: false,
      reason: 'INVALID_CREDENTIALS',
    };
  }
}
