# 📘 资产管理系统WEB and BFF Technology Stack

## Monorepo
- turbo pnpm monorepo，用于统一管理 Web、BFF及共享的 schema / types
- 仅共享纯逻辑与类型定义，不共享基础设施或运行时实现
- internal package use Just-in-Time package https://turborepo.dev/docs/core-concepts/internal-packages#just-in-time-packages

## Web (Frontend)
- Vite+React + TypeScript
- TanStack Router（File-based Routing）与 TanStack Query 作为核心应用框架
- Tailwind CSS + shadcn/ui 提供基础 UI 组件
- ky 作为 HTTP 客户端，基于 OpenAPI 生成类型安全的 API 调用
- Zustand 仅用于少量全局、非服务端状态
- 优先使用成熟的 React 最佳实践库完成通用能力，避免从零实现基础功能
- PWA
- Storybook
- MSW

## BFF (Serverless)
- Cloudflare Workers 作为运行环境
- Hono 作为 HTTP 框架，优先使用官方 middleware（鉴权、校验、错误处理等），避免自建基础功能
- Better Auth 负责用户认证与会话管理
- Drizzle ORM + Cloudflare D1 作为唯一持久化数据源
- BFF 仅承担鉴权、策略控制、任务创建与数据读取职责，不执行长生命周期任务

##   可调试
创建项目时需要为 web 和 bff 添加 vscode 的 debug config.