# Titanbay Funds API — Project Overview

## What it is

A RESTful API for managing private market funds and investor commitments, built with Fastify 5, TypeScript, Prisma 7, and PostgreSQL 16.

## Tech stack

| Layer           | Technology                          | Version           |
| --------------- | ----------------------------------- | ----------------- |
| Runtime         | Node.js                             | >= 20.0.0         |
| Framework       | Fastify                             | 5.7.4             |
| Language        | TypeScript                          | 5.9.3             |
| ORM             | Prisma (with PrismaPg adapter)      | 7.4.1             |
| Database        | PostgreSQL                          | 16 (via Docker)   |
| Validation      | Zod (via fastify-type-provider-zod) | 4.3.6             |
| Build           | tsup                                | 8.5.1             |
| Test            | Vitest + @vitest/coverage-v8        | 4.0.18            |
| Observability   | OpenTelemetry + Sentry              | 0.212.0 / 10.40.0 |
| Package manager | Yarn                                | 4.12.0            |

## Architecture

```
Route (HTTP + Zod validation)
  → Service (business logic + serialisation)
    → Repository (Prisma queries)
      → PostgreSQL
```

- **Routes**: Define HTTP endpoints with Zod schemas for request/response validation
- **Services**: Contain business logic, serialise Prisma Decimals/Dates to JSON-safe types
- **Repositories**: Thin Prisma wrappers, one per model
- **Schemas**: Zod schemas for input validation and type inference

## API surface

13 endpoints across 6 route files:

| Method | Path                                    | Purpose                                  |
| ------ | --------------------------------------- | ---------------------------------------- |
| GET    | `/health`                               | Health check                             |
| GET    | `/funds`                                | List all funds                           |
| POST   | `/funds`                                | Create fund                              |
| GET    | `/funds/:id`                            | Get fund by ID                           |
| PUT    | `/funds/:id`                            | Update fund                              |
| GET    | `/funds/:fund_id/total-value`           | Fund total value (with optional pending) |
| GET    | `/investors`                            | List all investors                       |
| POST   | `/investors`                            | Create investor                          |
| GET    | `/funds/:fund_id/investments`           | List investments for fund                |
| POST   | `/funds/:fund_id/investments`           | Create investment                        |
| GET    | `/transactions`                         | List all transactions                    |
| POST   | `/transactions/process`                 | Process transaction with fee calculation |
| PUT    | `/transactions/:transaction_id/reverse` | Reverse transaction                      |
| POST   | `/admin/recalculate-fees`               | Batch recalculate fees for fund          |

## Database models

4 models with 3 enums:

- **Fund** — name, vintage_year, target_size_usd (Decimal), status (FundStatus)
- **Investor** — name, investor_type (InvestorType), email (unique)
- **Investment** — fund_id (FK), investor_id (FK), amount_usd (Decimal), investment_date (Date)
- **Transaction** — fund_id (FK), amount (Decimal), fee_percentage (Decimal), calculated_fees (Decimal?), status (TransactionStatus), reason?, reversed_at?

## Test suite

216 tests across 29 files:

| Category                           | Tests   | Files  |
| ---------------------------------- | ------- | ------ |
| Unit: schemas                      | 51      | 4      |
| Unit: services                     | 47      | 5      |
| Unit: lib (errors + error-handler) | 21      | 2      |
| Unit: routes                       | 14      | 6      |
| Unit: repositories                 | 15      | 4      |
| Unit: app bootstrap                | 2       | 1      |
| Integration                        | 66      | 7      |
| **Total**                          | **216** | **29** |

## Coverage

| Suite                                          | Stmts  | Branch | Funcs  | Lines  |
| ---------------------------------------------- | ------ | ------ | ------ | ------ |
| Unit (`yarn test:coverage`)                    | 96.85% | 87.27% | 98.43% | 96.82% |
| Integration (`yarn test:integration:coverage`) | 95.81% | 85.45% | —      | 96.29% |

## Directory structure

```
src/
├── app.ts                    # Fastify factory (Zod compilers, CORS, error handler, routes)
├── server.ts                 # Entry point (listen on port 3000)
├── instrumentation.ts        # OTel + Sentry (loaded via --import)
├── lib/
│   ├── prisma.ts             # PrismaClient singleton with PrismaPg adapter
│   ├── errors.ts             # AppError, NotFoundError, ConflictError
│   └── error-handler.ts      # Global error handler (Zod, Prisma, Fastify, 500)
├── schemas/                  # Zod validation schemas + inferred types
├── repositories/             # Thin Prisma query wrappers
├── services/                 # Business logic + serialisation
├── routes/                   # Fastify route plugins with ZodTypeProvider
└── generated/prisma/         # Auto-generated Prisma client

tests/
├── helpers/                  # fixtures.ts, app.ts, db.ts
├── global-setup.integration.ts
├── unit/                     # 22 test files (150 tests)
│   ├── lib/
│   ├── schemas/
│   ├── services/
│   ├── routes/
│   └── repositories/
└── integration/              # 7 test files (66 tests)

prisma/
├── schema.prisma             # 3 enums, 4 models
├── migrations/               # SQL migrations
└── seed.ts                   # 4 funds, 5 investors, 6 investments
```
