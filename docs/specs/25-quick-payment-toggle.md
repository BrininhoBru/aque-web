# Toggle rápido de pago/pendente na lista de lançamentos

- **Issue:** #25 — https://github.com/BrininhoBru/aque-web/issues/25
- **Status:** Draft
- **Repo:** BrininhoBru/aque-web

## Problema

Hoje a única forma de marcar um lançamento como pago (ou reverter pra pendente) é abrir
"Editar" e passar pelo formulário completo (`transaction-form.component.ts`), mesmo que a
única coisa que mudou seja o status de pagamento. Isso ficou mais evidente depois de
aque-backend#18 introduzir um endpoint dedicado só pra isso
(`PATCH /transactions/{id}/payment`, aque-backend PR #26) — a lista de lançamentos
(`transactions.component.ts`/`.html`) ainda não tem como consumi-lo.

## Escopo

**Dentro:**
- Consumir `PATCH /transactions/{id}/payment` a partir de `transactions.component.ts`
- Tornar o badge de status (`badge-paid`/`badge-pending`, hoje só leitura — desktop
  `transactions.component.html` linha ~146, mobile linha ~232) clicável, alternando
  PENDENTE ⇄ PAGO
- Ao marcar como PAGO via o toggle, usar `amountExpected` como `amountPaid` (o toggle é
  pra "marcar como pago com o valor previsto"; se o valor pago real for diferente,
  o usuário continua usando "Editar" pra informar o valor exato)
- Ao marcar como PENDENTE via o toggle, enviar `amountPaid: null`
- Recarregar a lista (`load()`, já existe) depois do toggle ter sucesso, mesmo padrão já
  usado em `confirmDelete()`

**Fora:**
- Prompt/modal pra digitar um valor pago diferente do previsto no toggle rápido — isso
  continua sendo função do formulário de edição completo
- Qualquer mudança no `PUT /transactions/{id}` ou no formulário de edição
- Toggle em massa (selecionar vários lançamentos e marcar todos de uma vez)
- Indicador visual de loading por linha durante o toggle — usar o padrão mínimo
  necessário (ex.: desabilitar o badge/botão daquela linha enquanto a requisição está em
  voo), não precisa de spinner dedicado

## Abordagem

**`transaction.service.ts`**: novo método `updatePayment(id: string, amountPaid: number | null): Observable<Transaction>` chamando `PATCH /transactions/{id}/payment` com `{ amountPaid }` — mesmo padrão de `update()`/`delete()` já existentes no service.

**`transactions.component.ts`**: novo método `togglePayment(t: Transaction): void` —
calcula `amountPaid` (null se `t.status === 'PAGO'`, `t.amountExpected` caso contrário),
chama `transactionService.updatePayment(t.id, amountPaid)`, e no `next` chama `this.load()`
e `toast.success(...)`. Precisa de um signal (`togglingId`) pra desabilitar a linha
durante a requisição, no mesmo espírito de `deletingId`/`confirmDeleteId` já existentes.

**Templates** (desktop e mobile): trocar `<span [class]="t.status === 'PAGO' ? 'badge-paid' : 'badge-pending'">{{ t.status }}</span>` por um `<button>` com as mesmas classes de badge, `(click)="togglePayment(t)"`, `[disabled]="togglingId() === t.id"`, e `title` explicando a ação ("Marcar como pendente" / "Marcar como pago").

## Critério de aceite

- [ ] Clicar no badge "PENDENTE" de um lançamento marca ele como PAGO com
      `amountPaid = amountExpected`, sem abrir o formulário de edição
- [ ] Clicar no badge "PAGO" de um lançamento marca ele como PENDENTE
      (`amountPaid = null`), sem abrir o formulário de edição
- [ ] O toggle funciona igual nas duas visualizações (tabela desktop e cards mobile)
- [ ] Durante a requisição, o badge/botão daquela linha fica desabilitado (evita duplo
      clique disparando duas requisições pro mesmo lançamento)
- [ ] Falha na requisição mostra um toast de erro e não altera o status exibido
      (a lista só reflete o novo status depois do `load()` bem-sucedido)
- [ ] Nenhuma mudança de comportamento no formulário de edição completo ou no `PUT`

## Questões em aberto

- O toggle usa `amountExpected` como valor pago por padrão — se o usuário achar isso
  confuso (ex.: esperar que o toggle pergunte o valor), pode virar um ajuste futuro; por
  ora é a decisão registrada aqui, não uma pergunta em aberto pra bloquear a issue.
