export type PlatformType =
  | "EASTMONEY"
  | "TIANTIAN"
  | "XUEQIU"
  | "IBKR"
  | "SCHWAB"
  | "MOCK"
  | "OTHER";

export interface FetchedAsset {
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  costPrice: number;
  currency: string;
  marketValue: number;
}

export type FetchAssetsResult =
  | { ok: true; assets: FetchedAsset[] }
  | {
      ok: false;
      reason: "NEED_2FA" | "NEED_CAPTCHA" | "INVALID_CREDENTIALS" | "PLATFORM_CHANGED";
      metadata?: Record<string, unknown>;
    };

export interface DailyAssets {
  date: string;
  assets: FetchedAsset[];
}

export type FetchHistoryResult =
  | { ok: true; history: DailyAssets[] }
  | {
      ok: false;
      reason: "NOT_SUPPORTED" | "NEED_2FA" | "INVALID_CREDENTIALS" | string;
    };

export interface IPlatformAdapter {
  platform: PlatformType;
  name: string;
  fetchAssets(credentials: Record<string, unknown>): Promise<FetchAssetsResult>;
  fetchHistory?(credentials: Record<string, unknown>): Promise<FetchHistoryResult>;
  validateCredentials?(credentials: Record<string, unknown>): Promise<boolean>;
  submitChallenge?(sessionId: string, challengeResponse: string): Promise<FetchAssetsResult>;
}
