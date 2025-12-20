import {
  FetchedAsset,
  FetchAssetsResult,
  IPlatformAdapter,
  PlatformType,
} from './types';

export class MockAdapter implements IPlatformAdapter {
  platform: PlatformType = 'MOCK';
  name = 'Mock Broker';

  async fetchAssets(credentials: Record<string, unknown>): Promise<FetchAssetsResult> {
    // Simulate 2FA requirement if username is "2fa_user"
    if (credentials?.username === '2fa_user' && !credentials?._2fa_verified) {
      return {
        ok: false,
        reason: 'NEED_2FA',
        metadata: { sessionId: 'mock-session-id' },
      };
    }

    const assets: FetchedAsset[] = [
      {
        symbol: 'AAPL',
        name: 'Apple',
        quantity: 10,
        price: 190,
        costPrice: 170,
        currency: 'USD',
        marketValue: 1900,
      },
      {
        symbol: '00700.HK',
        name: 'Tencent',
        quantity: 100,
        price: 280,
        costPrice: 260,
        currency: 'HKD',
        marketValue: 28000,
      },
      {
        symbol: '510300',
        name: '沪深300ETF',
        quantity: 500,
        price: 4.2,
        costPrice: 4.0,
        currency: 'CNY',
        marketValue: 2100,
      },
    ];
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
