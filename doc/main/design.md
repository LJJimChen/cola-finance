# 资产管理系统 (Cola Finance) 技术架构与详细设计

| 文档版本 | 修改日期 | 修改人 | 备注 |
| :--- | :--- | :--- | :--- |
| v2.8 | 2025-12-20 | AI Assistant | 设计爬虫方式登录的双重验证码与异常处理流程 |
| v2.7 | 2025-12-20 | AI Assistant | 补全数据模型（分类/汇率/再平衡）与相关接口 |
| v2.6 | 2025-12-20 | AI Assistant | 新增前端架构与交互实现章节，完善 API 设计 |
| v2.5 | 2025-12-19 | AI Assistant | 新增 PWA 技术选型与 manifest 配置 |
| v2.4 | 2025-12-19 | AI Assistant | 新增家庭组 (Family Group)、消息通知与注册流程设计 |
| v2.3 | 2025-12-19 | AI Assistant | 重构爬虫模块为适配器模式 (Platform Adapters)，增加 Mock 平台设计 |
| v2.2 | 2025-12-06 | AI Assistant | 新增多用户支持、独立爬虫包、每日快照覆盖策略 |
| v2.1 | 2025-12-06 | AI Assistant | 基于 PRD v2.0 细化数据模型、接口定义与核心算法 |

## 1. 架构总览 (Architecture Overview)

### 1.1 设计原则
- **Local-First & Privacy**: 数据完全私有化，数据库 (SQLite/PostgreSQL) 部署在本地。
- **Multi-User Isolation**: 支持家庭多用户，数据逻辑隔离 (Row-Level Security 思想)。
- **Adapter-Based**: 数据获取逻辑封装为独立适配器包，与核心业务解耦，支持 API/Mock/Crawler 多种模式。
- **Snapshot Consistency**: 每日保留一份最新快照，支持历史走势回溯。
- **Collaborative**: 支持家庭组 (Family Group) 数据聚合与共享。

### 1.2 技术栈
- **Frontend**: `Next.js 14+`, `Recharts` (走势图), `Zustand`, `shadcn/ui`, `react-query`.
- **Admin**: `Vite`, `React`, `Refine`, `Chakra UI` (独立 SPA).
- **PWA**: `next-pwa` (Plugin), `manifest.json` (Web App Manifest).
- **Backend**: `NestJS`, `Prisma ORM`.
- **Monorepo**:
  - `apps/web`: C端前台应用
  - `apps/admin`: [NEW] 管理后台应用
  - `apps/api`: 后端 API 服务
  - `packages/platform-adapters`: 平台数据适配器模块
  - `packages/db`: 数据库 Schema 与 Client

### 1.3 系统拓扑

```mermaid
flowchart TB
  subgraph Client [C-End User]
    Web[apps/web (Next.js)]
  end

  subgraph Admin [Admin User]
    Console[apps/admin (Vite + Refine)]
  end

  subgraph Server [NestJS Backend]
    API[API Gateway]
    AuthGuard[User Guard]
    AdminGuard[Admin Guard]
    
    subgraph CoreServices [Core Domain]
      AuthSvc[AuthService]
      AssetSvc[AssetService]
      SnapshotSvc[SnapshotService]
      GroupSvc[FamilyGroupService]
    end

    subgraph InfraServices [Infrastructure]
      NotifySvc[NotificationService]
      JobSvc[JobService]
    end
  end

  subgraph Libs [Packages]
    AdapterLib[packages/platform-adapters]
  end

  subgraph Data [Storage]
    DB[(PostgreSQL)]
  end

  Web <-->|/api/*| API
  Console <-->|/admin/*| API
  
  API --> AuthGuard & AdminGuard
  AuthGuard --> CoreServices
  AdminGuard --> CoreServices

  CoreServices --> InfraServices
  InfraServices --> AdapterLib
  AdapterLib -->|API/Mock/Http| External[External Platforms]
  CoreServices --> DB
```

---

## 2. 详细数据模型 (Data Model)

### 2.1 用户与账户

```prisma
// 用户
model AppUser {
  id          String    @id @default(uuid())
  username    String    @unique
  password    String    // bcrypt hash
  email       String?   // optional for notification
  timezone    String    @default("Asia/Shanghai")
  createdAt   DateTime  @default(now())

  accounts    PlatformAccount[]
  snapshots   DailySnapshot[]
  memberships GroupMember[]
  notifications UserNotification[]
}

// 账户 (PlatformAccount) - 存储各平台凭证
model PlatformAccount {
  id          String   @id @default(uuid())
  userId      String   // 关联用户
  platform    PlatformType
  name        String
  credentials String?  // 加密存储的 API Key / Token
  status      String

  user        AppUser     @relation(fields: [userId], references: [id])
  assets      AssetPosition[]
}

enum PlatformType {
  EASTMONEY // 东方财富
  TIANTIAN  // 天天基金
  XUEQIU    // 雪球
  IBKR      // 盈透证券
  SCHWAB    // 嘉信理财 [NEW]
  MOCK      // 模拟
  OTHER
}
```

### 2.2 家庭组与协作 (Family Group)

```prisma
// 家庭组/投资组
model FamilyGroup {
  id          String    @id @default(uuid())
  name        String
  creatorId   String
  createdAt   DateTime  @default(now())

  members     GroupMember[]
}

// 组合分享配置 (Portfolio Share)
model PortfolioShareConfig {
  id          String    @id @default(uuid())
  userId      String    @unique
  isEnabled   Boolean   @default(false)
  shareToken  String    @unique @default(uuid()) // 用于生成公开链接
  
  // 可选配置：是否展示具体持仓标的 (默认展示，若 false 则只展示大类分布)
  showHoldings Boolean  @default(true)
  
  updatedAt   DateTime  @updatedAt
  
  user        AppUser      @relation(fields: [userId], references: [id])
}

// 组成员关联
model GroupMember {
  id          String    @id @default(uuid())
  groupId     String
  userId      String
  role        GroupRole @default(MEMBER) // OWNER, MEMBER
  joinedAt    DateTime  @default(now())

  group       FamilyGroup @relation(fields: [groupId], references: [id])
  user        AppUser        @relation(fields: [userId], references: [id])

  @@unique([groupId, userId])
}

enum GroupRole {
  OWNER
  MEMBER
}
```

### 2.3 消息通知 (Notification)

```prisma
model UserNotification {
  id          String    @id @default(uuid())
  userId      String    // 接收人
  type        NotifyType
  title       String
  content     String
  payload     Json?     // 携带额外数据 (如 groupId, inviterId)
  isRead      Boolean   @default(false)
  createdAt   DateTime  @default(now())

  user        AppUser      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum NotifyType {
  INVITATION  // 邀请加入
  SYSTEM      // 系统通知
  ALERT       // 资产预警
}
```

### 2.4 每日快照 (Daily Snapshot)

```prisma
// 全局快照 (DailySnapshot)
model DailySnapshot {
  id          String   @id @default(uuid())
  userId      String
  
  // 业务日期: YYYY-MM-DD
  date        String   
  timestamp   DateTime @default(now())

  totalValue  Decimal  
  dayProfit   Decimal  
  totalProfit Decimal  
  
  status      String   
  
  holdings    AssetPosition[]
  user        AppUser     @relation(fields: [userId], references: [id])

  @@unique([userId, date])
  @@index([date])
}

// 持仓快照 (AssetPosition)
model AssetPosition {
  id            String   @id @default(uuid())
  snapshotId    String
  accountId     String
  
  symbol        String
  quantity      Decimal
  price         Decimal
  costPrice     Decimal
  marketValue   Decimal
  dayProfit     Decimal
  
  snapshot      DailySnapshot @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  account       PlatformAccount  @relation(fields: [accountId], references: [id])
}

// 汇率缓存 (Exchange Rate)
model CurrencyRate {
  id          String   @id @default(uuid())
  from        String   // e.g. "USD"
  to          String   // e.g. "CNY"
  rate        Decimal
  updatedAt   DateTime @updatedAt

  @@unique([from, to])
}

// 资产自定义分类 (AssetCategory)
model AssetCategory {
  id          String   @id @default(uuid())
  userId      String
  symbol      String   // 资产代码
  category    String   // 用户手动指定的分类，如 "Equity", "Bond"
  
  user        AppUser     @relation(fields: [userId], references: [id])
  @@unique([userId, symbol])
}

// 再平衡配置 (AllocationConfig)
model AllocationConfig {
  id          String   @id @default(uuid())
  userId      String
  category    String   // 资产大类，如 "Equity-US", "Bond-CN"
  percentage  Decimal  // 目标占比 (0-100)
  
  user        AppUser     @relation(fields: [userId], references: [id])
  @@unique([userId, category])
}
```

---

## 3. 核心模块与算法 (Core Logic)

### 3.1 平台适配器封装 (`packages/platform-adapters`)

为了支持未来方便地扩展更多交易平台（如嘉信理财、富途牛牛等），系统采用**适配器模式 (Adapter Pattern)**。

#### 3.1.1 统一接口定义
所有适配器必须实现 `IPlatformAdapter` 接口，确保上层业务对具体平台无感知。

```typescript
export interface FetchedAsset {
  symbol: string;      // 资产代码 (e.g., "AAPL", "000001")
  name: string;        // 资产名称
  quantity: number;    // 持有数量
  price: number;       // 当前单价
  costPrice: number;   // 成本单价
  currency: string;    // 原始币种 (USD, CNY, HKD)
  marketValue: number; // 市值
}

export interface IPlatformAdapter {
  platform: PlatformType; // 平台标识
  name: string;           // 平台显示名称

  // 核心方法：获取最新持仓
  fetchAssets(credentials: Record<string, any>): Promise<FetchedAsset[]>;
  
  // 可选方法：校验凭证有效性
  validateCredentials?(credentials: Record<string, any>): Promise<boolean>;
}
```

#### 3.1.3 爬虫登录与双重验证码 (Crawler + 2FA)

对于采用网页爬取方式的适配器，需要额外处理登录态维持、验证码以及双重验证等问题。为此在逻辑上引入会话与挑战 (Challenge) 的概念：

- **Crawler 会话状态**：
  - 适配器内部维护与目标平台的登录会话，仅在会话有效期内复用 Cookie / Token。
  - 会话失效时，适配器返回结构化错误，标记为“需要重新认证”，而不是在内部无限重试。
- **挑战 / 验证类型**：
  - `PASSWORD_ONLY`：仅需用户名/密码。
  - `PASSWORD_AND_2FA`：需要密码 + 短信验证码/OTP 等二次验证码。
  - `CAPTCHA`：需要用户或后端完成图形/滑块验证码。

在接口层面，可以使用结果包装类型来表达这些状态（示意）：

```typescript
export type FetchAssetsResult =
  | { ok: true; assets: FetchedAsset[] }
  | { ok: false; reason: "NEED_2FA" | "NEED_CAPTCHA" | "INVALID_CREDENTIALS" | "PLATFORM_CHANGED"; metadata?: any };

export interface IPlatformAdapter {
  platform: PlatformType;
  name: string;
  fetchAssets(credentials: Record<string, any>): Promise<FetchAssetsResult>;
  validateCredentials?(credentials: Record<string, any>): Promise<boolean>;
}
```

当返回 `ok: false, reason: "NEED_2FA"` 时：

- 后端不再继续尝试爬取，而是将对应 `PlatformAccount` 的状态更新为“需要二次验证”，并通过业务服务返回给前端。
- 前端在设置页的账户卡片上展示“需要验证”的状态，提供“重新验证”入口，用户点击后进入专门的二次验证码输入流程。

当返回 `ok: false, reason: "NEED_CAPTCHA"` 时：

- 若平台允许在无验证码模式下获取部分非敏感数据，可降级为“仅展示上次快照 + 部分静态信息”。
- 若必须完成验证码才能登录，则同样将状态标记为“需要用户验证”，由前端提示用户稍后重试或在 Desktop 环境下手动完成验证。

二次验证码 (2FA) 的处理原则：

- 仅在认证流程中短暂保留验证码输入，不在数据库中持久化存储。
- 尽量利用平台的“记住设备”能力，减少用户频繁输入验证码的次数，但一旦会话过期必须重新认证。

#### 3.1.2 适配器注册与工厂
使用工厂模式管理适配器，新增平台只需注册一个新的 Class，无需修改核心调用逻辑。

```typescript
export class AdapterFactory {
  private static adapters = new Map<PlatformType, IPlatformAdapter>();

  static register(adapter: IPlatformAdapter) {
    this.adapters.set(adapter.platform, adapter);
  }

  static getAdapter(type: PlatformType): IPlatformAdapter {
    const adapter = this.adapters.get(type);
    if (!adapter) throw new Error(`Adapter for ${type} not found`);
    return adapter;
  }
}

// 注册示例 (在应用启动时执行)
AdapterFactory.register(new EastMoneyAdapter());
AdapterFactory.register(new IBKRAdapter());
AdapterFactory.register(new SchwabAdapter()); // 新增平台只需在此添加
```

### 3.2 每日快照覆盖策略 (SnapshotService)

系统强制执行“每日一快照”原则，确保历史趋势图的数据点均匀且唯一。

#### 3.2.1 覆盖逻辑 (Upsert Logic)
利用数据库的 Unique Constraint (`[userId, date]`) 和 Prisma 的事务机制。

```typescript
async function saveDailySnapshot(userId: string, data: FetchedAsset[]) {
  const user = await db.appUser.findUnique({ where: { id: userId } });
  // 根据用户时区确定“今天”的日期字符串 (e.g., "2025-12-20")
  const today = format(new Date(), 'yyyy-MM-dd', { timeZone: user.timezone });

  await db.$transaction(async (tx) => {
    // 1. 查找今日是否已存在快照
    const existing = await tx.dailySnapshot.findUnique({
      where: { userId_date: { userId, date: today } }
    });

    if (existing) {
      // 2. 存在则清理旧持仓数据
      await tx.assetPosition.deleteMany({ where: { snapshotId: existing.id } });
      
      // 3. 更新快照元数据
      await tx.dailySnapshot.update({
        where: { id: existing.id },
        data: {
          timestamp: new Date(),
          totalValue: sum(data.marketValue),
          holdings: { create: data.map(toAssetPositionModel) }
        }
      });
    } else {
      // 4. 不存在则新建
      await tx.dailySnapshot.create({
        data: {
          userId,
          date: today,
          totalValue: sum(data.marketValue),
          holdings: { create: data.map(toAssetPositionModel) }
        }
      });
    }
  });
}
```

### 3.3 家庭组数据聚合 (FamilyGroupService)

**聚合逻辑**:
当请求家庭组数据看板时，不实时拉取各成员的最新数据，而是**基于已生成的每日快照 (`DailySnapshot`) 进行聚合**。

1.  **获取成员**: 查询 `GroupMember` 获取所有 `userId`。
2.  **获取快照**: 查询所有成员在指定日期范围内的 `DailySnapshot`。
3.  **计算聚合值**:
    - `GroupTotalAsset(date) = Sum(Member_i.DailySnapshot(date).totalValue)`
    - `GroupDayProfit(date) = Sum(Member_i.DailySnapshot(date).dayProfit)`
    - `GroupTotalProfit(date) = Sum(Member_i.DailySnapshot(date).totalProfit)`
4.  **聚合收益率**:
    - 使用聚合后的每日总资产与收益流重新计算 TWR，确保数学意义正确。

---

## 4. 接口设计 (API Specification)

### 4.1 用户与授权 (Auth)
- `POST /auth/register`: 注册 (username, password)
- `POST /auth/login`: 登录 -> 返回 JWT

### 4.2 家庭组管理 (Group)
- `POST /groups`: 创建组
- `POST /groups/:id/invite`: 邀请用户 (param: username) -> 生成 `Notification`
- `GET /groups/:id/members`: 成员列表
- `GET /groups/:id/dashboard`: 聚合看板数据 (Assets, Profits, Trends)

### 4.3 消息中心 (Notification)
- `GET /notifications`: 列表
- `POST /notifications/:id/read`: 标为已读
- `POST /notifications/:id/accept`: 接受邀请 -> 插入 `GroupMember`

### 4.4 历史走势 (Trend)
- `GET /api/v1/history/trend?range=...`
  - **Params**:
    - `range`: `1M` | `3M` | `6M` | `1Y` | `2Y` | `3Y` | `5Y` | `10Y` | `ALL`
- `GET /api/v1/groups/:id/trend?range=...`: (家庭组聚合，参数同上)
- **Frontend Strategy**:
  - 使用 `Zustand` + `persist middleware` 或 `localStorage` 存储用户选择的 `trendRange`，作为默认值。

### 4.5 组合分享 (Portfolio Share) [NEW]
- `GET /api/v1/share/config`: 获取当前分享配置
- `POST /api/v1/share/config`: 更新配置 (开启/关闭, 刷新 Token)
- `GET /api/v1/share/:token`: 公开访问接口
  - **Auth**: 无需登录
  - **Response**: 
    - 用户昵称
    - 资产分布 (Pie Chart Data: { category, percentage })
    - 持仓列表 (仅 Symbol, Name, Percentage; **隐去 Quantity, Price, MarketValue**)

### 4.6 核心看板接口 (Dashboard & Portfolio) [UPD]
- `GET /api/v1/dashboard/summary`
  - **Response**: 总资产, 当日收益, 累计收益, 最新快照时间
- `GET /api/v1/assets`
  - **Params**: `groupBy` (platform/account/category), `filter`
  - **Response**: 扁平化的 AssetPosition 列表，建议前端进行分组处理以提升交互响应速度。
- `POST /api/v1/assets/:symbol/classify`
  - **Body**: `{ category: string }`
  - **Desc**: 手动修正资产分类 (Upsert AssetCategory)。

### 4.8 爬虫认证与二次验证接口 (Crawler Auth & 2FA) [NEW]

为支持网页爬取方式下的多步登录流程，后端需要暴露专门的认证接口，与前端的交互契约如下：

- `POST /api/v1/accounts/:id/crawler/login`
  - **Desc**: 使用用户名/密码触发登录流程，后端调用对应适配器。
  - **Response**：
    - 登录成功：返回当前连接状态，前端更新为 `Connected`。
    - 需要二次验证：返回 `{ status: "NEED_2FA", challengeId, expiresAt }`，前端弹出 2FA 输入对话框。
- `POST /api/v1/accounts/:id/crawler/2fa`
  - **Body**: `{ challengeId: string, code: string }`
  - **Desc**: 提交短信验证码/动态口令等二次验证码，完成后端登录流程并更新会话。
  - **Response**：返回新的连接状态（成功/失败/验证码错误）。
- `GET /api/v1/accounts/:id/status`
  - **Desc**: 查询当前账户连接状态（包括是否需要 2FA、会话是否失效等），用于前端在设置页展示“需要验证”提示。

### 4.7 分析与再平衡接口 (Analysis & Rebalance) [NEW]
- `GET /api/v1/analysis/rebalance`
  - **Response**: 
    - `totalAssets`: Decimal
    - `targets`: { category, targetPercent, currentPercent, deltaValue }[]
    - `actions`: { action: "BUY"|"SELL", category, amount }[]
- `POST /api/v1/analysis/targets`
  - **Body**: `{ targets: { category: string, percentage: number }[] }`
  - **Desc**: 批量更新用户的目标配置。

---

## 5. 前端架构与交互实现 (Frontend Architecture)

### 5.1 路由与页面结构 (App Router)
基于 Next.js 14 App Router 构建，严格映射 PRD 的导航结构。

```text
apps/web/src/app/
├── (main)/                 # 主应用布局 (Sidebar/TabBar)
│   ├── dashboard/          # [Page] 首页
│   ├── portfolio/          # [Page] 持仓明细
│   ├── analysis/           # [Page] 历史与再平衡
│   ├── family/             # [Page] 家庭组
│   └── settings/           # [Page] 设置
├── (auth)/                 # 认证布局 (无导航栏)
│   ├── login/              # [Page] 登录
│   └── register/           # [Page] 注册
├── api/                    # Next.js Route Handlers (BFF层)
└── layout.tsx              # Root Layout (Providers)
```

### 5.2 状态管理 (State Management)
使用 `Zustand` 进行轻量级状态管理，配合 `persist` 中间件实现本地偏好记忆。

- **`useUserStore`**: 存储 UserInfo, Token, FamilyGroupInfo。
- **`useAssetStore`**: 存储最新的 AssetPositions, DailySnapshots (用于缓存，避免频繁请求)。
- **`useSettingsStore`**: 
  - `currency`: 基准货币 (CNY/USD)。
  - `privacyMode`: 是否隐藏金额 (Boolean)。
  - `theme`: 主题偏好 (System/Light/Dark)。
  - `trendRange`: 走势图默认时间范围。

### 5.3 UI/UX 技术落地
遵循 PRD "简洁、清晰" 的设计原则。

- **组件库 (UI Library)**: 
  - 采用 **Shadcn/UI** (基于 Radix UI + Tailwind CSS)。
  - **优势**: 源码级拷贝，方便深度定制样式，去除冗余设计，符合“简洁”要求。
- **样式系统**: `Tailwind CSS`。
- **图表库**: `Recharts` (高度可定制，适合 React)。
- **交互反馈**:
  - **Skeleton**: 封装 `<Skeleton />` 组件，在数据加载 (`React Query` 的 `isLoading`) 时替代 Loading Spinner。
  - **Toast**: 使用 `Sonner` 提供优雅的成功/错误提示。
- **响应式布局策略**:
  - **Layout**: 使用 `md:flex-row` (PC侧边栏) vs `flex-col-reverse` (Mobile底部栏) 实现布局切换。
  - **View**: Portfolio 页面根据 `useMediaQuery` 决定渲染 `<DataTable />` (PC) 还是 `<AssetCardList />` (Mobile)。

### 5.4 PWA 配置细节
- **Manifest**: 
  - `display: "standalone"`
  - `background_color`: 跟随亮/暗色主题。
  - `shortcuts`: 提供 "Add Asset", "Check Trend" 等快捷入口。
- **Service Worker**: 使用 `next-pwa` 默认配置，缓存静态资源 (JS/CSS/Icons)，API 请求暂不缓存以保证数据实时性。

---

## 6. 工程结构更新

```text
cola-finance/
├── apps/
│   ├── web/
│   │   ├── public/
│   │   │   ├── manifest.json    # [NEW] PWA Manifest
│   │   │   └── icons/           # [NEW] PWA Icons
│   │   ├── next.config.js       # [UPD] next-pwa config
│   │   └── ...
│   └── api/
│       ├── src/
│       │   ├── auth/            # [NEW]
│       │   ├── family-group/    # [NEW]
│       │   ├── notification/    # [NEW]
│       │   └── ...
├── packages/
│   ├── platform-adapters/
│   ├── db/
│   └── shared/
└── ...
```
