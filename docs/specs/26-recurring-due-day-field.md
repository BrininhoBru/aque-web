# Campo "dia do vencimento" no formulário de recorrente

- **Issue:** #26 — https://github.com/BrininhoBru/aque-web/issues/26
- **Status:** Draft
- **Repo:** BrininhoBru/aque-web

## Problema

`aque-backend#19` (PR #28) adicionou um campo opcional `dueDay` (1-31) no
`RecurringTransaction`, usado pelo job de geração mensal pra calcular o `dueDate` das
instâncias geradas (sem ele, continuam sem vencimento — mesmo comportamento de antes do
campo existir). O formulário de "Novo Recorrente"/"Editar Recorrente"
(`recurring.component.ts`/`.html`) ainda não tem como configurar isso, então nenhum
recorrente criado pela UI consegue se beneficiar do indicador de "atrasados" do
dashboard.

## Escopo

**Dentro:**
- Campo numérico opcional "Dia do vencimento" no formulário (`recurring.component.html`),
  ao lado dos campos já existentes (Descrição, Tipo, Categoria, Valor padrão)
- `RecurringPayload` (`recurring.service.ts`) e `RecurringTransaction`
  (`core/models/index.ts`) ganham `dueDay: number | null`
- `openCreate()`/`openEdit()`/`save()` em `recurring.component.ts` passam a
  ler/escrever esse campo no model, mesmo padrão dos campos já existentes

**Fora:**
- Qualquer validação além de "1 a 31" — o backend já valida isso
  (`@Min`/`@Max` em `RecurringTransactionRequest`); o form só precisa não deixar
  digitar fora da faixa (`type="number" min="1" max="31"` já é suficiente)
- Retroagir `dueDay` em recorrentes já existentes — o campo fica vazio até o usuário
  editar e preencher
- Mudança na tela de Lançamentos ou no cálculo de "atrasados" do dashboard — isso já
  existe no backend, só falta o dado chegar lá

## Abordagem

Segue exatamente o padrão dos campos numéricos opcionais já existentes no app (ex.:
`amountPaid` em `transaction-form.component.html`, que usa `[formField]` com um input
`type="number"` simples, sem os problemas de `<select>` que motivaram `aque-web#18` —
`dueDay` é um `<input type="number">`, não um `<select>`, então não tem o mesmo risco de
sincronização).

**`recurring.service.ts`**: `RecurringPayload` ganha `dueDay?: number | null`.

**`core/models/index.ts`**: `RecurringTransaction` ganha `dueDay: number | null`.

**`recurring.component.ts`**: `model` inicial ganha `dueDay: null`; `openCreate()` reseta
pra `null`; `openEdit()` carrega `r.dueDay ?? null`; `save()` já envia o objeto inteiro do
model (não monta um payload campo a campo), então `dueDay` viaja junto sem mudança
adicional.

**`recurring.component.html`**: novo grupo de campo (mesmo estilo de
`ledger-form-group` já usado), com `[formField]="recurringForm.dueDay"` (registrar a
validação `min(1)`/`max(31)` no `form()` do componente, mesmo padrão de
`min(f.defaultAmount, 0.01, ...)` já existente) — sem `required()`, já que é opcional.

## Critério de aceite

- [ ] Criar um recorrente sem preencher "Dia do vencimento" continua funcionando
      exatamente como hoje (campo enviado como `null`/omitido)
- [ ] Criar um recorrente com "Dia do vencimento" preenchido (ex.: 5) salva esse valor,
      confirmável reabrindo "Editar" e vendo o campo preenchido
- [ ] Editar um recorrente existente pra adicionar/alterar/limpar o "Dia do vencimento"
      funciona
- [ ] Digitar um valor fora de 1-31 é bloqueado no client (o backend já rejeita, mas o
      form não deveria deixar chegar lá)
- [ ] Gerar recorrentes (`POST /recurring/generate/{year}/{month}`) pra um recorrente
      criado com `dueDay` configurado pela UI resulta numa transação com `dueDate`
      preenchido (verificação ponta a ponta com o backend já implementado)
