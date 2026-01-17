## Technology Stack

### Monorepo
- pnpm monorepo，用于统一管理 Web、BFF、Engine 及共享的 schema / types
- 仅共享纯逻辑与类型定义，不共享基础设施或运行时实现

### Web (Frontend)
- React + Vite + TypeScript
- TanStack Router（File-based Routing）与 TanStack Query 作为核心应用框架
- Tailwind CSS + shadcn/ui 提供基础 UI 组件
- ky 作为 HTTP 客户端，基于 OpenAPI 生成类型安全的 API 调用
- react-hook-form + zod 处理表单与输入校验
- Zustand 仅用于少量全局、非服务端状态
- 优先使用成熟的 React 最佳实践库完成通用能力，避免从零实现基础功能
- PWA

### BFF (Serverless)
- Cloudflare Workers 作为运行环境
- Hono 作为 HTTP 框架，优先使用官方 middleware（鉴权、校验、错误处理等），避免自建基础功能
- Better Auth 负责用户认证与会话管理
- Drizzle ORM + Cloudflare D1 作为唯一持久化数据源
- BFF 仅承担鉴权、策略控制、任务创建与数据读取职责，不执行长生命周期任务

### Engine (Stateful Service)
- Node.js 运行环境
- 轻量级 HTTP 框架（如 Fastify）作为内部 API 层
- Playwright 负责浏览器自动化与资产采集
- 使用明确的任务状态机（如 xstate）建模任务生命周期，避免隐式状态与重复实现流程控制逻辑
- 任务调度与队列能力保持可插拔设计，避免在早期阶段绑定具体实现
- 通过 Adapter 模式支持多 Broker，避免为不同平台重复实现采集逻辑
- Engine 不直接暴露给公网，仅信任由 BFF 签发的短期访问 Token