# Badge de pendências na sidebar e paleta de comando (Cmd/Ctrl+K)

- **Issue:** #38 — https://github.com/BrininhoBru/aque-web/issues/38
- **Status:** Draft
- **Repo:** BrininhoBru/aque-web

## Problema

A sidebar (`sidebar.component.ts`/`.html`) é hoje uma lista de navegação pura — não injeta
nenhum serviço de dados, só `LayoutService`. O item "Lançamentos" não dá nenhuma pista de que há
contas atrasadas sem entrar na tela e olhar a lista/dashboard.

Não existe nenhum atalho de teclado no app pra pular entre as 6 telas navegáveis
(`mainNav`/`secondaryNav` em `sidebar.component.ts`: Dashboard, Lançamentos, Recorrentes,
Categorias, Pessoas, Divisão) — só clique direto no link da sidebar.

## Escopo

**Dentro:**
- Badge numérico no item "Lançamentos" da sidebar mostrando `totalOverdueCount` (já calculado
  por `DashboardService.getSummary(year, month)` — `DashboardSummary.totalOverdueCount`) para o
  mês/ano atualmente selecionado em `MonthYearService`
- Badge escondido/ausente quando o valor é 0
- Atalho de teclado global `Cmd+K` (mac) / `Ctrl+K` (outros) que abre uma paleta de comando
  simples: lista as 6 rotas de `mainNav`/`secondaryNav`, filtráveis por texto, navegação por
  teclado (setas + Enter), fecha com Esc ou ao selecionar
- Paleta monta em `AppShellComponent` (mesmo nível de `ToastComponent`), disponível em toda tela
  autenticada

**Fora:**
- Busca fuzzy sobre dados (pessoas, categorias, lançamentos específicos) dentro da paleta — só
  navegação entre as 6 rotas existentes
- Outros números no badge além de `totalOverdueCount` (ex.: total pendente não vencido) — um
  número só, o mais acionável
- Badge em outros itens da sidebar (Recorrentes, Categorias, etc.) — fora de escopo, não há
  necessidade de negócio identificada
- Persistir/customizar atalhos de teclado — só o `Cmd/Ctrl+K` fixo

## Abordagem

`SidebarComponent` passa a injetar `DashboardService` e `MonthYearService`, com um `effect()` (ou
`resource()`/`toSignal`) que busca `getSummary` toda vez que o mês/ano selecionado muda —
seguindo o mesmo padrão reativo já usado em `TransactionsComponent` (`effect()` no construtor
reagindo a `monthYear.selected()`). Chamada isolada e enxuta: só `totalOverdueCount`, não precisa
de `byCategory`/`evolution`/`split` que o dashboard carrega.

A paleta de comando é um componente novo (`command-palette.component.ts`) com um
`HostListener('window:keydown', ...)` (ou listener em `AppShellComponent`) detectando
`Cmd/Ctrl+K`, controlando um signal `open`. Lista estática vinda das mesmas `NavItem[]` já
definidas na sidebar (`mainNav`/`secondaryNav`) — não duplicar a lista de rotas, importar/reusar
o array existente ou movê-lo pra um local compartilhado se a duplicação incomodar na review.

## Critério de aceite

- [ ] Com lançamentos atrasados no mês selecionado, o item "Lançamentos" da sidebar mostra um
      badge com a contagem correta (igual ao `totalOverdueCount` que o dashboard mostra pro mesmo
      mês)
- [ ] Trocar de mês/ano atualiza o badge para o valor do novo mês
- [ ] Sem atrasados no mês selecionado, nenhum badge aparece
- [ ] `Cmd+K`/`Ctrl+K` em qualquer tela autenticada abre a paleta de comando
- [ ] Digitar filtra a lista de rotas por nome; setas navegam, Enter navega pra rota selecionada
      e fecha a paleta; Esc fecha sem navegar
- [ ] A paleta não abre na tela de login (rota não autenticada)
- [ ] Abrir a paleta com o foco num campo de texto de um formulário não intercepta a digitação
      normal do campo (atalho não dispara enquanto usuário digita em input/textarea, exceto o
      próprio `Cmd/Ctrl+K`)

## Questões em aberto

Nenhuma.
