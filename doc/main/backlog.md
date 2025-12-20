# Product Backlog

## 待办事项 (To Do)

- [ ] **资产分类管理 UI**
  - 目前 `AssetCategory` 只能通过数据库操作，需要在前端 Settings 或 Portfolio 页面提供管理界面，允许用户手动修正资产分类（如将 AAPL 归类为 "Technology" 或 "Equity"）。

- [ ] **批量再平衡 (Batch Rebalance)**
  - Rebalance 页面目前仅提供聚合建议。未来可支持针对具体账户生成交易指令，甚至通过 API 自动执行（需谨慎）。

- [ ] **高级风险指标 (Advanced Metrics)**
  - 在 Analysis 页面增加 Sharpe Ratio, Volatility, Max Drawdown 等风险指标的计算与展示。

- [ ] **数据导出/导入 (Data Export/Import)**
  - 支持将 DailySnapshot 和 Transaction 导出为 CSV/Excel。
  - 支持从外部文件导入历史数据。

- [ ] **Next.js Workspace Root Warning**
  - 修复构建时关于 workspace root 的警告，确保依赖解析正确。

- [ ] **多币种深度支持**
  - 目前主要以本币（CNY/USD）展示。未来支持动态汇率转换查看不同币种视角的资产。

- [ ] **统一 API 路由前缀与前端默认 API Base**
  - `apps/web` 中默认 API Base 端口不一致（部分为 3002，Auth 为 3001），且 `/api/v1` 与非前缀接口混用；建议统一并集中封装请求入口。

- [ ] **完善 DailySnapshot 收益字段计算**
  - `SnapshotService` 当前将 `dayProfit/totalProfit` 固定写入 0，可按快照序列计算并存储，供趋势与看板复用。
