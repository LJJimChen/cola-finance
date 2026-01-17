# Implementation Tasks: Asset Management System

**Feature**: Asset Management System (003-asset-management-system)  
**Created**: 2026-01-18  
**Input**: Feature specification from `/specs/003-asset-management-system/spec.md`

## Implementation Strategy

The Asset Management System will be implemented as a web application with a React frontend and a Cloudflare Workers BFF. The implementation will follow an incremental delivery approach, starting with the core dashboard functionality (User Story 1) as the MVP, followed by portfolio management (User Story 2), rebalancing features (User Story 3), and finally internationalization (User Story 4).

Each user story will be implemented as a complete, independently testable increment with all necessary components (models, services, endpoints, UI).

## Phase 1: Setup Tasks

**Goal**: Initialize the monorepo project structure with both frontend and BFF applications

- [X] T001 Create monorepo root directory structure with apps/, packages/, specs/ directories
- [X] T002 Initialize pnpm workspace with pnpm-workspace.yaml
- [X] T003 [P] Scaffold web application using `pnpm create vite` with React + TypeScript template
- [X] T004 [P] Scaffold BFF application using `pnpm create hono` with TypeScript template
- [X] T005 Configure shared linting and formatting tools (ESLint, Prettier) for the monorepo
- [X] T006 Set up Turborepo configuration in turbo.json
- [X] T007 [P] Install common dependencies in web app (React, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui, ky, Zustand)
- [X] T008 [P] Install common dependencies in BFF (Hono, Better Auth, Drizzle ORM, @cloudflare/workers-types)
- [X] T009 Create initial README.md for the monorepo
- [X] T010 Set up basic CI/CD configuration files

## Phase 2: Foundational Tasks

**Goal**: Establish foundational components that all user stories depend on

- [X] T011 Set up Drizzle ORM with Cloudflare D1 in BFF
- [X] T012 Create database schema based on data-model.md in apps/bff/src/db/schema.ts
- [X] T013 Implement authentication using Better Auth in BFF
- [X] T014 Set up database migration scripts in BFF
- [X] T015 Create shared types directory in both web and BFF apps
- [X] T016 Implement API client generation from OpenAPI spec using ky
- [X] T017 Set up internationalization (i18n) infrastructure for ZH/EN support
- [X] T018 Implement currency conversion service in BFF
- [X] T019 Create base UI components in web app (Layout, Header, Navigation)
- [X] T020 Set up PWA configuration in web app

## Phase 3: User Story 1 - Dashboard Overview (Priority: P1)

**Goal**: Implement dashboard functionality showing portfolio overview with total value, daily profit, and annual return

**Independent Test Criteria**: User can log in and view dashboard showing totals, daily profit, annual return, charts, and allocation

- [X] T021 [US1] Create PortfolioService in BFF to calculate portfolio metrics
- [X] T022 [US1] Implement GET /portfolios/{portfolioId}/dashboard endpoint in BFF
- [X] T023 [US1] Create PortfolioHistoryService in BFF for historical data
- [X] T024 [US1] Implement ExchangeRateService in BFF for currency conversion
- [X] T025 [US1] Create DashboardPage component in web app
- [X] T026 [US1] Implement dashboard data fetching hook using TanStack Query
- [X] T027 [US1] Create chart components for portfolio performance visualization
- [X] T028 [US1] Implement currency conversion display in dashboard
- [X] T029 [US1] Add loading and error states to dashboard UI
- [X] T030 [US1] Create mock data for dashboard testing

## Phase 4: User Story 2 - Portfolio Management (Priority: P1)

**Goal**: Implement portfolio management functionality showing assets organized by category with allocation percentages, profit amounts, and yields

**Independent Test Criteria**: User can navigate to Portfolio page and view categorized assets with %/profit/yield and holdings list

- [X] T031 [US2] Create AssetService in BFF for asset management
- [X] T032 [US2] Create CategoryService in BFF for category management
- [X] T033 [US2] Implement GET /portfolios/{portfolioId}/allocation endpoint in BFF
- [X] T034 [US2] Implement GET /portfolios/{portfolioId}/assets endpoint in BFF
- [X] T035 [US2] Implement GET /portfolios/{portfolioId}/categories endpoint in BFF
- [X] T036 [US2] Create POST /portfolios/{portfolioId}/categories endpoint in BFF
- [X] T037 [US2] Create PortfolioPage component in web app
- [X] T038 [US2] Implement asset list component with category grouping
- [X] T039 [US2] Create allocation visualization components (pie charts, bars)
- [X] T040 [US2] Implement asset detail view with profit/yield calculations
- [X] T041 [US2] Add category management UI (create, edit, assign assets)

## Phase 5: User Story 3 - Asset Rebalancing (Priority: P2)

**Goal**: Implement rebalancing functionality allowing users to set target allocation percentages and see deviations from targets with recommendations

**Independent Test Criteria**: User can set target allocations and view deviations/recommendations

- [ ] T042 [US3] Create RebalancingService in BFF for calculating recommendations
- [ ] T043 [US3] Implement GET /portfolios/{portfolioId}/rebalance endpoint in BFF
- [ ] T044 [US3] Implement PUT /categories/{categoryId} endpoint in BFF for target allocation updates
- [ ] T045 [US3] Create rebalancing algorithm in BFF for generating recommendations
- [ ] T046 [US3] Create RebalancePage component in web app
- [ ] T047 [US3] Implement target allocation input UI
- [ ] T048 [US3] Create deviation visualization components
- [ ] T049 [US3] Implement recommendation display with suggested actions
- [ ] T050 [US3] Add rebalancing simulation functionality

## Phase 6: User Story 4 - Multi-language Support (Priority: P1)

**Goal**: Implement language switching functionality between Chinese and English interfaces

**Independent Test Criteria**: User can switch languages and UI updates within 1 second without reload

- [ ] T051 [US4] Set up i18n infrastructure with language detection
- [ ] T052 [US4] Create language context and provider in web app
- [ ] T053 [US4] Implement language switching functionality
- [ ] T054 [US4] Create ZH/EN translation files
- [ ] T055 [US4] Translate all UI components to both languages
- [ ] T056 [US4] Implement number and currency formatting for different locales
- [ ] T057 [US4] Add language preference saving to user profile
- [ ] T058 [US4] Create language switcher component in header
- [ ] T059 [US4] Optimize language switching performance to meet 1-second requirement

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Complete the implementation with polish, testing, and performance optimizations

- [ ] T060 Implement comprehensive error handling and error boundary components
- [ ] T061 Add loading skeletons and performance optimizations
- [ ] T062 Create comprehensive test suite (unit, integration, e2e)
- [ ] T063 Implement responsive design for mobile-first experience
- [ ] T064 Add accessibility features and ARIA attributes
- [ ] T065 Optimize bundle sizes and implement code splitting
- [ ] T066 Create documentation for the API and frontend components
- [ ] T067 Set up monitoring and logging infrastructure
- [ ] T068 Perform security audit and penetration testing
- [ ] T069 Conduct performance testing to meet success criteria

## Dependencies

### User Story Completion Order
1. User Story 1 (Dashboard Overview) - Foundation for viewing portfolio data
2. User Story 2 (Portfolio Management) - Builds on dashboard with detailed asset views
3. User Story 4 (Multi-language Support) - Can be implemented in parallel with other stories
4. User Story 3 (Asset Rebalancing) - Depends on portfolio management features

### Technical Dependencies
- Foundational tasks (Phase 2) must complete before any user story implementation
- Database schema (T012) must be completed before any service implementation
- Authentication (T013) must be in place before protected endpoints
- API client generation (T016) enables frontend-backend communication

## Parallel Execution Opportunities

### Within Each User Story
- UI component development can happen in parallel with backend service development
- Different services within a story can be developed in parallel if they operate on different entities
- Frontend and backend teams can work simultaneously using agreed-upon contracts

### Across User Stories
- User Story 4 (Multi-language) can be implemented in parallel with other stories since it's mostly UI-focused
- Services for different entities (AssetService, CategoryService, etc.) can be developed in parallel

## MVP Scope

The MVP will include User Story 1 (Dashboard Overview) with basic portfolio metrics and visualization. This provides immediate value to users by showing their portfolio performance at a glance.