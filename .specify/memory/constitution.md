<!--
Sync Impact Report

- Version change: N/A (template) → 1.0.0
- Modified principles: Replaced template placeholders with 21 concrete, enforceable principles
- Added sections:
  - Extensibility and Evolution Rules
  - Quality, Data, Errors, and Documentation
  - System Architecture Constraints
  - Non-Goals
  - Definition of Done
- Removed sections: None (filled placeholders and removed template comments)
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/tasks-template.md
  - ⚠️ .specify/templates/spec-template.md (no change required)
  - ⚠️ .specify/templates/checklist-template.md (no change required)
- Follow-up TODOs: None
-->

# Asset Management System (资产管理系统) Constitution

## Core Principles

### 1. Correctness Over Convenience

- Correct behavior is always more important than development speed.
- Silent failures, implicit fallbacks, and “magic defaults” are forbidden.
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

### 14. Controlled Dependencies

- Introducing a new dependency requires clear technical justification.
- Prefer fewer, well-maintained libraries over many small/experimental ones.
- Dependencies that introduce global side effects are strongly discouraged.

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

- Function-level documentation is part of the system’s design.
- Behavior changes MUST be accompanied by documentation updates.
- Documentation MUST guide future extension, not just current understanding.

### System Architecture Constraints (Project-Specific)

These constraints are treated as non-negotiable boundaries unless explicitly amended:

- The **BFF (Serverless)** is the only API boundary exposed to the frontend.
- The **Engine (stateful service)** owns long-lived state, browser automation, and task execution.
- The **frontend MUST NOT** directly access Engine internal APIs.
- The **database** is the only authoritative source for system state and computed results.
- The system MUST NOT store broker usernames/passwords.
- Human-in-the-loop flows (e.g., captcha/login) MUST be auditable and explicitly modeled in task state.

### Non-Goals

- Chasing trends or experimental technologies without clear benefit.
- Premature optimization or speculative scalability.
- Clever solutions that reduce readability, predictability, or extensibility.

### Definition of Done

- Code compiles without warnings.
- Types are sound, precise, and meaningful.
- Error cases are explicitly handled.
- Extension points (if any) are documented.
- Behavior is testable and tested where appropriate.
- The change can be clearly explained and justified to another engineer.

## Governance

- This constitution supersedes local conventions, ad-hoc practices, and tooling defaults.
- Any change that violates these principles MUST be treated as an exception and documented.

### Amendments

- Amendments MUST be proposed via a pull request that:
  - States the problem being solved and why existing principles are insufficient.
  - Includes migration strategy if the change affects public APIs, data, or workflows.
  - Updates dependent templates/guidance where applicable.

### Versioning Policy

- The constitution uses semantic versioning:
  - **MAJOR**: backward-incompatible governance/principle removals or redefinitions.
  - **MINOR**: new principles/sections, or materially expanded guidance.
  - **PATCH**: clarifications, wording improvements, typo fixes.

### Compliance Expectations

- Specs/plans MUST include a “Constitution Check” gate and explicitly note any exceptions.
- Code reviews MUST reject:
  - Hidden control flow and magic defaults
  - Unjustified `any` or type suppression
  - Swallowed errors / missing error context
  - Unowned cross-boundary dependencies
  - Missing contract documentation for public/domain/cross-boundary functions

**Version**: 1.0.0 | **Ratified**: 2026-01-11 | **Last Amended**: 2026-01-11
