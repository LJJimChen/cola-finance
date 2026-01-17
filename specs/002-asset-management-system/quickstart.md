# Quickstart Guide: Asset Management System

## Prerequisites

Before getting started, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher) - Install with `npm install -g pnpm`
- [Git](https://git-scm.com/)
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) - Install with `npm install -g wrangler`

## Project Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd cola-finance-sp
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables for the BFF:
   ```bash
   cd apps/bff
   cp .env.example .env
   # Update the .env file with your actual configuration values
   ```

## Running the Applications

### 1. Running the BFF (Backend for Frontend)

From the project root:

```bash
# Navigate to the BFF directory
cd apps/bff

# Run in development mode
pnpm dev
```

The BFF will be available at `http://localhost:8787`.

### 2. Running the Web Application

From the project root:

```bash
# Navigate to the Web directory
cd apps/web

# Run in development mode
pnpm dev
```

The Web application will be available at `http://localhost:5173`.

### 3. Running Both Applications Concurrently

From the project root:

```bash
# Run both applications using turborepo
pnpm dev
```

This will start both the BFF and Web applications with a single command.

## Database Setup

The project uses Cloudflare D1 as the database. To set up your local development database:

1. Create a new D1 database:
   ```bash
   wrangler d1 create asset-management-db
   ```

2. Update your `.env` file with the database binding name.

3. Apply database migrations:
   ```bash
   cd apps/bff
   pnpm db:migrate
   ```

## VSCode Debugging Setup

To enable debugging in VSCode, add the following configuration to your `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Web Application",
      "type": "edge",
      "request": "launch",
      "port": 9222,
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
      "request": "attach",
      "cwd": "${workspaceFolder}/apps/bff",
      "port": 9229,
      "restart": true,
      "protocol": "inspector"
    }
  ]
}
```

After adding this configuration:
1. Start your applications with `pnpm dev`
2. In VSCode, go to the "Run and Debug" view (Ctrl+Shift+D)
3. Select the appropriate debug configuration and click "Start Debugging"

## Building for Production

### Building the BFF

```bash
cd apps/bff
pnpm build
```

### Building the Web Application

```bash
cd apps/web
pnpm build
```

### Building Both Applications

From the project root:
```bash
pnpm build
```

## Testing

### Running Tests

```bash
# Run all tests in the monorepo
pnpm test

# Run tests for a specific app
pnpm --filter web test
pnpm --filter bff test
```

### Running Linting

```bash
# Lint all packages
pnpm lint

# Lint a specific package
pnpm --filter web lint
pnpm --filter bff lint
```

### Running Type Checking

```bash
# Type check all packages
pnpm type-check

# Type check a specific package
pnpm --filter web type-check
pnpm --filter bff type-check
```

## Deployment

### Deploying the BFF to Cloudflare Workers

```bash
cd apps/bff
wrangler deploy
```

### Deploying the Web Application

The web application is a static site that can be deployed to any hosting service. The build output is located at `apps/web/dist`.

For Cloudflare Pages deployment:
1. Connect your GitHub repository to Cloudflare Pages
2. Set the build command to `pnpm run build` 
3. Set the build output directory to `dist`
4. Set the build environment to `Vite`

## Key Technologies Used

### Web Application
- **Framework**: Vite + React 18 + TypeScript
- **Routing**: TanStack Router (file-based)
- **State Management**: Zustand (for global state) + React Hooks (for local state)
- **API Calls**: ky (fetch-based HTTP client) with OpenAPI-generated types
- **Styling**: Tailwind CSS + shadcn/ui components
- **Testing**: Vitest + React Testing Library + MSW
- **PWA**: Vite PWA plugin with Workbox

### BFF (Backend for Frontend)
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Authentication**: Better Auth
- **Database**: Cloudflare D1 with Drizzle ORM
- **Testing**: Vitest

### Monorepo Management
- **Package Manager**: pnpm
- **Build System**: Turborepo
- **Shared Types/Schemas**: Internal packages using JIT packaging

## Common Commands Reference

| Command | Description |
|--------|-------------|
| `pnpm dev` | Start all development servers |
| `pnpm build` | Build all packages |
| `pnpm test` | Run tests across all packages |
| `pnpm lint` | Lint all packages |
| `pnpm type-check` | Type check all packages |
| `pnpm --filter <package> <script>` | Run a script for a specific package |

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - The BFF runs on port 8787 and the Web app on port 5173
   - Check if these ports are free or configure different ports in the respective package.json files

2. **Environment Variables Missing**
   - Ensure you've created and configured the `.env` file in the BFF directory
   - Check that all required environment variables are present

3. **Database Connection Issues**
   - Verify that your D1 database is properly configured
   - Ensure migrations have been applied with `pnpm db:migrate`

4. **Dependency Issues**
   - Clean your installation with `pnpm store prune` and reinstall dependencies
   - Try deleting `node_modules` and `pnpm-lock.yaml` and reinstalling

### Getting Help

- Check the detailed documentation in the `/specs/002-asset-management-system/` directory
- Look at the API contracts in `/specs/002-asset-management-system/contracts/`
- Review the data model in `/specs/002-asset-management-system/data-model.md`