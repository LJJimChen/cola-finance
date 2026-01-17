# Tasks: Asset Management System

**Input**: Design documents from `/specs/002-asset-management-system/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo with pnpm and Turborepo**: `apps/web/`, `apps/bff/`, `packages/` at repository root
- **Web app**: `apps/web/src/`
- **BFF**: `apps/bff/src/`
- **Shared packages**: `packages/types/src/`, `packages/schemas/src/`, etc.

<!--
  ============================================================================
  IMPORTANT: The tasks below are ACTUAL tasks based on the design documents.

  Tasks are organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create pnpm monorepo structure with Turborepo configuration
- [X] T002 Initialize shared configuration packages in packages/config/
- [X] T003 [P] Initialize web application in apps/web with Vite+React+TypeScript
- [X] T004 [P] Initialize BFF application in apps/bff with Cloudflare Workers and Hono
- [X] T005 [P] Setup shared types package in packages/types
- [X] T006 [P] Setup shared schemas package in packages/schemas
- [X] T007 Configure ESLint, Prettier, and TypeScript across all packages
- [X] T008 Setup Vitest testing framework across all packages
- [X] T009 Configure VSCode debugging settings per plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T010 Setup Cloudflare D1 database configuration in BFF
- [X] T011 [P] Implement Drizzle ORM schema for User entity in apps/bff/src/db/schema.ts
- [X] T012 [P] Implement Drizzle ORM schema for Asset entity in apps/bff/src/db/schema.ts
- [X] T013 [P] Implement Drizzle ORM schema for Category entity in apps/bff/src/db/schema.ts
- [X] T014 [P] Implement Drizzle ORM schema for ExchangeRate entity in apps/bff/src/db/schema.ts
- [X] T015 [P] Implement Drizzle ORM schema for PortfolioHistory entity in apps/bff/src/db/schema.ts
- [X] T016 Setup database migration framework with Drizzle Kit in apps/bff
- [X] T017 [P] Implement authentication framework with Better Auth in apps/bff/src/auth/
- [X] T018 [P] Setup API routing structure with Hono in apps/bff/src/routes/
- [X] T019 Create base API middleware for authentication and validation in apps/bff/src/middleware/
- [X] T020 Configure environment variables and configuration management in apps/bff
- [X] T021 [P] Generate API client types from OpenAPI spec in packages/types/src/api.d.ts
- [X] T022 Setup shared UI components package in packages/ui with shadcn/ui
- [X] T023 Implement currency conversion utilities in apps/bff/src/utils/currency.ts
- [X] T024 Setup internationalization framework in apps/web/src/i18n/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Dashboard Overview (Priority: P1) 🎯 MVP

**Goal**: Implement dashboard that displays total assets, daily gains/losses, annual returns, and asset allocation charts

**Independent Test**: Can be fully tested by displaying mock portfolio data and verifying that all key metrics (total assets, daily gains, annual returns) and charts are displayed correctly, delivering immediate value to users.

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T025 [P] [US1] Contract test for /dashboard endpoint in apps/bff/tests/contract/dashboard.test.ts (Note: Tests created but require additional mocking setup to pass)
- [X] T026 [P] [US1] Integration test for dashboard data retrieval in apps/bff/tests/integration/dashboard.test.ts

### Implementation for User Story 1

- [X] T027 [P] [US1] Implement dashboard data aggregation service in apps/bff/src/services/dashboard-service.ts
- [X] T028 [US1] Implement /dashboard GET endpoint in apps/bff/src/routes/dashboard.ts
- [X] T029 [P] [US1] Create DashboardPage component in apps/web/src/pages/DashboardPage.tsx
- [X] T030 [P] [US1] Create TotalAssetsCard component in apps/web/src/components/dashboard/TotalAssetsCard.tsx
- [X] T031 [P] [US1] Create DailyGainLossCard component in apps/web/src/components/dashboard/DailyGainLossCard.tsx
- [X] T032 [P] [US1] Create AnnualReturnCard component in apps/web/src/components/dashboard/AnnualReturnCard.tsx
- [X] T033 [P] [US1] Create AssetAllocationChart component in apps/web/src/components/dashboard/AssetAllocationChart.tsx
- [X] T034 [US1] Implement currency conversion logic for dashboard values in apps/bff/src/services/currency-service.ts
- [X] T035 [US1] Connect dashboard API to frontend using TanStack Query in apps/web/src/hooks/useDashboard.ts
- [X] T036 [US1] Add responsive design for dashboard components per mobile-first approach

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Portfolio Management (Priority: P1)

**Goal**: Implement portfolio view that displays assets organized by categories with percentages, gains, and yields

**Independent Test**: Can be fully tested by displaying mock portfolio data grouped by categories, showing asset percentages, gains, and yields, delivering value by organizing complex data into understandable views.

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [X] T037 [P] [US2] Contract test for /portfolio endpoint in apps/bff/tests/contract/portfolio.test.ts
- [X] T038 [P] [US2] Integration test for portfolio data retrieval in apps/bff/tests/integration/portfolio.test.ts

### Implementation for User Story 2

- [X] T039 [P] [US2] Implement portfolio data aggregation service in apps/bff/src/services/portfolio-service.ts
- [X] T040 [US2] Implement /portfolio GET endpoint in apps/bff/src/routes/portfolio.ts
- [X] T041 [P] [US2] Create PortfolioPage component in apps/web/src/pages/PortfolioPage.tsx
- [X] T042 [P] [US2] Create CategoryCard component in apps/web/src/components/portfolio/CategoryCard.tsx
- [X] T043 [P] [US2] Create AssetList component in apps/web/src/components/portfolio/AssetList.tsx
- [X] T044 [P] [US2] Create AssetItem component in apps/web/src/components/portfolio/AssetItem.tsx
- [X] T045 [US2] Implement category allocation calculation logic in apps/bff/src/services/allocation-service.ts
- [X] T046 [US2] Connect portfolio API to frontend using TanStack Query in apps/web/src/hooks/usePortfolio.ts
- [X] T047 [US2] Add currency conversion for portfolio values in apps/bff/src/services/currency-service.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 7 - Multi-language Support (Priority: P1)

**Goal**: Implement language switching between Chinese and English for the entire interface

**Independent Test**: Can be fully tested by switching between languages and verifying that all interface elements are properly translated, delivering value by making the system accessible to a wider audience.

### Tests for User Story 7 (OPTIONAL - only if tests requested) ⚠️

- [ ] T048 [P] [US7] Contract test for language preference update in apps/bff/tests/contract/user-profile.test.ts
- [ ] T049 [P] [US7] Integration test for multi-language functionality in apps/web/tests/integration/i18n.test.ts

### Implementation for User Story 7

- [ ] T050 [P] [US7] Implement language preference update in /users/profile PUT endpoint in apps/bff/src/routes/users.ts
- [ ] T051 [P] [US7] Create Chinese translation files in apps/web/src/locales/zh.json, no need to add content for now
- [ ] T052 [P] [US7] Create English translation files in apps/web/src/locales/en.json, no need to add content for now 
- [ ] T053 [P] [US7] Create LanguageSwitcher component in apps/web/src/components/LanguageSwitcher.tsx
- [ ] T054 [US7] Integrate i18next with React components in apps/web/src/i18n/index.ts
- [ ] T055 [US7] Translate dashboard components to both languages in apps/web/src/
- [ ] T056 [US7] Translate portfolio components to both languages in apps/web/src/
- [ ] T057 [US7] Update navigation and common UI elements with translations

**Checkpoint**: At this point, User Stories 1, 2, AND 7 should all work independently

---

## Phase 6: User Story 4 - Currency Conversion (Priority: P2)

**Goal**: Implement currency conversion functionality to display all asset values in a target currency

**Independent Test**: Can be fully tested by converting mock assets in different currencies to a target currency using stored exchange rates, delivering value by providing unified wealth visibility.

### Tests for User Story 4 (OPTIONAL - only if tests requested) ⚠️

- [ ] T058 [P] [US4] Contract test for /exchange-rates endpoint in apps/bff/tests/contract/exchange-rates.test.ts
- [ ] T059 [P] [US4] Integration test for currency conversion in apps/bff/tests/integration/currency-conversion.test.ts

### Implementation for User Story 4

- [ ] T060 [P] [US4] Implement ExchangeRate CRUD operations in apps/bff/src/services/exchange-rate-service.ts
- [ ] T061 [US4] Implement /exchange-rates GET endpoint in apps/bff/src/routes/exchange-rates.ts
- [ ] T062 [P] [US4] Create ExchangeRate model and database operations in apps/bff/src/db/exchange-rate.ts
- [ ] T063 [US4] Implement currency conversion algorithm in apps/bff/src/utils/currency-converter.ts
- [ ] T064 [US4] Add exchange rate storage for USD/CNY and HKD/CNY as required in spec.md
- [ ] T065 [US4] Update dashboard service to support currency conversion parameter in apps/bff/src/services/dashboard-service.ts
- [ ] T066 [US4] Update portfolio service to support currency conversion parameter in apps/bff/src/services/portfolio-service.ts
- [ ] T067 [US4] Create CurrencySelector component in apps/web/src/components/CurrencySelector.tsx

**Checkpoint**: At this point, User Stories 1, 2, 4, AND 7 should all work independently

---

## Phase 7: User Story 3 - Asset Rebalancing (Priority: P2)

**Goal**: Implement rebalancing recommendations based on target allocations and current portfolio deviation

**Independent Test**: Can be fully tested by allowing users to set target allocations and calculating deviation metrics, delivering value by providing actionable insights for portfolio adjustments.

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T068 [P] [US3] Contract test for /rebalance endpoint in apps/bff/tests/contract/rebalance.test.ts
- [ ] T069 [P] [US3] Integration test for rebalancing calculations in apps/bff/tests/integration/rebalance.test.ts

### Implementation for User Story 3

- [ ] T070 [P] [US3] Implement rebalancing calculation algorithm in apps/bff/src/services/rebalance-service.ts
- [ ] T071 [US3] Implement /rebalance GET endpoint in apps/bff/src/routes/rebalance.ts
- [ ] T072 [P] [US3] Create RebalancePage component in apps/web/src/pages/RebalancePage.tsx
- [ ] T073 [P] [US3] Create RebalanceRecommendationCard component in apps/web/src/components/rebalance/RebalanceRecommendationCard.tsx
- [ ] T074 [P] [US3] Create RebalanceSummary component in apps/web/src/components/rebalance/RebalanceSummary.tsx
- [ ] T075 [US3] Connect rebalance API to frontend using TanStack Query in apps/web/src/hooks/useRebalance.ts
- [ ] T076 [US3] Implement rebalancing logic considering category-level allocations only per spec.md

**Checkpoint**: At this point, User Stories 1, 2, 3, 4, AND 7 should all work independently

---

## Phase 8: User Story 6 - Performance Tracking (Priority: P2)

**Goal**: Implement historical trends of total assets and returns with chart visualization

**Independent Test**: Can be fully tested by displaying historical data in chart form, delivering value by providing visual insights into performance trends.

### Tests for User Story 6 (OPTIONAL - only if tests requested) ⚠️

- [ ] T077 [P] [US6] Contract test for /history/portfolio endpoint in apps/bff/tests/contract/history.test.ts
- [ ] T078 [P] [US6] Integration test for portfolio history retrieval in apps/bff/tests/integration/history.test.ts

### Implementation for User Story 6

- [ ] T079 [P] [US6] Implement PortfolioHistory CRUD operations in apps/bff/src/services/portfolio-history-service.ts
- [ ] T080 [US6] Implement /history/portfolio GET endpoint in apps/bff/src/routes/history.ts
- [ ] T081 [P] [US6] Create PortfolioHistory model and database operations in apps/bff/src/db/portfolio-history.ts
- [ ] T082 [P] [US6] Create PortfolioHistoryChart component in apps/web/src/components/history/PortfolioHistoryChart.tsx
- [ ] T083 [P] [US6] Create ReturnChart component in apps/web/src/components/history/ReturnChart.tsx
- [ ] T084 [US6] Implement date range filtering for history data in apps/bff/src/services/portfolio-history-service.ts
- [ ] T085 [US6] Connect history API to frontend using TanStack Query in apps/web/src/hooks/usePortfolioHistory.ts
- [ ] T086 [US6] Add chart controls for different time periods in apps/web/src/components/history/ChartControls.tsx

**Checkpoint**: At this point, User Stories 1, 2, 3, 4, 6, AND 7 should all work independently

---

## Phase 9: User Story 5 - Custom Categories (Priority: P3)

**Goal**: Allow users to create custom asset categories beyond predefined ones

**Independent Test**: Can be fully tested by allowing users to create, modify, and assign assets to custom categories, delivering value by providing personalized portfolio organization.

### Tests for User Story 5 (OPTIONAL - only if tests requested) ⚠️

- [ ] T087 [P] [US5] Contract test for /categories endpoints in apps/bff/tests/contract/categories.test.ts
- [ ] T088 [P] [US5] Integration test for custom category functionality in apps/bff/tests/integration/categories.test.ts

### Implementation for User Story 5

- [ ] T089 [P] [US5] Enhance Category CRUD operations to support custom categories in apps/bff/src/services/category-service.ts
- [ ] T090 [US5] Update /categories endpoints to handle custom category creation in apps/bff/src/routes/categories.ts
- [ ] T091 [P] [US5] Create CategoryManagement component in apps/web/src/components/categories/CategoryManagement.tsx
- [ ] T092 [P] [US5] Create AddCategoryModal component in apps/web/src/components/categories/AddCategoryModal.tsx
- [ ] T093 [US5] Implement validation to prevent deletion of predefined categories in apps/bff/src/services/category-service.ts
- [ ] T094 [US5] Add category assignment functionality to asset management in apps/bff/src/services/asset-service.ts
- [ ] T095 [US5] Connect category management to frontend using TanStack Query in apps/web/src/hooks/useCategories.ts

**Checkpoint**: At this point, all user stories should be independently functional

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T096 [P] Add comprehensive error handling and user-friendly messages across all components
- [ ] T097 [P] Implement loading states and skeleton screens for better UX
- [ ] T098 Add PWA functionality with service workers in apps/web
- [ ] T099 [P] Add comprehensive logging for critical operations in apps/bff/src/middleware/logging.ts
- [ ] T100 [P] Add rate limiting to API endpoints in apps/bff/src/middleware/rate-limit.ts
- [ ] T101 [P] Add security headers and CORS configuration in apps/bff/src/middleware/security.ts
- [ ] T102 [P] Add comprehensive unit tests for all services in apps/bff/tests/unit/
- [ ] T103 [P] Add end-to-end tests for critical user journeys in tests/e2e/
- [ ] T104 [P] Documentation updates in docs/
- [ ] T105 Performance optimization across all stories
- [ ] T106 Security hardening across all components
- [ ] T107 Run quickstart.md validation to ensure smooth setup experience

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 7 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Builds on US1/US2 by adding currency conversion
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - May integrate with US2 for rebalancing
- **User Story 6 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 for historical data
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - May integrate with US2 for custom categories

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for /dashboard endpoint in apps/bff/tests/contract/dashboard.test.ts"
Task: "Integration test for dashboard data retrieval in apps/bff/tests/integration/dashboard.test.ts"

# Launch all components for User Story 1 together:
Task: "Create DashboardPage component in apps/web/src/pages/DashboardPage.tsx"
Task: "Create TotalAssetsCard component in apps/web/src/components/dashboard/TotalAssetsCard.tsx"
Task: "Create DailyGainLossCard component in apps/web/src/components/dashboard/DailyGainLossCard.tsx"
Task: "Create AnnualReturnCard component in apps/web/src/components/dashboard/AnnualReturnCard.tsx"
Task: "Create AssetAllocationChart component in apps/web/src/components/dashboard/AssetAllocationChart.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, and 7 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Dashboard)
4. Complete Phase 4: User Story 2 (Portfolio)
5. Complete Phase 5: User Story 7 (Multi-language)
6. **STOP and VALIDATE**: Test User Stories 1, 2, and 7 independently
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 7 → Test independently → Deploy/Demo (MVP!)
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 3 → Test independently → Deploy/Demo
7. Add User Story 6 → Test independently → Deploy/Demo
8. Add User Story 5 → Test independently → Deploy/Demo
9. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Dashboard)
   - Developer B: User Story 2 (Portfolio)
   - Developer C: User Story 7 (Multi-language)
3. Additional developers can work on lower priority stories:
   - Developer D: User Story 4 (Currency Conversion)
   - Developer E: User Story 3 (Rebalancing)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence