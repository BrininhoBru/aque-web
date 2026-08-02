# Technology Stack

**Analysis Date:** 2026-08-01

## Languages

**Primary:**
- TypeScript 5.9.3 - Application code (`src/app/**`), strict mode enabled

**Secondary:**
- CSS - Component/global styles (`src/styles.css`, inline component styles), processed by Tailwind v4
- HTML - Angular templates (`*.html` co-located with components)

## Runtime

**Environment:**
- Node.js 22 (`Dockerfile` uses `node:22-alpine` for build stage; local dev observed on v24.18.0 — no `.nvmrc` pinning version)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (committed)

## Frameworks

**Core:**
- Angular 21.2.6 (`@angular/core`, `@angular/common`, `@angular/compiler`, `@angular/platform-browser`, `@angular/router`, `@angular/forms`) - SPA framework, standalone components only (no NgModules)
- Angular CLI / `@angular/build` 21.2.5 - Build tooling (esbuild-based `@angular/build:application` builder, see `angular.json`)
- Zone.js 0.16.1 - Change detection (still used; `provideZoneChangeDetection({ eventCoalescing: true })` in `src/app/app.config.ts`)
- RxJS 7.8 - Reactive streams for HTTP calls and interceptors

**Testing:**
- Karma 6.4 + Jasmine 6.1 - Unit test runner/framework (`ng test`, config via `tsconfig.spec.json` + `angular.json` `test` architect target)
- `karma-chrome-launcher`, `karma-jasmine-html-reporter`, `karma-coverage` - Karma plugins

**Build/Dev:**
- Tailwind CSS v4.2.2 with `@tailwindcss/postcss` (used) and `@tailwindcss/vite` (installed, unused by build — Angular's builder uses PostCSS, not Vite)
- PostCSS 8.5.8 - CSS processing, config at `postcss.config.json` (the `.mjs` variant exists but is explicitly dead — see comment in that file)
- ApexCharts 5.10.4 + `ng-apexcharts` 2.3.0 - Charting library for dashboard visualizations

## Key Dependencies

**Critical:**
- `@angular/router` - Client-side routing with `withComponentInputBinding()` and `withViewTransitions()` enabled (`src/app/app.config.ts`)
- `@angular/common/http` - HTTP client with functional interceptor (`provideHttpClient(withInterceptors([authInterceptor]))`)
- `rxjs` - Used throughout services for async data flow

**Infrastructure:**
- `tslib` - TypeScript helper runtime
- `zone.js` - Required polyfill for Angular's default change detection (loaded in both `main.ts` build and test config)

## Configuration

**Environment:**
- No `src/environments/` folder exists — no Angular environment file pattern in use
- API base path is hardcoded as relative `/api/...` in each service (e.g. `src/app/core/services/transaction.service.ts:28`), resolved via dev proxy or production nginx reverse proxy
- No `.env` files detected

**Build:**
- `angular.json` - Single project (`aque-web`), builder `@angular/build:application`, output to `dist/aque-web`
- `tsconfig.json` (base, strict + extra strictness flags: `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`) with `tsconfig.app.json` and `tsconfig.spec.json` references
- `postcss.config.json` - Active PostCSS config (Tailwind v4 plugin only); `postcss.config.mjs` exists but is unused (documented in-file)
- `proxy.conf.json` - Dev server proxy: `/api` → `http://127.0.0.1:8080` (aque-backend), used by `ng serve` (`defaultConfiguration: development`)
- Production budgets: 500kB warning / 1MB error initial bundle; 4kB/8kB per-component-style budgets (`angular.json`)
- `.editorconfig`, `prettier` config embedded in `package.json` (100 char width, single quotes, `angular` parser override for `.html`)

## Platform Requirements

**Development:**
- Node.js (22+ recommended per Dockerfile), npm
- Backend (`aque-backend`, Spring Boot) running on `localhost:8080` for API proxy to function

**Production:**
- Multi-stage Docker build (`Dockerfile`): Node 22 Alpine build stage → Nginx Alpine runtime stage
- Nginx serves static Angular build (`dist/aque-web/browser`) and reverse-proxies `/api/` to `aque-backend:8080` (`nginx.conf`)
- HTTPS via mounted certs (`/etc/nginx/certs/aque.crt` / `.key`), HTTP→HTTPS redirect
- Deployed on Raspberry Pi 3B (per root `CLAUDE.md` / `fluxo-deploy-aque.md`), images built via GitHub Actions

---

*Stack analysis: 2026-08-01*
