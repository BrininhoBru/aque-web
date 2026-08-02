# Requirements: Aque Web

**Defined:** 2026-08-01 (updated 2026-08-01 for milestone v1.0)
**Core Value:** Let the user view and manage their money quickly and without friction.

## Milestone v1.0 Requirements

Scoped 1:1 from the 8 GitHub issues filed after the `/gsd-onboard` codebase audit ([BrininhoBru/aque-web#3-#10](https://github.com/BrininhoBru/aque-web/issues)). No new scope beyond these issues.

### Testing

- [ ] **TEST-01**: Core HTTP services (transaction, category, person, recurring, split, dashboard, theme) have unit tests — [GH #3](https://github.com/BrininhoBru/aque-web/issues/3)
- [ ] **TEST-02**: login.component.ts has a spec covering the auth entry point — [GH #4](https://github.com/BrininhoBru/aque-web/issues/4)
- [ ] **TEST-03**: toast.service.ts and toast.component.ts have specs — [GH #8](https://github.com/BrininhoBru/aque-web/issues/8)

### Tech Debt

- [ ] **DEBT-01**: `environment.ts`/`environment.prod.ts` exist with `apiBaseUrl`, and services no longer hardcode their own `/api/...` base path — [GH #5](https://github.com/BrininhoBru/aque-web/issues/5)
- [ ] **DEBT-02**: HTTP error handling is centralized (e.g. an error interceptor) that surfaces backend validation messages and logs unexpected errors — [GH #6](https://github.com/BrininhoBru/aque-web/issues/6)
- [ ] **DEBT-03**: The 401-vs-403 auth-failure contract with `aque-backend` is documented (or contract-tested) instead of living only in an interceptor comment — [GH #7](https://github.com/BrininhoBru/aque-web/issues/7)
- [ ] **DEBT-04**: Signal Forms field callback in login.component.ts is typed against the model shape, not `any` — [GH #9](https://github.com/BrininhoBru/aque-web/issues/9)
- [ ] **DEBT-05**: ApexCharts donut-chart formatter in dashboard.component.ts is typed, not `any` — [GH #10](https://github.com/BrininhoBru/aque-web/issues/10)

## Future Requirements

None deferred from this milestone — all 8 audit issues are in scope.

## Out of Scope

| Feature | Reason |
|---------|--------|
| NgRx / centralized state store | Signals-based per-service state covers current needs |
| httpOnly-cookie JWT storage | Acceptable risk at current scale per CONCERNS.md; revisit only if XSS surface grows |

## Traceability

| Requirement | GH Issue | Phase | Status |
|-------------|----------|-------|--------|
| DEBT-01 | #5 | Phase 1 | Pending |
| DEBT-04 | #9 | Phase 1 | Pending |
| DEBT-05 | #10 | Phase 1 | Pending |
| DEBT-02 | #6 | Phase 2 | Pending |
| DEBT-03 | #7 | Phase 2 | Pending |
| TEST-01 | #3 | Phase 3 | Pending |
| TEST-02 | #4 | Phase 3 | Pending |
| TEST-03 | #8 | Phase 3 | Pending |

**Coverage:**
- v1.0 requirements: 8 total
- Mapped to phases: 8 ✓
- Unmapped: 0

**Sequencing note:** the tech-debt phases run before the testing phase on purpose. DEBT-01 rewrites the URL literal in all 7 services TEST-01 specs, DEBT-04 changes the login form shape TEST-02 asserts against, and DEBT-02 changes the toast messages TEST-03 asserts against. Specs written first would be rewritten.

---
*Requirements defined: 2026-08-01*
*Last updated: 2026-08-01 after roadmap creation (traceability populated)*
