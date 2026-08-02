# Codebase Structure

**Analysis Date:** 2026-08-01

## Directory Layout

```
aque-web/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/            # AuthService, authGuard, authInterceptor (+ .spec.ts each)
│   │   │   ├── models/          # index.ts (all shared interfaces), enums.ts
│   │   │   └── services/        # One HTTP service per backend resource + MonthYearService, ThemeService
│   │   ├── features/            # Route-level standalone components, one folder per route
│   │   │   ├── categories/
│   │   │   ├── dashboard/
│   │   │   ├── login/
│   │   │   ├── persons/
│   │   │   ├── recurring/
│   │   │   ├── split/
│   │   │   └── transactions/
│   │   │       └── transaction-form/   # Nested sub-route component
│   │   ├── layout/
│   │   │   ├── app-shell/       # AppShellComponent (sidebar + header + router-outlet)
│   │   │   ├── header/          # HeaderComponent (month/year nav, theme toggle)
│   │   │   ├── sidebar/         # SidebarComponent
│   │   │   └── layout.service.ts
│   │   ├── shared/
│   │   │   ├── components/toast/  # ToastComponent
│   │   │   ├── pipes/             # BrlCurrencyPipe, MonthYearPipe
│   │   │   └── services/          # ToastService
│   │   ├── app.ts                 # Root AppComponent
│   │   ├── app.routes.ts          # Route table (lazy loadComponent)
│   │   ├── app.config.ts          # ApplicationConfig (providers)
│   │   └── app.spec.ts
│   ├── main.ts                    # bootstrapApplication entry point
│   └── styles.css                 # Tailwind v4 @theme config + ledger design tokens
├── public/                        # Static assets served as-is
├── proxy.conf.json                # Dev proxy: /api -> localhost:8080
├── angular.json, tsconfig*.json   # Angular CLI + TS config
├── package.json
└── .agents/skills/angular-developer/   # Project-specific Angular skill (AGENTS.md-style rules)
```

## Directory Purposes

**`src/app/core/`:**
- Purpose: app-wide data access and cross-cutting concerns, no UI
- Contains: injectable services (`providedIn: 'root'`), auth guard/interceptor, shared TypeScript domain models/enums
- Key files: `core/models/index.ts` (all interfaces), `core/auth/auth.service.ts` (JWT/session state)

**`src/app/features/`:**
- Purpose: one directory per route; each holds the component `.ts`, its `.html` template, and a `.spec.ts`
- Contains: standalone `@Component` classes wired directly into `app.routes.ts` via `loadComponent`
- Key files: `features/transactions/transaction-form/transaction-form.component.ts` is the reference implementation for Signal Forms usage

**`src/app/layout/`:**
- Purpose: authenticated app chrome (shell shown after login), not itself a route target for feature content
- Contains: `AppShellComponent` (router-outlet host), `SidebarComponent`, `HeaderComponent`, `LayoutService`
- Key files: `layout/app-shell/app-shell.component.ts`

**`src/app/shared/`:**
- Purpose: generic, reusable, feature-agnostic building blocks with no domain knowledge
- Contains: `components/toast/` (presentational), `pipes/` (formatting), `services/toast.service.ts` (notification queue)

## Key File Locations

**Entry Points:**
- `src/main.ts`: bootstraps `AppComponent` with `appConfig`
- `src/app/app.routes.ts`: route table, defines guarded vs public routes
- `src/app/app.config.ts`: DI providers (router, HttpClient + interceptors, change detection)

**Configuration:**
- `proxy.conf.json`: dev-only proxy of `/api` to `localhost:8080`
- `src/styles.css`: Tailwind v4 `@theme` design tokens (ledger color system, light/dark)
- `angular.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`

**Core Logic:**
- `src/app/core/services/*.service.ts`: one file per backend resource (transaction, category, person, recurring, split, dashboard)
- `src/app/core/auth/auth.service.ts`, `auth.guard.ts`, `auth.interceptor.ts`: session/auth logic
- `src/app/core/models/index.ts`: canonical shared type definitions

**Testing:**
- Co-located `*.spec.ts` next to the file under test (Karma + Jasmine, `npm test`)
- Present for: `auth.guard.ts`, `auth.interceptor.ts`, `auth.service.ts`, `month-year.service.ts`, `app.ts`, `dashboard.component.ts`, `recurring.component.ts`, `split.component.ts`, `transaction-form.component.ts`, `transactions.component.ts`
- Missing for: `category.service.ts`, `person.service.ts`, `recurring.service.ts`, `split.service.ts`, `dashboard.service.ts`, `theme.service.ts`, layout components, shared components/pipes, `categories.component.ts`, `login.component.ts`, `persons.component.ts` — see `TESTING.md`/`CONCERNS.md` for gap details if generated

## Naming Conventions

**Files:**
- Components: `<name>.component.ts` + co-located `<name>.component.html` (and `<name>.component.spec.ts` where tested); inline `styles: [...]` used for small component-scoped CSS rather than a separate `.css` file
- Services: `<name>.service.ts`, always `@Injectable({ providedIn: 'root' })`
- Guards/interceptors: `<name>.guard.ts` / `<name>.interceptor.ts` as plain functions (`CanActivateFn`, `HttpInterceptorFn`), not classes
- Pipes: `<name>.pipe.ts`

**Directories:**
- One directory per feature/route under `features/`, named after the route (plural for list views: `categories`, `persons`, `transactions`)
- Nested sub-routes get their own subdirectory: `features/transactions/transaction-form/`
- `core/` and `shared/` are split by concern (`auth/`, `models/`, `services/` under core; `components/`, `pipes/`, `services/` under shared)

**Classes/exports:**
- PascalCase for classes (`TransactionService`, `AppShellComponent`), camelCase for guard/interceptor function exports (`authGuard`, `authInterceptor`)
- Request/response/payload interfaces are colocated in the same file as the service that uses them (e.g. `TransactionFilters`, `TransactionPayload` in `transaction.service.ts`) rather than in `core/models/`

## Where to Add New Code

**New Feature/Route:**
- Component directory: `src/app/features/<feature-name>/<feature-name>.component.ts` (+ `.html`, `.spec.ts`)
- Register route: add a `loadComponent` entry as a child of the guarded route in `src/app/app.routes.ts`
- If it needs a new backend resource: add a service in `src/app/core/services/<resource>.service.ts` following the existing `TransactionService` pattern (base URL constant, CRUD methods returning `Observable<T>`, colocated payload/filter interfaces)

**New Shared Domain Type:**
- Add to `src/app/core/models/index.ts` (or `enums.ts` for enums); keep request/response DTOs local to the service file instead

**New Cross-Cutting UI State:**
- New singleton service under `src/app/core/services/` (if domain-adjacent) or `src/app/shared/services/` (if generic), following the `MonthYearService`/`ToastService` pattern: private mutable `signal()`, public `readonly`/`computed()` exposure, mutation only via named methods

**New Reusable UI Component/Pipe:**
- Component: `src/app/shared/components/<name>/<name>.component.ts`
- Pipe: `src/app/shared/pipes/<name>.pipe.ts`

**New Form with Validation:**
- Follow `src/app/features/transactions/transaction-form/transaction-form.component.ts`: model as `signal<Model>()`, wrap with `form(modelSignal, (f) => { ... validators ... })` from `@angular/forms/signals`, bind fields in template via `FormField`

## Special Directories

**`public/`:**
- Purpose: static assets copied as-is into the build output
- Generated: No
- Committed: Yes

**`.angular/`:**
- Purpose: Angular CLI build cache
- Generated: Yes
- Committed: No

**`dist/`:**
- Purpose: production build output
- Generated: Yes
- Committed: No

**`.agents/skills/angular-developer/`:**
- Purpose: project-specific Angular conventions/rules consumed by AI coding agents (reference material, not app code)
- Generated: No
- Committed: Yes

**`.planning/`:**
- Purpose: GSD workflow planning artifacts (this document lives under `.planning/codebase/`)
- Generated: Partially (by GSD tooling)
- Committed: Yes

---

*Structure analysis: 2026-08-01*
