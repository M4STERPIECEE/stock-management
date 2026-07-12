# Stock Management — Agent Guidelines

## Project structure

Monorepo with two independent pnpm projects: `backend/` (NestJS 11) and `frontend/` (React 19 + Vite 7). No root workspace — run all commands inside `backend/` or `frontend/`.

Docker compose moved from root to `infra/docker-compose.yml`. Use:
```bash
cd infra && docker-compose up -d --build
```

## Commands

**Backend** (`cd backend`):
- `pnpm start:dev` — Nest watch mode on `:3005`
- `pnpm test` — unit tests (Jest, `--forceExit --coverage`)
- `pnpm test:e2e` — e2e tests (needs PostgreSQL)
- `pnpm lint` — ESLint flat config (`eslint.config.mjs`)
- `pnpm build` — `nest build`
- `pnpm seed` — seed script (`src/seeds/` currently empty)

**Frontend** (`cd frontend`):
- `pnpm dev` — Vite dev server on `:5173`
- `pnpm build` — Vite production build
- `pnpm lint` — ESLint

**No frontend test runner configured.** CI only builds/lints/tests backend.

## Architecture quirks

- **TypeORM `synchronize: true`** — schema auto-syncs in dev. No manual migration steps.
- **API prefix**: `/api/v1/` (URI versioning). Swagger at `/doc/api`.
- **Auth**: JWT access token (1h) + refresh token (7d). Refresh token extracted from **body field** `refresh_token`, not header.
- **Roles**: `ADMIN` and `VENDEUR`.
- **Frontend**: TanStack Query + custom `fetchWithRefresh` wrapping the API client with auto-refresh.
- **Stock movements**: transactional (`QueryRunner`), immutable audit trail; reversing creates an inverse movement.
- **Throttling**: global 60 req/min; login 5 req/5min; forgot-password 3 req/5min.
- **No frontend tests** — none configured.
- **DB**: PostgreSQL 15, expected in CI as a service container.
- **CORS**: origin `true` (accepts any in dev).
- **Uploads**: avatars stored in `./uploads`, served at `/uploads/`, validated to JPEG/PNG/WebP ≤ 2MB.
