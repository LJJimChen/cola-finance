# 资产管理系统需求（中文）

## 1. 背景与目标

- 本系统用于聚合用户在不同资产平台的持仓数据，统一计算资产收益，按分类与币种展示资产结构，并辅助用户进行“按分类维度”的资产配置再平衡决策。
- 设计目标：Mobile-first、响应式；支持 PWA；支持中英文切换；以数据驱动为核心（数据库 Schema 关键）。
- UI 界面请参考 br/ui/designs

## 2. 范围与非范围

### 范围（Scope）

- 多平台（broker）资产数据聚合展示（数据以 mock 方式提供）
- 统一资产数据结构入库
- 资产/组合收益与走势图
- 资产分类与占比展示（含预设分类与自定义分类）
- 按“分类”维度的目标占比设定与偏离度计算、再平衡建议（不执行交易）
- 币种展示切换（CNY/USD/HKD 等，详见币种模型）
- 中英文 i18n

### 非范围（Out of Scope）

- broker 连接、broker 数据采集/聚合链路（本项目不实现，使用 mock data）

## 3. 系统形态与架构原则

- 架构：Web App（PWA）+ BFF + Serverless
- API 边界：BFF 是前端唯一可访问的 API 边界
- 数据权威：数据库是所有“金融事实与状态/结果”的唯一权威来源

### 预计算策略（关键原则）

- 必须预计算并落库：金融事实（例如组合总资产、日收益、累计收益等）
- 不预计算/不落库：展示偏好（例如展示币种换算结果），在请求时由 BFF 计算并返回 View Model
- 持久化基准币种：所有组合历史与聚合结果只存 CNY（RMB）

## 4. 核心数据实体（Key Entities）

- User：包含语言偏好、主题设置、展示币种偏好等
- Asset：单个持仓（Asset Position），非交易流水；字段包括 symbol、name、quantity、cost_basis（broker 提供的平均成本）、daily_profit（broker 提供的单资产日盈亏）、current_price、currency、broker_source
- Category：资产分类；字段包括 name、target_allocation_percentage、current_allocation_percentage
- Portfolio：用户的资产与分类集合
- PortfolioHistory：权威的组合快照；字段包括 timestamp(UTC)、total_value_cny、daily_profit_cny、current_total_profit_cny（只存 CNY）
- ExchangeRate：汇率历史事实；字段包括 date、from_currency、to_currency(固定 CNY)、rate_value；按“天”存储并永久保留

## 5. 币种与汇率模型（最终约束）

- 落库：只存 CNY 口径的金融事实（PortfolioHistory / 聚合类结果）
- 换算：由 BFF 在请求时按需计算，不写回数据库
- 汇率：只存常见货币兑 CNY 的日汇率（例如 USD→CNY、HKD→CNY），永久保留
- 换算公式（从 CNY 显示到目标币种）
  - convertedValue = value_cny / exchangeRate[targetCurrency]

## 6. 计算与时间规则

- 日收益（组合层）：daily_profit_cny = Σ(当日所有 Asset 的 daily_profit_cny)
- 日收益率（用于累计收益计算）：ri = daily_profit_cny / previous_day_total_value_cny
- 累计收益率：(1 + r₁) × (1 + r₂) × ... × (1 + rn) - 1
- PortfolioHistory 写入频率：每天多次（例如每小时一次），以提供更及时的表现指标
- 非交易日（周末/节假日）：继续基于最近一次已知值延续计算
- 时区：内部一律使用 UTC 存储与计算；展示时转换为用户选择或账户默认时区
- 金额精度：所有金额字段保留 4 位小数

## 7. 功能需求（Functional Requirements）

- FR-001：系统必须以统一数据结构聚合多个 broker 的资产数据（以 mock data 实现）
- FR-002：系统必须基于 cost basis（平均成本）计算/展示资产收益（Asset 以 broker 提供的 cost_basis 为准）
- FR-003：系统必须在 BFF 层基于 ExchangeRate 将资产/组合数据转换为用户选择的展示币种
- FR-004：用户必须能够对资产分类（示例：美股权益/中概股权益/亚太权益/其他权益/商品/股息红利/债券等）
- FR-005：系统必须按分类计算并展示占比、收益额、收益率
- FR-006：用户必须能为各分类设置目标占比，并查看与当前占比的偏离程度
- FR-007：系统必须提供“按分类维度”的再平衡建议（不涉及具体资产与交易执行）
- FR-008：系统必须提供预设分类供用户选择
- FR-009：用户必须能够创建自定义分类并用于资产归类
- FR-010：系统必须展示总资产与收益的历史趋势（走势图）
- FR-011：系统必须支持中英文切换；i18n 文案以增量方式加入 JSON
- FR-012：系统必须按天存储主流币种兑 CNY 的汇率，并永久保留
- FR-013：系统必须提供移动端友好的响应式设计（mobile-first）
- FR-014：系统必须实现 PWA 形态
- FR-015：系统必须以 BFF 作为前端唯一 API 边界
- FR-016：数据库必须作为所有金融事实与状态的权威来源
- FR-017：由于 broker 接入不在范围内，系统必须提供 mock data 来支撑功能验证
- FR-018：系统必须实现基础页面：Welcome / Login / Sign up / Dashboard / Portfolio / Analysis / Rebalance / Notification / Settings
- FR-019：Settings 必须支持主题选择与展示币种偏好设置
- FR-020：系统必须适配不同屏幕尺寸的响应式布局
- FR-021：系统必须存储日收益以支持累计收益统计（按“当日所有 Asset 的日收益相加”）
- FR-022：系统必须按乘积公式计算累计收益率（基于日收益率序列）
- FR-023：系统必须多次/天写入组合快照（例如每小时）
- FR-024：系统必须在周末/节假日延续收益计算（基于最后已知值）
- FR-025：系统必须内部统一使用 UTC 存储所有时间戳
- FR-026：系统必须在展示层将 UTC 转换为用户时区
- FR-027：系统必须仅在 PortfolioHistory 中落库 CNY 基础字段以优化性能
- FR-028：系统必须多次/天更新组合快照以反映资产价值变化
- FR-029：PortfolioHistory 必须包含 total_value_cny / daily_profit_cny / current_total_profit_cny
- FR-030：系统必须以 4 位小数存储金额
- FR-031：Asset 必须包含 broker 提供的单资产 daily_profit（不由系统推导）
- FR-032：Asset 必须存 cost_basis 与 daily_profit，替代 purchase price
- FR-033：Asset 表达的是当前持仓状态（Asset Position）
- FR-034：系统必须区分资产日盈亏（Asset.daily_profit）与组合日盈亏（PortfolioHistory.daily_profit_cny）
- FR-035：cost_basis 来源于 broker 数据，含义为该持仓的平均取得成本
- FR-036：PortfolioHistory 存 dailyProfit（daily_profit_cny），不使用 daily_return_rate/dailyReturn
- FR-037：PortfolioHistory 所有值必须为 CNY
- FR-038：系统不得落库任何展示币种的换算值；换算仅在 BFF 按需计算

## 8. 页面与核心展示内容（最小集合）

- Welcome：产品引导/入口
- Login / Sign up：基础登录注册（具体认证方式可后续细化）
- Dashboard（P1）：总资产、日收益、年收益、收益率走势图、资产分类占比图
- Portfolio（P1）：总资产、分类列表、分类下持仓明细
- Analysis：风险收益分析/绩效指标（可先做占位与基础指标）
- Rebalance（P2）：目标占比设置、偏离度、再平衡建议（分类维度）
- Notification：消息通知中心（可先做结构与占位）
- Settings（P1）：主题、展示币种、语言切换

## 9. 关键用户故事与验收场景（摘取 P1/P2）

### US-1 Dashboard（P1）

- Given 已登录且有组合数据；When 进入 Dashboard；Then 展示总资产、日收益、年收益、图表与分类占比
- Given 存在多币种资产；When 在 Settings 选择展示币种；Then Dashboard 数值按所选币种展示（由 BFF 换算）

### US-2 Portfolio（P1）

- Given 有组合数据；When 进入 Portfolio；Then 按分类展示占比、收益额、收益率与持仓列表

### US-3 Rebalance（P2）

- Given 有分类与当前占比；When 设置目标占比；Then 计算偏离度并展示
- Given 存在偏离；When 查看建议；Then 给出分类层面的调仓方向/金额建议（不执行交易）

### US-4 Currency（P2）

- Given 有汇率数据；When 切换展示币种；Then 换算准确到 4 位小数

### US-7 多语言（P1）

- Given 支持中英文；When 切换语言；Then 全站界面无需刷新即可在 1 秒内完成切换

## 10. 边界情况（Edge Cases）期望处理

- 缺失汇率：降级展示（提示不可换算、使用缓存/静态数据等）
- 资产为 0 或负值：可展示并确保计算不崩溃（偏离度/占比计算需定义零分母处理）
- 再平衡时现金不足：提示无法完全达成目标，仍可给出理论建议
- 数据量极大：保证 UI 仍可响应（见成功标准）
- 来自不同 broker 的数据不一致：以统一 schema 入库，必要时标记数据异常并提示
- i18n 缺失：展示兜底文案/Key，不阻塞页面渲染

## 11. 非功能性需求与成功标准（Success Criteria）

- SC-001：Dashboard 首屏关键指标 3 秒内加载完成
- SC-002：单用户至少支持 10,000 个资产仍保持 UI 响应
- SC-003：换算精度 4 位小数准确
- SC-004：95% 用户首次登录 2 分钟内能找到并查看 Portfolio 与占比
- SC-005：再平衡建议 5 秒内计算并展示
- SC-006：中英文切换 1 秒内完成且无需刷新
- SC-007：移动端可用屏宽 320px–768px
- SC-008：Dashboard/Portfolio 可用性 99.5%
- SC-009：自定义分类创建与分配成功率 95%
- SC-010：历史图表支持 1 天到 10 年区间
- SC-011：日收益计算与存储准确性 99.9%
- SC-012：累计收益公式计算数学准确性 99.9%
- SC-013：市场时段至少按小时更新，系统可用性 99.5%
- SC-014：非交易日收益计算连续性与一致性满足要求
- SC-015：UTC 内部一致性 100%，展示时区转换正确
