# Implementation Plan: Asset Management System (MVP)

**Branch**: `001-asset-management` | **Date**: 2026-01-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-asset-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.codebuddy/commands/speckit.plan.md` for the execution workflow.

## Summary

Build a multi-broker asset aggregation and portfolio analysis system with secure authorization (no credential storage), currency normalization, classification, and category-level rebalancing. The system uses a pnpm monorepo with React + Vite frontend, Cloudflare Workers BFF, and Node.js Engine for browser automation.

## Technical Context

**Language/Version**: TypeScript (ES2022+), Node.js 20+  
**Primary Dependencies**:
- Frontend: React 18, Vite, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui, ky, react-hook-form, zod, Zustand
- BFF: Cloudflare Workers, Hono, Better Auth, Drizzle ORM, Cloudflare D1
- Engine: Node.js, Fastify, Playwright, xstate  
**Storage**: Cloudflare D1 (SQLite) via Drizzle ORM. Exchange rates: Daily historical records for USD/CNY and HKD/CNY only; other pairs use latest cached rates.  
**Testing**: NEEDS CLARIFICATION (vitest/jest/playwright for frontend, integration, e2e)  
**Target Platform**: Web (PWA, mobile-first), Cloudflare Workers (serverless BFF), Node.js (Engine service)  
**Project Type**: Monorepo (web + BFF + Engine)  
**Performance Goals**: 
- BFF API: <200ms p95 for portfolio reads
- Engine: Complete broker authorization within 30s (excluding user verification)
- Frontend: <2s initial load (mobile), 60fps UI updates  
**Constraints**:
- No broker credential storage (authorization via secure tokens only)
- Engine Access Tokens for human-in-the-loop: 5-minute lifetime
- Frontend polling interval: 2-5 seconds for task status
- BFF only: no direct frontend-to-Engine access  
**Scale/Scope**: 
- MVP: 1-10 users, 1-3 brokers, <100 holdings per user
- Target: <10k users, ~10 supported brokers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Use `.specify/memory/constitution.md` as the source of truth. This plan MUST explicitly
confirm each gate below, or document an exception with rationale.

- [x] No silent failures or magic defaults in critical paths
- [x] Type safety enforced (no unjustified `any`/type suppression; public types are precise)
- [x] Clear boundaries and ownership (front-end ↔ BFF ↔ Engine; no cross-boundary leakage)
- [x] Database treated as the single source of truth; migrations are forward-only and reviewable
- [x] Defensive error handling (no swallowed errors; errors carry actionable context)
- [x] Testability: core business logic is isolated and has a test strategy (unit + integration where needed)
- [x] Function documentation: public/domain/cross-boundary functions have intent + contract comments
- [x] Dependency discipline: any new dependency is justified; global side effects avoided

**Gate Assessment (Pre-Phase 0)**: All checks pass. The architecture enforces clear boundaries (Frontend → BFF → Engine), uses TypeScript throughout, and leverages mature tooling (Hono middleware, Drizzle ORM, xstate for explicit state management). Testing strategy requires clarification in Phase 0.

**Gate Re-Assessment (Post-Phase 1)**:
- ✅ **No silent failures**: All error states explicitly modeled in API contracts (4xx/5xx responses with error codes and messages). Task state machines (xstate) make all state transitions explicit.
- ✅ **Type safety**: OpenAPI contracts generate TypeScript types for frontend-backend communication. Drizzle ORM provides type-safe database queries. No `any` types in public interfaces.
- ✅ **Clear boundaries**: Data model enforces strict ownership (User → BrokerConnection → Holding). BFF is only public API; Engine accessed via short-lived tokens. Foreign key constraints prevent cross-boundary leakage.
- ✅ **Database as truth**: All entities have explicit validation rules. Migrations will be forward-only (Drizzle migrations). State persistence explicitly documented (what to store, what to keep ephemeral).
- ✅ **Defensive error handling**: All API endpoints return structured errors with `error_code` and `message`. Task failures record actionable error information. No swallowed errors in contracts.
- ✅ **Testability**: Testing strategy resolved (Vitest + Playwright). Core business logic (authorization, collection, rebalancing) isolated in services layer. State machines (xstate) testable with `@xstate/test`.
- ✅ **Function documentation**: API contracts serve as public interface documentation. Data model documents all validation rules, business rules, and state transitions. Quickstart guide provides developer onboarding.
- ✅ **Dependency discipline**: All dependencies justified in research.md (Vitest for testing, ExchangeRate-API for currency, BFF-issued JWT for authorization). No global side effects (all dependencies injected).

**Final Assessment**: All gates pass. The design adheres to all Constitution principles. No exceptions required.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
├── web/                      # Frontend (React + Vite PWA)
│   ├── src/
│   │   ├── routes/          # TanStack Router (file-based)
│   │   ├── components/      # shadcn/ui + custom components
│   │   ├── lib/             # API client (ky + OpenAPI generated), utilities
│   │   ├── hooks/           # TanStack Query hooks, custom hooks
│   │   ├── stores/          # Zustand stores (minimal global state)
│   │   └── types/           # Shared types (from schema package)
│   └── tests/
│       ├── unit/
│       └── e2e/
│
├── bff/                      # Backend-for-Frontend (Cloudflare Workers)
│   ├── src/
│   │   ├── routes/          # Hono route handlers
│   │   ├── middleware/      # Hono middleware (auth, validation, errors)
│   │   ├── services/        # Business logic (authorization, task creation, portfolio reads)
│   │   ├── db/              # Drizzle ORM schema, migrations
│   │   └── types/           # API types, request/response schemas
│   └── tests/
│       ├── integration/     # API integration tests
│       └── unit/
│
└── engine/                   # Stateful Service (Node.js)
    ├── src/
    │   ├── brokers/         # Broker adapters (Adapter pattern)
    │   ├── tasks/           # Task state machines (xstate)
    │   ├── services/        # Playwright orchestration, data collection
    │   ├── api/             # Fastify internal API (token-authenticated)
    │   └── types/           # Task models, broker interfaces
    └── tests/
        ├── integration/
        └── unit/

packages/
└── schema/                   # Shared types & contracts
    ├── src/
    │   ├── entities/        # Domain entities (User, Holding, etc.)
    │   ├── api/             # OpenAPI spec + generated types
    │   └── tasks/           # Task state types (shared by BFF + Engine)
    └── tests/
```

**Structure Decision**: Monorepo with `apps/` for three deployable applications (web, bff, engine) and `packages/` for a shared schema package. This aligns with the constitution's requirement for clear boundaries: Frontend only calls BFF, BFF creates tasks and reads data, Engine executes tasks. The schema package ensures type safety across boundaries without sharing infrastructure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. All gates pass.
