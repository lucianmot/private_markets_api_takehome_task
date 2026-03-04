# Implementation Plan

## Phase summary

| Phase | Name                  | What it delivers                                                  | Cumulative files | Cumulative tests |
| ----- | --------------------- | ----------------------------------------------------------------- | ---------------- | ---------------- |
| 0     | Scaffolding           | Project setup, tooling, configs                                   | ~10 config files | 0                |
| 1     | Database              | Docker, Prisma schema, migrations, seed                           | +6 files         | 0                |
| 2     | App Foundation        | Fastify factory, errors, error handler, health route              | +5 files         | 0                |
| 3     | Observability         | OpenTelemetry + Sentry instrumentation                            | +1 file (+ mods) | 0                |
| 4     | Fund Endpoints        | Schema, repo, service, 4 routes                                   | +4 files         | 0                |
| 5     | Investor Endpoints    | Schema, repo, service, 2 routes                                   | +4 files         | 0                |
| 6     | Investment Endpoints  | Schema, repo, service, 2 routes                                   | +4 files         | 0                |
| 7     | Core Tests            | Test helpers + unit/integration for phases 4-6                    | +14 test files   | 121              |
| 8     | Transaction Endpoints | Fee service, txn repo/service, 5 routes                           | +5 files         | 121              |
| 9     | Extended Tests        | Error handler tests, fee/txn service tests, txn/admin integration | +8 test files    | 185              |
| 9.5   | Unit Coverage         | Route, app, repository unit tests → 97% coverage                  | +11 test files   | 216              |

## Dependency graph

```
Phase 0 (Scaffolding)
  └─→ Phase 1 (Database)
        └─→ Phase 2 (App Foundation)
              ├─→ Phase 3 (Observability)
              └─→ Phase 4 (Fund Endpoints)
                    └─→ Phase 5 (Investor Endpoints)
                          └─→ Phase 6 (Investment Endpoints)
                                └─→ Phase 7 (Core Tests)
                                      └─→ Phase 8 (Transaction Endpoints)
                                            └─→ Phase 9 (Extended Tests)
                                                  └─→ Phase 9.5 (Unit Coverage)
```

## Key decisions

### Why separate test phases?

Tests are in dedicated phases (7, 9, 9.5) rather than alongside features because:

1. Phase 7 establishes the test infrastructure (helpers, fixtures, patterns) that all subsequent tests use
2. Phase 9 tests Phase 8's transaction logic which has the most complex business rules
3. Phase 9.5 is a coverage sweep targeting route/repo layers that were already covered by integration tests

### Why Prisma with PrismaPg adapter?

The `@prisma/adapter-pg` adapter gives native PostgreSQL prepared statements and better performance than Prisma's default query engine, while keeping the Prisma schema/migration DX.

### Why Zod over Ajv?

Fastify 5 defaults to Ajv, but `fastify-type-provider-zod` replaces it with Zod for:

- Better TypeScript type inference (schemas double as types)
- More expressive validation (UUID, email, date patterns)
- Consistent validation language across the whole stack

### Why separate unit and integration configs?

- Unit tests: fast, parallel, no external dependencies, mock at boundaries
- Integration tests: sequential (`pool: "forks"`, `maxWorkers: 1`), real test database, global setup for schema push

### Coverage exclusions

These files are excluded from coverage reports:

- `src/server.ts` — entry point (just calls listen)
- `src/instrumentation.ts` — OTel/Sentry setup (infrastructure, graceful degradation)
- `src/plugins/**` — reserved for future Fastify plugins
- `src/generated/**` — auto-generated Prisma client

## Final metrics

- **13 API endpoints** across 6 route files
- **4 database models** with 3 enums
- **216 tests** (150 unit + 66 integration) across 29 test files
- **96.85% unit statement coverage** (87.27% branch)
- **95.81% integration statement coverage** (85.45% branch)
- All source layers at 100% except `prisma.ts` (infra singleton) and one branch in `app.ts` (pino-pretty transport)

## Plan files

| File                                                                 | Description                                |
| -------------------------------------------------------------------- | ------------------------------------------ |
| [overview.md](overview.md)                                           | Project overview, tech stack, architecture |
| [phase-0-scaffolding.md](phase-0-scaffolding.md)                     | Project setup, dependencies, configs       |
| [phase-1-database.md](phase-1-database.md)                           | Docker, Prisma schema, migrations, seed    |
| [phase-2-app-foundation.md](phase-2-app-foundation.md)               | Fastify factory, errors, health route      |
| [phase-3-observability.md](phase-3-observability.md)                 | OpenTelemetry + Sentry                     |
| [phase-4-fund-endpoints.md](phase-4-fund-endpoints.md)               | Fund CRUD (4 endpoints)                    |
| [phase-5-investor-endpoints.md](phase-5-investor-endpoints.md)       | Investor list + create (2 endpoints)       |
| [phase-6-investment-endpoints.md](phase-6-investment-endpoints.md)   | Investment endpoints (2 nested)            |
| [phase-7-core-tests.md](phase-7-core-tests.md)                       | Test infrastructure + 121 tests            |
| [phase-8-transaction-endpoints.md](phase-8-transaction-endpoints.md) | Transaction processing (5 endpoints)       |
| [phase-9-extended-tests.md](phase-9-extended-tests.md)               | Edge case tests → 185 tests                |
| [phase-9.5-unit-coverage.md](phase-9.5-unit-coverage.md)             | Coverage sweep → 216 tests, 97% stmts      |
