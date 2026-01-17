# Implementation Plan: Asset Management System

**Branch**: `002-asset-management-system` | **Date**: 2026-01-17 | **Spec**: [link to spec.md]
**Input**: Feature specification from `/specs/002-asset-management-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implementation of an asset management system with a modern web frontend and serverless backend. The system aggregates user asset data from multiple broker platforms, calculates gains, converts currencies, manages categories, and provides rebalancing recommendations. The architecture uses a pnpm monorepo with Turborepo for unified management of Web, BFF, and shared schemas/types. The frontend utilizes Vite+React+TypeScript with TanStack Router and Query, while the BFF runs on Cloudflare Workers with Hono framework. The system emphasizes type safety, explicit boundaries, and predictable architecture following the project constitution.

## Technical Context

**Language/Version**: TypeScript 5.x, JavaScript ES2022
**Primary Dependencies**:
- Web: Vite, React 18, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui, ky, Zustand, PWA tools
- BFF: Cloudflare Workers, Hono, Better Auth, Drizzle ORM, Cloudflare D1
**Storage**: Cloudflare D1 (SQL database), with Cloudflare's built-in caching mechanisms; Redis may be added later if performance monitoring indicates a need (RESOLVED: Initially relying on Cloudflare's caching solutions)
**Testing**: Vitest, React Testing Library, MSW for mocking
**Target Platform**: Web browsers (with PWA support), mobile-responsive
**Project Type**: Web application with BFF (Backend for Frontend)
**Performance Goals**:
- Dashboard loads in <3s (first meaningful paint)
- UI interactions respond in <100ms (perceived performance)
- Support for 10k+ assets per user with <2s data refresh
- API response time <500ms for 95% of requests
- Efficient data fetching with pagination/caching for large datasets
**Constraints**: Serverless limitations on Cloudflare Workers, mobile-first responsive design, offline capability via PWA
**Scale/Scope**: Multi-language support (Chinese/English), multi-currency support, real-time portfolio tracking

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Compliance Verification

**Principle 1 - Correctness Over Convenience**: ✅ COMPLIANT
- Using TypeScript with strict typing to prevent silent failures
- Explicit error handling in both Web and BFF layers
- No "magic defaults" in the architecture

**Principle 2 - Type Safety Is Mandatory**: ✅ COMPLIANT
- TypeScript used in both Web and BFF applications
- Generated API clients from OpenAPI specs for type safety
- Strict TypeScript configuration required

**Principle 3 - Explicit Boundaries and Ownership**: ✅ COMPLIANT
- Clear separation between Web frontend and BFF
- BFF serves as the sole API boundary for frontend
- Well-defined API contracts using OpenAPI specifications

**Principle 4 - Predictable and Boring Architecture**: ✅ COMPLIANT
- Using proven technologies (React, Hono, Drizzle ORM)
- Standard patterns (REST APIs, component-based UI)
- Avoiding framework magic or implicit control flow

**Principle 11 - Data Is the Source of Truth**: ✅ COMPLIANT
- Cloudflare D1 as the single source of truth
- Forward-only, reproducible migrations with Drizzle ORM
- No business logic relying on undocumented data assumptions

**Principle 22 - Monorepo with Turborepo and pnpm**: ✅ COMPLIANT
- Using pnpm monorepo with Turborepo for unified management
- Internal packages using JIT packaging approach

**Principle 26 - Build and Deployment Pipeline**: ✅ COMPLIANT
- Turborepo orchestrating builds, tests, and deployments
- Build caching enabled for optimized CI/CD performance

### Potential Concerns

- **Serverless Constraints**: Cloudflare Workers have limitations on execution time and memory that may impact complex calculations (RESOLVED: Complex calculations will be performed in smaller chunks or pre-calculated in scheduled jobs)
- **Caching Strategy**: Need to determine if additional caching layer (Redis) is required for performance (RESOLVED: Cloudflare's built-in caching mechanisms combined with D1's performance should be sufficient initially)

## Project Structure

### Documentation (this feature)

```text
specs/002-asset-management-system/
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
├── web/                 # Vite+React+TypeScript web application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route-level components
│   │   ├── routes/      # File-based routing definitions (TanStack Router)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Shared utilities and services
│   │   ├── types/       # Type definitions
│   │   └── assets/      # Static assets
│   ├── public/          # Public assets
│   ├── index.html       # Main HTML entry point
│   ├── vite.config.ts   # Vite configuration
│   ├── tsconfig.json    # TypeScript configuration
│   └── package.json
├── bff/                 # Cloudflare Workers BFF application
│   ├── src/
│   │   ├── routes/      # API route handlers (Hono)
│   │   ├── middleware/  # Authentication, validation, error handling
│   │   ├── services/    # Business logic implementations
│   │   ├── utils/       # Utility functions
│   │   ├── types/       # Type definitions
│   │   └── index.ts     # Entry point
│   ├── migrations/      # Database migration files (Drizzle)
│   ├── wrangler.toml    # Cloudflare Workers configuration
│   ├── package.json
│   └── tsconfig.json

packages/                # Shared internal packages (JIT packages)
├── types/               # Shared TypeScript types
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── schemas/             # Shared Zod schemas and validation rules
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── ui/                  # Shared UI components (shadcn/ui based)
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── config/              # Shared configuration
    ├── eslint/
    ├── prettier/
    ├── tailwind/
    ├── typescript/
    └── package.json

.storybook/              # Storybook configuration
tests/
├── e2e/                 # End-to-end tests
├── integration/         # Integration tests
└── unit/                # Unit tests
```

**Structure Decision**: Web application with BFF (Backend for Frontend) architecture using a pnpm monorepo managed by Turborepo. The structure separates concerns between frontend, backend, and shared packages while enabling efficient development and build processes through the monorepo setup. Shared packages use JIT packaging approach for on-demand publishing.

## Debugging Configuration

For proper debugging support, VSCode launch configurations will be added to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Web Application",
      "type": "pwa-chrome", // or "edge" for Microsoft Edge
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/apps/web",
      "sourceMapPathOverrides": {
        "src/*": "${webRoot}/src/*"
      },
      "skipFiles": [
        "<node_internals>/**"
      ]
    },
    {
      "name": "Debug BFF (Cloudflare Workers)",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/apps/bff",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["wrangler", "dev", "--port", "8787"],
      "port": 9229,
      "restart": true,
      "preLaunchTask": "npm: build-bff"
    }
  ],
  "compounds": [
    {
      "name": "Debug Full Application",
      "configurations": ["Debug Web Application", "Debug BFF"]
    }
  ]
}
```

## Security Considerations

- **Authentication & Authorization**: Using Better Auth for secure user authentication with proper session management
- **API Security**: All BFF endpoints implement proper authentication checks and input validation using Hono middleware
- **Data Protection**: Sensitive user data is encrypted at rest in Cloudflare D1 and in transit using HTTPS
- **Rate Limiting**: Implement rate limiting on API endpoints to prevent abuse
- **Input Sanitization**: All user inputs are validated and sanitized to prevent injection attacks
- **CORS Policy**: Proper CORS configuration to allow only authorized domains to access the API
- **Secret Management**: Environment variables and secrets are securely managed and never exposed to the client
- **Audit Logging**: Critical operations are logged for security monitoring and compliance

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
