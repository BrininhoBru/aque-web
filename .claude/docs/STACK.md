# Technology Stack

## Languages

**Primary:** TypeScript 5.9.3 — application code (`src/app/**`), strict mode enabled
**Secondary:** CSS (`src/styles.css`, inline component styles, processed by Tailwind v4), HTML (Angular templates, co-located with components)

## Runtime

**Environment:** Node.js 22 (`Dockerfile` uses `node:22-alpine` for build stage; no `.nvmrc` pinning version)
**Package Manager:** npm, lockfile `package-lock.json` (committed)

## Frameworks

**Core:**
- Angular 21.2.6 (`@angular/core`, `@angular/common`, `@angular/compiler`, `@angular/platform-browser`, `@angular/router`, `@angular/forms`) — SPA framework, standalone components only (no NgModules)
- Angular CLI / `@angular/build` 21.2.5 — build tooling (esbuild-based `@angular/build:application` builder)
- Zone.js 0.16.1 — change detection (`provideZoneChangeDetection({ eventCoalescing: true })` in `src/app/app.config.ts`)
- RxJS 7.8 — reactive streams for HTTP calls and interceptors

**Testing:**
- Karma 6.4 + Jasmine 6.1 — unit test runner/framework (`ng test`, config via `tsconfig.spec.json` + `angular.json`)
- `karma-chrome-launcher`, `karma-jasmine-html-reporter`, `karma-coverage` — Karma plugins

**Build/Dev:**
- Tailwind CSS v4.2.2 with `@tailwindcss/postcss` (used) — `@tailwindcss/vite` is installed but unused (Angular's builder uses PostCSS, not Vite)
- PostCSS 8.5.8 — config at `postcss.config.json` (the `.mjs` variant exists but is explicitly dead, documented in-file)
- ApexCharts 5.10.4 + `ng-apexcharts` 2.3.0 — charting library for dashboard visualizations

## Key Dependencies

**Critical:**
- `@angular/router` — client-side routing with `withComponentInputBinding()` and `withViewTransitions()` enabled
- `@angular/common/http` — HTTP client with functional interceptor (`provideHttpClient(withInterceptors([authInterceptor]))`)
- `rxjs` — used throughout services for async data flow

**Infrastructure:** `tslib`, `zone.js` (required polyfill for Angular's default change detection).

## Configuration

**Environment:**
- No `src/environments/` folder — no Angular environment file pattern in use
- API base path is hardcoded as relative `/api/...` in each service (e.g. `src/app/core/services/transaction.service.ts:28`), resolved via dev proxy or production nginx reverse proxy
- No `.env` files

**Build:**
- `angular.json` — single project (`aque-web`), builder `@angular/build:application`, output to `dist/aque-web`
- `tsconfig.json` (base, strict + extra strictness flags: `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`) with `tsconfig.app.json` and `tsconfig.spec.json` references
- `postcss.config.json` — active PostCSS config (Tailwind v4 plugin only)
- `proxy.conf.json` — dev server proxy: `/api` → `http://127.0.0.1:8080` (aque-backend)
- Production budgets: 500kB warning / 1MB error initial bundle; 4kB/8kB per-component-style budgets
- `.editorconfig`, prettier config embedded in `package.json` (100 char width, single quotes, `angular` parser override for `.html`)

## Platform Requirements

**Development:** Node.js (22+ recommended), npm. Backend (`aque-backend`) running on `localhost:8080` for API proxy to function.

**Production:**
- Multi-stage Docker build: Node 22 Alpine build stage → Nginx Alpine runtime stage
- Nginx serves static Angular build (`dist/aque-web/browser`) and reverse-proxies `/api/` to `aque-backend:8080` (`nginx.conf`)
- HTTPS via mounted certs (`/etc/nginx/certs/aque.crt` / `.key`), HTTP→HTTPS redirect
- Deployed on Raspberry Pi 3B, images built via GitHub Actions
