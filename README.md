# Titanbay Private Markets API

A RESTful API for managing private market funds, investor commitments, and transaction processing. Built with Fastify, TypeScript, Prisma, and PostgreSQL.

## Quick Start

### Prerequisites

- **Node.js** >= 20
- **Yarn** (v4 — bundled via Corepack)
- **Docker** (for PostgreSQL)

### 1. Clone and install

```bash
git clone <repo-url> && cd titanbay-funds-api
corepack enable          # activates the bundled Yarn 4
yarn install
```

### 2. Start the databases

```bash
docker compose up -d     # starts dev DB on :5432 and test DB on :5433
```

### 3. Configure environment

```bash
cp .env.example .env     # defaults work out of the box with Docker Compose
```

### 4. Run migrations and seed

```bash
yarn db:migrate          # applies Prisma migrations
yarn db:seed             # populates sample funds, investors, and investments
```

### 5. Start the server

```bash
yarn dev                 # http://localhost:3000  (hot-reload via tsx)
```

Interactive API docs are available at **http://localhost:3000/docs** (Swagger UI).

## Available Scripts

| Script                  | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| `yarn dev`              | Start dev server with hot-reload                      |
| `yarn build`            | Compile to `dist/` via tsup                           |
| `yarn start`            | Run production build                                  |
| `yarn test`             | Run unit tests with coverage                          |
| `yarn test:integration` | Run integration tests with coverage (requires Docker) |
| `yarn lint`             | Run ESLint                                            |
| `yarn format`           | Run Prettier                                          |
| `yarn db:migrate`       | Apply database migrations                             |
| `yarn db:seed`          | Seed sample data                                      |
| `yarn db:studio`        | Open Prisma Studio GUI                                |
| `yarn db:reset`         | Reset database and re-apply migrations                |

## API Endpoints

All 8 endpoints from the [API specification](https://storage.googleapis.com/interview-api-doc-funds.wearebusy.engineering/index.html) are implemented, plus a health check.

### Funds

| Method | Path         | Description       |
| ------ | ------------ | ----------------- |
| `GET`  | `/funds`     | List all funds    |
| `POST` | `/funds`     | Create a new fund |
| `GET`  | `/funds/:id` | Get a fund by ID  |
| `PUT`  | `/funds/:id` | Update a fund     |

### Investors

| Method | Path         | Description             |
| ------ | ------------ | ----------------------- |
| `GET`  | `/investors` | List all investors      |
| `POST` | `/investors` | Register a new investor |

### Investments

| Method | Path                          | Description                         |
| ------ | ----------------------------- | ----------------------------------- |
| `GET`  | `/funds/:fund_id/investments` | List investments for a fund         |
| `POST` | `/funds/:fund_id/investments` | Record a new investment into a fund |

### Transactions

| Method | Path                                    | Description                                          |
| ------ | --------------------------------------- | ---------------------------------------------------- |
| `GET`  | `/transactions`                         | List all transactions                                |
| `POST` | `/transactions/process`                 | Process a transaction with automatic fee calculation |
| `PUT`  | `/transactions/:transaction_id/reverse` | Reverse a completed transaction                      |
| `GET`  | `/funds/:fund_id/total-value`           | Calculate fund total value (with optional pending)   |

### Admin

| Method | Path                      | Description                                |
| ------ | ------------------------- | ------------------------------------------ |
| `POST` | `/admin/recalculate-fees` | Recalculate fees for a fund's transactions |

### Utility

| Method | Path      | Description  |
| ------ | --------- | ------------ |
| `GET`  | `/health` | Health check |

## Architecture

```
src/
  routes/          Route handlers — parse request, call service, send response
  schemas/         Zod schemas — request validation and OpenAPI generation
  services/        Business logic — serialisation, fee calculations, validation rules
  repositories/    Data access — thin Prisma wrappers
  lib/             Shared utilities — Prisma client, error classes, error handler
  plugins/         Fastify plugin configuration
```

The codebase follows a **Route → Service → Repository → Database** layered architecture. Each layer has a single responsibility:

- **Routes** handle HTTP concerns (status codes, request/response shapes) and delegate to services.
- **Services** contain business logic: Decimal-to-number serialisation, date formatting, fee calculation, cross-entity validation (e.g. checking a fund exists before recording an investment).
- **Repositories** are thin data-access wrappers over Prisma — one function per query, no business logic.
- **Schemas** define validation rules using Zod, which also powers automatic OpenAPI spec generation via `fastify-type-provider-zod`.

## Database Design

Four tables with enforced foreign-key relationships:

```
Fund (id, name, vintage_year, target_size_usd, status, created_at)
  ├── Investment (id, fund_id → Fund, investor_id → Investor, amount_usd, investment_date)
  └── Transaction (transaction_id, fund_id → Fund, amount, fee_percentage, calculated_fees,
                    auto_calculate_fees, bypass_validation, status, reason, reversed_at, created_at)

Investor (id, name, investor_type, email [unique], created_at)
  └── Investment (investor_id → Investor)
```

- `Decimal(18,2)` for monetary values — avoids floating-point precision issues.
- `ON DELETE RESTRICT` on all foreign keys — prevents orphaned records.
- Enums for `FundStatus` (Fundraising, Investing, Closed), `InvestorType` (Individual, Institution, FamilyOffice), and `TransactionStatus` (pending, completed, reversed).

## Key Design Decisions

**Prisma 7 with PrismaPg adapter** — Uses the driver adapter pattern instead of the built-in connection handler, as required by Prisma 7. The datasource URL is configured via `prisma.config.ts` rather than the schema file.

**Zod 4 as the validation layer** — Replaces Fastify's default Ajv validator. Schemas serve double duty: they validate incoming requests and auto-generate the OpenAPI spec rendered at `/docs`.

**Decimal serialisation in the service layer** — Prisma returns `Decimal` objects for monetary fields. Services convert these to plain numbers (`Number(fund.target_size_usd)`) before returning to routes, keeping the API response clean while preserving database precision.

**Fee calculation** — `amount * (feePercentage / 100)` rounded to 2 decimal places. Auto-calculation only applies when `auto_calculate_fees` is `true` and `bypass_validation` is `false`.

**Transaction reversal** — Reversed transactions are immutable; attempting to reverse an already-reversed transaction returns `409 Conflict`. The optional `refund_fees` flag nullifies `calculated_fees` on reversal.

**Structured error handling** — A global error handler catches Zod validation errors, custom `AppError` subclasses (`NotFoundError`, `ConflictError`), Prisma constraint violations (P2002/P2003/P2025), and unhandled exceptions (logged and reported to Sentry).

## Testing

193 tests across unit and integration suites:

```bash
yarn test                # 128 unit tests — mocked Prisma, no database required
yarn test:integration    # 65 integration tests — real PostgreSQL via Docker
```

Both commands include code coverage (v8 provider). Current coverage: **96.5% statements, 98.4% functions, 96.4% lines**.

Unit tests cover schemas, services, repositories, routes, the error handler, and app bootstrap. Integration tests exercise full request/response cycles against a real database, including validation errors, foreign-key constraints, and transaction processing flows.

### Test database

Integration tests use a separate PostgreSQL instance on port `5433` (the `db-test` service in `docker-compose.yml`). The global setup script runs migrations automatically — no manual setup needed beyond `docker compose up -d`.

## Observability

- **Sentry** — Error tracking and performance monitoring. Gracefully disabled when `SENTRY_DSN` is not set.
- **OpenTelemetry** — Distributed tracing via `@opentelemetry/sdk-node`. Exports to any OTLP-compatible collector when `OTEL_EXPORTER_OTLP_ENDPOINT` is configured. Gracefully skipped when absent.
- **Structured logging** — Pino with pretty-printing in development, JSON in production.

## How This Meets the Requirements

| Requirement                       | Implementation                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------- |
| **All 8 endpoints working**       | All endpoints from the spec are implemented and tested                           |
| **PostgreSQL with proper schema** | 4 tables with foreign keys, enums, decimal precision, and constraints            |
| **Input validation**              | Zod schemas on every mutating endpoint with descriptive error responses          |
| **Error handling**                | Global handler for validation, not-found, conflict, constraint, and 500 errors   |
| **Clean, organised code**         | Layered architecture with clear separation of concerns                           |
| **Setup instructions**            | This README — 5 commands from clone to running server                            |
| **Unit and integration tests**    | 193 tests, 96.5% statement coverage                                              |
| **REST conventions**              | Proper HTTP methods, status codes (200, 201, 400, 404, 409, 500), JSON responses |

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify 5
- **Language**: TypeScript 5.9
- **ORM**: Prisma 7 (PrismaPg adapter)
- **Database**: PostgreSQL 16
- **Validation**: Zod 4
- **Docs**: Swagger UI via `@fastify/swagger`
- **Testing**: Vitest 4 with v8 coverage
- **Observability**: Sentry + OpenTelemetry
- **Package Manager**: Yarn 4
