# Aque Web

## What This Is

Aque Web is an Angular 21 single-page app — the frontend for **aque**, a personal finance app for a single household/user. Standalone components, Signals for state, Signal Forms for input, Tailwind v4 for styling. Talks to the `aque-backend` Spring Boot API under `/api`.

## Core Value

Let the user view and manage their money (transactions, categories, people, recurring transactions, splits) quickly and without friction — this is a daily-use ledger tool, so speed and clarity of the transaction/dashboard views matter most.

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

<!-- No new v1 work scoped at onboarding time. -->

(None yet — this is a baseline onboarding snapshot of an already-shipped app. Run `/gsd-new-milestone` or `/gsd-capture` to scope the next slice of work.)

### Out of Scope

- Environment-based API config (`environment.ts`) — currently every service hardcodes its own `/api/...` path; works because dev proxy and prod both serve API under the same origin. Revisit only if a split-origin deployment is ever needed.
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
*Last updated: 2026-08-01 after initialization*

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
