# Roadmap: Aque Web

## Overview

Aque Web is an existing, already-deployed Angular SPA. Milestone v1.0 closes the 8 issues filed from the `/gsd-onboard` codebase audit ([BrininhoBru/aque-web#3-#10](https://github.com/BrininhoBru/aque-web/issues)) — no new features, only tech debt and missing test coverage.

The ordering is deliberate: **all source-shape changes land before any spec is written**. `environment.ts` (DEBT-01) rewrites the URL literal in all 7 services that TEST-01 will spec; the login form typing (DEBT-04) changes the shape TEST-02 asserts against; the error interceptor (DEBT-02) changes the toast messages TEST-03 asserts against. Writing specs first means writing them twice.

## Milestones

- ✅ **Pre-GSD baseline** — existing shipped app, mapped via `/gsd-onboard` on 2026-08-01 (no phase-by-phase history; built before GSD tracking)
- 🚧 **v1.0 Tech Debt & Testing Cleanup** — Phases 1-3 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: API Config & Type Cleanup** - Single configured API base URL, no `any`-typed callbacks
- [ ] **Phase 2: Centralized HTTP Error Handling** - One error interceptor surfacing real backend messages, auth contract documented
- [ ] **Phase 3: Test Coverage for Services, Login & Toast** - Specs for the 7 untested services, the login component, and toast

## Phase Details

### Phase 1: API Config & Type Cleanup
**Goal**: Every HTTP call builds its URL from one configured base, and the two `any`-typed callbacks are typed against their real shapes.
**Depends on**: Nothing (first phase)
**Requirements**: DEBT-01 ([GH #5](https://github.com/BrininhoBru/aque-web/issues/5)), DEBT-04 ([GH #9](https://github.com/BrininhoBru/aque-web/issues/9)), DEBT-05 ([GH #10](https://github.com/BrininhoBru/aque-web/issues/10))
**Success Criteria** (what must be TRUE):
  1. `src/environments/environment.ts` and `environment.prod.ts` exist exporting `apiBaseUrl`, and `angular.json` file-replaces them on production build
  2. No file under `src/app/` contains a hardcoded `/api/...` string literal — all 6 domain services (`transaction`, `category`, `person`, `recurring`, `split`, `dashboard`) *and* `auth.service.ts`'s login call derive their URL from `environment.apiBaseUrl`
  3. The Signal Forms field callback in `login.component.ts:160` is typed against the login model — no `any` in its signature
  4. The ApexCharts donut formatter in `dashboard.component.ts:139` is typed against the ApexCharts option type — no `any`
  5. `npm run build` succeeds and `npm test` passes with the existing 10 specs still green
**Plans**: TBD

### Phase 2: Centralized HTTP Error Handling
**Goal**: HTTP failures surface the backend's actual message to the user and land in the logs, with the 401-vs-403 auth contract written down instead of buried in an interceptor comment.
**Depends on**: Phase 1 (ordering only — no file overlap, but keeps interceptor-chain and service edits landing before specs are written)
**Requirements**: DEBT-02 ([GH #6](https://github.com/BrininhoBru/aque-web/issues/6)), DEBT-03 ([GH #7](https://github.com/BrininhoBru/aque-web/issues/7))
**Success Criteria** (what must be TRUE):
  1. A single error interceptor is registered in `app.config.ts`, and a request failing with a backend validation message shows *that* message in the toast — not a generic "erro ao salvar" string
  2. Unexpected errors (5xx, network failure) are logged with status + URL while the user still gets a readable non-technical toast
  3. Per-feature `catchError` blocks that existed only to raise a generic toast are removed — HTTP error handling lives in one place
  4. The 401-vs-403 contract with `aque-backend` (401 = wrong credentials at login, 403 = missing/invalid/expired token on protected routes, per Spring Security) is documented in a durable repo location, not only as an inline comment in `auth.interceptor.ts`
  5. `npm test` passes and `auth.interceptor.spec.ts` is still green with the new interceptor in the chain
**Plans**: TBD

### Phase 3: Test Coverage for Services, Login & Toast
**Goal**: The untested HTTP service layer, the auth entry point, and the toast surface all have specs — written once, against the post-cleanup code shape.
**Depends on**: Phase 1 and Phase 2 (specs assert on URLs from Phase 1, on the login form typing from Phase 1, and on the toast messages produced by the Phase 2 interceptor)
**Requirements**: TEST-01 ([GH #3](https://github.com/BrininhoBru/aque-web/issues/3)), TEST-02 ([GH #4](https://github.com/BrininhoBru/aque-web/issues/4)), TEST-03 ([GH #8](https://github.com/BrininhoBru/aque-web/issues/8))
**Success Criteria** (what must be TRUE):
  1. `npm test` passes with new specs for all 7 listed services: `transaction`, `category`, `person`, `recurring`, `split`, `dashboard`, `theme`
  2. Service specs assert request URLs via `HttpTestingController` derived from `environment.apiBaseUrl` — no hardcoded `/api/...` literals in the spec expectations either
  3. `login.component.spec.ts` covers successful login, rejected credentials, and post-login navigation
  4. `toast.service.spec.ts` and `toast.component.spec.ts` cover show / dismiss / auto-dismiss and the rendering of each toast variant
**Plans**: TBD

## Progress

**Execution Order:** 1 → 2 → 3

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. API Config & Type Cleanup | v1.0 | 0/TBD | Not started | - |
| 2. Centralized HTTP Error Handling | v1.0 | 0/TBD | Not started | - |
| 3. Test Coverage for Services, Login & Toast | v1.0 | 0/TBD | Not started | - |

## Issue Closure

Each phase's plan closes its GitHub issues on completion:

| Phase | Closes |
|-------|--------|
| 1 | #5, #9, #10 |
| 2 | #6, #7 |
| 3 | #3, #4, #8 |
