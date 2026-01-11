### Human-in-the-Loop 与 Engine 安全边界

- **Engine 不直接暴露公网的原因**
  - 负责浏览器自动化、任务调度和敏感凭证管理（Cookie / Token），直接暴露公网会增加攻击面。
  - 维护任务状态机和长生命周期任务，直接由前端操作易导致状态分散或错误。
  - 通过 BFF 可统一策略、审计操作、限流防滥用。

- **Human-in-the-Loop 场景访问流程**
  1. Engine 暂停任务，生成短期、任务绑定的 Engine Access Token。
  2. Engine 将 Token 返回给 BFF。
  3. BFF 将 Token 安全下发给前端。
  4. 前端使用 Token 访问 Engine 提供的受控浏览器界面（iframe / VNC / WebRTC）。
  5. 用户完成操作后，Engine 收到事件继续执行任务。

- **设计原则**
  - 前端不直接知道 Engine 的公网地址。
  - Engine 仅接受来自 BFF 或带有效短期 Token 的请求。
  - 所有操作可追踪、可审计。
  - 保证任务状态完整性、安全性，并避免滥用。