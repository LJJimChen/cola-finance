# Drizzle ORM & Cloudflare D1 Best Practices

This document outlines the configuration and workflow for managing the database in the Cola Finance BFF service, using **Drizzle ORM** with **Cloudflare D1**.

## Configuration Overview

We use a **hybrid configuration** in `drizzle.config.ts` to seamlessly support both local development (using Wrangler's local state) and production management (using Cloudflare's D1 HTTP API).

### `drizzle.config.ts` Strategy

The configuration automatically detects the environment:

1.  **Local Development (Default)**:
    -   **Detection**: Checks for the existence of a local SQLite file in `.wrangler/state/v3/d1/...`.
    -   **Behavior**: Connects directly to the local SQLite file.
    -   **Benefit**: Allows `drizzle-kit studio` to view local development data without any authentication or internet connection.

2.  **Production / Remote (`NODE_ENV=production`)**:
    -   **Detection**: Triggered when `NODE_ENV=production` or when no local DB is found.
    -   **Behavior**: Uses the `d1-http` driver to connect to Cloudflare D1 via API.
    -   **Benefit**: Allows secure management of production data using Cloudflare credentials.

### `wrangler.jsonc` Configuration

The `wrangler.jsonc` file connects the Cloudflare D1 database to your Worker environment.

```jsonc
// apps/bff/wrangler.jsonc
"d1_databases": [
  {
    "binding": "DB",               // The name used in your code (env.DB)
    "database_name": "cola-finance-db",
    "database_id": "109fd72a-...", // Your D1 Database ID
    "migrations_dir": "drizzle"    // IMPORTANT: Tells Wrangler where to find .sql migration files
  }
]
```

-   **`migrations_dir`**: This is critical. It must point to the directory where `drizzle-kit generate` outputs your SQL files (default is `drizzle`).
    -   When you run `wrangler d1 migrations apply`, Wrangler looks in this folder to know what changes to apply to the database.
    -   If this is misconfigured, Wrangler won't find your new tables or columns.

## Connection Scenarios & Adapters

Understanding which tool connects to the database and how is crucial for troubleshooting and development.

| Scenario | Tool / Command | Connection Adapter/Driver | Need Real Connection? | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Schema Generation** | `npm run db:generate` | **None** | ❌ No | Reads `schema.ts` and generates `.sql` files. Purely static analysis. |
| **Local Migration** | `npm run d1:migrate:local` | **Wrangler CLI** | ✅ Yes (Local) | Uses Wrangler's built-in D1 emulation to execute SQL against local `.sqlite` file. |
| **Prod Migration** | `npm run d1:migrate:prod` | **Wrangler CLI** | ✅ Yes (Remote) | Uses Wrangler's authenticated session to execute SQL against Cloudflare D1 via API. |
| **View Local Data** | `npm run db:studio` | **better-sqlite3** (Implicit) | ✅ Yes (Local File) | Drizzle Studio reads the local `.sqlite` file directly from `.wrangler/state/...`. |
| **View Prod Data** | `npm run db:studio:prod` | **d1-http** | ✅ Yes (Remote API) | Drizzle Studio uses the Cloudflare D1 HTTP API (via `d1-http` driver) to query production data. |
| **App Runtime (Dev)** | `npm run dev` | **D1 Binding** | ✅ Yes (Local) | The Worker runtime connects via the `env.DB` binding provided by Wrangler/Miniflare. |
| **App Runtime (Prod)** | Deployed Worker | **D1 Binding** | ✅ Yes (Remote) | The deployed Worker connects natively to D1 via Cloudflare's internal network. |

### Key Takeaways

1.  **Drizzle Kit vs. App Runtime**: 
    -   **Drizzle Kit** (Studio/Push) runs in a Node.js environment and needs specific drivers (`better-sqlite3` for local files, `d1-http` for remote API) to "simulate" a connection.
    -   **The Application** runs in the Cloudflare Workers runtime (or Miniflare locally) and uses the **D1 Binding** (`env.DB`), which is a special platform-native adapter, not a standard Node.js driver.

2.  **Why Hybrid Config?**: 
    -   We use `better-sqlite3` logic for `db:studio` locally because it's faster and requires zero auth.
    -   We use `d1-http` for `db:studio:prod` because we cannot access the remote SQLite file directly.

## Workflow Commands

We have configured `package.json` scripts to streamline common tasks.

### 1. Schema Management

-   **Generate Migrations**:
    ```bash
    npm run db:generate
    ```
    *Usage*: Run this after modifying `src/db/schema.ts`. This creates SQL files in the `drizzle` folder but **does not** apply them.

### 2. Database Migration

-   **Apply to Local DB**:
    ```bash
    npm run d1:migrate:local
    ```
    *Usage*: Applies pending migrations to your local Wrangler development database.

-   **Apply to Production DB**:
    ```bash
    npm run d1:migrate:prod
    ```
    *Usage*: Applies pending migrations to the remote Cloudflare D1 database. **Use with caution.**

### 3. Data Viewing (Drizzle Studio)

-   **View Local Data**:
    ```bash
    npm run db:studio
    ```
    *Usage*: Opens Drizzle Studio pointing to your **local** development database.

-   **View Production Data**:
    ```bash
    npm run db:studio:prod
    ```
    *Usage*: Opens Drizzle Studio pointing to the **remote production** database.
    *Prerequisite*: Requires `.env` file with Cloudflare credentials (see below).

## Environment Setup (`.env`)

For remote operations (like `db:studio:prod`), you must configure the following in `apps/bff/.env`:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_database_id
CLOUDFLARE_D1_TOKEN=your_api_token
```

-   **CLOUDFLARE_ACCOUNT_ID**: Your Cloudflare Account ID.
-   **CLOUDFLARE_DATABASE_ID**: The ID of your D1 database (found in `wrangler.jsonc` or via `wrangler d1 info`).
-   **CLOUDFLARE_D1_TOKEN**: A Cloudflare API Token with **D1 Edit** permissions.

## Troubleshooting

-   **"No local database found"**: Ensure you have started the dev server at least once (`npm run dev`) or applied migrations (`npm run d1:migrate:local`), which initializes the local SQLite file.
-   **Permission Errors**: If you encounter permission issues with Wrangler (e.g., `EPERM`), try running commands with `XDG_CONFIG_HOME=./.wrangler-config` or check your system's folder permissions.
