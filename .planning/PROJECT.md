# Aque Web

## What This Is

Aque Web is an Angular 21 single-page app — the frontend for **aque**, a personal finance app for a single household/user. Standalone components, Signals for state, Signal Forms for input, Tailwind v4 for styling. Talks to the `aque-backend` Spring Boot API under `/api`.

## Core Value

Let the user view and manage their money (transactions, categories, people, recurring transactions, splits) quickly and without friction — this is a daily-use ledger tool, so speed and clarity of the transaction/dashboard views matter most.

## Current Milestone: v1.0 Tech Debt & Testing Cleanup

**Goal:** Close out the 8 issues filed from the `/gsd-onboard` codebase audit — the missing test coverage across services/login/toast, the `environment.ts` gap, centralized HTTP error handling, and the small typing/documentation cleanups.

**Target features:**
- Cover the untested HTTP service layer and the auth-critical login component with specs
- Introduce `environment.ts` for API base URL config (supersedes the earlier "out of scope" call — now being addressed)
- Centralize HTTP error handling and document the cross-repo 401/403 contract
- Clear the small typing cleanups (Signal Forms callback, ApexCharts formatter) and add a toast spec

## Requirements

### Validated

- ✓ JWT-based login, token stored in `localStorage`, auto-logout on 401/403 — existing
- ✓ Transaction management (list, create, edit) scoped by month/year via global `MonthYearService` — existing
- ✓ Category management — existing
- ✓ Person management (for expense splitting) — existing
- ✓ Recurring transaction management — existing
- ✓ Expense split view (`split` feature) — existing
- ✓ Dashboard with charts (ng-apexcharts: pie + line) — existing
- ✓ Light "ledger" theme with opt-in dark mode (OS-preference default, persisted via `ThemeService`) — existing
- ✓ App shell layout (sidebar + header, route-guarded) — existing

### Active

<!-- Milestone v1.0: tech-debt/testing cleanup, scoped from GitHub issues #3-#10 -->

- [ ] Core HTTP services (transaction, category, person, recurring, split, dashboard, theme) have unit tests — GH #3
- [ ] login.component.ts has a spec — GH #4
- [ ] `environment.ts` exists with `apiBaseUrl`, replacing hardcoded `/api/...` paths — GH #5
- [ ] HTTP error handling is centralized, surfacing backend messages and logging unexpected errors — GH #6
- [ ] The 401 vs 403 auth-failure contract with `aque-backend` is documented or contract-tested — GH #7
- [ ] toast service/component have specs — GH #8
- [ ] Signal Forms field callback in login.component.ts is typed (no `any`) — GH #9
- [ ] ApexCharts formatter in dashboard.component.ts is typed (no `any`) — GH #10

### Out of Scope

- NgRx / centralized state library — Signals-based per-service state is the established pattern and covers current needs

## Context

- Brownfield onboarding via `/gsd-onboard` on 2026-08-01. Full codebase map at `.planning/codebase/` (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS).
- Sibling repo `aque-backend` (Spring Boot 3 REST API) is the only backend this app talks to; the two are independent git repos under the same parent directory, no monorepo tooling. Dev proxy (`proxy.conf.json`) forwards `/api` to `localhost:8080`.
- Known tech debt (see `.planning/codebase/CONCERNS.md`): no `environment.ts` (hardcoded `/api/...` base paths per service), a couple of `any`-typed callbacks (Signal Forms field tree, ApexCharts formatter), and generic non-actionable error toasts that discard the real `HttpErrorResponse`.
- Security note: JWT stored in `localStorage` (XSS-exfiltration risk in principle), mitigated by client-side expiry check and forced logout on 401/403 — acceptable tradeoff for a single-user personal app, revisit only if the threat model changes.
- Deploys via GitHub Actions/Docker; see `../fluxo-deploy-aque.md`.

## Constraints

- **Tech stack**: Angular 21 standalone components, Signals (no NgRx/RxJS BehaviorSubject for state), Signal Forms (`@angular/forms/signals`, experimental API) — established, not up for debate without a migration plan
- **Styling**: Tailwind v4 CSS-based config (`@theme` in `src/styles.css`), no `tailwind.config.js` — keep design tokens there, not scattered inline
- **API contract**: All calls prefixed `/api`, single-origin assumption baked into every service (see Out of Scope note above)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Signals over NgRx | Simpler state for a small, single-domain app | ✓ Good |
| Signal Forms over ReactiveFormsModule | Newer Angular API, aligns with Signals-first approach | ✓ Good |
| JWT in localStorage, not httpOnly cookie | Simplicity for a single-user personal app; SPA-only, no cross-site cookie needs | ✓ Good — acceptable risk at current scale |

---
*Last updated: 2026-08-01 after starting milestone v1.0*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
