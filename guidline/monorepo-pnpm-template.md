# pnpm TypeScript Monorepo Template

> 可直接 `git init` 使用的 **pnpm + TypeScript Monorepo 模板**，完全遵循 `monorepo-guidelines.md`。

---

## 目录结构

```text
.
├─ apps/
│  ├─ web/
│  │  ├─ src/
│  │  │  └─ main.ts
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  └─ worker/
│     ├─ src/
│     │  └─ index.ts
│     ├─ package.json
│     └─ tsconfig.json
│
├─ packages/
│  ├─ core/
│  │  ├─ src/index.ts
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  ├─ feature/
│  │  ├─ src/index.ts
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  └─ env/
│     ├─ src/index.ts
│     ├─ package.json
│     └─ tsconfig.json
│
├─ .eslintrc.cjs
├─ tsconfig.base.json
├─ vitest.workspace.ts
├─ package.json
├─ pnpm-workspace.yaml
└─ monorepo-guidelines.md
```

---

## 根配置文件

### package.json (root)

```json
{
  "name": "@cola/monorepo",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "pnpm -r dev",
    "build": "tsc -b packages/*",
    "test": "vitest",
    "lint": "eslint ."
  },
  "devDependencies": {
    "typescript": "latest",
    "tsx": "latest",
    "tsup": "latest",
    "vitest": "latest",
    "eslint": "latest",
    "@typescript-eslint/parser": "latest",
    "@typescript-eslint/eslint-plugin": "latest"
  }
}
```

---

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

### tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true
  }
}
```

---

## Library 模板（packages/*）

### packages/core/package.json

```json
{
  "name": "@cola/core",
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --dts --format esm,cjs"
  }
}
```

### packages/core/tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true
  },
  "include": ["src"]
}
```

---

## Application 模板（apps/*）

### apps/web/package.json

```json
{
  "name": "@cola/web",
  "private": true,
  "type": "module",
  "dependencies": {
    "@cola/core": "workspace:*",
    "@cola/env": "workspace:*"
  },
  "scripts": {
    "dev": "tsx src/main.ts",
    "build": "tsx src/main.ts"
  }
}
```

### apps/web/tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src"]
}
```

---

## 环境变量包示例（@cola/env）

```ts
import { z } from "zod"

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().default(3000)
})

export const env = schema.parse(process.env)
```

---

## 使用方式

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
```

---

## 建议

- 新包一律从 `packages/core` 模板复制
- 新应用一律从 `apps/web` 模板复制
- 所有结构调整建议同步更新 `monorepo-guidelines.md`

---

> 这是一个**可以长期存活的起点**，而不是一次性 demo。
