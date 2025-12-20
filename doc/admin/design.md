# 资产管理系统后台管理平台 (Cola Admin) 技术设计文档

| 文档版本 | 修改日期 | 修改人 | 备注 |
| :--- | :--- | :--- | :--- |
| v2.0 | 2025-12-20 | AI Assistant | 重构版本：Refine + Vite + Chakra UI，独立账号体系 |

## 1. 架构设计

### 1.1 系统定位
Cola Admin 是一个**独立部署**的单页应用 (SPA)，通过 REST API 与后端 (`apps/api`) 交互。它拥有独立的账号体系 (`AdminUser`)，与 C 端用户完全物理隔离，确保管理权限的安全性。

### 1.2 技术栈 (Technical Stack)
- **核心框架**: [Refine](https://refine.dev/) (Headless Admin Framework)
- **构建工具**: [Vite](https://vitejs.dev/) (极速构建)
- **UI 组件库**: [Chakra UI](https://chakra-ui.com/) (现代、可访问性优先)
- **数据通信**: Axios + Refine Simple REST Provider
- **状态管理**: React Query (Refine 内置)

### 1.3 系统拓扑 (Monorepo)
```text
cola-finance/
├── apps/
│   ├── web/          # C端前台 (Next.js)
│   ├── api/          # 后端服务 (NestJS)
│   └── admin/        # [NEW] 管理后台 (Vite + React + Refine + Chakra UI)
└── packages/         # 共享库 (Prisma Client, Types 等)
```

---

## 2. 功能模块设计

### 2.1 认证与授权 (Auth & RBAC)
- **登录页**: 独立的管理员登录界面。
- **鉴权**: 
  - 前端：Refine `AuthProvider` 负责 Token 存储与路由守卫。
  - 后端：`AdminGuard` 校验 JWT，确保 `userType === 'ADMIN'`。
- **权限控制**:
  - 基于 `AccessControlProvider` (Refine) 实现按钮级权限控制。
  - 角色：`SUPER_ADMIN` (全权), `OPERATOR` (仅查看/封禁用户, 无法修改系统配置)。

### 2.2 资源管理 (Resources)
| 资源名称 | 对应后端路径 | 功能描述 | 权限要求 |
| :--- | :--- | :--- | :--- |
| **Users** | `/admin/users` | C 端用户列表、详情、封禁操作 | `USER_READ`, `USER_MANAGE` |
| **AdminUsers** | `/admin/admin-users` | 管理员账号增删改查 | `SUPER_ADMIN` |
| **SystemConfigs** | `/admin/configs` | 系统全局配置 (如爬虫间隔) | `CONFIG_EDIT` |
| **AuditLogs** | `/admin/audit-logs` | 操作审计日志 (只读) | `LOG_READ` |

### 2.3 Dashboard
- **关键指标**:
  - 总用户数 / 今日新增
  - 总管理资产规模 (AUM)
  - 异常任务数 (爬虫失败)
- **图表**:
  - 使用 Recharts 展示资产增长趋势。

---

## 3. 数据模型 (Data Model)

为了安全和解耦，**管理员 (AdminUser)** 与 **C 端用户 (AppUser)** 使用两套完全独立的账号体系。

```prisma
// --- 管理后台专用模型 ---

// 管理员用户
model AdminUser {
  id          String   @id @default(uuid())
  username    String   @unique
  password    String   // bcrypt hash
  name        String?
  avatar      String?
  
  roleId      String
  role        AdminRole @relation(fields: [roleId], references: [id])
  
  isActive    Boolean  @default(true) // 账号状态
  lastLoginAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  auditLogs   AuditLog[]
}

// 管理员角色与权限
model AdminRole {
  id          String   @id @default(uuid())
  name        String   @unique // e.g. "SUPER_ADMIN", "OPERATOR"
  permissions String[] // e.g. ["USER_READ", "USER_BAN", "CONFIG_EDIT"]
  description String?
  
  users       AdminUser[]
}

// 审计日志 (关联到 AdminUser)
model AuditLog {
  id          String   @id @default(uuid())
  adminId     String
  admin       AdminUser @relation(fields: [adminId], references: [id])
  
  action      String   // "UPDATE_CONFIG", "BAN_USER"
  resource    String   // "user", "system_config"
  targetId    String?  // 被操作对象的 ID (如 userId)
  payload     Json?    // 修改详情
  ip          String?
  createdAt   DateTime @default(now())
}

// --- 业务系统模型 (C端) ---

// 扩展 User 模型 (仅增加管理状态字段)
model AppUser {
  // ... existing fields (id, email, password, etc.)
  
  // 移除所有管理员相关字段，仅保留被管理状态
  isActive    Boolean  @default(true) // 是否被封禁
  note        String?  // 管理员备注 (仅后台可见)
}

// 系统配置
model SystemConfig {
  key         String   @id
  value       String
  description String?
  updatedAt   DateTime @updatedAt
}
```

---

## 4. 接口设计 (API Specification)

### 4.1 认证接口 (Admin Auth)
后台拥有独立的登录接口，不与 C 端混用。

- `POST /admin/auth/login`: 管理员登录 (验证 `AdminUser` 表)。
- `POST /admin/auth/logout`: 登出。
- `GET /admin/auth/me`: 获取当前管理员信息及权限列表。

### 4.2 资源管理接口 (Refine Data Provider)
针对 `AdminUser` 鉴权，操作业务数据。

| Resource | Method | Path | Description |
| :--- | :--- | :--- | :--- |
| **users** | GET | `/admin/users` | 分页查询 C 端用户列表 |
| | POST | `/admin/users/:id/ban` | 封禁/解封用户 (更新 `AppUser.isActive`) |
| **admin-users** | GET | `/admin/admin-users` | 管理员列表 (仅超级管理员可用) |
| **audit-logs** | GET | `/admin/audit-logs` | 查看审计日志 |

---

## 5. 安全策略

1.  **物理隔离**:
    *   `AdminUser` 表存储管理员账号，`AppUser` 表存储 C 端用户。即使 C 端数据库泄露，管理员账号也不会直接暴露（虽然在同一个 DB，但逻辑上完全分开）。
2.  **鉴权机制**:
    *   **AdminGuard**: 验证 Header 中的 `Authorization: Bearer <AdminToken>`。
    *   **Token 区分**: Admin Token 签发时包含 `type: 'admin'` payload，防止 C 端 User Token 越权访问后台接口。
3.  **权限控制 (RBAC)**:
    *   基于 `AdminRole.permissions` 进行细粒度控制。
    *   例如：只有拥有 `ADMIN_MANAGE` 权限的账号才能增删 `AdminUser`。
