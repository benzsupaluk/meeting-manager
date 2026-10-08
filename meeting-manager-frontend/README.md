# Meeting Manager — Frontend

Web client for the **Candidate Meeting Scheduler**: recruiters log in, browse upcoming interviews, book new ones, and keep notes and feedback per candidate.

Built with **Next.js 16 (App Router) · TypeScript · Zustand · Tailwind CSS v4 · shadcn/ui · lucide-react**. The REST API lives in [`meeting-manager-backend`](../meeting-manager-backend).

## Features

| Page | Route | What it does |
| --- | --- | --- |
| Login | `/login` | Email + password, or **Continue as Guest** (view-only, see below) |
| Dashboard | `/dashboard` | "Upcoming Meetings" card list with **infinite scroll**, Upcoming/Past/All tabs, status filter and debounced search; today's meetings panel. Each card shows the creator's email |
| Booking form | `/meetings/new` | Candidate autocomplete (or free text), position, date picker, start/end time, Onsite / Zoom / Google Meet, location or link, status, notes |
| Edit meeting | `/meetings/:id/edit` | Same form, pre-filled |
| Candidate summary | `/candidates/:id` | Profile header with **Edit Meeting / Cancel Meeting / Add Feedback**, meeting info with creator email, interview notes (read-only view with an **Edit** toggle once notes exist), history timeline (past interviews + evaluations) |

Each meeting card also has a menu to edit it, confirm it, cancel it, or delete it (with a confirmation step).

Meetings without a recorded creator (created before the backend tracked one) show the demo recruiter as their creator.

### Guest access

**Continue as Guest** signs in as a shared account with `role: "guest"`. Guests can browse meetings, open candidate details and use join links. The app hides scheduling, editing and cancelling for them:

- No **Schedule Meeting** nav item, sidebar card or dashboard button.
- `/meetings/new` redirects to `/dashboard` with a toast; `/meetings/:id/edit` shows a notice instead of the form.
- **Edit** and **Cancel** are removed from meeting menus and the candidate header, and **Cancelled** is removed from the status dropdown.
- The header shows "Guest access" instead of an email.

Use `useIsGuest()` from `stores/auth-store` and `<MembersOnly>` from `features/auth/members-only` to gate new member-only UI. The backend only enforces the create rule (`403` on `POST /meetings`), so the edit and cancel restrictions are UI-only.

## Getting started

Requirements: **Node.js ≥ 20.9** (22 LTS recommended) and **pnpm** (`corepack enable`).

```bash
cp .env.example .env.local      # points at http://localhost:4000/api by default
pnpm install
pnpm dev                        # http://localhost:3000
```

Start the backend first (see its README). The quickest option, with no database needed, is `DB_DRIVER=memory pnpm dev` in the backend repo.

Demo login: `recruiter@example.com` / `password123`

### Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm test` | Unit and component tests (Vitest + Testing Library) |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript |

### Environment

| Variable | Default | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | Inlined at **build time**. It must be reachable from the browser. |

## Docker

```bash
docker build -t meeting-manager-web --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000/api .
docker run -p 3000:3000 meeting-manager-web
```

The image uses Next.js `output: "standalone"` and runs as a non-root user. To run the whole stack (web, API and Postgres), use the `docker-compose.yml` in the backend repo.

## Architecture

```
src/
├── app/                    # Routes only: thin pages that compose features
│   ├── login/
│   └── (app)/              # Authenticated area; layout = AuthGuard + sidebar + header
│       ├── dashboard/
│       ├── meetings/new, meetings/[id]/edit
│       └── candidates/[id]
├── features/               # UI grouped by domain
│   ├── auth/               # login form, client-side auth guard
│   ├── layout/             # sidebar, header, nav config
│   ├── meetings/           # card, list (infinite scroll), filters, form + zod schema, actions
│   └── candidates/         # profile, autocomplete, notes, history, feedback dialog
├── stores/                 # Zustand: auth (persisted), meetings (list/pagination/mutations), candidates
├── lib/
│   ├── api/                # typed fetch client + endpoint modules
│   ├── types.ts, constants.ts, format.ts
├── hooks/                  # useInfiniteScroll, useDebouncedValue
└── components/             # shared presentational pieces + shadcn/ui primitives (ui/)
```

Key decisions:

- **Separate layers.** Components never call `fetch`. They call store actions, the stores call `lib/api`, and `lib/api/client.ts` handles the auth header, JSON parsing and typed `ApiError`s. The client gets its token through `configureApiClient`, so it never imports a store and there are no circular imports.
- **Zustand stores with predictable writes.** List requests are aborted when filters change, so a slow response can't overwrite a newer one. Delete is optimistic and rolls back on failure. Updates patch the item in place and drop it if it no longer matches the active filter. Create refetches, because ordering is defined by the server.
- **Auth.** The JWT is persisted in localStorage and rehydrated after mount, so server and client render the same markup. A 401 from the API clears the session and the guard redirects to `/login?next=…`; the `next` value only accepts same-origin paths, so it can't be used for open redirects.
- **Forms.** react-hook-form with zod schemas. Field errors from the server are mapped back onto the matching inputs. Date and time inputs are combined in the user's local timezone and sent as ISO strings.
- **Accessibility.** The autocomplete follows the combobox/listbox pattern, meeting type and rating use radio groups, and the dialogs are focus-trapped (Radix).
