# Cola Finance 开发任务列表 (Task List)

> 依据 `doc/main/prd.md` 与 `doc/main/design.md` 整理  
> 面向 Monorepo：`apps/web`, `apps/api`, `apps/admin`, `packages/*`

---

## 0. 技术栈概览 (Tech Stack)

- 前端 C 端 (`apps/web`)
  - `Next.js 14+` (App Router)
  - `React` + `TypeScript`
  - `shadcn/ui` + `Tailwind CSS`
  - `Recharts`（走势图与图表）
  - 状态与数据：`Zustand`、`react-query`
  - PWA：`next-pwa`、`manifest.json`
- 后端 API (`apps/api`)
  - `NestJS`
  - `Prisma ORM` + `PostgreSQL`（或兼容的本地数据库）
- 管理后台 (`apps/admin`)
  - `Vite` + `React`
  - `Refine` (Headless Admin Framework)
  - `Chakra UI`
- 共享与基础设施
  - Monorepo 管理：`pnpm` workspace
  - `packages/platform-adapters`：平台数据适配器
  - `packages/db`：Prisma Schema 与 Client
  - `packages/shared`：共享类型与工具方法

---

## M1: 核心骨架与数据链路

### 1.1 基础工程与基础设施

- [x] 初始化 Monorepo 结构与包管理
  - 创建 `apps/web`, `apps/api`, `apps/admin`, `packages/platform-adapters`, `packages/db`, `packages/shared` 目录结构
  - 配置统一的包管理（如 pnpm + workspace）与基础脚本（lint/test/build）
- [x] 搭建数据库与 Prisma
  - 选择并配置本地数据库（默认 PostgreSQL）
  - 在 `packages/db` 中定义 Prisma Schema（AppUser/PlatformAccount/DailySnapshot/AssetPosition/CurrencyRate 等）
  - 生成 Prisma Client 并在 `apps/api` 中封装数据库访问模块
- [x] 搭建 `apps/api` 基础框架 (NestJS)
  - 初始化 NestJS 应用，配置基础模块划分（auth/asset/snapshot/family-group/notification 等）
  - 接入 Prisma Module 与全局异常处理、中间件（日志、Request ID 等）

### 1.2 用户体系与认证授权 (apps/api + apps/web)

- [x] 实现 C 端用户注册/登录接口
  - 接口：`POST /auth/register`，`POST /auth/login`
  - 支持用户名/密码注册，密码使用 bcrypt 存储
  - 登录成功签发 JWT（区分用户类型字段）
- [x] 接入用户鉴权守卫
  - 在 NestJS 中实现 `AuthGuard`，校验 Authorization Header 中的 Bearer Token
  - 配置路由保护：资产、快照、家庭组等接口仅允许已登录用户访问
- [x] 前端登录/注册页面与会话管理 (apps/web)
  - 按照 App Router 结构实现 `(auth)/login` 与 `(auth)/register` 页面
  - 使用 `react-query` 发起登录请求，成功后将 Token 存入 `useUserStore`
  - 登录成功后跳转到 `dashboard`，未登录访问主路由时跳转到登录页

### 1.3 平台账户与 Mock 平台

- [x] 平台账户数据模型与接口 (apps/api)
  - 完成 `PlatformAccount` 的 CRUD 基础接口：创建、更新、删除、查询
  - 接口示例：`POST /accounts`，`GET /accounts`，`DELETE /accounts/:id`
  - 字段包含：平台类型、名称、凭证（加密保存）、状态（Connected/Error/NeedVerify 等）
- [x] 实现 Mock 平台适配器 (packages/platform-adapters)
  - 定义 `IPlatformAdapter` 与 `FetchedAsset` 接口，并实现 `MockAdapter`
  - MockAdapter 自动生成若干持仓数据与价格波动逻辑
  - 在 `AdapterFactory` 中注册 Mock 平台
- [x] 平台账户前端管理页面 (apps/web)
  - 在 `Settings` 页面实现平台卡片列表，展示连接状态与上次更新时间
  - 实现新增/编辑 Mock 平台账户的表单弹窗，与后端接口打通

### 1.4 每日快照与基础看板

- [x] 实现每日快照生成逻辑 (SnapshotService)
  - 根据用户时区计算业务日期 (Business Date)
  - 调用适配器生成 FetchedAsset 数组，计算总资产、日收益、累计收益
  - 按 `[userId, date]` 唯一键进行 Upsert，覆盖当日旧快照与旧持仓
- [x] 实现 Dashboard 汇总接口
  - `GET /api/v1/dashboard/summary`：返回总资产、当日收益、累计收益、最近快照时间
  - `GET /api/v1/assets`：返回当前持仓列表，支持按平台/账户/分类分组的参数
- [x] 前端 Dashboard 页面骨架
  - 使用 `shadcn/ui` + `Recharts` 实现基础的 Dashboard 布局
  - 显示关键指标卡（总资产、当日收益、累计收益）
  - 接口联通后能展示真实 Mock 数据

---

## M2: 家庭组、消息中心与多用户协作

### 2.1 家庭组数据模型与接口 (apps/api)

- [x] 实现 FamilyGroup 与 GroupMember 数据表
  - 按 `design.md` 中 Prisma 定义创建表与关联
  - 确保一个用户可加入多个家庭组，支持角色（OWNER/MEMBER）
- [x] 家庭组管理接口
  - `POST /groups`：创建家庭组（仅登录用户）
  - `GET /groups`：列出用户参与的家庭组
  - `GET /groups/:id/members`：成员列表
- [ ] 家庭组聚合看板接口
  - `GET /groups/:id/dashboard`：基于成员每日快照聚合总资产、日收益、累计收益
  - `GET /groups/:id/trend?range=...`：基于 DailySnapshot 计算家庭组趋势与收益率

### 2.2 消息中心与邀请流程

- [x] 实现 UserNotification 模型与基础接口
  - 数据表字段：类型（INVITATION/SYSTEM/ALERT）、标题、内容、payload、是否已读
  - 接口：`GET /notifications`，`POST /notifications/:id/read`
- [x] 邀请加入家庭组流程
  - 接口：`POST /groups/:id/invite`，传入被邀请用户名
  - 创建邀请类型的 Notification，payload 携带 groupId、inviter 信息
  - 接口：`POST /notifications/:id/accept`，接受邀请后写入 GroupMember
- [ ] 前端消息中心页面与交互 (apps/web)
  - 在 Dashboard Header 上实现消息铃铛提示，显示未读角标
  - 构建消息中心列表，可以筛选邀请/系统通知
  - 在邀请消息上实现接受/拒绝操作，与后端接口打通

### 2.3 家庭组前端页面 (apps/web)

- [ ] Family 看板页面
  - 复用 Dashboard 布局，改为展示当前选中家庭组的聚合数据
  - 显示成员头像与基本信息
- [ ] 成员管理与邀请 UI
  - 在 Family 页面提供成员列表与角色显示
  - 实现输入用户名的邀请卡片，与 `/groups/:id/invite` 接口打通

---

## M3: 历史走势、分析与再平衡

### 3.1 历史走势与收益率

- [ ] 历史趋势接口实现 (apps/api)
  - `GET /api/v1/history/trend?range=...`：根据 range 查询用户 DailySnapshot 序列
  - 计算每日资产值、当日收益、累计收益率（TWR/复利累加）
  - 支持家庭组版本：`GET /api/v1/groups/:id/trend?range=...`
- [ ] 再平衡数据模型与接口
  - 在数据库中实现 AllocationConfig，用于存储用户目标占比
  - `GET /api/v1/analysis/rebalance`：计算当前配置 vs 目标配置，输出调仓建议
  - `POST /api/v1/analysis/targets`：更新用户目标配置

### 3.2 前端 Analysis 与 Rebalance 页面 (apps/web)

- [ ] Analysis 历史走势页
  - 使用 `Recharts` 实现资产曲线与累计收益率曲线切换
  - 实现时间范围筛选：1M / 3M / 6M / 1Y / YTD / All
  - 添加 Tooltip、十字光标、区间缩放等交互
- [ ] Rebalance 页面
  - 展示目标 vs 当前占比仪表盘/条形图
  - 以 Action List 形式列出具体的“买入/卖出”金额建议
  - 提供目标配置编辑入口，与 `analysis/targets` 接口打通

---

## M4: 多平台适配、爬虫与 2FA

### 4.1 平台适配器框架完善 (packages/platform-adapters)

- [ ] 抽象统一的 `IPlatformAdapter` 接口
  - 补充错误返回结构 `FetchAssetsResult`，支持 NEED_2FA/NEED_CAPTCHA/INVALID_CREDENTIALS 等状态
  - 在 `AdapterFactory` 中实现注册与获取逻辑
- [ ] 实现 API 平台适配器（如 IBKR）
  - 封装调用官方/非公开 API 的逻辑
  - 处理币种、时区与价格精度

### 4.2 网页爬取与多步登录 (Crawler + 2FA)

- [ ] 爬虫会话与挑战状态设计
  - 在适配器内部维护会话状态与 Cookie/Token
  - 约定会话失效与挑战（密码、2FA、验证码）时的错误返回结构
- [ ] Crawler 认证与 2FA 接口 (apps/api)
  - 实现 `POST /api/v1/accounts/:id/crawler/login` 触发爬虫登录
  - 实现 `POST /api/v1/accounts/:id/crawler/2fa` 提交二次验证码
  - 实现 `GET /api/v1/accounts/:id/status` 查询连接与验证状态
- [ ] 前端爬虫配置与 2FA 流程 (apps/web)
  - 在 Settings 平台卡片中展示“需要验证”状态与重新验证按钮
  - 新增向导式多步表单：账号密码输入 -> 触发登录 -> 根据返回决定是否展示 2FA 输入
  - 2FA 对话框中展示平台名称、风险提示与验证码输入框

---

## M5: UI/UX、PWA 与国际化

### 5.1 交互与视觉实现 (apps/web)

- [ ] 完成导航结构与布局
  - PC 端：侧边栏导航，菜单项 `Dashboard/Portfolio/Analysis/Family/Settings`
  - 移动端：底部 TabBar，适配单手操作
- [ ] Dashboard 视觉细节
  - 实现问候语、刷新按钮（含 Loading 动画）、消息铃铛角标
  - 实现迷你 Sparkline 与资产分布饼图
- [ ] Portfolio 多视图与表格交互
  - 实现列表/卡片视图切换
  - 实现“平台 > 账户”与“资产类别 > 标的”两级折叠分组
  - 实现搜索与按币种/市场筛选
 - [ ] UI 风格对齐主流理财类 App
   - 整体交互和信息密度参考东方财富、天天基金、雪球等国内主流理财类 App 的持仓与行情页面

### 5.2 PWA 支持

- [ ] `manifest.json` 配置与图标资源
  - 配置名称、short_name、display=standalone、主题色、背景色
  - 提供多尺寸图标与启动图
- [ ] 接入 `next-pwa` 与 Service Worker
  - 配置静态资源缓存策略
  - 实现基础离线 App Shell：无网络时仍能打开应用框架与最近一次快照数据

### 5.3 国际化与偏好记忆

- [ ] 前端多语言方案实现
  - 在 `apps/web` 中选型并接入 i18n（如基于 JSON 词条的简单实现）
  - 支持 English / 简体中文 UI，默认加载英文
  - 关键页面（Dashboard/Portfolio/Analysis/Family/Settings/Auth）的文案双语化
- [ ] 用户偏好存储与切换
  - 在 `useSettingsStore` 中增加 `language` 字段
  - Settings 页面提供语言切换开关，与 `language` 状态联动
  - 使用 `persist` 中间件将语言偏好、本币、主题、趋势时间范围等本地持久化

---

## M6: 管理后台 (Cola Admin)

### 6.1 Admin 基础工程 (apps/admin)

- [ ] 初始化基于 Vite + React + Refine + Chakra UI 的 Admin 应用
  - 配置基本路由与布局
  - 接入 Refine 的 Data Provider 与 Auth Provider

### 6.2 管理员认证与 RBAC

- [ ] AdminUser 模型与登录接口 (apps/api)
  - 定义 AdminUser/Role/Permission 等管理端数据表
  - 实现 `POST /admin/auth/login`，`POST /admin/auth/logout`，`GET /admin/auth/me`
- [ ] AdminGuard 与 Token 区分
  - 实现独立的 `AdminGuard`，区分 Admin Token 与 User Token
  - 仅允许 Admin Token 访问 `/admin/**` 路由

### 6.3 后台管理功能

- [ ] 用户管理页面
  - 列出 C 端用户列表，支持分页/筛选
  - 提供封禁/解封操作（调用 `/admin/users/:id/ban`）
- [ ] 系统配置页面
  - 管理抓取频率、重试策略等 SystemConfig
  - 提供简单的表单编辑与保存
- [ ] 监控与审计
  - 实现基础的审计日志查询（登录、封禁操作、配置变更）
  - 在 Admin 界面提供审计日志列表与过滤器

---

## 通用任务与质量保障

- [ ] 日志与监控
  - 在 `apps/api` 中统一接入日志组件，记录关键业务事件（登录、抓取、快照生成）
  - 为错误与异常场景定义一致的错误码与返回结构
- [ ] 错误处理与降级
  - 确保采集失败时前端能获得“数据部分过期”的状态与上次更新时间
  - 对验证码/2FA 失败采用“需要用户交互”模式，而非无限重试
- [ ] 安全与隐私
  - 确认敏感字段（密码、凭证、验证码）均未持久化明文存储
  - 针对 2FA 验证码仅在内存中短暂使用，接口层做输入校验与速率限制
- [ ] 基础测试与验证
  - 为核心服务（AuthService/AssetService/SnapshotService/FamilyGroupService）编写单元测试
  - 为关键接口编写集成测试（注册登录、Mock 数据采集、快照生成、家庭组聚合等）
