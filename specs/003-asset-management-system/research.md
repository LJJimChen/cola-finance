# Research Summary: Asset Management System

## Technology Decisions

### Frontend Framework
**Decision**: Vite + React + TypeScript with TanStack Router and TanStack Query
**Rationale**: 
- Vite provides fast development experience with hot module replacement
- React is mature and widely adopted with strong ecosystem
- TypeScript ensures type safety as required by the constitution
- TanStack Router offers file-based routing which aligns with the requirements
- TanStack Query provides excellent server state management for API calls

**Alternatives considered**:
- Next.js: More complex than needed for this use case
- Angular: Would require more boilerplate and learning curve
- Vue: Less ecosystem maturity for financial applications

### Styling Solution
**Decision**: Tailwind CSS + shadcn/ui
**Rationale**:
- Tailwind CSS provides utility-first approach that speeds development
- shadcn/ui provides accessible, customizable UI components
- Both integrate well with React and TypeScript
- Enables rapid UI development while maintaining consistency

**Alternatives considered**:
- Styled-components: Would add complexity with CSS-in-JS
- Material UI: Too opinionated and heavy for this use case
- Custom CSS: Would require more time to implement consistently

### HTTP Client
**Decision**: ky (based on fetch)
**Rationale**:
- Lightweight and modern HTTP client
- Works well with TypeScript
- Better API than raw fetch
- Can be combined with OpenAPI generator for type-safe API calls

**Alternatives considered**:
- axios: More features but heavier, CommonJS issues with ESM
- fetch: Native but requires more boilerplate
- SWR: More focused on caching than ky

### State Management
**Decision**: Zustand for client-side state
**Rationale**:
- Lightweight solution for global state needs
- Simpler than Redux for this use case
- Good TypeScript support
- Only used for少量 global, non-service-side state as specified

**Alternatives considered**:
- Redux Toolkit: More complex than needed
- Context API: Could become unwieldy for complex state
- Jotai/Recoil: Additional learning curve

### Backend Framework
**Decision**: Hono for Cloudflare Workers
**Rationale**:
- Lightweight and fast framework designed for serverless environments
- Excellent TypeScript support
- Built-in middleware system for auth, validation, etc.
- Perfect fit for Cloudflare Workers environment
- Small bundle size which is important for serverless

**Alternatives considered**:
- Express: Too heavy for serverless environment
- Fastify: Also good but not as optimized for serverless
- Nitro: Less mature ecosystem

### Authentication
**Decision**: Better Auth
**Rationale**:
- Designed specifically for modern web applications
- Works well with React and serverless environments
- Provides secure session management
- Good TypeScript support
- Simpler to implement than custom solutions

**Alternatives considered**:
- Lucia: Good option but newer ecosystem
- Clerk: More features but also more complex/proprietary
- Custom JWT solution: Would require more implementation and security considerations

### Database & ORM
**Decision**: Cloudflare D1 + Drizzle ORM
**Rationale**:
- D1 provides SQLite-compatible database for Cloudflare Workers
- Drizzle provides type-safe SQL queries with excellent TypeScript support
- Aligns with the requirement for a single authoritative data source
- Forward-only migration support as required by constitution

**Alternatives considered**:
- Prisma: More popular but larger bundle size for serverless
- Kysely: Good alternative but less type safety than Drizzle
- Raw SQL: Would lose type safety

### Monorepo Setup
**Decision**: pnpm + Turborepo
**Rationale**:
- pnpm provides fast, disk space-efficient package management
- Turborepo provides excellent build orchestration
- Both align with the monorepo guidelines specified
- Supports the internal package requirements

**Alternatives considered**:
- Lerna: Older tool, less efficient than modern alternatives
- Nx: More complex than needed for this project
- Yarn workspaces: Good alternative but pnpm has better disk efficiency

## Unknowns Resolved

### Currency Conversion Implementation
**Decision**: Backend service will handle currency conversion on-demand
**Rationale**:
- As specified in the requirements, conversion happens in the backend service
- Values are stored in CNY only to maintain a single source of truth
- Conversion is computed based on stored exchange rates when requested
- Prevents inconsistencies from storing multiple currency representations

### Data Storage Strategy
**Decision**: Store financial facts in CNY only, compute conversions on demand
**Rationale**:
- Aligns with the pre-calculation principle in the spec
- Maintains data consistency by having a single source of truth
- Reduces storage requirements
- Ensures all calculations are based on the same base values

### Time Zone Handling
**Decision**: Store all timestamps in UTC, convert to user's timezone for presentation
**Rationale**:
- As specified in the requirements, all internal calculations use UTC
- Provides consistency across different user locations
- Allows for proper historical data representation
- Simplifies backend calculations

## Best Practices Applied

### Security
- All API endpoints will have proper authentication/authorization
- Input validation will be performed on all endpoints
- Financial data will be protected with appropriate access controls
- Session management will follow security best practices

### Performance
- Implement proper caching strategies for exchange rates and static data
- Optimize database queries with appropriate indexing
- Use pagination for large datasets (supporting 10,000+ assets)
- Implement proper loading states and error boundaries in UI

### Internationalization
- Implement ZH/EN language switching as required
- Use proper i18n libraries for text translation
- Handle number/date formatting appropriately for different locales
- Ensure language switching completes within 1 second as specified

### Testing Strategy
- Unit tests for all business logic functions
- Integration tests for API endpoints
- Component tests for UI elements
- End-to-end tests for critical user flows
- Contract tests to ensure API compatibility