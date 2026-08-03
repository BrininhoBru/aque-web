# Coding Conventions

## Naming Patterns

**Files:**
- Angular CLI defaults: `kebab-case.type.ts` — e.g. `auth.service.ts`, `auth.guard.ts`, `auth.interceptor.ts`, `dashboard.component.ts`, `month-year.service.ts`
- Spec files mirror the source: `auth.service.spec.ts` next to `auth.service.ts`
- Feature folders under `src/app/features/<feature>/` hold a route-level component named after the folder (`dashboard.component.ts`, `transactions.component.ts`); nested sub-components live in their own subfolder (`transactions/transaction-form/transaction-form.component.ts`)

**Functions:**
- camelCase, verb-first: `nextMonth()`, `previousMonth()`, `setMonthYear()`, `loadPartial()`

**Variables:**
- Private signal backing fields prefixed with underscore, public readonly signal exposed without prefix:
  ```typescript
  private readonly _selected = signal<MonthYear>({...});
  readonly selected = this._selected.asReadonly();
  ```
- Local domain-specific enums-as-string-unions in Portuguese for user-facing state (`'PENDENTE' | 'PAGO'`, `'RECEITA' | 'DESPESA'`, `'TODOS' | 'ATIVOS' | 'INATIVOS'`)

**Types:**
- PascalCase interfaces, no `I` prefix: `Category`, `Person`, `Transaction`, `RecurringTransaction`, `SplitRule`, `DashboardSummary`
- Component-local view/form models suffixed `Model` or `Payload`: `TransactionModel` (form shape), `TransactionPayload` (service DTO)
- Domain models centralized in `src/app/core/models/index.ts`, re-exporting `./enums`

## Code Style

**Formatting:**
- Prettier, configured inline in `package.json` (`"prettier"` key), no separate `.prettierrc`
- `printWidth: 100`, `singleQuote: true`, `.html` files use the `angular` parser override
- `.editorconfig` enforces 2-space indent, single quotes for `.ts`, final newline, trimmed trailing whitespace

**Linting:** No ESLint config present — style is enforced by Prettier + TypeScript strictness only.

**TypeScript:**
- Strict compiler settings via `tsconfig.json` (Angular CLI defaults)
- Standalone components everywhere — no `NgModule` declarations anywhere in `src/app`

## Import Organization

**Order (observed, not enforced by tooling):**
1. Angular framework imports (`@angular/core`, `@angular/common`, `@angular/forms/signals`, `@angular/router`)
2. RxJS imports (`rxjs/operators`, `rxjs`)
3. Local relative imports, deepest/most-specific last (services, then shared services, then models)

**Path Aliases:** None configured — all local imports use relative paths.

## Error Handling

**HTTP errors:**
- Centralized in `authInterceptor` (`src/app/core/auth/auth.interceptor.ts`): any `401` or `403` response triggers `authService.logout()` and redirect — components don't handle auth errors individually
- Feature-level HTTP failures are caught per-call and surfaced via `ToastService` rather than thrown
- `DashboardComponent` treats a `404` on the split endpoint as a valid "not configured" state (`splitError` signal set to `true`), not as an error to propagate

**Auth token validation:**
- JWT payload decoding wrapped in `try/catch` returning `false` on any parse failure (`AuthService.isAuthenticated`) — never throws to callers

**Forms:**
- Signal Forms validators (`required()`, `min()`) attach inline validation messages in Portuguese; a `computed()` (`formValid`) aggregates per-field `.valid()` checks rather than reading a single form-level valid flag

## Logging

No console wrapper or logging service — errors are surfaced to the user via `ToastService`, not logged to console.

## Comments

**When to comment:**
- Comments are written in Portuguese and used sparingly, mostly to explain *why* something non-obvious is done (e.g. duplicate requests, workarounds), not to restate *what* the code does:
  ```typescript
  // dispara a change detection pra rodar o effect() do construtor (que faz o load() inicial)
  fixture.detectChanges();
  ```
- Test comments frequently document known quirks/bugs being locked in by the test.

**JSDoc/TSDoc:** Not used.

## Function Design

**Size:** Small, single-purpose methods (a handful of lines); component classes group related signals/computed values together at the top before methods.

**Parameters:** Primitive or small object parameters; no options-object pattern observed for 1-2 arg functions (`setMonthYear(month, year)` not `setMonthYear({month, year})`).

**Return Values:** Services expose `Observable<T>` from HTTP methods (unwrapped by callers), signals/computed for synchronous state reads.

## Module Design

**Exports:** One class/interface per file for services, guards, interceptors, pipes; models are batched into a single `src/app/core/models/index.ts` barrel plus `enums.ts`.

**Barrel Files:** Only `core/models/index.ts` acts as a barrel (`export * from './enums'` plus inline interfaces); no barrels for services, components, or features — always import directly from the specific file.

## State Management Convention (project-specific, load-bearing)

- No NgRx, no RxJS `BehaviorSubject` for app state — Angular Signals only
- Services expose state as `readonly` signals via `.asReadonly()`, never the raw writable signal
- `computed()` derives all reactive derived values; `effect()` used sparingly for side effects only (e.g. triggering initial data load in a component constructor — see `DashboardComponent`)
- `MonthYearService` (`src/app/core/services/month-year.service.ts`) is the single global month/year selector; features read `monthYear.month()`/`monthYear.year()` rather than maintaining their own date state

## Forms Convention (project-specific, load-bearing)

- Use Angular's experimental **Signal Forms** (`@angular/forms/signals`): `form()`, `FormField`, `required()`, `min()` — NOT `ReactiveFormsModule`
- Canonical example: `src/app/features/transactions/transaction-form/transaction-form.component.ts`
- Form backing model is a plain `signal<T>()`; the `form()` call wraps it and attaches field-level validators; template binds via the `FormField` directive

## Styling Convention (project-specific)

- Tailwind CSS v4, PostCSS-only (no `tailwind.config.js`) — design tokens defined as CSS custom properties (`--color-ledger-*`) in `src/styles.css` via `@theme`
- Reusable utility classes: `.ledger-card`, `.ledger-input`, `.ledger-label`, `.ledger-table`, `.btn-primary`/`-secondary`/`-ghost`/`-danger`, `.badge-paid`/`-pending`/`-income`/`-expense`
- Component-local styles use the `styles: [...]` inline array (not separate `.css` files) for small scoped animations, e.g. the loader spinner in `transaction-form.component.ts`
