# Phase 1 — Database Layer

## Goal

Set up PostgreSQL via Docker (dev + test), define the Prisma schema with all 4 models, run migrations, create the Prisma singleton, and write seed data.

## Prerequisites

- Phase 0 complete (dependencies installed)
- Docker running

## Steps

### 1.1 — Docker Compose (`docker-compose.yml`)

Two PostgreSQL 16-alpine services:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: funds-db
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: funds_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes: [pgdata:/var/lib/postgresql/data]

  db-test:
    image: postgres:16-alpine
    container_name: funds-db-test
    ports: ["5433:5432"]
    environment:
      POSTGRES_DB: funds_test_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres

volumes:
  pgdata:
```

```bash
docker compose up -d
```

### 1.2 — Environment file (`.env`)

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/funds_db"
```

### 1.3 — Prisma schema (`prisma/schema.prisma`)

**Generator:**
- `prisma-client-js` with `output: "../src/generated/prisma"`

**Datasource:**
- `postgresql` provider
- `prismaClientRust` preview feature (not currently used but enabled)

**Enums:**

| Enum | Values |
|------|--------|
| `FundStatus` | Fundraising, Investing, Closed |
| `InvestorType` | Individual, Institution, FamilyOffice |
| `TransactionStatus` | pending, completed, reversed |

**Models:**

#### Fund
| Field | Type | Notes |
|-------|------|-------|
| `id` | String (UUID) | @id @default(uuid()) |
| `name` | String | |
| `vintage_year` | Int | |
| `target_size_usd` | Decimal(18,2) | |
| `status` | FundStatus | |
| `created_at` | DateTime | @default(now()) |
| `investments` | Investment[] | relation |
| `transactions` | Transaction[] | relation |

#### Investor
| Field | Type | Notes |
|-------|------|-------|
| `id` | String (UUID) | @id @default(uuid()) |
| `name` | String | |
| `investor_type` | InvestorType | |
| `email` | String | @unique |
| `created_at` | DateTime | @default(now()) |
| `investments` | Investment[] | relation |

#### Investment
| Field | Type | Notes |
|-------|------|-------|
| `id` | String (UUID) | @id @default(uuid()) |
| `fund_id` | String | FK → Fund, @index, onDelete: Restrict |
| `investor_id` | String | FK → Investor, @index, onDelete: Restrict |
| `amount_usd` | Decimal(18,2) | |
| `investment_date` | DateTime @db.Date | |
| `fund` | Fund | relation |
| `investor` | Investor | relation |

#### Transaction
| Field | Type | Notes |
|-------|------|-------|
| `transaction_id` | String (UUID) | @id @default(uuid()) |
| `fund_id` | String | FK → Fund, @index, onDelete: Restrict |
| `amount` | Decimal(18,2) | |
| `fee_percentage` | Decimal(5,4) | |
| `calculated_fees` | Decimal(18,2)? | nullable |
| `auto_calculate_fees` | Boolean | @default(false) |
| `bypass_validation` | Boolean | @default(false) |
| `status` | TransactionStatus | @default(pending) |
| `created_at` | DateTime | @default(now()) |
| `reason` | String? | nullable (reversal reason) |
| `reversed_at` | DateTime? | nullable |
| `fund` | Fund | relation, onDelete: Restrict |

### 1.4 — Run migration

```bash
npx prisma migrate dev --name init
```

This generates the Prisma client at `src/generated/prisma/`.

### 1.5 — Prisma singleton (`src/lib/prisma.ts`)

```ts
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg(connectionString);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["query"] : [],
});
```

Key details:
- Uses `PrismaPg` adapter for native PostgreSQL prepared statements
- Conditional query logging (dev only)
- Exported as singleton

### 1.6 — Seed script (`prisma/seed.ts`)

Creates:
- **4 funds**: Horizon Growth Equity ($500M), Apex Venture Capital ($250M), Summit Buyout ($1B), Nova Infrastructure ($750M)
- **5 investors**: Alice Chen (Individual), Global Pension Partners (Institution), Morrison Family Office (FamilyOffice), Bob Williams (Individual), BlueStar Capital (Institution)
- **6 investments**: 2 per fund (Horizon, Apex, Summit) with realistic amounts and dates

```bash
yarn db:seed
```

### 1.7 — Integration test global setup (`tests/global-setup.integration.ts`)

```ts
import { execSync } from "child_process";

export default function globalSetup() {
  execSync("npx prisma db push --accept-data-loss", {
    env: {
      ...process.env,
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5433/funds_test_db",
    },
  });
}
```

This pushes the schema to the test database before integration tests run.

## Verification

```bash
docker compose ps          # both containers running
npx prisma studio          # browse models in browser
yarn db:seed               # seed data loads without errors
```

## Files created

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Dev + test PostgreSQL containers |
| `.env` | Database connection string |
| `prisma/schema.prisma` | 3 enums, 4 models with relations |
| `prisma/migrations/` | Auto-generated SQL migration |
| `src/lib/prisma.ts` | PrismaClient singleton with PrismaPg adapter |
| `src/generated/prisma/` | Auto-generated Prisma client |
| `prisma/seed.ts` | 4 funds, 5 investors, 6 investments |
| `tests/global-setup.integration.ts` | Push schema to test DB before tests |
