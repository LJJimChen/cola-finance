# Quickstart Guide: Asset Management System

## Prerequisites

- Node.js 18.x or later
- pnpm (recommended) or npm/yarn
- Git
- Cloudflare Wrangler CLI (for BFF deployment)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cola-finance
```

### 2. Install Dependencies

Using pnpm (recommended):
```bash
pnpm install
```

Or using npm:
```bash
npm install
```

### 3. Environment Configuration

Create `.env` files in both the web and bff directories with the required environment variables:

#### For the BFF (apps/bff/.env):
```env
DATABASE_URL="your-database-connection-string"
AUTH_SECRET="your-auth-secret-key"
CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"
```

#### For the Web app (apps/web/.env):
```env
VITE_API_BASE_URL="http://localhost:8787/api"  # Adjust for your local BFF URL
VITE_AUTH_BASE_URL="http://localhost:8787"    # Adjust for your local auth URL
```

### 4. Database Setup

Set up your database and run initial migrations:

```bash
cd apps/bff
pnpm db:push  # or however your db migration command is configured
```

### 5. Running the Applications

#### Development Mode

To run both applications in development mode:

```bash
# From the root directory
pnpm dev
```

This will start both the web frontend and BFF backend with hot reloading.

Alternatively, you can run them separately:

```bash
# Terminal 1: Start the BFF
cd apps/bff
pnpm dev

# Terminal 2: Start the Web app
cd apps/web
pnpm dev
```

#### Individual Commands

Web app:
```bash
cd apps/web
pnpm dev        # Start dev server
pnpm build      # Build for production
pnpm preview    # Preview production build
pnpm test       # Run tests
```

BFF:
```bash
cd apps/bff
pnpm dev        # Start development server
pnpm deploy     # Deploy to Cloudflare Workers
pnpm test       # Run tests
```

## Project Structure

```
cola-finance/
├── apps/
│   ├── web/           # React frontend application
│   └── bff/           # Cloudflare Workers BFF
├── packages/          # Shared libraries (if any)
├── specs/             # Feature specifications
└── pnpm-workspace.yaml # Workspace configuration
```

## Key Technologies Used

### Frontend (Web)
- **Framework**: React 18 with TypeScript
- **Router**: TanStack Router (file-based)
- **State Management**: Zustand for client state, TanStack Query for server state
- **Styling**: Tailwind CSS + shadcn/ui components
- **HTTP Client**: ky with OpenAPI-generated types
- **Build Tool**: Vite

### Backend (BFF)
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Authentication**: Better Auth
- **Database**: Cloudflare D1 with Drizzle ORM
- **Deployment**: Cloudflare Wrangler

## Development Workflow

1. **Feature Development**:
   - Create a new branch: `git checkout -b feature/your-feature-name`
   - Develop your feature in the appropriate app directory
   - Write tests for your changes
   - Submit a pull request

2. **API Changes**:
   - Update the OpenAPI spec in `specs/003-asset-management-system/contracts/openapi.yaml`
   - Implement the corresponding backend endpoints in the BFF
   - Regenerate frontend API clients if needed
   - Update frontend to use new API endpoints

3. **Database Changes**:
   - Update the schema in `apps/bff/src/db/schema.ts`
   - Create and run a new migration
   - Update the data model documentation if needed

## Testing

Run tests for the entire monorepo:
```bash
pnpm test
```

Run tests for specific apps:
```bash
cd apps/web && pnpm test
cd apps/bff && pnpm test
```

## Debugging

### VSCode Debug Configurations

Debug configurations have been added for both web and BFF applications. You can find them in `.vscode/launch.json`.

To debug:
1. Open VSCode in the project root
2. Go to the Run and Debug view (Ctrl+Shift+D)
3. Select the appropriate debug configuration
4. Press F5 to start debugging

### Web Application Debugging
- Use browser dev tools for frontend debugging
- Console logs will appear in the browser console
- React DevTools recommended for component inspection

### BFF Debugging
- Console logs will appear in the terminal running the BFF
- Use Wrangler's local development mode for debugging Cloudflare Workers
- Add breakpoints in VSCode when using the debug configuration

## Deployment

### BFF (Cloudflare Workers)
```bash
cd apps/bff
pnpm deploy
```

### Web Application
The web app is typically deployed to a CDN or static hosting service. Configuration depends on your chosen provider.

## Troubleshooting

### Common Issues

1. **Module Resolution Issues**:
   - Ensure you're using pnpm for consistent dependency resolution
   - Run `pnpm install` if dependencies seem incorrect

2. **Database Connection Issues**:
   - Verify your DATABASE_URL is correctly set in the environment
   - Ensure your database is accessible from your current network

3. **Authentication Issues**:
   - Check that AUTH_SECRET is set correctly
   - Verify that your domain is properly configured for cookies

4. **Cross-Origin Issues**:
   - Ensure your BFF CORS settings allow requests from your web app origin
   - Check that environment variables are correctly set for API URLs