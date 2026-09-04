# Codebase Concerns

## Tech Debt

**Hardcoded API base paths, no environment config:**
- Issue: No `environment.ts`/`environment.prod.ts` files exist. Every service hardcodes its own `/api/...` base path (e.g. `private readonly base = '/api/transactions';`).
- Files: `src/app/core/services/transaction.service.ts:28`, `dashboard.service.ts:9`, `category.service.ts:9`, `person.service.ts:9`, `recurring.service.ts:16`
- Impact: Works today only because dev proxy (`proxy.conf.json`) and prod deployment both happen to serve the API under the same origin at `/api`. Any future split-origin deployment (different API host) requires editing every service file individually.
- Fix approach: Introduce Angular `environment.ts` with `apiBaseUrl`, inject via a single `HttpClient` base config or a shared `API_BASE` token.

**Loosely-typed reactive form signatures:**
- Issue: `form()` field-tree callback typed with `any` instead of the actual model shape.
- Files: `src/app/features/login/login.component.ts:160` (`f: { username: any; password: any; }`)
- Impact: No compile-time safety on form field usage; typos in field access won't be caught.
- Fix approach: Type the callback parameter against the `model` signal's inferred type instead of `any`.

**ApexCharts formatter typed as `any`:**
- Issue: Donut chart total-label formatter takes `w: any`.
- Files: `src/app/features/dashboard/dashboard.component.ts:139`
- Impact: `w.globals.seriesTotals` access is unchecked; a library upgrade changing the callback shape would fail silently.
- Fix approach: Use `ApexOptions`/`w: ApexChart` types from `ng-apexcharts` if exported, or a narrow local interface for the fields actually accessed.

**Generic, non-actionable error messages across all feature components:**
- Issue: Every HTTP subscription's `error` handler discards the actual `HttpErrorResponse` and shows a fixed Portuguese toast string (e.g. `'Erro ao carregar lançamentos.'`), with no distinction between 4xx/5xx/network failures.
- Files: `src/app/features/transactions/transactions.component.ts:122,139,207,241`, `src/app/features/split/split.component.ts:93,110,125,134,181`, and equivalent patterns in `categories.component.ts`, `persons.component.ts`, `recurring.component.ts`
- Impact: Users get no actionable feedback (e.g. validation errors from backend are swallowed); debugging production issues requires reproducing locally since errors aren't logged anywhere.
- Fix approach: Centralize HTTP error mapping (e.g. a new error interceptor) that surfaces backend validation messages when present, and log unexpected errors for observability.

## Known Bugs

None currently open. One class of bug worth flagging as a recurring risk, found and fixed twice
in the same week (`recurring.component.html`, issues #43/#44 follow-up):

**`min`/`max` native attributes on an `<input>` bound with `[formField]` break the production
build, undetected by `npm test`:**
- Risk: Angular's template compiler raises `NG8022` ("Setting the 'min'/'max' attribute is not
  allowed on nodes using the '[formField]' directive") only during AOT compilation (`ng build`/
  `ng serve`) — Karma's JIT-based test runner (`npm test`) never exercises this code path, so a
  reintroduction of this pattern passes the full test suite while breaking `npm start` and the
  production build.
- Files: any Signal Forms field (`[formField]="..."`) — don't add `min`/`max`/other native
  validation attributes alongside it; range validation belongs in the field's `validate()`/
  `min()`/`max()` Signal Forms functions instead (see `recurring.component.ts`'s `dueDay`
  handling for the correct pattern).
- Recommendations: `docker-publish.yml` doesn't run `npm run build` today (documented gap,
  `standards.md`), so this class of bug has no CI safety net — a manual `npm start`/`ng build`
  check before merging any Signal Forms template change is the only current mitigation.

## Security Considerations

**JWT stored in localStorage:**
- Risk: `localStorage` is readable by any JS running on the page, so a single XSS vulnerability anywhere in the app (including a third-party dependency) can exfiltrate the auth token.
- Files: `src/app/core/auth/auth.service.ts` (`localStorage.getItem/setItem/removeItem(TOKEN_KEY)`)
- Current mitigation: Token expiry is checked client-side via JWT `exp` claim before treating the user as authenticated, and `auth.interceptor.ts` force-logs-out on 401/403 responses.
- Recommendations: Consider httpOnly cookie-based token storage (requires backend cookie support) if XSS surface grows; ensure no user-supplied content is rendered via `innerHTML`/`bypassSecurityTrust*` anywhere in the app (not currently observed).

**No client-side input sanitization layer beyond Angular defaults:**
- Risk: App relies entirely on Angular's built-in template sanitization; no explicit bypasses found.
- Recommendations: None needed unless a future feature introduces raw HTML rendering (e.g. markdown notes) — audit at that time.

## Performance Bottlenecks

None significant for current app size (~3,600 lines across `src/app`). Largest component (`dashboard.component.ts`, ~310 lines) mixes chart-config construction with data-fetching logic but is well within maintainable bounds at current scale.

## Fragile Areas

**Auth token expiry check via manual JWT decode:**
- Files: `src/app/core/auth/auth.service.ts`
- Why fragile: Manually splits and `atob()`-decodes the JWT payload without validating token structure beyond a try/catch; any change to token format (e.g. backend switching claim names) silently breaks `isAuthenticated` rather than failing loudly.
- Safe modification: If backend JWT shape changes, update the `payload.exp` access here; add a unit test asserting behavior for malformed tokens.

**401 vs 403 handling relies on a backend-specific undocumented convention:**
- Files: `src/app/core/auth/auth.interceptor.ts`
- Why fragile: Backend uses 401 only for a bad login credential; a missing/invalid/expired token on protected routes comes back as 403 (Spring Security). This couples frontend auth-failure handling to an implicit backend behavior contract not enforced by any shared type or cross-repo test — see the equivalent note in `aque-backend`'s architecture doc.
- Safe modification: Any change to `aque-backend`'s Spring Security exception handling (e.g. a custom `AuthenticationEntryPoint` returning 401 for expired tokens) would silently break logout-on-expiry here without a compile or runtime error on either side.

## Scaling Limits

Not applicable — SPA with no client-side data volume constraints observed (all lists rendered from filtered API responses, no unbounded in-memory collections).

## Dependencies at Risk

None flagged. Stack is current: Angular 21.2.x, RxJS 7.8, TypeScript 5.9, Tailwind 4.2, ApexCharts 5.10.

## Missing Critical Features

No environment-based configuration — see Tech Debt above; blocks any deployment topology other than same-origin API.

## Test Coverage Gaps

**Zero test files for 6 of 9 core services:**
- What's not tested: `theme.service.ts`, `category.service.ts`, `transaction.service.ts`, `recurring.service.ts`, `split.service.ts`, `dashboard.service.ts` — the entire HTTP-client service layer except `month-year.service.ts`.
- Risk: Bugs in request construction, query-param handling, or response mapping in these services won't be caught until manual QA or production.
- Priority: High — these services back every feature page.

**No spec coverage for login, categories, persons, layout components:**
- What's not tested: `login.component.ts`, `categories.component.ts`, `persons.component.ts`, `header.component.ts`, `sidebar.component.ts`, `app-shell.component.ts`, `layout.service.ts`.
- Risk: Login is the auth entry point (highest-risk untested surface); layout components control app shell behavior across every route.
- Priority: High for `login.component.ts` (auth-critical), Medium for categories/persons, Low for layout components (mostly presentational).

**No spec coverage for shared UI infrastructure:**
- What's not tested: `toast.service.ts`, `toast.component.ts`.
- Risk: Toast is the app's sole user-facing error/success feedback channel — a regression here silently breaks feedback for all features simultaneously.
- Priority: Medium.
