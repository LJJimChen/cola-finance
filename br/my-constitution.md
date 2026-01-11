# speckit.constitution

This project follows a strict engineering-first constitution.
All design, implementation, and refactoring decisions must comply with the principles below.

## Project Intent:
- Build a long-lived, maintainable, and evolvable system rather than a short-term demo
- Optimize for correctness, clarity, and extensibility
- Minimize hidden complexity and implicit behavior
- Ensure the system can grow by addition rather than modification

## Core Engineering Principles

1. Correctness Over Convenience
- Correct behavior is always more important than development speed
- Silent failures, implicit fallbacks, and magic defaults are forbidden
- All critical logic must be explicit, deterministic, and explainable

2. Type Safety Is Mandatory
- TypeScript must be used in all JavaScript-capable environments
- `any`, unsafe type assertions, and type suppression are disallowed unless explicitly justified
- Public interfaces must expose precise, minimal, and intention-revealing types

3. Explicit Boundaries and Ownership
- Each module, package, or service must have a clearly defined responsibility
- Cross-boundary access must go through well-defined interfaces
- Direct access to internal implementation details is forbidden

4. Predictable and Boring Architecture
- Prefer simple, well-understood patterns over clever or novel approaches
- Avoid framework magic, reflection-based logic, and implicit control flow
- Architectural decisions must be explainable in plain language

## Extensibility and Evolution Rules

5. Explicit Axes of Change
- Every non-trivial module must clearly identify its primary axis of change
- Code must be structured so that new variants can be added with minimal modification to existing code
- Growth by adding new code is preferred over modifying existing code

6. Controlled Growth of Business Logic
- Business rules must not grow through unbounded if/else or switch branching
- Conditional logic that varies by feature, type, or scenario must be isolated behind stable interfaces
- If a conditional is expected to grow, it must be refactored before growth occurs

7. Stable Dependency Direction
- Stable core modules must not depend on volatile or feature-specific modules
- Dependency direction must always flow from high-level policy to low-level details via abstractions
- Circular dependencies are forbidden

8. Separation of Construction and Behavior
- Object creation and dependency wiring must be separated from business behavior
- Dependency selection must not be interleaved with domain logic
- Runtime behavior must not depend on hard-coded instantiation paths

9. Replaceable Units and Plugin-Oriented Design
- Features that are expected to grow must be designed as replaceable units
- Adding a new variant must not require modifying existing variants
- Extension points must be explicit, intentional, and documented

10. Pattern Discipline
- Design patterns are tools, not goals
- Patterns may be used only when they reduce coupling or clarify extension points
- Any chosen structure must be justifiable without naming the pattern itself

## Data, Errors, and Quality
- Database schema is the single source of truth
- Migrations must be forward-only, reproducible, and reviewable
- Destructive operations require explicit safeguards
- No business logic may rely on undocumented data assumptions

12. Defensive Error Handling
- Errors must be handled explicitly and intentionally
- No empty catch blocks or swallowed errors are allowed
- Errors must carry sufficient context for debugging and observability

13. Testability as a Design Requirement
- Code that cannot be reasonably tested is considered incomplete
- Core business logic must be isolated from infrastructure concerns
- Tests must validate behavior, not implementation details

14. Controlled Dependencies
- Introducing a new dependency requires clear technical justification
- Prefer fewer, well-maintained libraries over many small or experimental ones
- Dependencies that introduce global side effects are strongly discouraged

## Change Management and Documentation

15. Backward Compatibility and Change Discipline
- Breaking changes must be intentional, explicit, and documented
- Public APIs and data contracts require versioning or migration strategies
- Refactoring must not change externally observable behavior unless specified

16. Documentation as Part of the System
- Important decisions must be recorded close to the code
- README and inline documentation must reflect actual behavior
- Outdated or misleading documentation is considered a defect

Documentation and Function-Level Contracts

17. Mandatory Function Documentation
- Every function must have an accompanying comment that explains its intent
- Comments must describe *why* the function exists, not restate *what* the code does
- Public, domain, or cross-boundary functions require explicit documentation

18. Function Contracts
- Function documentation must clearly state:
  - Purpose and intent
  - Input assumptions and preconditions
  - Output guarantees
  - Side effects, if any
- Implicit assumptions are forbidden

19. Documentation Quality Rules
- Comments must add semantic value beyond the function name and signature
- Redundant or self-evident comments are discouraged
- Misleading or outdated comments are considered defects

20. Exceptions and Minimalism
- Private utility functions may use minimal or no comments only if their intent is unambiguous from naming alone
- Thin wrappers may use brief annotations instead of full documentation
- Any omission of documentation must be justifiable during code review

21. Documentation as an Evolution Tool
- Function-level documentation is part of the system’s design, not an afterthought
- Changes in behavior must be accompanied by updates to the corresponding documentation
- Documentation must guide future extension, not just current understanding

## Non-Goals

- Chasing trends or experimental technologies without clear benefit
- Premature optimization or speculative scalability
- Clever solutions that reduce readability, predictability, or extensibility

## Definition of Done

- Code compiles without warnings
- Types are sound, precise, and meaningful
- Error cases are explicitly handled
- Extension points (if any) are documented
- Behavior is testable and tested where appropriate
- The change can be clearly explained and justified to another engineer