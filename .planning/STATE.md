---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Tech Debt & Testing Cleanup
current_phase: 1
current_phase_name: API Config & Type Cleanup
status: executing
stopped_at: ROADMAP.md created for milestone v1.0; REQUIREMENTS.md traceability populated
last_updated: "2026-08-02T12:26:49.906Z"
last_activity: 2026-08-01
last_activity_desc: Roadmap created, 8/8 requirements mapped across 3 phases
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 3
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-01)

**Core value:** Let the user view and manage their money quickly and without friction.
**Current focus:** Phase 1 — API Config & Type Cleanup

## Current Position

Phase: 1 of 3 (API Config & Type Cleanup)
Plan: — (not yet planned)
Status: Ready to execute
Last activity: 2026-08-01 — Roadmap created, 8/8 requirements mapped across 3 phases

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

- Roadmap: tech-debt phases (1, 2) run before the testing phase (3) — DEBT-01/-04/-02 change the exact URLs, form shape, and toast messages the specs would assert on
- Roadmap: `auth.service.ts`'s `/api/auth/login` is in DEBT-01 scope too, not just the 6 domain services — one base, all callers
- Onboarding: Signals over NgRx — simpler state for a small, single-domain app
- Onboarding: JWT in localStorage, not httpOnly cookie — acceptable risk at current scale

### Pending Todos

None yet.

### Blockers/Concerns

- No `environment.ts` — every service hardcodes its own `/api/...` base path (addressed in Phase 1)
- Generic, non-actionable HTTP error toasts discard the real `HttpErrorResponse` (addressed in Phase 2)

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-08-01
Stopped at: ROADMAP.md created for milestone v1.0; REQUIREMENTS.md traceability populated
Resume file: None
