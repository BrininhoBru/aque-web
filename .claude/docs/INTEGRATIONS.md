# External Integrations

## APIs & External Services

**Backend API:**
- `aque-backend` (Spring Boot REST API, sibling repo) — sole external service this SPA talks to
  - Client: Angular `HttpClient` (`provideHttpClient` in `src/app/app.config.ts`)
  - Base path: relative `/api/...`, each domain service hardcodes its own sub-path:
    - `src/app/core/services/transaction.service.ts:28` → `/api/transactions`
    - `src/app/core/services/dashboard.service.ts:9` → `/api/dashboard`
    - `src/app/core/services/person.service.ts:9` → `/api/persons`
    - `src/app/core/services/recurring.service.ts:16` → `/api/recurring`
    - `src/app/core/services/split.service.ts:13` → `/api/split`
    - `src/app/core/services/category.service.ts:9` → `/api/categories`
    - `src/app/core/auth/auth.service.ts` → `/api/auth/login`
  - Routing: dev via `proxy.conf.json` (`/api` → `http://127.0.0.1:8080`), prod via `nginx.conf` (`/api/` → `http://aque-backend:8080/api/`, Docker Compose service name)
  - No API client SDK or generated OpenAPI client — plain `HttpClient` calls per service

No other third-party APIs, SaaS integrations, or external SDKs (no Stripe, no analytics, no error-tracking SDK, no maps, no payment providers).

## Data Storage

**Databases:** None directly — this is a frontend-only repo. Persistence lives entirely in `aque-backend` (Postgres).
**File Storage:** Local filesystem only (static assets in `public/`, served by Nginx).
**Caching:** None (no service worker, no HTTP cache layer beyond browser defaults).

## Authentication & Identity

Custom JWT-based auth, fully implemented against `aque-backend`:
- `src/app/core/auth/auth.service.ts` — login via `POST /api/auth/login`, stores JWT in `localStorage` (key `aque_token`), exposes `isAuthenticated` signal by decoding JWT `exp` claim client-side (no signature verification, expected for a client)
- `src/app/core/auth/auth.interceptor.ts` — functional `HttpInterceptorFn` attaches `Authorization: Bearer <token>` to every outgoing request; on `401` or `403` response, force-logs-out (backend uses 401 only for bad login credentials, 403 for expired/invalid/missing token on protected routes)
- No refresh-token flow, no OAuth/SSO/social login

## Monitoring & Observability

**Error Tracking:** None. **Logs:** Console only (`console.error` on bootstrap failure); no structured client-side logging.

## CI/CD & Deployment

Self-hosted: Raspberry Pi 3B running Docker Compose (Nginx container serving this app). GitHub Actions builds the Docker image, pulled by the Pi in deployment.

## Environment Configuration

**Required env vars:** none in the frontend build itself (no Angular environment files, no `.env` usage). API target is configuration-file-driven (`proxy.conf.json` for dev, `nginx.conf` for prod), not env-var-driven.

**Secrets location:**
- TLS certs mounted at runtime in production (`/etc/nginx/certs/aque.crt`, `.key`) via Docker bind mounts — not present in this repo
- JWT stored client-side in `localStorage` (not a "secret" in the backend sense, but security-relevant: no httpOnly cookie, standard XSS exposure tradeoff for SPA JWT storage)

## Webhooks & Callbacks

None — SPA has no server-side endpoints.
