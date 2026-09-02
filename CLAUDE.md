# Convenções do Projeto

> Este arquivo é a fonte da verdade para qualquer dev ou IA trabalhando neste repositório.
> Mantenha abaixo de 200 linhas — detalhes específicos ficam em `.claude/rules/` e `.claude/docs/`.

## Estrutura do repositório

SPA Angular puro — sem backend neste repo (o `aque-backend`, Spring Boot, é um repo irmão).

- `src/app/core/` — services de acesso a dados (um por recurso do backend), auth (`AuthService`,
  `authGuard`, `authInterceptor`), modelos/enums compartilhados
- `src/app/features/` — um diretório por rota (dashboard, transactions, categories, persons,
  recurring, split, login), standalone components
- `src/app/layout/` — chrome autenticado (`AppShellComponent`, sidebar, header)
- `src/app/shared/` — componentes/pipes/services genéricos e sem conhecimento de domínio
- `.claude/rules/` — convenções detalhadas por área (carregadas sob demanda)
- `.claude/docs/` — referência mais profunda de arquitetura, stack, testes, integrações e débitos
  técnicos (`ARCHITECTURE.md`, `STACK.md`, `TESTING.md`, `CONVENTIONS.md`, `CONCERNS.md`, etc.)
- `.claude/skills/` — fluxos reutilizáveis (`commit-msg`, `/gerar-pr`, `/security-review`)
- `.claude/agents/` — subagentes especializados (`code-reviewer`, `debugger`)
- `.agents/skills/angular-developer/` — referência de padrões Angular consumida por agentes de IA

## Comandos

- Instalar deps: `npm install`
- Dev server: `npm start` (proxy `/api` → `aque-backend` em `localhost:8080`, ver `proxy.conf.json`)
- Build: `npm run build`
- Testes: `npm test` (Karma + Jasmine, headless Chrome)
- Rodar um spec específico: `npx ng test --include='**/auth.service.spec.ts'`

Não há `npm run lint` — não há ESLint configurado neste projeto; estilo é garantido só por
Prettier (config embutida no `package.json`) + TypeScript strict.

## Stack

- **Frontend**: Angular 21 (standalone components, Signals, Signal Forms), TypeScript 5.9 strict,
  RxJS, Tailwind CSS v4 (PostCSS), ApexCharts/`ng-apexcharts`
- **Testes**: Karma + Jasmine (`karma-coverage` instalado, sem threshold obrigatório)
- **CI/CD**: GitHub Actions builda e publica a imagem Docker no push pra `main`
  (`docker-publish.yml`) — não roda lint nem teste
- **Deploy**: Nginx servindo o build estático, Raspberry Pi 3B via Docker Compose

## Regras gerais

- Nunca commitar direto na `main` — sempre via PR
- Todo PR precisa passar lint + testes no CI antes do merge (hoje o CI só builda a imagem —
  gap conhecido, ver `.claude/rules/standards.md`)
- Mensagens de commit no padrão Conventional Commits (`feat:`, `fix:`, `chore:`...)
- Identificadores de código em inglês; comentários, testes e mensagens de commit em português —
  ver `.claude/rules/standards.md`
- Regras detalhadas de estilo, testes e segurança estão em `.claude/rules/` e carregam
  automaticamente conforme os arquivos que você tocar

## Fluxos comuns

- Revisão de segurança de um diff: `/security-review`
- Gerar descrição de PR a partir do git diff: `/gerar-pr`
- Gerar mensagem de commit (Conventional Commits, em português, com prefixo de ticket da branch
  quando houver): skill `commit-msg` — ativa automaticamente ao pedir para "fazer commit" ou
  "gerar mensagem de commit"
- Para revisão de código isolada (sem editar nada), delegue ao subagente `code-reviewer`
