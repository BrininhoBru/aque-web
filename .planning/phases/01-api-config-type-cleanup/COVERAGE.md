# API Coverage — Phase 1: API Config & Type Cleanup

No external API integration: this phase adds no third-party service, SDK, or outbound integration — it extracts the app's own same-origin API base path (`/api`, already proxied by `proxy.conf.json` in dev and `nginx.conf` in prod) into local build-time config modules, and types two callbacks against shapes already declared by installed dependencies (`@angular/forms/signals`, `apexcharts`). No new dependency is added and no request destination changes.

**Scope evidence:**

| Check | Result |
|-------|--------|
| New outbound service/SDK/API | None |
| New dependency in `package.json` | None — gated by `git diff --exit-code package.json package-lock.json` in the plan's `<verification>` (threat T-01-SC) |
| Request destinations changed | None — `apiBaseUrl` is `/api` in both environments, identical to the 7 literals it replaces |
| Credentials / API keys introduced | None — the environment object has exactly one member, `apiBaseUrl` (threat T-01-02) |

*Written: 2026-08-02 during phase planning.*
