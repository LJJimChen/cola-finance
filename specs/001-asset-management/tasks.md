# Tasks: Asset Management System (MVP)

**Input**: Design documents from `/specs/001-asset-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included for critical business logic and cross-boundary behavior (authorization, collection, rebalancing). Unit tests for UI components and simple utilities are deferred to post-MVP refinement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Apps**: `apps/web/`, `apps/bff/`, `apps/engine/`
- **Packages**: `packages/schema/`
- Monorepo structure with pnpm workspaces

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and monorepo structure

- [X] T001 Initialize pnpm workspace with monorepo configuration in root package.json and pnpm-workspace.yaml
- [X] T002 [P] Create apps/web/ directory structure with Vite + React + TypeScript configuration
- [X] T003 [P] Create apps/bff/ directory structure with Cloudflare Workers + Hono + TypeScript configuration
- [X] T004 [P] Create apps/engine/ directory structure with Node.js + Fastify + TypeScript configuration
- [X] T005 [P] Create packages/schema/ directory structure for shared types and contracts
- [X] T006 Configure TypeScript for monorepo with path mappings in root tsconfig.json
- [X] T007 [P] Setup ESLint and Prettier with monorepo configuration
- [X] T008 [P] Configure Vitest workspace configuration in vitest.workspace.ts
- [X] T009 [P] Setup Git pre-commit hooks with Husky for linting and type checking
- [X] T010 [P] Create .env.example files for apps/web/, apps/bff/, apps/engine/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Shared Schema (Cross-App Types)

- [X] T011 [P] Define domain entity types in packages/schema/src/entities/user.ts
- [X] T012 [P] Define domain entity types in packages/schema/src/entities/broker.ts
- [X] T013 [P] Define domain entity types in packages/schema/src/entities/holding.ts
- [X] T014 [P] Define task state types in packages/schema/src/tasks/authorization-task.ts
- [X] T015 [P] Define task state types in packages/schema/src/tasks/collection-task.ts
- [X] T016 Copy OpenAPI specs to packages/schema/src/api/ and configure type generation

### BFF Foundation

- [X] T017 Setup Drizzle ORM configuration in apps/bff/drizzle.config.ts for Cloudflare D1
- [X] T018 Create base database schema in apps/bff/src/db/schema/users.ts (User table)
- [X] T019 [P] Create base database schema in apps/bff/src/db/schema/brokers.ts (Broker table)
- [X] T020 [P] Create base database schema in apps/bff/src/db/schema/broker-connections.ts (BrokerConnection table)
- [X] T021 [P] Create base database schema in apps/bff/src/db/schema/exchange-rates.ts (ExchangeRate table with USD/CNY, HKD/CNY support)
- [X] T022 Generate initial migration with `drizzle-kit generate` in apps/bff/
- [X] T023 Create database seed script in apps/bff/src/db/seeds.ts (preset brokers and classification schemes)
- [X] T024 Setup Better Auth configuration in apps/bff/src/lib/auth.ts (email/password authentication)
- [X] T025 Implement JWT token generation utility in apps/bff/src/lib/jwt.ts (for Engine delegation tokens with 5-minute expiry)
- [X] T026 Create Hono app instance in apps/bff/src/index.ts with middleware pipeline (CORS, error handling, auth)
- [X] T027 [P] Implement authentication middleware in apps/bff/src/middleware/auth.ts (JWT verification for protected routes)
- [X] T028 [P] Implement error handling middleware in apps/bff/src/middleware/error.ts (structured error responses with error_code and message)
- [X] T029 [P] Implement validation middleware in apps/bff/src/middleware/validation.ts (zod schema validation)

### Engine Foundation

- [X] T030 Setup Fastify app instance in apps/engine/src/index.ts with JWT authentication plugin
- [X] T031 Implement JWT validation middleware in apps/engine/src/middleware/validate-delegation-token.ts (verify BFF-issued tokens)
- [X] T032 [P] Setup Playwright browser pool in apps/engine/src/lib/browser-pool.ts (persistent context management)
- [X] T033 [P] Create base broker adapter interface in apps/engine/src/brokers/adapter.interface.ts
- [X] T034 Create xstate configuration utilities in apps/engine/src/lib/state-machine-utils.ts (state persistence, error handling)

### Frontend Foundation

- [X] T035 Setup TanStack Router configuration in apps/web/src/routes/__root.tsx
- [X] T036 Setup TanStack Query configuration in apps/web/src/lib/query-client.ts
- [X] T037 Generate TypeScript API client from OpenAPI spec using ky in apps/web/src/lib/api-client.ts
- [X] T038 [P] Configure Tailwind CSS with shadcn/ui in apps/web/tailwind.config.ts
- [X] T039 [P] Setup i18n configuration in apps/web/src/lib/i18n.ts (English and Chinese locales)
- [X] T040 Create authentication context in apps/web/src/lib/auth-context.tsx (JWT token management, auto-detect locale)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Connect broker + view portfolio (Priority: P1) 🎯 MVP

**Goal**: A user securely connects one supported broker account and can view a consolidated portfolio summary and holdings

**Independent Test**: Using a test/dummy broker account, a user completes the authorization flow, triggers a portfolio refresh, and sees a portfolio summary and holdings list

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T041 [P] [US1] Create integration test for broker authorization flow in apps/bff/tests/integration/auth-flow.test.ts (test JWT token generation, task creation)
- [ ] T042 [P] [US1] Create integration test for portfolio refresh flow in apps/bff/tests/integration/collection-flow.test.ts (test task status polling)
- [ ] T043 [P] [US1] Create E2E test for full user journey in apps/web/tests/e2e/broker-connection.spec.ts (sign up, connect broker, view portfolio)

### Database Schema for User Story 1

- [ ] T044 [P] [US1] Create authorization_tasks table schema in apps/bff/src/db/schema/authorization-tasks.ts
- [ ] T045 [P] [US1] Create collection_tasks table schema in apps/bff/src/db/schema/collection-tasks.ts
- [ ] T046 [P] [US1] Create holdings table schema in apps/bff/src/db/schema/holdings.ts
- [ ] T047 [P] [US1] Create holding_snapshots table schema in apps/bff/src/db/schema/holding-snapshots.ts
- [ ] T048 [US1] Generate migration for US1 tables with `drizzle-kit generate` in apps/bff/

### BFF Implementation for User Story 1

- [ ] T049 [P] [US1] Implement POST /auth/signup endpoint in apps/bff/src/routes/auth.ts (email/password signup with locale auto-detection)
- [ ] T050 [P] [US1] Implement POST /auth/signin endpoint in apps/bff/src/routes/auth.ts (email/password signin, return JWT)
- [ ] T051 [P] [US1] Implement GET /auth/me endpoint in apps/bff/src/routes/auth.ts (return current user profile)
- [ ] T052 [US1] Implement GET /brokers endpoint in apps/bff/src/routes/brokers.ts (list supported brokers from seed data)
- [ ] T053 [US1] Implement POST /brokers/{brokerId}/connect endpoint in apps/bff/src/routes/brokers.ts (create authorization task, issue 5-minute delegation token)
- [ ] T054 [US1] Implement GET /brokers/connections endpoint in apps/bff/src/routes/brokers.ts (list user's broker connections)
- [ ] T055 [US1] Implement DELETE /brokers/connections/{connectionId} endpoint in apps/bff/src/routes/brokers.ts (revoke connection)
- [ ] T056 [US1] Implement POST /brokers/connections/{connectionId}/refresh endpoint in apps/bff/src/routes/brokers.ts (create collection task, call Engine)
- [ ] T057 [US1] Implement GET /tasks/{taskId} endpoint in apps/bff/src/routes/tasks.ts (return task status for polling)
- [ ] T058 [US1] Implement GET /portfolio endpoint in apps/bff/src/routes/portfolio.ts (return portfolio summary with total value, returns)
- [ ] T059 [US1] Implement GET /portfolio/holdings endpoint in apps/bff/src/routes/portfolio.ts (list holdings with original currency values)
- [ ] T060 [P] [US1] Create authorization service in apps/bff/src/services/authorization.service.ts (task creation, Engine API calls)
- [ ] T061 [P] [US1] Create collection service in apps/bff/src/services/collection.service.ts (task creation, Engine API calls)
- [ ] T062 [P] [US1] Create portfolio service in apps/bff/src/services/portfolio.service.ts (portfolio aggregation, holdings queries)

### Engine Implementation for User Story 1

- [ ] T063 [US1] Create authorization state machine in apps/engine/src/tasks/authorization.machine.ts using xstate (pending → in_progress → paused/completed/failed states)
- [ ] T064 [US1] Create collection state machine in apps/engine/src/tasks/collection.machine.ts using xstate (pending → in_progress → completed/partial/failed states)
- [ ] T065 [US1] Implement POST /authorize endpoint in apps/engine/src/api/routes/authorization.ts (execute authorization state machine, handle human-in-the-loop)
- [ ] T066 [US1] Implement POST /authorize/{taskId}/resume endpoint in apps/engine/src/api/routes/authorization.ts (resume paused authorization after user verification)
- [ ] T067 [US1] Implement POST /collect endpoint in apps/engine/src/api/routes/collection.ts (execute collection state machine)
- [ ] T068 [P] [US1] Create example broker adapter in apps/engine/src/brokers/example.adapter.ts (implements adapter interface, demonstrates Playwright automation)
- [ ] T069 [P] [US1] Create Futu broker adapter in apps/engine/src/brokers/futu.adapter.ts (real broker implementation with captcha support)
- [ ] T070 [US1] Implement broker adapter factory in apps/engine/src/brokers/adapter.factory.ts (select adapter by broker_id)
- [ ] T071 [US1] Create authorization orchestration service in apps/engine/src/services/authorization-orchestrator.ts (state machine execution, adapter coordination)
- [ ] T072 [US1] Create collection orchestration service in apps/engine/src/services/collection-orchestrator.ts (state machine execution, holdings persistence via BFF callback or direct DB write)

### Frontend Implementation for User Story 1

- [ ] T073 [P] [US1] Create sign-up page in apps/web/src/routes/auth/signup.tsx (email/password form with locale selection)
- [ ] T074 [P] [US1] Create sign-in page in apps/web/src/routes/auth/signin.tsx (email/password form)
- [ ] T075 [US1] Create brokers list page in apps/web/src/routes/brokers/index.tsx (display supported brokers with "Connect" button)
- [ ] T076 [US1] Create broker connection flow component in apps/web/src/components/broker-connection-flow.tsx (handle authorization task polling with 2-5s interval)
- [ ] T077 [US1] Create human-in-the-loop verification dialog in apps/web/src/components/verification-dialog.tsx (display verification URL when task status is "paused")
- [ ] T078 [US1] Create my connections page in apps/web/src/routes/connections/index.tsx (list connected brokers with "Refresh" and "Revoke" actions)
- [ ] T079 [US1] Create portfolio summary component in apps/web/src/components/portfolio-summary.tsx (display total value, returns, last updated)
- [ ] T080 [US1] Create holdings list component in apps/web/src/components/holdings-list.tsx (table with symbol, name, quantity, value, currency)
- [ ] T081 [US1] Create portfolio refresh button component in apps/web/src/components/portfolio-refresh-button.tsx (trigger refresh, show polling status)
- [ ] T082 [US1] Create portfolio page in apps/web/src/routes/portfolio/index.tsx (layout with summary, holdings list, refresh button)
- [ ] T083 [P] [US1] Create TanStack Query hooks for broker operations in apps/web/src/hooks/use-brokers.ts (useConnect, useConnections, useRefresh)
- [ ] T084 [P] [US1] Create TanStack Query hooks for portfolio operations in apps/web/src/hooks/use-portfolio.ts (usePortfolioSummary, useHoldings)
- [ ] T085 [P] [US1] Create task polling hook in apps/web/src/hooks/use-task-polling.ts (refetchInterval with 2-5s, stop when terminal state reached)

### Integration & Validation for User Story 1

- [ ] T086 [US1] Deploy BFF to Cloudflare Workers dev environment and validate authentication flow
- [ ] T087 [US1] Start Engine locally and validate broker adapter with test account
- [ ] T088 [US1] Run E2E test T043 to verify full user journey end-to-end
- [ ] T089 [US1] Validate edge case: authorization expiration during refresh (engine should mark task as failed and prompt re-auth)
- [ ] T090 [US1] Validate edge case: broker temporarily unavailable (engine should mark collection task as "partial")

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. User can sign up, connect a broker, and view portfolio holdings.

---

## Phase 4: User Story 2 - Normalize portfolio to a display currency (Priority: P2)

**Goal**: A user selects a display currency and sees portfolio totals and per-holding values normalized to that currency

**Independent Test**: With a portfolio containing at least two currencies, the user switches the display currency and sees totals and holdings values update consistently

### Tests for User Story 2 ⚠️

- [ ] T091 [P] [US2] Create unit test for currency conversion logic in apps/bff/tests/unit/exchange-rate.service.test.ts (test USD/CNY historical lookup, latest rate fallback)
- [ ] T092 [P] [US2] Create integration test for portfolio normalization in apps/bff/tests/integration/portfolio-normalization.test.ts (test multi-currency portfolio conversion)

### Database Schema for User Story 2

(ExchangeRate table already created in Foundational phase, no new tables needed)

### BFF Implementation for User Story 2

- [ ] T093 [US2] Implement PATCH /auth/me/preferences endpoint in apps/bff/src/routes/auth.ts (update display_currency preference)
- [ ] T094 [US2] Create exchange rate service in apps/bff/src/services/exchange-rate.service.ts (fetch from API, cache in Cloudflare KV with 24h TTL, persist USD/CNY and HKD/CNY daily)
- [ ] T095 [US2] Create daily exchange rate fetch cron job in apps/bff/src/cron/fetch-exchange-rates.ts (fetch USD/CNY and HKD/CNY rates at midnight UTC, store in DB)
- [ ] T096 [US2] Update portfolio service apps/bff/src/services/portfolio.service.ts to support currency normalization (convert holdings using historical rates for USD/CNY, HKD/CNY; latest rates for others)
- [ ] T097 [US2] Update GET /portfolio endpoint to accept `?currency=` query parameter and return normalized values
- [ ] T098 [US2] Update GET /portfolio/holdings endpoint to accept `?currency=` query parameter and return normalized holding values

### Frontend Implementation for User Story 2

- [ ] T099 [US2] Create currency selector component in apps/web/src/components/currency-selector.tsx (dropdown with major currencies: USD, CNY, HKD, EUR)
- [ ] T100 [US2] Add currency selector to portfolio page in apps/web/src/routes/portfolio/index.tsx (persist selection in user preferences)
- [ ] T101 [US2] Update portfolio summary component apps/web/src/components/portfolio-summary.tsx to display currency and handle conversion
- [ ] T102 [US2] Update holdings list component apps/web/src/components/holdings-list.tsx to show both original currency and normalized value
- [ ] T103 [US2] Create stale data indicator component in apps/web/src/components/stale-data-indicator.tsx (show warning badge if exchange rate is >24h old)
- [ ] T104 [US2] Update use-portfolio hook apps/web/src/hooks/use-portfolio.ts to accept currency parameter and refetch on currency change

### Integration & Validation for User Story 2

- [ ] T105 [US2] Seed test data with holdings in multiple currencies (USD, HKD, EUR)
- [ ] T106 [US2] Run integration test T092 to verify currency normalization with historical rates for USD/CNY, HKD/CNY
- [ ] T107 [US2] Validate edge case: missing exchange rate data (system should flag as stale and preserve last known value)
- [ ] T108 [US2] Validate edge case: holdings with unknown currency (system should display in original currency with flag)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. User can view portfolio in any supported currency with normalized values.

---

## Phase 5: User Story 3 - Classify holdings + rebalance preview (Priority: P3)

**Goal**: A user selects a classification scheme, configures target allocation by category, and views a rebalance preview showing current vs target allocation and drift

**Independent Test**: With any portfolio and a classification scheme, the user sets target weights and receives a rebalance preview that highlights drift and suggested category-level adjustments

### Tests for User Story 3 ⚠️

- [ ] T109 [P] [US3] Create unit test for rebalance calculation in apps/bff/tests/unit/rebalance.service.test.ts (test drift calculation, adjustment suggestions)
- [ ] T110 [P] [US3] Create integration test for rebalance preview in apps/bff/tests/integration/rebalance-preview.test.ts (test end-to-end rebalance flow with validation)

### Database Schema for User Story 3

- [ ] T111 [P] [US3] Create classification_schemes table schema in apps/bff/src/db/schema/classification-schemes.ts
- [ ] T112 [P] [US3] Create target_allocations table schema in apps/bff/src/db/schema/target-allocations.ts
- [ ] T113 [P] [US3] Create rebalance_previews table schema in apps/bff/src/db/schema/rebalance-previews.ts
- [ ] T114 [US3] Generate migration for US3 tables with `drizzle-kit generate` in apps/bff/
- [ ] T115 [US3] Update seed script apps/bff/src/db/seeds.ts to include preset "Asset Class" classification scheme

### BFF Implementation for User Story 3

- [ ] T116 [US3] Implement GET /classification/schemes endpoint in apps/bff/src/routes/classification.ts (list preset and user's custom schemes)
- [ ] T117 [US3] Implement POST /classification/schemes endpoint in apps/bff/src/routes/classification.ts (create custom classification scheme)
- [ ] T118 [US3] Implement GET /classification/schemes/{schemeId}/targets endpoint in apps/bff/src/routes/classification.ts (get target allocation)
- [ ] T119 [US3] Implement PUT /classification/schemes/{schemeId}/targets endpoint in apps/bff/src/routes/classification.ts (set target allocation, validate sum=100%)
- [ ] T120 [US3] Implement GET /classification/schemes/{schemeId}/rebalance-preview endpoint in apps/bff/src/routes/classification.ts (compute and return rebalance preview)
- [ ] T121 [US3] Create classification service in apps/bff/src/services/classification.service.ts (scheme CRUD operations)
- [ ] T122 [US3] Create rebalance service in apps/bff/src/services/rebalance.service.ts (compute current allocation, drift, adjustments)
- [ ] T123 [US3] Implement target allocation validation in rebalance service (ensure weights sum to exactly 100%, block submission otherwise)

### Frontend Implementation for User Story 3

- [ ] T124 [US3] Create classification schemes page in apps/web/src/routes/classification/index.tsx (list preset and custom schemes)
- [ ] T125 [US3] Create scheme selector component in apps/web/src/components/scheme-selector.tsx (dropdown with preset and custom schemes)
- [ ] T126 [US3] Create target allocation form in apps/web/src/components/target-allocation-form.tsx (input fields per category with real-time sum validation)
- [ ] T127 [US3] Create rebalance preview page in apps/web/src/routes/rebalance/index.tsx (display current vs target allocation chart, drift indicators, adjustments)
- [ ] T128 [US3] Create allocation chart component in apps/web/src/components/allocation-chart.tsx (pie/bar chart showing category percentages using shadcn/ui charts)
- [ ] T129 [US3] Create drift indicator component in apps/web/src/components/drift-indicator.tsx (red/green badges showing category drift)
- [ ] T130 [US3] Create adjustment suggestions component in apps/web/src/components/adjustment-suggestions.tsx (list of buy/sell actions by category)
- [ ] T131 [P] [US3] Create TanStack Query hooks for classification operations in apps/web/src/hooks/use-classification.ts (useSchemes, useTargets, useRebalancePreview)
- [ ] T132 [US3] Add validation for target allocation form (block submission if sum ≠ 100%, display error message)

### Integration & Validation for User Story 3

- [ ] T133 [US3] Seed test portfolio with categorized holdings (stocks, bonds, cash)
- [ ] T134 [US3] Run integration test T110 to verify rebalance calculation accuracy
- [ ] T135 [US3] Validate edge case: targets don't sum to 100% (system should block submission with clear error)
- [ ] T136 [US3] Validate edge case: empty portfolio (system should disable rebalance preview and show empty state)

**Checkpoint**: All user stories should now be independently functional. User can set target allocations and view rebalance suggestions.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T137 [P] Setup PWA configuration in apps/web/vite.config.ts (service worker, manifest, offline support)
- [ ] T138 [P] Implement error boundary component in apps/web/src/components/error-boundary.tsx (catch and display errors gracefully)
- [ ] T139 [P] Implement loading skeleton components in apps/web/src/components/loading-skeleton.tsx (improve perceived performance)
- [ ] T140 [P] Add comprehensive logging to BFF services (use Cloudflare Workers KV for log storage)
- [ ] T141 [P] Add comprehensive logging to Engine services (structured JSON logs)
- [ ] T142 [P] Implement rate limiting in BFF middleware (e.g., 5 authorization attempts per hour per user)
- [ ] T143 [P] Add audit logging for security-sensitive operations (authorization attempts, connection revocations) in apps/bff/src/services/audit.service.ts
- [ ] T144 Setup Cloudflare Pages deployment configuration for apps/web/
- [ ] T145 Setup Cloudflare Workers deployment configuration for apps/bff/
- [ ] T146 [P] Create Docker configuration for Engine service in apps/engine/Dockerfile
- [ ] T147 [P] Add performance monitoring (track p95 latency for BFF endpoints)
- [ ] T148 [P] Optimize bundle size for apps/web/ (code splitting, lazy loading routes)
- [ ] T149 Run full E2E test suite across all user stories
- [ ] T150 Validate quickstart.md setup instructions with fresh environment
- [ ] T151 [P] Update README.md with architecture overview and getting started guide

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-5)**: All depend on Foundational phase completion
  - User Story 1: Can start after Phase 2 - No dependencies on other stories
  - User Story 2: Can start after Phase 2 - Requires User Story 1's portfolio data (but tested independently with seed data)
  - User Story 3: Can start after Phase 2 - Requires User Story 1's portfolio data (but tested independently with seed data)
- **Polish (Phase 6)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only - independently completable ✅ MVP
- **User Story 2 (P2)**: Can start after Foundational - uses holdings from US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational - uses holdings from US1 but independently testable

### Within Each User Story

1. Tests MUST be written and FAIL before implementation
2. Database schema before services
3. Services before routes
4. Routes before frontend components
5. Core implementation before integration
6. Story complete before moving to next priority

### Parallel Opportunities

**Setup Phase (T001-T010)**:
- T002 (web), T003 (bff), T004 (engine), T005 (schema) can run in parallel
- T007 (eslint), T008 (vitest), T009 (husky), T010 (.env) can run in parallel

**Foundational Phase (T011-T040)**:
- Schema package (T011-T016) can run in parallel
- BFF schema (T018-T021) can run in parallel
- BFF middleware (T027-T029) can run in parallel
- Engine foundation (T032-T034) can run in parallel
- Frontend foundation (T038-T040) can run in parallel

**User Story 1**:
- Tests (T041-T043) can run in parallel
- Database schema (T044-T047) can run in parallel
- BFF routes (T049-T051, T052-T059) can run in parallel
- BFF services (T060-T062) can run in parallel
- Engine adapters (T068-T069) can run in parallel
- Frontend pages (T073-T074) can run in parallel
- Frontend hooks (T083-T085) can run in parallel

**User Story 2**:
- Tests (T091-T092) can run in parallel
- Frontend components (T099-T104) can run in parallel

**User Story 3**:
- Tests (T109-T110) can run in parallel
- Database schema (T111-T113) can run in parallel
- Frontend components (T124-T130) can run in parallel

**Polish Phase**:
- Most tasks (T137-T143, T146-T148, T151) marked [P] can run in parallel

---

## Parallel Example: User Story 1

**Tests** (write first, all run in parallel):
```bash
Task T041: Create integration test for broker authorization flow
Task T042: Create integration test for portfolio refresh flow
Task T043: Create E2E test for full user journey
```

**Database Schema** (all run in parallel):
```bash
Task T044: Create authorization_tasks table schema
Task T045: Create collection_tasks table schema
Task T046: Create holdings table schema
Task T047: Create holding_snapshots table schema
```

**BFF Services** (all run in parallel after schema):
```bash
Task T060: Create authorization service
Task T061: Create collection service
Task T062: Create portfolio service
```

**Frontend Hooks** (all run in parallel):
```bash
Task T083: Create TanStack Query hooks for broker operations
Task T084: Create TanStack Query hooks for portfolio operations
Task T085: Create task polling hook
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T010)
2. Complete Phase 2: Foundational (T011-T040) - CRITICAL BLOCKER
3. Complete Phase 3: User Story 1 (T041-T090)
4. **STOP and VALIDATE**: Test User Story 1 independently with quickstart.md
5. Deploy MVP (apps/web + apps/bff + apps/engine)

**Estimated MVP Scope**: ~90 tasks (T001-T090)

### Incremental Delivery

1. Setup + Foundational (T001-T040) → Foundation ready (~40 tasks)
2. Add User Story 1 (T041-T090) → Test independently → **MVP RELEASE** (~50 tasks)
3. Add User Story 2 (T091-T108) → Test independently → **Version 1.1 RELEASE** (~18 tasks)
4. Add User Story 3 (T109-T136) → Test independently → **Version 1.2 RELEASE** (~28 tasks)
5. Add Polish (T137-T151) → **Version 1.3 RELEASE** (~15 tasks)

Each increment adds value without breaking previous stories.

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

1. **Team completes Setup + Foundational together** (T001-T040)
2. **Once T040 completes (Foundation checkpoint)**:
   - Developer A: User Story 1 (T041-T090) - MVP priority
   - Developer B: User Story 2 (T091-T108) - Can start in parallel
   - Developer C: User Story 3 (T109-T136) - Can start in parallel
3. Stories complete independently, integrate at the end

**Critical Success Factor**: Phase 2 (Foundational) MUST complete before any parallel story work begins.

---

## Task Count Summary

- **Phase 1 (Setup)**: 10 tasks
- **Phase 2 (Foundational)**: 30 tasks
- **Phase 3 (User Story 1)**: 50 tasks
- **Phase 4 (User Story 2)**: 18 tasks
- **Phase 5 (User Story 3)**: 28 tasks
- **Phase 6 (Polish)**: 15 tasks

**Total**: 151 tasks

**MVP Scope (Phases 1-3)**: 90 tasks
**Parallel Opportunities**: 54 tasks marked [P] (35.8% of total)

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story independently completable and testable
- Tests written first (TDD approach for core business logic)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Foundation (Phase 2) is critical blocker - must complete before stories
- Exchange rate persistence: USD/CNY and HKD/CNY stored daily; other pairs use latest rates
- JWT delegation tokens: 5-minute lifetime for Engine access
- Frontend polling: 2-5 seconds for task status updates
- All errors structured with error_code and message
- xstate for explicit state management (authorization and collection tasks)
