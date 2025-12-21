# Database Package

本模块管理项目的数据库 Schema、迁移历史以及 Prisma Client。

## 常用开发流程 (Workflow)

当你需要修改数据库结构时，请遵循以下标准流程：

1. **修改 Schema**
   编辑 `packages/db/schema.prisma` 文件，根据需求新增表、字段或修改关联关系。

2. **生成并执行迁移**
   在 `packages/db` 目录下运行以下命令：
   ```bash
   npx prisma migrate dev --name <migration_name>
   ```
   *   `<migration_name>`: 用简短的英文描述本次变更，例如 `add_user_profile` 或 `update_post_status`。
   *   **作用**：
        1.  Prisma 会自动比对 schema 变化。
        2.  在 `migrations/` 目录下生成一个新的 SQL 迁移文件。
        3.  自动在本地数据库执行该 SQL，更新数据库结构。
        4.  重新生成 `@prisma/client` 类型定义。

3. **提交代码**
   生成的 `migrations/` 目录下的 SQL 文件需要提交到版本控制系统 (Git)。这确保了团队成员和生产环境的数据库结构一致性。

## 核心概念说明

### Migration 文件
`migrations/` 目录下的 SQL 文件是数据库的**版本控制记录**。
*   **不要手动修改**这些生成的 SQL 文件。
*   它们保证了在任何新机器或生产环境中，都能重现出完全一致的数据库结构。

## 常用命令速查

| 命令 | 说明 |
| --- | --- |
| `npx prisma migrate dev` | **开发常用**：生成迁移并应用到数据库 |
| `npx prisma migrate reset` | 重置开发数据库（**警告**：会删除所有数据并重新执行所有迁移） |
| `npx prisma migrate deploy` | **生产/CI环境**：仅应用迁移，不生成新文件 |
| `npx prisma studio` | 打开浏览器 GUI 查看和编辑数据库数据 |
| `npx prisma generate` | 仅重新生成 TypeScript 类型定义 (client)，通常在 `npm install` 后自动运行 |
