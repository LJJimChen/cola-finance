declare module '@prisma/client' {
  export * from '@prisma/client/scripts/default-index';

  export enum AccountStatus {
    Connected = 'Connected',
    Error = 'Error',
    NeedVerify = 'NeedVerify',
    Unauthorized = 'Unauthorized',
  }

  export enum PlatformType {
    EASTMONEY = 'EASTMONEY',
    TIANTIAN = 'TIANTIAN',
    XUEQIU = 'XUEQIU',
    IBKR = 'IBKR',
    SCHWAB = 'SCHWAB',
    MOCK = 'MOCK',
    OTHER = 'OTHER',
  }

  export enum SnapshotStatus {
    OK = 'OK',
  }

  export enum NotifyType {
    INVITATION = 'INVITATION',
    SYSTEM = 'SYSTEM',
    ALERT = 'ALERT',
  }

  export enum GroupRole {
    OWNER = 'OWNER',
    MEMBER = 'MEMBER',
  }
}
