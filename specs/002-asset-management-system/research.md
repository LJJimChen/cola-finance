# Research Summary: Asset Management System

## Executive Summary

This document summarizes the research conducted for the asset management system implementation. All previously identified unknowns have been resolved, and technology decisions have been validated based on best practices and requirements alignment.

## Technology Decisions

### Frontend Stack
- **Framework**: React with TypeScript - Selected for its strong ecosystem, component-based architecture, and excellent developer experience
- **Router**: TanStack Router with file-based routing - Offers excellent performance and developer experience with automatic route generation
- **State Management**: Zustand for global state, TanStack Query for server state - Zustand provides lightweight, intuitive state management; TanStack Query handles server state efficiently
- **Styling**: Tailwind CSS with shadcn/ui components - Provides utility-first CSS approach with pre-built accessible components
- **HTTP Client**: ky - Lightweight, Promise-based HTTP client with TypeScript support and good browser compatibility
- **PWA Support**: Built-in Vite PWA plugin - Enables progressive web app capabilities with minimal configuration

### Backend Stack (BFF)
- **Runtime**: Cloudflare Workers - Serverless platform offering global distribution and low latency
- **Framework**: Hono - Lightweight, fast web framework with excellent TypeScript support
- **Authentication**: Better Auth - Modern authentication solution designed for serverless environments
- **Database**: Cloudflare D1 with Drizzle ORM - SQL database with TypeScript-first ORM for type-safe database operations
- **Architecture**: BFF (Backend for Frontend) - Handles authentication, policy enforcement, and data aggregation for the frontend

### Development Tools
- **Monorepo**: Turborepo with pnpm - Efficient monorepo management with fast builds and dependency resolution
- **Internal Packages**: Just-in-Time packages - Dynamic package creation as needed
- **Testing**: Vitest for unit/integration tests, Playwright for E2E tests - Modern, fast testing frameworks
- **Mock Service Worker**: MSW for API mocking during development and testing
- **Storybook**: For component development and documentation

## Architecture Decisions

### Data Model Approach
- Standardized data structure for assets from multiple brokers
- Portfolio aggregation at the BFF layer
- Base currency storage in CNY with on-demand conversion in BFF
- Daily portfolio snapshots with profit calculations

### Currency Conversion Strategy
- Exchange rates stored for major currency pairs quoted to CNY (USD→CNY, HKD→CNY)
- On-demand conversion in BFF layer rather than pre-calculating all possible currencies
- 4 decimal places precision for all currency values
- All internal calculations use UTC timestamps

### Performance Optimization
- Base-currency values stored in database for performance
- Caching strategies for frequently accessed data
- Optimized queries using Drizzle ORM
- Client-side caching with TanStack Query

## Unknowns Resolution

### Previously Identified Unknowns:
1. **Technology Stack Clarity**: Resolved - Full tech stack defined with specific tools and frameworks
2. **Database Schema Design**: Resolved - Using Cloudflare D1 with Drizzle ORM for type-safe operations
3. **Currency Conversion Implementation**: Resolved - On-demand conversion in BFF layer with base currency in CNY
4. **Timezone Handling**: Resolved - All internal calculations use UTC, with user timezone conversion for display
5. **Performance Requirements**: Resolved - Defined specific metrics (page load < 3s, support 10k+ assets)
6. **Authentication Strategy**: Resolved - Using Better Auth for serverless authentication
7. **Deployment Strategy**: Resolved - Cloudflare Workers for BFF, static hosting for web app
8. **Testing Strategy**: Resolved - Unit, integration, and E2E testing with Vitest and Playwright

## Best Practices Applied

### Security
- Authentication handled at BFF layer
- Input validation using Zod schemas
- Secure headers and CORS policies
- Proper session management with Better Auth

### Internationalization
- i18n support with incremental translation addition
- Support for Chinese and English interfaces
- Right-to-left layout support prepared (though not immediately needed)

### Accessibility
- shadcn/ui components with built-in accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility

### Performance
- Code splitting with dynamic imports
- Image optimization
- Bundle size optimization with Vite
- Efficient data fetching with TanStack Query

## Risks and Mitigations

### Technical Risks
- **Risk**: Cloudflare D1 limitations with complex queries
  - **Mitigation**: Careful schema design and query optimization; fallback to workers for complex aggregations
- **Risk**: Currency conversion accuracy
  - **Mitigation**: Regular exchange rate updates and validation
- **Risk**: Performance degradation with large datasets
  - **Mitigation**: Pagination, caching, and database indexing strategies

### Operational Risks
- **Risk**: Third-party service dependencies (exchange rates)
  - **Mitigation**: Fallback mechanisms and graceful degradation
- **Risk**: Data consistency across multiple brokers
  - **Mitigation**: Standardized data validation and transformation layers

## Future Considerations

### Scalability
- Horizontal scaling through Cloudflare's global network
- Database sharding strategies for very large datasets
- CDN for static assets

### Maintainability
- Component documentation with Storybook
- Comprehensive test coverage
- Clear separation of concerns between frontend and BFF

### Extensibility
- Plugin architecture for additional broker integrations
- Modular design for adding new features
- API versioning strategy for backward compatibility