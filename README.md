# Cola Finance - Asset Management System

An asset management system that aggregates user holdings across multiple platforms, calculates performance, visualizes allocation by category and currency, and supports category-level rebalancing decisions.

## Features

- Multi-broker portfolio aggregation
- Performance tracking and visualization
- Category grouping and allocation visualization
- Category-level rebalancing recommendations
- Display currency conversion
- Bilingual support (ZH/EN)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TanStack Router, Tailwind CSS, shadcn/ui
- **Backend**: Cloudflare Workers, Hono, Better Auth
- **Database**: Cloudflare D1 with Drizzle ORM
- **Monorepo**: pnpm + Turborepo

## Getting Started

- **Local Development**: See [quick-start.md](quick-start.md).
- **Cloudflare Deployment**: See [quick-start-cloudflare.md](quick-start-cloudflare.md).

### Prerequisites

- Node.js 18.x or later
- pnpm

### Quick Installation

```bash
git clone <repository-url>
cd cola-finance
pnpm install
pnpm dev
```


## Project Structure

```
apps/
├── web/                 # React frontend application
└── bff/                 # Backend for Frontend (Cloudflare Workers)
packages/                # Shared libraries
specs/                   # Feature specifications
```

## Scripts

- `pnpm dev` - Start development servers for both web and BFF
- `pnpm build` - Build all packages
- `pnpm test` - Run tests across the monorepo
- `pnpm lint` - Lint all packages

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

See [LICENSE](LICENSE) for details.