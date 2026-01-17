# Research Summary: WEB and BFF Technology Stack

## Identified Unknowns Requiring Research

### 1. Caching Strategy for Performance
**Unknown**: Whether additional caching layer (Redis) is required for performance
**Resolution**: After analysis, Cloudflare's built-in caching mechanisms combined with D1's performance should be sufficient for initial implementation. Redis may be added later if performance monitoring indicates a need.

### 2. Serverless Constraints Impact on Calculations
**Unknown**: How Cloudflare Workers' limitations on execution time and memory may impact complex portfolio calculations
**Resolution**: Complex calculations will be performed in smaller chunks or pre-calculated in scheduled jobs. For intensive calculations, we'll implement streaming/pagination approaches to stay within Worker limits. For very complex operations, we may need to implement a hybrid approach with client-side computation when appropriate.

## Technology Decisions

### 1. Frontend Framework Choice
**Decision**: Vite + React + TypeScript with TanStack Router and TanStack Query
**Rationale**: 
- React offers a mature ecosystem and extensive community support
- Vite provides fast development and build times
- TanStack Router provides excellent file-based routing capabilities
- TanStack Query handles server-state management effectively
- TypeScript ensures type safety throughout the application

**Alternatives Considered**:
- Next.js: More complex than needed for this use case, heavier bundle sizes
- Vue.js: Less familiarity in team, smaller ecosystem for financial applications
- SvelteKit: Interesting but smaller ecosystem compared to React

### 2. Styling and UI Components
**Decision**: Tailwind CSS + shadcn/ui
**Rationale**:
- Tailwind CSS provides utility-first approach that speeds development
- shadcn/ui offers accessible, customizable components that integrate well with Tailwind
- Both technologies align with modern React development practices

**Alternatives Considered**:
- Styled-components: Would add complexity and runtime overhead
- Material UI: Too opinionated and heavy for this use case
- Custom CSS: Would require more development time

### 3. HTTP Client
**Decision**: ky (based on fetch)
**Rationale**:
- Lightweight and modern HTTP client
- Built on the standard fetch API
- Good TypeScript support
- Works well with OpenAPI-generated clients

**Alternatives Considered**:
- Axios: More features but also more overhead
- fetch (native): Requires more boilerplate code

### 4. State Management
**Decision**: Zustand for global state, React hooks for local state
**Rationale**:
- Zustand is lightweight and has minimal boilerplate
- Excellent TypeScript support
- Sufficient for managing session, theme, and currency preferences
- React hooks handle component-local state effectively

**Alternatives Considered**:
- Redux Toolkit: More complex than needed for this application
- Jotai/Recoil: Good options but Zustand simpler for this use case

### 5. Backend Framework
**Decision**: Hono for Cloudflare Workers
**Rationale**:
- Lightweight and fast framework designed for serverless environments
- Excellent TypeScript support
- Built-in middleware for authentication, validation, and error handling
- Perfect fit for Cloudflare Workers runtime

**Alternatives Considered**:
- Express.js: Traditional but heavier, not optimized for serverless
- Fastify: Good performance but not as well integrated with Cloudflare Workers

### 6. Authentication Solution
**Decision**: Better Auth
**Rationale**:
- Modern authentication solution with good TypeScript support
- Designed for modern web applications
- Supports social logins and email/password authentication
- Lightweight and easy to integrate with Hono

**Alternatives Considered**:
- NextAuth.js: Primarily designed for Next.js applications
- Auth0/Lucia: Either too heavy or less maintained than Better Auth

### 7. Database and ORM
**Decision**: Cloudflare D1 with Drizzle ORM
**Rationale**:
- D1 provides SQL database capabilities in Cloudflare's edge network
- Drizzle ORM offers type-safe SQL building with excellent TypeScript support
- Good integration with Cloudflare Workers
- Migration system supports forward-only, reproducible changes

**Alternatives Considered**:
- Prisma: Popular but slower build times and less optimized for serverless
- Kysely: Good alternative but Drizzle has better documentation and community

### 8. Internationalization
**Decision**: react-i18next for multi-language support
**Rationale**:
- Mature and well-documented solution for React applications
- Good performance with code-splitting capabilities
- Supports both Chinese and English as required

**Alternatives Considered**:
- FormatJS: Good option but more complex setup
- Lingui: Good but smaller community than react-i18next

### 9. Charting Library
**Decision**: Recharts or Chart.js
**Rationale**:
- Both offer good React integration and customization options
- Support responsive designs needed for mobile-first approach
- Good performance with large datasets

**Alternatives Considered**:
- D3.js: More powerful but more complex to implement
- Victory: Good but less popular than Recharts

### 10. PWA Implementation
**Decision**: Vite PWA plugin with Workbox
**Rationale**:
- Vite PWA plugin integrates seamlessly with Vite build process
- Workbox provides reliable service worker generation
- Supports all required PWA features (offline, installable, etc.)

**Alternatives Considered**:
- CRA PWA: Not applicable since we're using Vite
- Manual service worker: More control but more maintenance

### 11. Testing Framework
**Decision**: Vitest + React Testing Library + MSW
**Rationale**:
- Vitest provides fast test execution with Jest-like API
- React Testing Library follows best practices for component testing
- MSW enables realistic API mocking

**Alternatives Considered**:
- Jest: More established but slower than Vitest
- Cypress: Good for E2E but not needed for unit/component testing

### 12. VSCode Debug Configuration
**Decision**: Add launch configurations for both Web and BFF
**Rationale**:
- Essential for developer productivity
- Allows debugging of both frontend and backend code
- Standard practice for development workflows

Configuration examples:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Web Application",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/apps/web",
      "sourceMapPathOverrides": {
        "src/*": "${webRoot}/src/*"
      }
    },
    {
      "name": "Debug BFF (Cloudflare Workers)",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/apps/bff",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["wrangler", "dev"],
      "port": 9229,
      "restart": true
    }
  ]
}
```