# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development server (proxies /api to localhost:8080)
npm start

# Build for production
npm run build

# Run all tests (headless via Karma + Jasmine)
npm test

# Run tests for a specific file
npx ng test --include='**/auth.service.spec.ts'

# Watch build
npm run watch
```

## Architecture

**AqueWeb** is an Angular 21 personal finance SPA (standalone components, no NgModules). It communicates with a backend at `localhost:8080` via the dev proxy in `proxy.conf.json` — all HTTP calls use the `/api` prefix.

### State management approach

The app uses Angular Signals throughout — no NgRx or RxJS `BehaviorSubject` for state. Key pattern:
- Services expose `readonly` signals (`signal.asReadonly()`) for state consumers
- `computed()` derives values from signals
- `effect()` is used sparingly for side effects

**`MonthYearService`** (`src/app/core/services/month-year.service.ts`) is the global month/year selector. Features read `monthYear.month()` and `monthYear.year()` to scope their API calls. When the user navigates months in the header, all views react automatically.

### Forms

Forms use Angular's experimental **Signal Forms** API (`@angular/forms/signals`): `form()`, `FormField`, `required()`, `min()`. This is **not** the standard `ReactiveFormsModule`. See `transaction-form.component.ts` for the canonical usage pattern.

### Folder structure

```
src/app/
  core/
    auth/         # AuthService (signal-based), authGuard, authInterceptor
    models/       # All shared interfaces + enums (re-exported from index.ts)
    services/     # One service per domain (transaction, category, person, recurring, split, dashboard)
  features/       # Route-level components (dashboard, transactions, recurring, categories, persons, split, login)
  layout/         # AppShellComponent (sidebar + header + router-outlet), SidebarComponent, HeaderComponent
  shared/
    components/toast/  # ToastComponent
    pipes/             # BrlCurrencyPipe, MonthYearPipe
    services/          # ToastService
```

### Auth flow

`AuthService` stores the JWT in `localStorage` under key `aque_token`. `authInterceptor` injects the `Authorization: Bearer` header on every request and calls `auth.logout()` on 401 **or** 403. `authGuard` protects all routes under the `AppShellComponent` layout.

**401 vs 403 contract with `aque-backend`:** the backend only returns `401` for wrong credentials at `POST /auth/login` (handled inline by `login.component.ts`, not the interceptor). A missing, invalid, or expired token on any protected route returns `403` — Spring Security's default for an unauthenticated request past the `JwtFilter`, not a "true" authorization failure. `authInterceptor` treats both as "not logged in" and logs out. This is an implicit behavior contract, not enforced by a shared type or a test spanning both repos — a change to `aque-backend`'s `SecurityConfig`/exception handling that starts returning a different status for expired tokens would silently break logout-on-expiry here. See the matching note in `aque-backend/CLAUDE.md`.

### Styling

- **Tailwind CSS v4** (PostCSS plugin, no config file) — the entire design system is CSS-based config in `src/styles.css` via `@theme`
- Light "ledger" (cream/paper) theme by default via CSS custom properties (`--color-ledger-*`) in `src/styles.css`, with an opt-in dark mode: `@custom-variant dark (&:where(.dark, .dark *))` plus a `.dark { ... }` block redefining every `--color-ledger-*` token. Toggled by `ThemeService` (`core/services/theme.service.ts`), which adds/removes the `.dark` class on `<html>`, persists the choice in `localStorage`, and defaults to OS preference (`prefers-color-scheme`) on first load
- Reusable classes: `.ledger-card`, `.ledger-input`, `.ledger-label`, `.ledger-table`, `.btn-primary`/`-secondary`/`-ghost`/`-danger`, `.badge-paid`/`-pending`/`-income`/`-expense`
- Fonts: **Crimson Pro** (serif/display) and **DM Mono** (numeric/mono) from Google Fonts

### Charts

Dashboard uses **ng-apexcharts** (`ng-apexcharts` + `apexcharts`). Chart option types are defined locally in `dashboard.component.ts` (`PieChartOptions`, `LineChartOptions`).

### Domain models

All interfaces live in `src/app/core/models/index.ts`. Key types:
- `Transaction` — has `referenceMonth`/`referenceYear`, `amountExpected`/`amountPaid`, `status: PENDENTE|PAGO`
- `RecurringTransaction` — template that generates monthly transactions; linked via `recurringId` on `Transaction`
- `SplitRule` / `SplitResult` — per-month expense split among `Person` entries by percentage 

## Reference docs

Deeper, verified-against-code analysis lives in `.claude/docs/`: `ARCHITECTURE.md` (layers, data flow, anti-patterns), `CONVENTIONS.md` (naming, error handling, style), `STACK.md` (dependencies, versions), `STRUCTURE.md` (where to add new code), `TESTING.md` (test patterns/fixtures), `INTEGRATIONS.md` (external services, env vars), `CONCERNS.md` (tech debt, known gaps, fragile areas). Read the relevant one before a structural change or when this file doesn't have the answer.

## Key decisions

- **Signals over NgRx** — simpler state for a small, single-domain app.
- **Signal Forms over `ReactiveFormsModule`** — experimental Angular API, chosen deliberately to align with the Signals-first approach.
- **JWT in `localStorage`, not an httpOnly cookie** — acceptable risk for a single-user personal app; revisit only if the XSS threat model changes.
