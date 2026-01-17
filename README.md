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

### Prerequisites

- Node.js 18.x or later
- pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd cola-finance-sp
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables (see individual app READMEs)

4. Run the development servers:
   ```bash
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