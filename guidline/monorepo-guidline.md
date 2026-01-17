# Monorepo Guidelines

> 一套为 **长期演进** 而设计的 TypeScript Monorepo 协作约定。
>
> 目标只有一个：**让代码库在 6 个月、2 年、3 年后依然可维护、可扩展、可协作。**

---

## 适用范围

- TypeScript / Node.js / Web / Edge 项目
- pnpm Workspaces
- 多应用（apps）+ 多共享库（packages）
- 个人或小团队的中长期维护（> 1 年）代码库

---

## 总体原则（建议遵守）

1. **边界优先于复用**：宁可多一个包，也不要模糊边界
2. **约定尽量可执行**：能由工具（TS / ESLint）强制的尽量强制
3. **默认保守**：对外 API 与依赖方向尽量收紧
4. **演进而非推翻**：允许调整，但必须可控、可回溯

---

## 目录结构约定

```text
apps/            # 最终运行的应用
  web/
  worker/

packages/        # 可被复用的库
  core/
  domain/
  feature/
  ui/
  env/
```

### 命名规则

- ✅ 使用**业务域 / 语义命名**：`auth`、`billing`、`search`
- ❌ 禁止使用技术层命名：`utils`、`helpers`、`common`

> 业务语义比技术实现更稳定。

---

## 包管理与依赖约定

### Workspaces

- 统一使用 **pnpm**
- 内部依赖建议使用 `workspace:*`

```json
"dependencies": {
  "@acme/auth": "workspace:*"
}
```

### 禁止行为

- ❌ apps 直接依赖未声明 exports 的路径（deep import）

---

## TypeScript 基线配置

### 根配置（强烈建议）

所有包必须继承根目录 `tsconfig.base.json`。

核心要求：

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `verbatimModuleSyntax: true`
- `isolatedModules: true`

> 禁止为了“图省事”而放松类型系统。

---

## Library vs Application 区分

### Library（packages/\*）

**必须满足：**

- `composite: true`
- 生成 `.d.ts`
- 不依赖运行时环境（`process.env`、`window` 等）
- Side effects 可控（默认无）

### Application（apps/\*）

**允许：**

- 运行时依赖
- 平台 API（Node / Edge / Browser）
- 不生成 `.d.ts`

```json
// apps/*/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  }
}
```

---

## TypeScript Project References

### 规则

- `packages/*` 建议启用 Project References
- 构建建议使用 `tsc -b`

```bash
tsc -b packages/*
```

### 原则

> TypeScript 是构建系统的一部分，而不仅是类型检查工具。

---

## 构建与开发工具

### 统一工具链

| 场景   | 工具      |
| ---- | ------- |
| 库构建  | tsup    |
| 本地开发 | tsx     |
| 构建调度 | pnpm -r |

```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsup src/index.ts --dts --format esm,cjs"
}
```

---

## 包导出与边界控制

### Exports 规则（建议）

- packages 建议声明 `exports`
- ❌ 尽量避免 deep import

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.mjs",
    "require": "./dist/index.cjs"
  }
}
```

---

## 依赖分层模型（架构级约定）

### 分层定义

```text
core     → domain → feature → app
ui       → feature
```

### ESLint 建议执行

- 禁止反向依赖
- 禁止循环依赖

> 架构必须存在于工具中，而不是 PPT 中。

---

## 测试约定

### 测试工具

- 统一使用 **Vitest Workspace**
- 测试与代码就近放置

```ts
// vitest.workspace.ts
export default defineWorkspace([
  { test: { include: ["packages/**/src/**/*.test.ts"] } },
  { test: { include: ["apps/**/src/**/*.test.ts"] } }
])
```

---

## 环境变量管理

### 集中定义（建议）

- 所有环境变量必须在 `@acme/env` 中定义
- 使用 Zod 校验并导出类型

```ts
export const env = schema.parse(process.env)
```

> 环境错误必须在启动时失败，而不是在生产中失败。

---

## 个人项目的最低自检

- `pnpm lint`
- `pnpm test`
- `pnpm build`

---

## 允许演进的部分

- 工具版本升级（pnpm / tsup / vitest）
- 新增包类型或分层
- 构建性能优化

**尽量不破坏的部分：**

- 依赖方向
- 导出边界

---

## 结语

> Monorepo 的失败，几乎从来不是技术问题， 而是**边界不清 + 约定不可执行**的问题。

这份规范不是为了限制个人发挥， 而是为了让整个团队在时间中持续前进。
