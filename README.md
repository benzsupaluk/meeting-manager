# Meeting Manager

A **Candidate Meeting Scheduler**. Recruiters log in, browse upcoming interviews, book and edit meetings, and keep interview notes and feedback for each candidate.

This is a monorepo with two apps:

| Folder | What it is | Stack |
| --- | --- | --- |
| [`meeting-manager-frontend`](meeting-manager-frontend) | Web client | Next.js 16 (App Router), TypeScript, Zustand, Tailwind CSS v4, shadcn/ui |
| [`meeting-manager-backend`](meeting-manager-backend) | REST API | Node.js 22, Express 5, TypeScript, PostgreSQL (`pg`), zod, Vitest + Supertest |

## Project structure

```
meeting-manager/
├── meeting-manager-frontend/
│   ├── src/
│   │   ├── app/              # Routes: /login and the authenticated area (dashboard, meetings, candidates)
│   │   ├── features/         # UI grouped by domain: auth, layout, meetings, candidates
│   │   ├── stores/           # Zustand stores: auth (persisted), meetings, candidates
│   │   ├── lib/              # Typed API client, types, constants, formatting
│   │   ├── hooks/            # useInfiniteScroll, useDebouncedValue
│   │   └── components/       # Shared components and shadcn/ui primitives
│   ├── Dockerfile
│   └── .env.example
├── meeting-manager-backend/
│   ├── src/
│   │   ├── domain/           # Entities, enums, typed errors (no framework imports)
│   │   ├── services/         # Use cases: auth, meetings, candidates
│   │   ├── repositories/     # Interfaces plus postgres/ and memory/ implementations
│   │   ├── http/             # Express router, controllers, zod schemas, middleware
│   │   ├── db/               # Migrations and demo-data seed
│   │   ├── config/env.ts     # Validated environment
│   │   ├── container.ts      # Composition root
│   │   ├── app.ts            # createApp(services)
│   │   └── server.ts         # Bootstrap and graceful shutdown
│   ├── tests/                # Service and HTTP integration tests
│   ├── Dockerfile
│   ├── docker-compose.yml    # Full stack: Postgres + API + Web
│   └── .env.example
└── README.md
```

Each app has its own README with more detail (API reference, architecture notes).

## Option 1: Run everything with Docker

Requires Docker with Compose.

```bash
cd meeting-manager-backend
docker compose up --build
```

| Service | URL |
| --- | --- |
| Web | http://localhost:3000 |
| API | http://localhost:4000/api |
| Postgres | localhost:5432 (user `meeting`, password `meeting`, db `meeting_manager`) |

Demo login: `recruiter@example.com` / `password123`, or click **Continue as Guest**. Guests can browse meetings, open details and use join links, but can't schedule, edit or cancel meetings.

Optional overrides (environment variables or a `.env` next to `docker-compose.yml`): `DB_PORT`, `JWT_SECRET`, `WEB_ORIGIN`, `PUBLIC_API_URL`.

Stop with `docker compose down`. Add `-v` to also delete the database volume.

## Option 2: Run locally for development

Requirements: **Node.js 22** and **pnpm** (`corepack enable`). The `.nvmrc` files in each app select the right Node version with `nvm use`.

### 1. Backend

```bash
cd meeting-manager-backend
pnpm install
cp .env.example .env

# With Postgres:
docker compose up -d db
pnpm dev

# Or with no database (in-memory, resets on restart):
DB_DRIVER=memory pnpm dev
```

The API runs at http://localhost:4000/api. On startup it runs migrations and seeds demo data if the database is empty.

### 2. Frontend

In a second terminal:

```bash
cd meeting-manager-frontend
pnpm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:4000/api
pnpm dev
```

The web app runs at http://localhost:3000.

## Build for production

```bash
# Backend: compiles to dist/ and runs it
cd meeting-manager-backend
pnpm build
pnpm start

# Frontend: Next.js production build and server
cd meeting-manager-frontend
pnpm build
pnpm start
```

`NEXT_PUBLIC_API_URL` is inlined at **build time**, so set it before `pnpm build` (or pass it as a Docker build arg). It must be reachable from the user's browser.

## Deployment

The app is deployed as three services: **Supabase** (database), **Render** (API) and **Vercel** (web).

## Test and check

| Where | Command | What it does |
| --- | --- | --- |
| backend | `pnpm test` | Unit and HTTP tests (in-memory repositories, no database needed) |
| backend | `pnpm typecheck` | TypeScript only |
| frontend | `pnpm test` | Vitest and Testing Library |
| frontend | `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript |

## Environment variables

**Backend** (`meeting-manager-backend/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | API port |
| `DB_DRIVER` | `postgres` | `postgres` or `memory` |
| `DATABASE_URL` | `postgres://meeting:meeting@localhost:5432/meeting_manager` | Postgres connection |
| `JWT_SECRET` | dev value | Token signing secret. Change it in production. |
| `JWT_EXPIRES_IN` | `1d` | Token lifetime |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated allowed origins |
| `SEED_DEMO_DATA` | `true` | Seed demo data when the database is empty |

**Frontend** (`meeting-manager-frontend/.env.local`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | Base URL of the REST API |
