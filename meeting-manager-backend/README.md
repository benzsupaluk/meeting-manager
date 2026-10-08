# Meeting Manager — Backend

REST API for the **Candidate Meeting Scheduler**. It supports CRUD for interview meetings, candidate profiles with interview notes and feedback, and JWT authentication.

Built with **Node.js 22 · Express 5 · TypeScript · PostgreSQL (pg) · zod · Vitest + Supertest**. The web client lives in [`meeting-manager-frontend`](../meeting-manager-frontend).

## Quick start (whole stack in Docker)

Clone both repos side by side:

```
meeting-manager/
├── meeting-manager-backend/    ← this repo (owns docker-compose.yml)
└── meeting-manager-frontend/
```

```bash
cd meeting-manager-backend
docker compose up --build
```

| Service | URL |
| --- | --- |
| Web | http://localhost:3000 |
| API | http://localhost:4000/api |
| Postgres | localhost:5432 (`meeting` / `meeting`, db `meeting_manager`) |

Demo login: `recruiter@example.com` / `password123`. You can also use **Continue as Guest**.

You can override these with environment variables or a `.env` file next to `docker-compose.yml`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_PORT` | `5432` | Host port for Postgres (change this if 5432 is already in use) |
| `JWT_SECRET` | `please-change-me-in-production` | Signing secret for tokens |
| `WEB_ORIGIN` | `http://localhost:3000` | CORS allow-list for the API |
| `PUBLIC_API_URL` | `http://localhost:4000/api` | API URL baked into the web bundle |

## Local development

Requirements: **Node.js ≥ 22** and **pnpm** (`corepack enable`).

```bash
pnpm install
cp .env.example .env

docker compose up -d db          # Postgres only
pnpm dev                         # http://localhost:4000/api (watch mode)

# or with no database at all (in-memory, resets on restart)
DB_DRIVER=memory pnpm dev
```

On startup the server runs migrations (in a transaction, under an advisory lock) and seeds demo data if the database is empty.

| Command | Description |
| --- | --- |
| `pnpm dev` | Watch mode via tsx |
| `pnpm build` / `pnpm start` | Compile to `dist/` / run the compiled server |
| `pnpm test` | Unit and HTTP integration tests (in-memory repositories, no DB needed) |
| `pnpm typecheck` | TypeScript only |

### Environment (`.env.example`)

| Variable | Default | |
| --- | --- | --- |
| `PORT` | `4000` | |
| `DB_DRIVER` | `postgres` | `postgres` or `memory` |
| `DATABASE_URL` | `postgres://meeting:meeting@localhost:5432/meeting_manager` | |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | dev secret / `1d` | |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated list |
| `SEED_DEMO_DATA` | `true` | Seeds demo data only if no users exist |

## API

All routes are under `/api`. Every route except `/health` and `/auth/*` requires `Authorization: Bearer <token>`.

### Auth

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| POST | `/auth/guest` | — | `{ token, user }` |
| GET | `/auth/me` | — | `{ user }` |
| POST | `/auth/logout` | — | `204` (tokens are stateless; the client discards its copy) |

### Meetings

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/meetings` | Query: `page` (1), `limit` (10, max 50), `scope` = `upcoming` \| `past` \| `all`, `status` (comma-separated), `search`, `candidateId`, `from`, `to` (ISO) |
| POST | `/meetings` | Create |
| GET | `/meetings/:id` | |
| PATCH | `/meetings/:id` | Partial update |
| DELETE | `/meetings/:id` | `204` |

Meeting payload:

```jsonc
{
  "candidateId": "uuid",              // either an existing candidate…
  "candidateName": "Alice Johnson",   // …or name + position (found or created)
  "position": "Software Engineer",
  "title": "Technical Interview",     // optional, default "<position> Interview"
  "description": "Notes",             // optional
  "startAt": "2026-10-12T03:00:00Z",  // ISO-8601 with offset (the "due date")
  "endAt":   "2026-10-12T04:00:00Z",  // must be after startAt
  "type": "onsite | zoom | google_meet",
  "location": "Room A or https://…",  // optional
  "status": "pending | confirmed | cancelled | completed"  // default pending
}
```

List response shape: `{ data: Meeting[], meta: { page, limit, total, totalPages, hasMore } }`.

### Candidates

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/candidates?search=ali` | Autocomplete (`{ data: [{ id, name, position }] }`) |
| GET | `/candidates/:id` | Profile + `upcomingMeetings`, `pastMeetings`, `feedback` |
| PATCH | `/candidates/:id/notes` | `{ interviewNotes }` |
| POST | `/candidates/:id/feedback` | `{ rating: 1-5, comment, meetingId? }` |
| GET | `/positions` | Suggested positions |

### Errors

All errors use the same shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid request", "details": [{ "field": "endAt", "message": "…" }] } }
```

Possible codes: `400 VALIDATION_ERROR | BAD_JSON`, `401 UNAUTHORIZED`, `404 NOT_FOUND`, `500 INTERNAL_ERROR`.

## Architecture

The code follows clean architecture: dependencies point inward, and only `container.ts` knows about concrete implementations.

```
src/
├── domain/            # Entities, enums, pagination, typed errors (no framework imports)
├── services/          # Use cases: MeetingService, CandidateService, AuthService
├── repositories/
│   ├── types.ts       # Repository interfaces (ports)
│   ├── postgres/      # pg implementation (adapter)
│   └── memory/        # In-memory implementation (tests / DB_DRIVER=memory)
├── http/              # Express adapter: router, controllers, zod schemas, middleware
├── db/                # Migrations + idempotent demo seed
├── config/env.ts      # Validated environment
├── container.ts       # Composition root (wires repositories → services)
├── app.ts             # createApp(services): Express app, no I/O side effects
└── server.ts          # Bootstrap + graceful shutdown
```

- **Validation happens at the edge** (zod in controllers). **Business rules live in services**, for example: the end time must be after the start time, also after a partial update merges fields; candidates are found or created by name and position; the default title is derived from the position.
- **Postgres details.** Every query is parameterized. A list request is a single query that uses `COUNT(*) OVER()` for the total. Find-or-create is a race-free upsert on a unique `(lower(name), position)` index. Table constraints (`CHECK`, foreign keys) back up the validation, and there are indexes on `start_at` and `candidate_id`.
- **Security.** helmet, a CORS allow-list, a 100 kB JSON body limit, bcrypt password hashes, and login responses that take the same time whether or not the email exists, so they don't reveal which accounts exist.
- **Testability.** `createApp` takes its services as input, so the HTTP tests run the real Express stack against in-memory repositories.
