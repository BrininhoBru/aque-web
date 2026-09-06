# Patrimônio (net worth) screen with manual asset entry

- **Issue:** #50 — https://github.com/BrininhoBru/aque-web/issues/50
- **Status:** Implemented
- **Repo:** BrininhoBru/aque-web

## Problema

O app hoje só acompanha fluxo de caixa (lançamentos, recorrentes, categorias, divisão entre pessoas) — não existe nenhuma tela onde o usuário veja o que ele *tem* (investimentos, contas, imóveis). Depende dos endpoints novos de `Asset` da issue companheira `BrininhoBru/aque-backend#33`.

## Escopo

**Dentro:**
- Tela nova `/assets` (rota + item de nav em `SECONDARY_NAV`) listando os ativos cadastrados e o patrimônio total.
- Formulário de criar/editar/excluir um ativo (nome, tipo, valor atual, pessoa opcional).
- Upload do arquivo `.xlsx` de **"Posição" da Área do Investidor da B3** pra importar vários ativos de uma vez, mostrando o resultado do import — quantos foram **criados** vs. **atualizados** (reimportar atualiza o valor de ativos já cadastrados em vez de duplicar, ver issue #33), e o que falhou e por quê — formato real confirmado no backend, não um CSV genérico.
- Erros informativos do import (linha de rodapé/subtotal do export da B3, esperada em toda importação) aparecem visualmente separados de erros de verdade — não fazem sentido tratados como alerta toda vez que o usuário importa.
- Gráfico de composição do patrimônio por tipo de ativo (donut), ao lado do card de total.

**Fora:**
- Qualquer integração automática com B3/corretoras — v1 é 100% entrada manual (ou import do arquivo que a B3 já disponibiliza pra download).
- Gráfico de evolução do patrimônio ao longo do tempo (o backend não guarda histórico, só o valor atual — o gráfico de composição é uma foto do momento, não uma série temporal).
- Filtro da lista por pessoa (o backend já suporta `?personId=`, mas não faz parte deste recorte — próxima iteração).

## Abordagem

Novo feature module `features/assets/`, espelhando `features/categories/` (componente standalone, `signal`-based state, `form()`/`FormField` de `@angular/forms/signals`, mesmos validators de `shared/validators`):

- `core/services/asset.service.ts`: `getAll(personId?)`, `create()`, `update()`, `delete()`, `getNetWorth()`, `importXlsx(file: File)` — mesmo padrão de `HttpClient` + `environment.apiBaseUrl` de `category.service.ts`; `importXlsx` manda `FormData` multipart (campo `file`) pro `POST /assets/import`.
- `core/models/index.ts`: adicionar `interface Asset { id, name, type: AssetType, currentValue, person: Person | null }`, `type AssetType = 'RENDA_FIXA' | 'ACAO' | 'FUNDO' | 'CRIPTO' | 'IMOVEL' | 'OUTRO'`, `interface NetWorthSummary { totalValue: number }`, `interface AssetImportError { sheet: string, row: number, message: string, isInformational: boolean }`, e `interface AssetImportResult { created: Asset[], updated: Asset[], errors: AssetImportError[] }` (espelha o `AssetImportResponse` atualizado do backend — `created`/`updated` no lugar de um `imported` único, `isInformational` no erro).
- `features/assets/assets.component.ts` + `.html`: lista de ativos (tabela, como `transactions.component`), card de patrimônio total no topo, formulário inline de criar/editar (como `categories.component`), e um `<input type="file" accept=".xlsx">` com texto explicando que é o export de "Posição" da B3 — dispara `importXlsx`.
  - Resultado do import: toast único (`"${created.length} criado(s), ${updated.length} atualizado(s)"`), e o bloco de erros existente passa a filtrar por `isInformational` — erros reais (`isInformational === false`) mantêm o destaque atual (borda/cor negativa); os informativos (`isInformational === true`) aparecem como uma linha neutra separada, tipo "3 linha(s) de rodapé ignorada(s) automaticamente", sem cor de alerta.
  - Novo `computed()` `allocationByType`: agrupa `assets()` por `type`, somando `currentValue` — mesmo formato que `dashboard.component.ts` já usa pra montar o donut de categorias (`ApexNonAxisChartSeries` + `NgApexchartsModule`, dependência já instalada, `apexcharts`/`ng-apexcharts`). Um `<apx-chart>` de donut ao lado do card de patrimônio total, rótulos = `assetTypes` já existente no componente.
- `app.routes.ts`: nova entrada `{ path: 'assets', loadComponent: () => import('./features/assets/assets.component')... }` dentro do array `children` do shell autenticado.
- `layout/nav-items.ts`: novo item em `SECONDARY_NAV` (`path: '/assets', label: 'Patrimônio'`).

## Critério de aceite

- [x] Tela `/assets` acessível só quando autenticado (mesma guarda `authGuard` das outras rotas)
- [x] Lista todos os ativos cadastrados com nome, tipo e valor atual
- [x] Exibe o patrimônio total (soma vinda de `GET /assets/net-worth`) com atualização após criar/editar/excluir/importar
- [x] Formulário cria um ativo novo e ele aparece na lista sem reload da página
- [x] Editar um ativo existente atualiza os campos exibidos na lista
- [x] Excluir um ativo remove ele da lista e do patrimônio total
- [x] Upload de um `.xlsx` de Posição da B3 válido importa os ativos e atualiza a lista e o total
- [x] Upload com linhas/abas que o backend não conseguiu importar mostra o motivo reportado por ele, sem descartar as que passaram
- [x] Reimportar o mesmo arquivo depois de já ter ativos cadastrados mostra `updated` > 0 e não duplica linhas na lista
- [x] Erros com `isInformational: true` (rodapé/subtotal) aparecem visualmente distintos dos erros com `isInformational: false` (erro de verdade)
- [x] Gráfico de composição por tipo aparece quando há pelo menos 1 ativo e some (ou mostra estado vazio) quando não há nenhum
- [x] Soma das fatias do gráfico bate com `netWorth()`
- [x] Novo item "Patrimônio" aparece na sidebar e navega pra `/assets`

## Questões em aberto

- Layout exato do formulário de import (modal dedicado vs. seção inline na própria tela) — a definir na implementação, sem impacto no contrato com o backend.
