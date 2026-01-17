<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.0.0 (initial constitution)
- Modified principles: All principles newly defined
- Added sections: Core Principles, Extensibility and Evolution Rules, Quality/Data/Errors/Documentation, Technology Stack Requirements
- Removed sections: None (new constitution)
- Templates requiring updates: ⚠ pending review of .specify/templates/plan-template.md, .specify/templates/spec-template.md, .specify/templates/tasks-template.md
- Follow-up TODOs: None
-->
# Cola Finance Constitution

## Core Principles

### 1. Correctness Over Convenience
- Correct behavior is always more important than development speed.
- Silent failures, implicit fallbacks, and "magic defaults" are forbidden.
- All critical logic MUST be explicit, deterministic, and explainable.

### 2. Type Safety Is Mandatory
- TypeScript MUST be used in all JavaScript-capable environments in this repo.
- `any`, unsafe type assertions, and type suppression are disallowed unless explicitly justified.
- Public interfaces MUST expose precise, minimal, intention-revealing types.

### 3. Explicit Boundaries and Ownership
- Each module/package/service MUST have a clearly defined responsibility.
- Cross-boundary access MUST go through well-defined interfaces.
- Direct access to internal implementation details across boundaries is forbidden.

### 4. Predictable and Boring Architecture
- Prefer simple, well-understood patterns over clever or novel approaches.
- Avoid framework magic, reflection-based logic, and implicit control flow.
- Architectural decisions MUST be explainable in plain language.

## Extensibility and Evolution Rules

### 5. Explicit Axes of Change
- Every non-trivial module MUST identify its primary axis of change.
- Code MUST be structured so new variants can be added with minimal modification.
- Growth by adding new code is preferred over modifying existing code.

### 6. Controlled Growth of Business Logic
- Business rules MUST NOT grow through unbounded `if/else` or `switch` branching.
- Logic that varies by feature/type/scenario MUST be isolated behind stable interfaces.
- If a conditional is expected to grow, it MUST be refactored before growth occurs.

### 7. Stable Dependency Direction
- Stable core modules MUST NOT depend on volatile or feature-specific modules.
- Dependency direction MUST flow from policy → details via abstractions.
- Circular dependencies are forbidden.

### 8. Separation of Construction and Behavior
- Object creation/dependency wiring MUST be separated from business behavior.
- Dependency selection MUST NOT be interleaved with domain logic.
- Runtime behavior MUST NOT depend on hard-coded instantiation paths.

### 9. Replaceable Units and Plugin-Oriented Design
- Features expected to grow MUST be designed as replaceable units.
- Adding a new variant MUST NOT require modifying existing variants.
- Extension points MUST be explicit and intentional.

### 10. Pattern Discipline
- Design patterns are tools, not goals.
- Patterns may be used only when they reduce coupling or clarify extension points.
- Any chosen structure MUST be justifiable without naming the pattern.

## Quality, Data, Errors, and Documentation

### 11. Data Is the Source of Truth
- The database schema is the single source of truth.
- Migrations MUST be forward-only, reproducible, and reviewable.
- Destructive operations MUST include explicit safeguards.
- No business logic may rely on undocumented data assumptions.

### 12. Defensive Error Handling
- Errors MUST be handled explicitly and intentionally.
- Empty `catch` blocks and swallowed errors are forbidden.
- Errors MUST carry sufficient context for debugging and observability.

### 13. Testability as a Design Requirement
- Code that cannot be reasonably tested is considered incomplete.
- Core business logic MUST be isolated from infrastructure concerns.
- Tests MUST validate behavior, not implementation details.

### 14. Infrastructure as Code
- All infrastructure configurations MUST be defined in code.
- Cloudflare Workers configurations, environment variables, and deployment settings MUST be version-controlled.
- Infrastructure changes MUST follow the same review and testing process as application code.

### 15. Backward Compatibility and Change Discipline
- Breaking changes MUST be intentional, explicit, and documented.
- Public APIs and data contracts require versioning or migration strategies.
- Refactoring MUST NOT change externally observable behavior unless specified.

### 16. Documentation as Part of the System
- Important decisions MUST be recorded close to the code.
- Documentation MUST reflect actual behavior.
- Outdated or misleading documentation is considered a defect.

### 17. Mandatory Function Documentation
- Every function MUST have a comment explaining its intent (why it exists), not just what it does.
- Public, domain, or cross-boundary functions MUST include full contract documentation.

### 18. Function Contracts
Function documentation MUST state:
- Purpose and intent
- Input assumptions and preconditions
- Output guarantees
- Side effects (if any)
Implicit assumptions are forbidden.

### 19. Documentation Quality Rules
- Comments MUST add semantic value beyond the function name/signature.
- Redundant or self-evident comments are discouraged.
- Misleading or outdated comments are defects.

### 20. Exceptions and Minimalism
- Private utility functions MAY omit comments only if intent is unambiguous from naming.
- Thin wrappers MAY use brief annotations.
- Any omission of documentation MUST be justifiable in review.

### 21. Documentation as an Evolution Tool
- Function-level documentation is part of the system's design.
- Behavior changes MUST be accompanied by documentation updates.
- Documentation MUST guide future extension, not just current understanding.

## Technology Stack Requirements

### 22. Monorepo with Turborepo and pnpm
- All packages MUST be managed within a single Turborepo workspace.
- pnpm MUST be used as the package manager for all dependencies.
- Package dependencies MUST be declared explicitly in individual package.json files.

### 23. Official Scaffolding Tools
- Projects MUST be created using official scaffolding tools (e.g.pnpm create hono,pnpm create vite, @hono/cli, etc.) when available.
- Custom scaffolding is prohibited unless officially supported tools are inadequate.
- Generated code MUST comply with all constitutional principles.

### 26. Build and Deployment Pipeline
- Turborepo MUST orchestrate all builds, tests, and deployments.
- Build caching MUST be leveraged to optimize CI/CD performance.
- Deployment pipelines MUST be defined in code and version-controlled.
- Automated testing MUST pass before any deployment to production.

- Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.
- Always use /skill ui-ux-pro-max when implementing frontend components or pages.
- never read files under ./br-private
- always use the latest version of the technologies specified in this document.

## Governance
- This Constitution supersedes all other development practices in this repository.
- Amendments require explicit documentation, team approval, and migration planning.
- All pull requests and code reviews MUST verify compliance with these principles.
- Complexity must be justified with clear benefits and trade-offs.
- Use this document as the primary reference for development decisions.

**Version**: 1.0.0 | **Ratified**: 2026-01-15 | **Last Amended**: 2026-01-15
