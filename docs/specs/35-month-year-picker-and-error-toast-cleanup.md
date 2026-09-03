# Seletor direto de mês/ano e limpeza de toasts de erro duplicados

- **Issue:** #35 — https://github.com/BrininhoBru/aque-web/issues/35
- **Status:** Draft
- **Repo:** BrininhoBru/aque-web

## Problema

A navegação de mês/ano no header (`header.component.html:8-15`) só tem as setas `‹ mês ›` —
voltar 8 meses exige 8 cliques. O `MonthYearService.setMonthYear(month, year)`
(`core/services/month-year.service.ts`) já existe e faz exatamente isso, mas nenhuma UI o chama.

Separadamente, `transaction-form.component.ts` e `dashboard.component.ts` disparam um
`toast.error()` com mensagem fixa dentro dos callbacks `error:` de chamadas HTTP. Desde que
`errorInterceptor` foi centralizado (commit `fbc4a5f`, 2026-08-06), ele já mostra um toast com a
mensagem específica vinda do backend pra **todo** erro HTTP (exceto 401/403, tratados à parte).
Esses componentes duplicam o aviso — o usuário vê dois toasts empilhados por um único erro.

## Escopo

**Dentro:**
- Ao clicar no texto do mês/ano no header (`.header-month-display`), abrir um seletor (dropdown
  de mês + input/stepper de ano, ou popover equivalente) que chama
  `monthYear.setMonthYear(month, year)`
- Botão/atalho "Hoje" que chama `setMonthYear` com o mês/ano corrente, visível quando o mês
  selecionado é diferente do atual
- Remover a chamada `this.toast.error('Erro ao carregar categorias.')` em
  `transaction-form.component.ts:141` (callback `error:` do `categoryService.getAll()`)
- Remover a chamada `this.toast.error('Erro ao carregar lançamento.')` em
  `transaction-form.component.ts:175` (callback `error:` do `loadTransaction`) — mantém
  `this.loading.set(false)` no mesmo callback
- Remover a chamada `this.toast.error('Erro ao salvar lançamento.')` em
  `transaction-form.component.ts:219` (callback `error:` do `save()`) — mantém
  `this.saving.set(false)` no mesmo callback
- Remover a chamada `this.toast.error('Erro ao carregar dados do dashboard.')` em
  `dashboard.component.ts:286` — mantém `this.loading.set(false)` no mesmo callback

**Fora:**
- `transaction-form.component.ts:169` (`'Lançamento não encontrado.'`) **não** é removido — essa
  chamada está no callback `next:` (a requisição teve sucesso, só não achou o id na lista), não é
  um erro HTTP e não passa pelo `errorInterceptor`. Continua sendo o único feedback pra esse caso.
- Nenhuma mudança em `error.interceptor.ts` — ele já está correto
- Nenhuma mudança de layout/estilo do header além do necessário pro seletor
- Nenhum toast novo em telas que hoje não têm

## Abordagem

O picker de mês/ano fica melhor como um pequeno componente/estado local dentro de
`HeaderComponent` (signal de "aberto/fechado" + um `<select>` de mês e um input numérico de ano,
ou 12 botões de mês — decisão de UI, não muda a API do `MonthYearService`). Fecha ao selecionar ou
ao clicar fora.

A remoção dos toasts duplicados é puramente subtrativa: apagar a linha `this.toast.error(...)` em
cada um dos 4 pontos listados, mantendo o resto do callback intacto. Não precisa de teste novo —
é remoção de um efeito colateral redundante, o comportamento coberto por teste (loading/saving
sendo resetado) não muda.

## Critério de aceite

- [ ] Clicar no texto do mês/ano no header abre um seletor que permite escolher qualquer mês e
      ano diretamente, sem precisar clicar em `‹`/`›` repetidamente
- [ ] Selecionar um mês/ano no seletor atualiza `MonthYearService.selected()` e a tela recarrega
      os dados desse mês (mesmo efeito de hoje ao usar as setas)
- [ ] Existe uma forma de voltar ao mês/ano atual em um clique quando o selecionado for diferente
- [ ] Um erro ao carregar categorias no formulário de lançamento mostra exatamente um toast (o do
      `errorInterceptor`), não dois
- [ ] Um erro ao carregar um lançamento existente (edição) mostra exatamente um toast
- [ ] Um erro ao salvar (criar/editar) um lançamento mostra exatamente um toast
- [ ] Um erro ao carregar dados do dashboard mostra exatamente um toast
- [ ] Abrir o formulário de edição com um id de lançamento inexistente continua mostrando
      "Lançamento não encontrado." e voltando pra tela anterior (comportamento preservado)

## Questões em aberto

Nenhuma.
