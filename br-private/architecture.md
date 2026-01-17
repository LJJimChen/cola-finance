1. Title

Asset Management System – System Architecture Specification

⸻

2. Purpose（为什么要有这个架构）

该系统需要满足以下约束条件：
	•	支持多 Broker 的资产采集
	•	不存储用户账号和密码
	•	支持需要验证码 / 人工登录的平台 - Human-in-the-Loop	人工完成登录与验证码
	•	前端使用 Serverless BFF
	•	资产采集和浏览器自动化是长生命周期、状态型任务
	•	系统未来可能开放给其他用户（SaaS）

因此系统必须在 安全性、可扩展性、职责隔离 三者之间取得平衡。

Human-in-the-Loop（人工介入登录与验证码）流程概述：

在系统自动化抓取或任务执行过程中，当遇到账号登录、验证码（图形 / 滑块 / 短信 / 二次验证）等无法稳定自动化的环节时，任务会被暂停并进入「等待人工介入」状态。系统将当前登录上下文（目标站点、账号、页面 URL、截图、Cookie 状态等）推送给人工操作界面，由人工在受控浏览器环境中完成登录与验证码验证。验证成功后，系统安全地回收会话凭证（如 Cookie / Token），并将其注入回原任务执行环境，任务随后自动恢复并继续执行。

涉及的关键技术：
	•	任务状态机（Running → NeedHuman → Resumed）
	•	受控浏览器（Playwright / Puppeteer + Remote Debug）
	•	会话隔离与凭证安全回收（Cookie / Token Vault）
	•	人工操作 UI（Web 控制台 / VNC / Browser-in-Browser）
	•	事件通知与回调（WebSocket / Queue）
	•	权限与审计（操作记录、一次性授权）

核心原则：机器负责规模化，人工只介入“不可自动化的临界点”，并且介入过程可追踪、可复用、可审计。

⸻

3. High-Level Architecture Overview

系统采用 三层 + 单一数据源 架构：

Frontend
   ↓
BFF (Serverless)
   ↓
Engine (Stateful Service)
   ↓
Database (Single Source of Truth)

核心设计原则
	1.	BFF 是唯一对前端暴露的 API 边界
	2.	Engine 负责所有状态型、长连接、浏览器相关能力
	3.	前端永远不直接访问 Engine 的内部 API
	4.	数据库是状态与结果的唯一权威来源

⸻

4. Component Responsibilities

4.1 Frontend

职责：
	•	UI 展示
	•	调用 BFF API
	•	通过 iframe / WebView 显示远程浏览器（授权场景）
	•	轮询任务状态

约束：
	•	不直接访问 Engine API
	•	不持有 Engine 的长期凭证
	•	不感知 Playwright / 浏览器实现细节

⸻

4.2 BFF（Serverless）

职责：
	•	用户鉴权（JWT / Session）
	•	资产、收益、分类等数据读取
	•	创建 / 查询采集任务
	•	创建授权任务
	•	向 Engine 签发短期访问 Token
	•	充当系统的 Policy / Security Boundary

约束：
	•	不维护 WebSocket
	•	不运行 Playwright
	•	不处理浏览器流量

⸻

4.3 Engine（Stateful Service）

职责：
	•	Playwright Headful / Headless
	•	Remote Browser（noVNC / WebRTC）
	•	Broker Adapter
	•	授权流程执行
	•	资产采集任务调度
	•	Cookie / Session 管理
	•	任务锁（同一 broker 同一时间仅一个任务）

约束：
	•	不对公网直接暴露管理 API
	•	仅信任 BFF 签发的 Token

⸻

4.4 Database

职责：
	•	存储用户资产
	•	存储授权状态
	•	存储采集任务状态
	•	存储分类与配置
	•	存储最终计算结果

⸻

二、BFF / Engine API 对照表

1️⃣ BFF 对前端 API（公开）

API	方法	描述
/brokers	GET	已连接的 broker
/brokers/:id/auth/start	POST	创建授权任务
/auth-tasks/:id	GET	查询授权任务状态
/collection-tasks	POST	创建资产采集任务
/collection-tasks/:id	GET	查询采集任务状态
/assets	GET	当前资产
/portfolio/summary	GET	汇总数据
/rebalance/preview	POST	再平衡计算


⸻

2️⃣ BFF → Engine API（内部）

API	方法	描述
/engine/auth-sessions	POST	创建授权会话
/engine/collection-tasks	POST	启动采集任务
/engine/tasks/:id/cancel	POST	取消任务

⚠️ 这些 API 只允许 BFF 调用

⸻

3️⃣ Engine → Database
	•	更新任务状态
	•	写入 Session
	•	写入 Holdings

⸻

三、Auth Token 设计规范

1️⃣ 设计目标
	•	BFF 是唯一签发方
	•	Token 有明确作用域
	•	Token 生命周期短
	•	Engine 可独立校验

⸻

2️⃣ Token 类型

（1）Engine Access Token（JWT）

用途：
	•	授权前端访问 Remote Browser
	•	授权 Engine 执行指定任务

Payload 示例：

{
  "iss": "bff",
  "sub": "user_123",
  "scope": "auth_browser",
  "authSessionId": "auth_456",
  "exp": 1700000000
}

特性：
	•	有效期：5–10 分钟
	•	单次用途
	•	绑定 authSessionId

⸻

3️⃣ 校验规则（Engine）
	•	校验签名（公钥）
	•	校验 exp
	•	校验 scope
	•	校验 authSessionId 是否存在且状态正确

⸻

四、任务状态机定义

1️⃣ 授权任务（AuthTask）

CREATED
  ↓
BROWSER_READY
  ↓
WAITING_FOR_USER
  ↓
AUTHORIZED
  ↓
SESSION_SAVED
  ↓
COMPLETED

FAILED
EXPIRED

状态说明

状态	含义
CREATED	BFF 创建
BROWSER_READY	Engine 启动浏览器
WAITING_FOR_USER	用户操作中
AUTHORIZED	登录成功
SESSION_SAVED	Cookie 已保存
COMPLETED	授权完成


⸻

2️⃣ 采集任务（CollectionTask）

CREATED
  ↓
QUEUED
  ↓
RUNNING
  ↓
FETCHING
  ↓
NORMALIZING
  ↓
SAVING
  ↓
COMPLETED

FAILED
CANCELLED


⸻

3️⃣ 并发与锁规则
	•	(user_id, broker) 作为唯一执行锁
	•	新任务创建时：
	•	若已有 RUNNING / QUEUED → 拒绝
	•	或合并为同一任务

⸻

五、为什么这是“最合理”的架构

✅ Serverless 优势不被破坏

✅ Playwright 能力完整释放

✅ 安全边界清晰

✅ 能平滑演进为 SaaS

✅ 非常适合 spec-kit 驱动开发

⸻

六、下一步你应该做什么（强烈建议）

现在不是写代码的时候，而是做这三步之一：

1️⃣ 把以上内容 落成 spec 文件结构
2️⃣ 基于 spec 生成 Plan（开发计划）
3️⃣ 选一个模块（如 Auth / Engine）进入 代码骨架