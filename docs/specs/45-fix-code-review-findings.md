# Corrige achados das revisões de código das PRs #43 e #44

- **Issue:** #45 — https://github.com/BrininhoBru/aque-web/issues/45
- **Status:** Draft
- **Repo:** BrininhoBru/aque-web

## Problema

`/code-review` rodado nas PRs #43 (badge sidebar + paleta de comando) e #44 (fechamento de
lacunas do `/spec-verify`), já mergeadas em `dev`, encontrou 9 pontos que não bloqueavam o merge
mas valem correção: 1 duplicação de requisição HTTP, 1 bug de UX, 1 conflito de atalho de
teclado, 1 lacuna de acessibilidade, 3 duplicações de código, 1 acoplamento frágil, e 2 lacunas
de teste de regressão pra bugs já corrigidos.

Nota de grounding: esta spec foi analisada contra `dev`, não `main` — o código revisado
(`SidebarComponent`, `CommandPaletteComponent`, o fix de checkbox) só existe em `dev` hoje.
`main` neste repo só avança via PR de release de `dev`, então analisar contra `main` teria
comparado contra uma árvore sem nenhum desses arquivos.

## Escopo

**Dentro:**
1. **Fetch duplicado do dashboard summary** (`sidebar.component.ts:174-185` e
   `dashboard.component.ts:261-262`): `SidebarComponent` e `DashboardComponent` chamam
   `DashboardService.getSummary(year, month)` de forma independente — na rota `/dashboard`,
   ambos disparam a mesma requisição a cada troca de mês, dobrando a carga nesse endpoint
2. **Cmd+K reabrindo a paleta já aberta zera a busca** (`command-palette.component.ts:88-92`):
   `openPalette()` roda sem checar `this.open()`, descartando `query`/`activeIndex` em progresso
3. **Atalho colide com Ctrl+Shift+K do Firefox** (`command-palette.component.ts:88`): o check
   `(event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'` não distingue
   `Ctrl+Shift+K` de `Ctrl+K`, sequestrando o atalho nativo do Firefox de abrir o Console em
   qualquer rota autenticada
4. **Acessibilidade da paleta** (`command-palette.component.html`): overlay sem
   `role="dialog"`/`aria-modal="true"`, sem focus trap (Tab escapa pro conteúdo atrás do
   backdrop), sem devolver o foco ao elemento anterior ao fechar
5. **Guarda de `requestId` triplicada**: o mesmo padrão manual (incrementar contador, comparar
   na resposta pra descartar request obsoleta) existe hoje em `dashboard.component.ts`,
   `transactions.component.ts` e `sidebar.component.ts:167,176,179` — extrair um helper
   compartilhado
6. **Backdrop da paleta duplicado do sidebar**: `command-palette.component.ts:22`
   (`.command-palette-backdrop`) e `app-shell.component.ts:44` (`.sidebar-backdrop`) definem
   `position: fixed; inset: 0` de forma independente — extrair a base comum (`fixed`/`inset:0`)
   pra uma classe utilitária em `styles.css`, mantendo o resto (blur vs cor sólida, z-index) local
   a cada um, já que servem propósitos visuais diferentes (modal centralizado vs scrim de drawer
   mobile)
7. **Badge hardcoded no loop de nav** (`sidebar.component.html`): o item que recebe o badge é
   identificado comparando a string literal `'/transactions'` dentro do `@for` genérico —
   estender `NavItem` (`nav-items.ts:1-5`) com um campo opcional que carregue essa associação
8. **Helper de teste duplicado**: a função `press(key, opts)` (dispatch de `KeyboardEvent` em
   `window`) está copiada verbatim em `command-palette.component.spec.ts` e
   `app-shell.component.spec.ts`
9. **Factory de mock duplicada**: `sidebar.component.spec.ts` define `summary(overrides)` pra
   montar um `DashboardSummary` mock; `app-shell.component.spec.ts` escreve os mesmos 10 campos
   na mão em vez de reusar
10. **Regressão do fix de checkbox invisível** (`transactions.component.ts:89-91`): o fix já
    mergeado (CSS `appearance: auto` nos checkboxes de seleção) não tem teste que trave o
    tamanho/aparência renderizada — viola a regra de TDD do time pra código legado alterado
11. **Regressão do fix de build NG8022**: o fix em `recurring.component.html` (remoção de
    `min`/`max` incompatíveis com `[formField]`) não é detectável pela suíte Karma atual — o
    `npm test` faz compilação JIT, não a checagem AOT de template que gerou o erro original;
    `docker-publish.yml` também não roda `npm run build` hoje

**Fora:**
- Não introduzir um serviço de cache genérico entre `DashboardService` e seus consumidores — o
  fix do item 1 é local (mover a leitura do badge pra reusar o dado que `DashboardComponent` já
  tem quando ambos estão montados, ou aceitar duas chamadas quando estão em rotas diferentes;
  ver Abordagem). Uma camada de cache com invalidação é over-engineering pro volume de uma app
  pessoal e introduz risco de dado desatualizado depois de uma mutação (ex.: marcar pago)
- Não adicionar `npm run build` ao CI (`docker-publish.yml`) neste PR — é a mitigação real pro
  item 11, mas é uma mudança de infraestrutura de CI, decisão separada de "corrigir os achados
  da revisão"; a spec só cobre deixar isso documentado e, quando possível, coberto por teste
- Não construir um componente de overlay/dialog genérico reutilizável (ex.: um `<app-modal>`)
  — o item 6 pede só extrair a base `fixed;inset:0` compartilhada, não uma abstração de dialog
- Não mudar o comportamento do atalho em si além de excluir Shift/Alt — não adicionar
  customização de atalho (fora de escopo já na spec #38 original)

## Abordagem

**Item 1 (fetch duplicado):** `SidebarComponent` está montado globalmente em
`AppShellComponent`, então em rotas que não são `/dashboard` ele já é a única fonte da chamada
— duplicação só ocorre quando o usuário está na própria rota `/dashboard`. Solução lazy:
`DashboardService` ganha um `resource()`/signal compartilhado só pra `getSummary` (o método mais
chamado por consumidores diferentes), usando `rxResource` ou um `shareReplay({ bufferSize: 1,
refCount: true })` por chave `year-month` que expira quando não há mais subscribers — sem cache
persistente entre navegações, só deduplicação de chamadas concorrentes/quase-simultâneas.
`SidebarComponent` e `DashboardComponent` passam a consumir esse observable compartilhado em vez
de cada um chamar `http.get` direto.

**Item 2 (Cmd+K reabre):** guarda em `onKeydown` —
`if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); if (!this.open()) this.openPalette(); return; }`.

**Item 3 (Ctrl+Shift+K):** adicionar `&& !event.shiftKey && !event.altKey` ao mesmo check.

**Item 4 (acessibilidade):** `command-palette.component.html` — `role="dialog"` e
`aria-modal="true"` no painel; foco inicial já vai pro input (`afterRenderEffect` existente,
`command-palette.component.ts:78-84`), falta capturar o elemento com foco antes de abrir
(`document.activeElement`) e devolver o foco a ele em `close()`. Focus trap: um handler de Tab
simples ciclando entre o input e os itens da lista (sem lib nova — poucos elementos focáveis).

**Item 5 (guarda de requestId):** extrair uma função utilitária pequena (não um serviço/classe)
em algum lugar compartilhado como `core/rxjs/latest-request-guard.ts` — ex.:
`createLatestRequestGuard()` retornando `{ next(): id, isCurrent(id): boolean }` — e substituir o
padrão manual nos 3 pontos.

**Item 6 (backdrop):** classe `.overlay-backdrop { position: fixed; inset: 0; z-index: ...; }`
em `styles.css` (seguindo o padrão de utilitário já usado ali, `.ledger-*`); cada componente
mantém sua cor/blur/z-index específicos combinando com a classe base.

**Item 7 (badge hardcoded):** `NavItem` (`nav-items.ts`) ganha `badgeSignal?: () => number` ou,
mais simples e sem acoplar `nav-items.ts` a Angular signals importados de fora, um campo
`badgeKey?: string` que o `SidebarComponent` usa pra decidir qual signal local mostrar — decisão
de implementação exata fica pro momento de codar, mas o loop do template deixa de comparar a
string de path.

**Item 8 e 9 (duplicação em specs):** mover `press()` e `summary()` pra um arquivo de fixture
compartilhado (ex.: `src/app/layout/test-helpers.ts` para `press`, já que é específico de
teclado/layout; `summary()` pode ir para perto de `DashboardSummary` em
`core/models`-adjacent test helpers, ou simplesmente ser exportada de
`dashboard.component.spec.ts` e importada por quem precisar — decisão de local exata na
implementação, seguindo o padrão de fixtures locais já usado no repo).

**Item 10 (regressão checkbox):** teste em `transactions.component.spec.ts` que renderiza a
tabela e verifica `offsetWidth`/`offsetHeight` > 0 (ou `getComputedStyle(...).appearance !==
'none'`) nos dois checkboxes (cabeçalho "selecionar todos" e linha).

**Item 11 (regressão build):** como Karma não pega isso, a mitigação realista é documentação —
um comentário no arquivo (`recurring.component.html`) já existe implicitamente pela natureza do
fix; adicionar uma nota no `CONCERNS.md` do repo (gap de CI já documentado) referenciando este
padrão especificamente (`min`/`max` nativo + `[formField]`) como algo a não reintroduzir. Ver
"Fora de escopo" — adicionar `npm run build` ao CI fica para decisão separada.

## Critério de aceite

- [ ] Na rota `/dashboard`, `DashboardService.getSummary` é chamado no máximo uma vez por
      mudança de mês/ano (verificável em teste via `HttpTestingController.expectOne`, não
      `expectOne` falhando por chamada dupla)
- [ ] Apertar Cmd/Ctrl+K com a paleta já aberta não altera `query()`/`activeIndex()` correntes
- [ ] `Ctrl+Shift+K` (ou `Cmd+Shift+K`) não abre a paleta nem chama `preventDefault()`
- [ ] O painel da paleta tem `role="dialog"` e `aria-modal="true"`; fechar a paleta (Esc, Enter
      ou seleção) devolve o foco ao elemento que estava focado antes de abrir
- [ ] Tab dentro da paleta aberta não move o foco para elementos fora dela
- [ ] `dashboard.component.ts`, `transactions.component.ts` e `sidebar.component.ts` usam o
      mesmo helper de guarda de request obsoleta, não 3 implementações manuais separadas
- [ ] `.command-palette-backdrop` e `.sidebar-backdrop` compartilham a declaração
      `position:fixed;inset:0` via uma classe/regra comum, sem repetir os mesmos valores
      literais duas vezes
- [ ] O `@for` de navegação em `sidebar.component.html` não compara `item.path === '/transactions'`
      como string literal — a associação do badge à rota vem do próprio `NavItem`
- [ ] `press()` e `summary()` existem em um só lugar, importados pelos specs que precisam, não
      duplicados
- [ ] Um teste cobre que os checkboxes de seleção em lote renderizam com dimensão/aparência
      visível (não 0x0), cobrindo o fix já mergeado
- [ ] `.claude/docs/CONCERNS.md` (ou equivalente) documenta que `min`/`max` nativo junto de
      `[formField]` quebra o build de produção sem ser pego pela suíte de testes atual

## Questões em aberto

- Mecanismo exato de dedup do item 1 (`rxResource` vs `shareReplay` manual) — decidir no momento
  da implementação, ambos atendem o critério de aceite igualmente
- Local exato dos arquivos compartilhados dos itens 5, 8 e 9 — qualquer local consistente com a
  convenção de fixtures/utilitários já usada no repo serve
