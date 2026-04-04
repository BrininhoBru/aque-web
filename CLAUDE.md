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

`AuthService` stores the JWT in `localStorage` under key `aque_token`. `authInterceptor` injects the `Authorization: Bearer` header on every request and calls `auth.logout()` on 401. `authGuard` protects all routes under the `AppShellComponent` layout.

### Styling

- **Tailwind CSS v4** (PostCSS plugin, no config file)
- Dark-only theme via CSS custom properties defined in `src/styles.css` (`--color-bg`, `--color-surface`, `--color-primary`, etc.)
- Reusable utility classes defined in `@layer components`: `.card`, `.card-glass`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.input`, `.label`, `.badge-pago`, `.badge-pendente`, `.badge-receita`, `.badge-despesa`, `.page-title`
- Fonts: **DM Sans** (body) and **Syne** (display/headings) from Google Fonts

### Charts

Dashboard uses **ng-apexcharts** (`ng-apexcharts` + `apexcharts`). Chart option types are defined locally in `dashboard.component.ts` (`PieChartOptions`, `LineChartOptions`).

### Domain models

All interfaces live in `src/app/core/models/index.ts`. Key types:
- `Transaction` — has `referenceMonth`/`referenceYear`, `amountExpected`/`amountPaid`, `status: PENDENTE|PAGO`
- `RecurringTransaction` — template that generates monthly transactions; linked via `recurringId` on `Transaction`
- `SplitRule` / `SplitResult` — per-month expense split among `Person` entries by percentage
