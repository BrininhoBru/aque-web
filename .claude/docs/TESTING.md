# Testing Patterns

## Test Framework

**Runner:** Karma 6.4 + Jasmine 6.1 (Angular CLI default), headless Chrome via `karma-chrome-launcher`. No standalone `karma.conf.js` — Angular CLI's built-in test builder (`@angular/build`) drives Karma via `angular.json`. Coverage plugin present: `karma-coverage`. Interactive HTML reporter available: `karma-jasmine-html-reporter`.

**Assertion Library:** Jasmine matchers (`expect().toBe()`, `.toBeTrue()`, `.toBeFalse()`, `.toBeNull()`, `.toEqual()`, `.toHaveBeenCalled()`, `.toBeTruthy()`).

**Run Commands:**
```bash
npm test                                          # Run all tests (headless via Karma+Jasmine)
npx ng test --include='**/auth.service.spec.ts'   # Run a single spec file
```
No dedicated watch/coverage npm scripts beyond `npm test` — flags can be passed through `ng test` directly.

## Test File Organization

**Location:** co-located — every `*.spec.ts` sits next to the file it tests, same directory.

**Naming:** `<subject>.<type>.spec.ts` matching the source file name exactly, e.g. `auth.service.spec.ts`, `auth.guard.spec.ts`, `auth.interceptor.spec.ts`, `dashboard.component.spec.ts`, `transaction-form.component.spec.ts`.

**Coverage in repo:**
- `src/app/app.spec.ts`
- `src/app/core/auth/auth.service.spec.ts`, `auth.guard.spec.ts`, `auth.interceptor.spec.ts`
- `src/app/core/services/month-year.service.spec.ts`
- `src/app/features/dashboard/dashboard.component.spec.ts`
- `src/app/features/transactions/transactions.component.spec.ts`
- `src/app/features/transactions/transaction-form/transaction-form.component.spec.ts`
- `src/app/features/recurring/recurring.component.spec.ts`
- `src/app/features/split/split.component.spec.ts`

Notably untested: `categories.component.ts`, `persons.component.ts`, `login.component.ts`, layout components (`app-shell`, `header`, `sidebar`), `toast.service.ts`, pipes (`brl-currency.pipe.ts`, `month-year.pipe.ts`) — see `CONCERNS.md`.

## Test Structure

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  describe('isAuthenticated()', () => {
    it('deve retornar false quando não há token', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });
  });
});
```

**Patterns:**
- Test descriptions (`describe`/`it`) are written in Portuguese, phrased as behavior statements: `'deve retornar false quando não há token'`
- Nested `describe` blocks group tests by method/feature under test (`describe('login()', ...)`, `describe('logout()', ...)`)
- `localStorage.clear()` in both `beforeEach` and `afterEach` to guarantee isolation for anything touching `AuthService`'s token storage
- `http.verify()` in `afterEach` to assert no unexpected outstanding HTTP requests
- When a test needs a service instantiated with different initial state (e.g. a pre-existing token), it calls `TestBed.resetTestingModule()` and reconfigures from scratch inside the `it()` block, rather than parameterizing `beforeEach`

## Mocking

**Framework:** Angular's `HttpClientTestingModule` (via `provideHttpClientTesting()`) + `HttpTestingController`; Jasmine `spyOn()` for method spies.

**Patterns:**
```typescript
// HTTP mocking — provide real HttpClient + testing backend, assert on HttpTestingController
TestBed.configureTestingModule({
  providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
});
httpMock = TestBed.inject(HttpTestingController);

// Expect a specific request, then flush a response (success or error status)
httpMock.expectOne(`${base}/summary/${year}/${month}`).flush(summary({}));
httpMock
  .expectOne(`${base}/split/${year}/${month}`)
  .flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });

// Spy on a real service method instead of mocking the whole service
spyOn(authService, 'logout');
expect(authService.logout).toHaveBeenCalled();
```

**What to mock:** HTTP boundary only, via `HttpTestingController` — never a hand-rolled fake `HttpClient`. Individual methods on real, DI-provided services via `spyOn()` when only observing a call, not full service replacement. Router navigation is exercised through `provideRouter([...])` with real (stub) route configs rather than mocking `Router`.

**What NOT to mock:** Signals and computed state are never mocked — tests set state directly via public signal setters and assert on computed outputs. `AuthService` itself is never mocked when testing the interceptor/guard — it's constructed for real against `localStorage` and a testing `HttpClient`.

## Fixtures and Factories

```typescript
// Local factory function per spec file, using object-spread overrides
function summary(overrides: Partial<DashboardSummary>): DashboardSummary {
  return {
    totalIncomeExpected: 100,
    totalIncomePaid: 100,
    totalExpenseExpected: 50,
    totalExpensePaid: 50,
    balanceExpected: 50,
    balancePaid: 50,
    ...overrides,
  };
}

// Fake JWT builder for auth-related specs (only encodes the `exp` claim actually read by the code)
function fakeJwt(expSeconds: number): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(expSeconds) }));
  return `header.${payload}.signature`;
}
```

No shared fixtures directory — each spec file defines its own local factory functions at the top, scoped to what that suite needs (avoid over-fixturing; only encode fields the code under test actually reads).

## Coverage

No enforced coverage threshold. View with `npx ng test --code-coverage` (`karma-coverage` is installed as a devDependency).

## Test Types

**Unit Tests:** Services (`AuthService`, `MonthYearService`) tested directly via `TestBed.inject()`, no component wrapper.

**Component/Integration Tests:** Components tested via `TestBed.createComponent()` + `fixture.detectChanges()`, with real `HttpTestingController` backing any HTTP calls triggered by constructor `effect()`s — effectively integration tests exercising signal reactivity + HTTP + component logic together. Guards and interceptors tested as plain functions via DI setup (functional guards/interceptors, not class-based).

**E2E Tests:** Not used — no Cypress/Playwright/Protractor config.

## Common Patterns

**Async Testing:**
```typescript
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [DashboardComponent],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  }).compileComponents();

  fixture = TestBed.createComponent(DashboardComponent);
  component = fixture.componentInstance;
  httpMock = TestBed.inject(HttpTestingController);
  fixture.detectChanges(); // triggers constructor effect() -> initial load()
});
```
HTTP responses are flushed synchronously within the test body (no `fakeAsync`/`tick()` observed) — `HttpTestingController.flush()` resolves the `Observable` chain immediately for assertions.

**Error Testing:**
```typescript
it('deve emitir erro quando credenciais inválidas', () => {
  let erro = false;
  service.login('admin', 'errado').subscribe({ error: () => (erro = true) });

  http
    .expectOne('/api/auth/login')
    .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

  expect(erro).toBeTrue();
  expect(localStorage.getItem('aque_token')).toBeNull();
});
```
Errors are asserted via a boolean flag set in the `subscribe({ error: ... })` callback, then checked after `flush()`, rather than using `catchError` or async/await patterns.
