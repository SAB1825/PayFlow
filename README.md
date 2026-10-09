# PayFlow

A payment platform API built with NestJS — user accounts, money transfers between accounts, beneficiaries, and real-time notifications over WebSockets.

## Features

- **Authentication** — register / login / refresh / logout with JWT access tokens and rotating refresh tokens stored in `httpOnly` cookies, protected by a CSRF guard (argon2 password hashing).
- **Accounts** — savings and current accounts with balances.
- **Transfers** — move money between accounts, idempotent via an `Idempotency-Key` header and rate-limited per user.
- **Beneficiaries** — save frequently used account numbers with nicknames.
- **Notifications** — persisted in the database and pushed instantly over Socket.IO.
- **Health checks** — liveness and readiness probes for orchestrators.
- **Structured logging** — JSON/text formats, request correlation ids, optional SQL logging.

## Tech stack

| Layer     | Choice                                   |
| --------- | ---------------------------------------- |
| Framework | [NestJS](https://nestjs.com) 12 (CQRS)   |
| Language  | TypeScript 6                             |
| Database  | PostgreSQL 16 + Drizzle ORM              |
| Realtime  | Socket.IO                                |
| Testing   | Jest + Supertest                         |
| Linting   | oxlint + Prettier                        |
| Runtime   | Node.js 20+                              |

## Getting started

### Prerequisites

- Node.js 20+ and [pnpm](https://pnpm.io)
- Docker (for the local Postgres)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure the environment

```bash
cp .env.example .env
```

| Variable                 | Purpose                              |
| ------------------------ | ------------------------------------ |
| `DATABASE_URL`           | Postgres connection string           |
| `ACCESS_TOKEN_SECRET`    | JWT signing secret for access tokens |
| `ACCESS_TOKEN_EXPIRES_IN`| Access token lifetime (e.g. `15m`)   |
| `REFRESH_TOKEN_SECRET`   | JWT signing secret for refresh tokens|
| `REFRESH_TOKEN_EXPIRES_IN`| Refresh token lifetime (e.g. `7d`)  |
| `LOG_LEVEL`              | `silent` … `verbose`                 |
| `LOG_FORMAT`             | `auto` / `json` / `pretty`           |
| `LOG_HTTP` / `LOG_SQL`   | Request / query logging              |

`PORT` is optional and defaults to `3000`.

### 3. Start PostgreSQL

```bash
pnpm infra:up      # docker compose up -d --wait (waits until healthy)
```

### 4. Apply database migrations

```bash
pnpm drizzle-kit migrate    # apply committed migrations in ./drizzle
pnpm drizzle-kit generate   # generate new migrations after schema changes
```

### 5. Run the app

```bash
pnpm start:dev     # watch mode
pnpm start         # build + run once
pnpm start:prod    # run the built output (after pnpm build)
```

The API is available at `http://localhost:3000`.

## Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `pnpm start:dev`  | Start in watch mode            |
| `pnpm build`      | Compile to `dist/`             |
| `pnpm start:prod` | Run the production build       |
| `pnpm test`       | Unit tests                     |
| `pnpm test:e2e`   | End-to-end tests               |
| `pnpm test:cov`   | Unit tests with coverage       |
| `pnpm lint`       | Lint (oxlint)                  |
| `pnpm format`     | Format (prettier)              |
| `pnpm infra:up`   | Start local Postgres           |
| `pnpm infra:down` | Stop local Postgres            |
| `pnpm infra:reset`| Recreate local Postgres        |

## API

Base URL: `http://localhost:3000/api/v1`

Every business route lives behind the versioned `/api/v1` prefix and requires `Authorization: Bearer <access_token>` except the ones marked **public**. Health probes are deliberately **not** versioned — they stay at `/health/*` so orchestrator and load balancer configs never change.

Status codes: creates answer `201` with the created resource (plus a `Location` header on accounts and transfers), reads answer `200`, and mutations with no body (`DELETE /beneficiaries/:beneficiaryId`, `PATCH /notifications/:notificationId/read`, `POST /auth/logout`) answer `204`. Paths below are relative to the base URL.

### Auth (public)

| Method | Endpoint        | Description                        |
| ------ | --------------- | ---------------------------------- |
| POST   | `/auth/register`| Register a user (`name`, `email`, `password`) → `201` + user |
| POST   | `/auth/login`   | Log in (`email`, `password`) → `200` — sets refresh + CSRF cookies |
| POST   | `/auth/refresh` | Rotate the refresh token → `200` (CSRF-protected) |
| POST   | `/auth/logout`  | Clear the refresh token → `204` (CSRF-protected) |
| GET    | `/auth/me`      | Current user's profile             |

### Accounts

| Method | Endpoint              | Description                    |
| ------ | --------------------- | ------------------------------ |
| POST   | `/accounts`           | Open an account (`accountType`: `SAVINGS` \| `CURRENT`) → `201` + account |
| GET    | `/accounts`           | List the user's accounts       |
| GET    | `/accounts/:accountId`| Account details (UUID)         |

### Transfers

| Method | Endpoint                        | Description                       |
| ------ | ------------------------------- | --------------------------------- |
| POST   | `/transfers`                    | Transfer money (`fromAccountNumber`, `toAccountNumber`, `amount`) → `201` + transfer — send an `Idempotency-Key` header to make retries safe |
| GET    | `/accounts/:accountId/transfers`| Transfers for an account          |
| GET    | `/transfers/:transferId`        | Transfer details                  |

### Beneficiaries

| Method | Endpoint                  | Description                              |
| ------ | ------------------------- | ---------------------------------------- |
| POST   | `/beneficiaries`          | Add one (`accountNumber`, `nickName`) → `201` + beneficiary |
| GET    | `/beneficiaries`          | List beneficiaries                       |
| DELETE | `/beneficiaries/:beneficiaryId` | Remove one → `204`                  |

### Notifications

| Method | Endpoint                              | Description            |
| ------ | ------------------------------------- | ---------------------- |
| GET    | `/notifications`                      | List notifications     |
| GET    | `/notifications/unread-count`         | Unread badge count     |
| PATCH  | `/notifications/:notificationId/read` | Mark as read → `204`   |

### Health (public)

| Method | Endpoint         | Description                                       |
| ------ | ---------------- | ------------------------------------------------- |
| GET    | `/health/live`   | Liveness — `200` while the process serves HTTP    |
| GET    | `/health/ready`  | Readiness — `200` when all dependencies are up, `503` otherwise |
| GET    | `/health`        | Alias of `/health/ready`                          |

These three are served at the root (`http://localhost:3000/health/...`), not behind `/api/v1`.

Readiness currently checks Postgres (`select 1`) with a 2 s timeout and reports per-check timing and errors:

```json
{
  "status": "ok",
  "timestamp": "2026-10-08T13:33:31.118Z",
  "checks": [{ "name": "postgres", "status": "up", "responseTimeMs": 1 }]
}
```

New dependencies plug in through the `HEALTH_CHECKS` factory provider in `src/modules/health/health.module.ts` — no controller changes needed. The probe endpoints are exempt from auth and rate limiting, so orchestrators never see `401`/`429`.

## Real-time notifications

Clients connect with their access token and receive pushed events:

```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: accessToken },
});

socket.on('notification', (payload) => { /* new notification */ });
socket.on('notification:read', (payload) => { /* marked as read */ });
```

An invalid or missing token emits `unauthorized` and drops the connection. Transfers automatically generate notifications for both sender and receiver ("Transfer sent" / "Money received").

## Project structure

Modules follow a layered, DDD-inspired layout — each feature owns its own slices:

```
src/
├── app.module.ts            # wires modules, global guards
├── main.ts                  # bootstrap (pipes, filters, cookies)
├── modules/
│   ├── identity/            # auth, users, tokens
│   ├── account/             # accounts & balances
│   ├── transfer/            # money transfers (idempotent)
│   ├── beneficiary/         # saved beneficiaries
│   ├── notification/        # notifications + WebSocket gateway
│   └── health/              # liveness/readiness probes
└── shared/
    ├── domain/              # Money, exceptions, domain events
    └── infrastructure/      # Drizzle, guards, filters, logging
```

Every feature module splits the same way: `presentation/` (controllers, DTOs) → `application/` (CQRS commands/queries, ports) → `domain/` (entities, value objects) → `infrastructure/` (repositories, external services).

## Testing

```bash
pnpm test        # unit tests (45 tests)
pnpm test:e2e    # end-to-end tests (supertest)
pnpm test:cov    # coverage report
```

Unit tests cover domain logic, command handlers, event handlers, and the health checks; e2e tests exercise the HTTP surface.

## Logging

Structured logging is built around `AppLogger` (`src/shared/infrastructure/logging/`):

- **Formats** — colorized text in development, one JSON object per line in production (`LOG_FORMAT`), level via `LOG_LEVEL`.
- **HTTP logging** — every request logs method, path, status and duration; responses get an `x-request-id` correlation header that is attached to all logs for that request, including SQL queries.
- **SQL logging** — opt in with `LOG_SQL=true`; slow queries (over `SLOW_QUERY_MS`) always log as warnings.
- **Sensitive values** (`password`, `token`, `secret`, …) are masked automatically.
- **Lifecycle** — boot and shutdown are logged; `app.enableShutdownHooks()` handles SIGTERM/SIGINT cleanly.

```ts
private readonly logger = new AppLogger(TransferService.name);
this.logger.log('transfer completed', { transferId, amount });
```

## License

UNLICENSED
