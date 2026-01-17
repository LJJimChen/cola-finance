# Implementation Plan: Asset Management System

**Branch**: `003-asset-management-system` | **Date**: 2026-01-18 | **Spec**: [link](spec.md)
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The asset management system will be implemented as a web application with a React frontend and a Cloudflare Workers BFF (Backend for Frontend). The system will aggregate user holdings across multiple platforms, calculate performance, visualize allocation by category and currency, and support category-level rebalancing decisions. The frontend will be built with Vite + React + TypeScript using TanStack Router and Query, Tailwind CSS + shadcn/ui, and will support PWA functionality. The BFF will use Hono framework on Cloudflare Workers with Drizzle ORM and Cloudflare D1 for data persistence.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.x, JavaScript ES2022
**Primary Dependencies**:
- Frontend: Vite, React, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui, ky, Zustand, Storybook, MSW
- BFF: Hono, Better Auth, Drizzle ORM, Cloudflare Workers runtime
**Storage**: Cloudflare D1 SQL database with Drizzle ORM
**Testing**: Vitest/Jest for unit tests, Playwright for E2E tests, Storybook for component testing
**Target Platform**: Web browser (PWA), mobile-responsive, Cloudflare Workers environment
**Project Type**: Web application (frontend + BFF backend)
**Performance Goals**: Dashboard key metrics load within 3 seconds, support at least 10,000 assets per user with responsive UI, conversion accuracy maintained to 4 decimals
**Constraints**: <3s dashboard load time, <5s rebalancing recommendations, mobile usability across 320px–768px widths, 99.5% uptime for Dashboard and Portfolio viewing features
**Scale/Scope**: Support 10,000+ assets per user, 95% of users can reach Portfolio and view allocation within 2 minutes after first login

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **Correctness Over Convenience**: All critical financial calculations will be explicit and deterministic, with no silent failures or magic defaults. ✓ PASSED - Financial calculations will be implemented with explicit validation and error handling.
2. **Type Safety Is Mandatory**: Full TypeScript implementation with strict typing across both frontend and BFF layers. ✓ PASSED - TypeScript 5.x will be used with strict typing throughout the codebase.
3. **Explicit Boundaries and Ownership**: Clear separation between frontend and BFF responsibilities, with well-defined API contracts. ✓ PASSED - Well-defined OpenAPI contracts establish clear boundaries between frontend and BFF.
4. **Predictable and Boring Architecture**: Using proven technologies (React, Hono, Drizzle) rather than experimental approaches. ✓ PASSED - Established technologies selected for stability and predictability.
5. **Explicit Axes of Change**: Financial calculation logic will be isolated behind stable interfaces to allow for future algorithm changes. ✓ PASSED - Financial calculation services will be designed as replaceable units with stable interfaces.
6. **Controlled Growth of Business Logic**: Using plugin-oriented design for different asset types and calculation methods. ✓ PASSED - Services will be designed to accommodate new asset types and calculation methods without modifying existing code.
7. **Stable Dependency Direction**: Domain logic will not depend on UI or infrastructure details. ✓ PASSED - Clean architecture principles applied with domain layer independent of UI and infrastructure.
8. **Separation of Construction and Behavior**: Dependency injection will separate object creation from business logic. ✓ PASSED - DI container will be used to separate object construction from business logic.
9. **Replaceable Units and Plugin-Oriented Design**: Currency conversion and calculation algorithms will be designed as replaceable units. ✓ PASSED - Currency conversion and calculation services will be designed as pluggable modules.
10. **Pattern Discipline**: Only using design patterns that reduce coupling or clarify extension points. ✓ PASSED - Patterns selected based on their ability to reduce coupling and clarify extension points.
11. **Data Is the Source of Truth**: Database schema will be the single source of truth with forward-only migrations. ✓ PASSED - Drizzle ORM with forward-only migrations will maintain data integrity.
12. **Defensive Error Handling**: All errors will be handled explicitly with sufficient context for debugging. ✓ PASSED - Comprehensive error handling with proper logging and error context will be implemented.
13. **Testability as a Design Requirement**: Core business logic will be isolated from infrastructure concerns. ✓ PASSED - Business logic will be implemented in pure functions/services independent of infrastructure.
14. **Infrastructure as Code**: Cloudflare Workers configurations will be defined in code and version-controlled. ✓ PASSED - Wrangler.toml and deployment scripts will define infrastructure as code.
15. **Backward Compatibility and Change Discipline**: API versioning strategy will be implemented for public interfaces. ✓ PASSED - API versioning will be implemented following REST best practices.
16. **Documentation as Part of the System**: All functions will include proper documentation. ✓ PASSED - Documentation will be required for all functions following constitutional guidelines.
17. **Mandatory Function Documentation**: All public and domain functions will include full contract documentation. ✓ PASSED - All public and domain functions will include complete contract documentation.
18. **Function Contracts**: Documentation will include purpose, inputs, outputs, and side effects. ✓ PASSED - Function documentation will follow the required contract format.
19. **Documentation Quality Rules**: Comments will add semantic value beyond function signatures. ✓ PASSED - Documentation will be reviewed to ensure semantic value.
20. **Exceptions and Minimalism**: Documentation omissions will be justified. ✓ PASSED - Any documentation omissions will be explicitly justified.
21. **Documentation as an Evolution Tool**: Documentation will guide future extensions. ✓ PASSED - Documentation will be maintained as an evolution tool.
22. **Monorepo with Turborepo and pnpm**: Using pnpm monorepo with Turborepo for build orchestration. ✓ PASSED - pnpm monorepo with Turborepo configured as specified.
23. **Official Scaffolding Tools**: Using official tools like `pnpm create vite` and `pnpm create hono`. ✓ PASSED - Official scaffolding tools will be used for project creation.
26. **Build and Deployment Pipeline**: Turborepo will orchestrate all builds, tests, and deployments. ✓ PASSED - Turborepo configured to manage the complete pipeline.

## Project Structure

### Documentation (this feature)

```text
specs/003-asset-management-system/
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
├── web/                 # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route-specific components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Shared utilities and services
│   │   ├── routes/      # TanStack Router route definitions
│   │   ├── stores/      # Zustand stores for client state
│   │   └── types/       # TypeScript type definitions
│   ├── public/
│   ├── index.html
│   └── package.json
└── bff/                 # Backend for Frontend (Cloudflare Workers)
    ├── src/
    │   ├── routes/      # Hono API route handlers
    │   ├── middleware/  # Authentication, validation, error handling
    │   ├── services/    # Business logic implementations
    │   ├── db/          # Drizzle schema and queries
    │   ├── utils/       # Shared utilities
    │   └── types/       # TypeScript type definitions
    ├── wrangler.jsonc    # Cloudflare Workers configuration
    └── package.json
```

**Structure Decision**: Web application with separate frontend and BFF directories under the apps/ folder. This follows the monorepo guidelines with clear separation of concerns between the React frontend and the Cloudflare Workers BFF.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations require justification. All principles have been satisfied in the design.
