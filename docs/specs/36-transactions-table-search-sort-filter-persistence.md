# Busca, ordenação de colunas e persistência de filtros na tabela de lançamentos

- **Issue:** #36 — https://github.com/BrininhoBru/aque-web/issues/36
- **Status:** Draft
- **Repo:** BrininhoBru/aque-web

## Problema

A tela de Lançamentos (`transactions.component.ts`/`.html`) filtra hoje só por categoria, tipo e
status (`tx-filter-bar`, `transactions.component.html:24-74`), com os signals `filterCategoryId`,
`filterType`, `filterStatus`. Não há busca por texto, as colunas da tabela (`ledger-table`,
`transactions.component.html:101-113`) não são clicáveis pra ordenar, e trocar de rota (ou só
recarregar) reseta todos os filtros pro estado inicial. Numa lista usada toda semana, isso custa
cliques repetidos toda vez que o usuário procura algo específico.

`TransactionService.getAll(filters)` só envia `month`/`year`/`categoryId`/`type`/`status` ao
backend — o filtro combinado já acontece 100% client-side, no `computed()` `filtered()` sobre
`transactions()` (dados do mês já carregados). Busca e ordenação por texto podem seguir o mesmo
padrão, sem endpoint novo.

## Escopo

**Dentro:**
- Input de busca por texto na `tx-filter-bar`, filtrando `filtered()` por
  `description` (case-insensitive, substring)
- Colunas ordenáveis por clique no `<th>`: Descrição, Categoria, Previsto, Pago, Vencimento —
  alterna asc/desc, com indicador visual (seta) de qual coluna e direção está ativa
- Persistência de `categoryId`/`type`/`status`/busca/coluna-de-ordenação/direção em query params
  da rota (`?categoria=...&tipo=...&status=...&busca=...&sort=...&dir=...`), restaurados ao
  entrar na tela
- Chip de filtro rápido "Vencidos" / "Vencendo esta semana" na `tx-filter-bar`, calculado
  client-side a partir de `dueDate` e `status` das transações já carregadas (mesmo critério que o
  dashboard usa pra `totalOverdueCount`, mas sem chamar o endpoint do dashboard — os dados já
  estão na tela)

**Fora:**
- Ordenação ou busca server-side — segue tudo client-side sobre os dados do mês selecionado
- Paginação — fora de escopo aqui (nenhuma tela do app pagina hoje; volume mensal de lançamentos
  é baixo o suficiente pra não justificar)
- Mudança em `TransactionService`/`TransactionController` (backend) — nenhum parâmetro novo de
  query
- Aplicar o padrão de busca/sort em outras telas (Categorias, Pessoas, Recorrentes) — isso é a
  Fase 3, issue #37, feita depois que este padrão estiver validado aqui

## Abordagem

Ordenação e busca entram como signals novos no `TransactionsComponent`
(`sortColumn`, `sortDirection`, `searchText`), compostos no mesmo `computed()` que já produz
`filtered()` — busca e sort aplicados depois dos filtros de categoria/tipo/status existentes, na
mesma cadeia.

Persistência usa `ActivatedRoute.queryParams` pra ler o estado inicial e `Router.navigate` (com
`queryParamsHandling: 'merge'`) pra escrever a cada mudança — sem introduzir um serviço de estado
novo, os signals continuam sendo a fonte de verdade local; a URL é só espelho pra sobreviver a
navegação/reload.

O chip de vencidos reaproveita a mesma lógica que aparece implícita no dashboard (`dueDate` no
passado e `status === 'PENDENTE'`) — extrair como função local/pure, não chamar
`DashboardService`.

## Critério de aceite

- [ ] Digitar no campo de busca filtra a tabela (desktop) e os cards (mobile) pela descrição,
      case-insensitive, combinando com os filtros de categoria/tipo/status já ativos
- [ ] Clicar no cabeçalho de uma coluna ordenável ordena a lista por ela; clicar de novo inverte
      a direção; um indicador visual mostra coluna e direção ativas
- [ ] Ordenação e busca respeitam os mesmos itens já filtrados por categoria/tipo/status (não
      reordenam/buscam sobre a lista inteira do mês ignorando outros filtros)
- [ ] Sair da tela de Lançamentos e voltar (ou dar F5) preserva categoria/tipo/status/busca/
      ordenação selecionados anteriormente
- [ ] Trocar de mês/ano (`MonthYearService`) mantém os filtros de categoria/tipo/status/busca/
      ordenação ativos, recarregando só os dados
- [ ] O chip "Vencidos" mostra somente lançamentos com `status = PENDENTE` e `dueDate` anterior à
      data de hoje
- [ ] "Limpar filtros" (botão já existente) também limpa busca, ordenação e o chip de vencidos, e
      reflete isso na URL

## Questões em aberto

Nenhuma.
