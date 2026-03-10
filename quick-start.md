# Quick Start Guide

This guide will help you get the Cola Finance development environment up and running on your local machine.

## Prerequisites

- **Node.js**: 18.x or later
- **pnpm**: Package manager

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd cola-finance
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Environment Setup

#### Backend (BFF)

You need to set up the environment variables for the BFF application.

1. Copy the example environment file:
   ```bash
   cp apps/bff/.env.example apps/bff/.env
   ```

2. Open `apps/bff/.env` and update it with your configuration (e.g., Cloudflare credentials, Better Auth secrets).

### 4. Database Initialization

This project uses Cloudflare D1 with Drizzle ORM. You need to run migrations to set up the local database schema.

Run the migration command:

```bash
# From the project root
pnpm --filter bff d1:migrate:local
```

Or navigate to the BFF directory and run it there:

```bash
cd apps/bff
pnpm d1:migrate:local
```

### 5. Start Development Servers

Start both the frontend and backend development servers:

```bash
pnpm dev
```

- **Frontend**: http://localhost:5173
- **Backend (BFF)**: http://localhost:8787
