<!-- refreshed: 2026-08-01 -->
# Architecture

**Analysis Date:** 2026-08-01

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      Routes (lazy loaded)                    │
│                  `src/app/app.routes.ts`                     │
├──────────────────┬──────────────────┬───────────────────────┤
│   Login (public)  │  AppShell (guarded, wraps all other      │
│  `features/login` │  routes as children)                     │
│                    │  `layout/app-shell/app-shell.component`  │
└──────────────────┴──────────────────┴───────────────────────┘
         │                                     │
         ▼                                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Feature Components (standalone, route-level)       │
│  dashboard, transactions, transaction-form, recurring,        │
│  categories, persons, split                                   │
│  `src/app/features/*`                                        │
└─────────────────────────────┬─────────────────────────────────┘
                               │ inject()
                               ▼
┌─────────────────────────────────────────────────────────────┐
│         Core Services (one per domain, `providedIn: root`)   │
│  TransactionService, CategoryService, PersonService,          │
│  RecurringService, SplitService, DashboardService,             │
│  MonthYearService, AuthService, ThemeService                  │
│  `src/app/core/services/*`, `src/app/core/auth/*`             │
└─────────────────────────────┬─────────────────────────────────┘
                               │ HttpClient (via authInterceptor)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Spring Boot backend (`/api/*`, proxied to localhost:8080     │
│  in dev via `proxy.conf.json`)                                │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| AppComponent | Root bootstrap component, hosts `<router-outlet>` | `src/app/app.ts` |
| AppShellComponent | Authenticated layout shell: sidebar + header + `<router-outlet>` for feature routes | `src/app/layout/app-shell/app-shell.component.ts` |
| SidebarComponent / HeaderComponent | Navigation chrome, month/year selector, theme toggle | `src/app/layout/sidebar/sidebar.component.ts`, `src/app/layout/header/header.component.ts` |
| LayoutService | Sidebar open/collapsed state (mobile vs desktop) | `src/app/layout/layout.service.ts` |
| Feature components | One per route: fetch data from a core service, hold local UI state as signals, render templates | `src/app/features/*/*.component.ts` |
| Core services | Thin HTTP wrappers per backend resource; some own additional client-side signal state (auth, month/year, theme) | `src/app/core/services/*.ts`, `src/app/core/auth/*.ts` |
| ToastService / ToastComponent | Global transient notification queue, consumed once in `AppShellComponent` | `src/app/shared/services/toast.service.ts`, `src/app/shared/components/toast/toast.component.ts` |
| Pipes | Presentation-only transforms (BRL currency formatting, month/year label) | `src/app/shared/pipes/*.ts` |

## Pattern Overview

**Overall:** Flat two-layer SPA — standalone Angular components (feature/route layer) talking directly to per-domain injectable services (data/state layer), which talk directly to the backend REST API via `HttpClient`. No NgModules, no state-management library, no repository/facade abstraction between components and services.

**Key Characteristics:**
- Signals are the only state primitive: `signal()` for mutable state, `computed()` for derived state, `.asReadonly()` to expose read-only views from services
- Angular Signal Forms (`@angular/forms/signals`) are used instead of `ReactiveFormsModule` for forms with validation (see `transaction-form.component.ts`)
- Routes are lazily loaded per-component via `loadComponent()`, no route-level modules
- Cross-cutting UI state (selected month/year, theme, sidebar open state, toasts) lives in dedicated singleton services, not in a global store

## Layers

**Routing/Shell:**
- Purpose: top-level navigation, route guarding, layout chrome
- Location: `src/app/app.routes.ts`, `src/app/layout/`
- Contains: `Routes` config, `AppShellComponent`, `SidebarComponent`, `HeaderComponent`
- Depends on: `authGuard` (`core/auth/auth.guard.ts`), feature components (lazy-imported)
- Used by: `app.config.ts` (via `provideRouter`)

**Features:**
- Purpose: one component per route; owns page-level UI state, calls services, renders template + inline/co-located styles
- Location: `src/app/features/*`
- Contains: standalone `@Component` classes, `.html` templates, `.spec.ts` unit tests
- Depends on: core services (`inject()`), shared pipes/components, `core/models`
- Used by: router (`loadComponent`)

**Core (services/auth/models):**
- Purpose: domain data access (HTTP), cross-cutting app state (auth, month/year selection, theme), shared TypeScript interfaces
- Location: `src/app/core/`
- Contains: `services/*.service.ts` (one per backend resource), `auth/*` (AuthService, authGuard, authInterceptor), `models/index.ts` + `models/enums.ts`
- Depends on: `HttpClient`, `Router`
- Used by: feature components, layout components, shared components

**Shared:**
- Purpose: generic, feature-agnostic UI building blocks
- Location: `src/app/shared/`
- Contains: `components/toast/` (ToastComponent), `pipes/` (BrlCurrencyPipe, MonthYearPipe), `services/toast.service.ts`
- Depends on: nothing feature-specific
- Used by: any feature or layout component

## Data Flow

### Primary Request Path (list + mutate a resource, e.g. Transactions)

1. Feature component `ngOnInit`/constructor calls a core service method, e.g. `transactionService.getAll(filters)` (`src/app/features/transactions/transactions.component.ts`)
2. Service builds `HttpParams`/body and issues the request through `HttpClient` (`src/app/core/services/transaction.service.ts:30`)
3. `authInterceptor` attaches `Authorization: Bearer <token>` from `AuthService.getToken()` and intercepts 401/403 to force logout (`src/app/core/auth/auth.interceptor.ts`)
4. Response flows back as an RxJS `Observable`; component subscribes and calls `signal.set(...)` to update local state, e.g. `this.categories.set(data)` (`src/app/features/transactions/transaction-form/transaction-form.component.ts:107`)
5. Template re-renders reactively off the signal (zoneless-friendly change detection)

### Month/Year Scoping Flow

1. User changes month/year in `HeaderComponent`, which calls `MonthYearService.nextMonth()/previousMonth()/setMonthYear()` (`src/app/core/services/month-year.service.ts`)
2. `MonthYearService._selected` signal updates; `month`/`year` are `computed()` from it
3. Feature components read `monthYear.month()`/`monthYear.year()` directly (not via events) — any component reading these signals recomputes/re-fetches when they change, typically via an `effect()` or by re-triggering a fetch in a computed/subscribed callback

**State Management:**
- No central store. State ownership is distributed across singleton (`providedIn: 'root'`) services, each exposing readonly signals; components own only local/UI-only signals (loading, saving, form model)

## Key Abstractions

**Domain Service (one per backend resource):**
- Purpose: encapsulate REST calls + shape request/response types for one resource
- Examples: `src/app/core/services/transaction.service.ts`, `category.service.ts`, `person.service.ts`, `recurring.service.ts`, `split.service.ts`, `dashboard.service.ts`
- Pattern: `@Injectable({ providedIn: 'root' })` class with `private readonly http = inject(HttpClient)`, a `base` URL constant, and CRUD methods returning `Observable<T>`. Filter/payload interfaces are colocated in the same file (e.g. `TransactionFilters`, `TransactionPayload`)

**Signal-backed State Service:**
- Purpose: cross-cutting client state exposed as readonly signals
- Examples: `AuthService` (token + `isAuthenticated` computed from JWT `exp`), `MonthYearService` (selected month/year), `ThemeService` (dark mode), `LayoutService` (sidebar state), `ToastService` (toast queue)
- Pattern: private mutable `signal()`, public `readonly` exposed via `.asReadonly()` or `computed()`; mutation only through named methods on the service (never `.set()` from outside)

**Signal Forms:**
- Purpose: typed, validated form state without `ReactiveFormsModule`
- Examples: `src/app/features/transactions/transaction-form/transaction-form.component.ts`
- Pattern: a plain `signal<Model>()` holds form data; `form(modelSignal, (f) => { required(f.field, {message}); min(f.field, n, {message}); })` from `@angular/forms/signals` produces a form object; template binds fields via `FormField` directive; validity read per-field as `.valid()` and combined into a `computed()`

## Entry Points

**Bootstrap:**
- Location: `src/main.ts`
- Triggers: app startup — `bootstrapApplication(AppComponent, appConfig)`
- Responsibilities: mounts root standalone `AppComponent`, applies `appConfig` providers (zone change detection, router, HTTP client + interceptor)

**appConfig (DI root):**
- Location: `src/app/app.config.ts`
- Triggers: read once at bootstrap
- Responsibilities: registers `provideRouter(routes, withComponentInputBinding(), withViewTransitions())`, `provideHttpClient(withInterceptors([authInterceptor]))`

**Routes:**
- Location: `src/app/app.routes.ts`
- Triggers: URL navigation
- Responsibilities: lazy-loads `LoginComponent` (public) or `AppShellComponent` (guarded by `authGuard`, wraps all feature routes as children)

## Architectural Constraints

- **Threading:** Single-threaded browser SPA; no web workers. `provideZoneChangeDetection({ eventCoalescing: true })` still uses Zone.js-based change detection (not fully zoneless) — `src/app/app.config.ts:9`
- **Global state:** Cross-cutting signal state lives in root-provided singletons (`AuthService`, `MonthYearService`, `ThemeService`, `LayoutService`, `ToastService`). These are effectively app-wide mutable singletons injected wherever needed — acceptable at this app's size but any new cross-cutting concern should follow the same readonly-signal-service pattern rather than a new bespoke mechanism
- **Auth storage:** JWT stored in `localStorage` under `aque_token` (`src/app/core/auth/auth.service.ts:17`); `isAuthenticated` is computed client-side by decoding the JWT payload without signature verification — trust boundary is the backend, not the client
- **No repository/facade layer:** Feature components call domain services directly; there is no additional abstraction layer between components and `HttpClient` calls

## Anti-Patterns

None observed as established patterns to avoid — the codebase is small and consistent. One point worth flagging for future work:

### Fetch-then-filter for single-resource lookups

**What happens:** `TransactionFormComponent.loadTransaction(id)` calls `transactionService.getAll()` and finds the record client-side by `id` instead of calling a `GET /transactions/:id` endpoint (`src/app/features/transactions/transaction-form/transaction-form.component.ts:118-146`, with an inline comment noting the API lacks that endpoint).
**Why it's wrong:** Over-fetches the entire list to edit one record; will not scale as transaction volume grows.
**Do this instead:** Add a `GET /api/transactions/{id}` backend endpoint and a matching `TransactionService.getById(id)` method when this becomes a performance concern.

## Error Handling

**Strategy:** RxJS `error` callbacks in component `.subscribe({ next, error })` calls surface failures as user-facing toasts; the auth interceptor globally handles 401/403 by forcing logout.

**Patterns:**
- Components call `this.toast.error('...')` inside the `error` callback of a service subscription (e.g. `transaction-form.component.ts:108`, `:142`, `:186`)
- `authInterceptor` catches `HttpErrorResponse`, checks `status === 401 || status === 403`, and calls `auth.logout()` before rethrowing via `throwError(() => error)` (`src/app/core/auth/auth.interceptor.ts:12-21`)
- No global error boundary or centralized HTTP error interceptor beyond auth handling — each component is responsible for its own toast messaging

## Cross-Cutting Concerns

**Logging:** No structured logging; only default `console.error` on unhandled bootstrap failure (`src/main.ts:5`)

**Validation:** Client-side via Signal Forms validators (`required`, `min`) on forms; no shared custom validator library yet — validators are declared inline per form

**Authentication:** JWT bearer token attached by `authInterceptor` on every HTTP request; `authGuard` protects all routes nested under `AppShellComponent`; `AuthService.isAuthenticated` computed signal drives both

---

*Architecture analysis: 2026-08-01*
