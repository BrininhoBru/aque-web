# Ações em lote, exclusão com desfazer e reuso do padrão de tabela em Recorrentes

- **Issue:** #37 — https://github.com/BrininhoBru/aque-web/issues/37
- **Status:** Draft
- **Repo:** BrininhoBru/aque-web

## Problema

Na tabela de Lançamentos, marcar vários itens como pago exige um clique por linha
(`togglePayment(t)`, `transactions.component.html:148-155`) — comum no início do mês, quando
várias contas chegam de uma vez. Excluir um lançamento usa um modal bloqueante
(`confirmDeleteId`, `transactions.component.html:304-324`) que interrompe o fluxo pra uma ação
that dá pra desfazer.

Separadamente, a Fase 2 (#36) valida um padrão de busca+ordenação client-side na tabela de
Lançamentos. A tela de Recorrentes (`recurring.component.ts`/`.html`) usa uma tabela real do
mesmo formato (`<th>Descrição</th><th>Categoria</th><th>Tipo</th>`,
`recurring.component.html:53-57`) e hoje não tem nenhum dos dois.

Categorias e Pessoas foram avaliadas e **não entram** neste reuso: nenhuma das duas usa
`<table>` (`categories.component.html`/`persons.component.html` são listas/cards), e o volume é
pequeno por natureza — 13 categorias predefinidas + custom, e uma lista de pessoas de uma casa
(tipicamente 2-5). Busca/ordenação nessas telas não se paga no tamanho de dado que elas têm.

## Escopo

**Dentro:**
- Checkbox de seleção por linha na tabela de Lançamentos (desktop) + checkbox "selecionar todos
  os visíveis" no cabeçalho
- Ação em lote "Marcar como pago" / "Marcar como pendente" pras linhas selecionadas, disparando
  `TransactionService.updatePayment` em paralelo (`forkJoin` ou equivalente) para os ids
  selecionados
- Excluir lançamento (desktop e mobile) passa a chamar `toast` com ação "Desfazer": a exclusão
  real (`TransactionService.delete`) só dispara depois de uma janela sem desfazer (ex.: os
  mesmos ~4s do auto-dismiss do toast); clicar "Desfazer" cancela a exclusão
- Aplicar o mesmo padrão de busca-por-texto + ordenação de coluna da issue #36 na tabela de
  Recorrentes (colunas Descrição, Categoria, Tipo, Valor padrão)

**Fora:**
- Endpoint de bulk update no backend — reaproveita `updatePayment` existente por id
- Seleção múltipla ou exclusão com desfazer na view mobile (cards) — fica só na tabela desktop
  nesta fase; a FAB e os botões de card mobile continuam como estão
- Busca/ordenação em Categorias ou Pessoas (ver justificativa em Problema)
- Modal de confirmação de exclusão continua existindo pra outras entidades (Categorias, Pessoas,
  Recorrentes) — só Lançamentos migra pro padrão de toast com desfazer nesta fase

## Abordagem

Seleção múltipla entra como um `signal<Set<string>>` de ids selecionados no
`TransactionsComponent`, populado/limpo pelos checkboxes; a barra de ação em lote só aparece
quando o set não está vazio. O bulk usa `forkJoin` sobre um array de `updatePayment$` — volume
mensal de lançamentos é baixo o bastante pra isso ser aceitável sem paginação/streaming.

O undo-delete substitui a chamada imediata de `TransactionService.delete` por um
`setTimeout`/temporizador guardado num signal; "Desfazer" cancela o timer antes dele disparar. O
`ToastService` (`shared/services/toast.service.ts`) precisa de uma variante que aceite uma ação
(hoje só tem `message`/`type`) — estender a interface `Toast` com um campo opcional
`action?: { label: string; onClick: () => void }`, sem quebrar os usos existentes que não passam
ação.

Recorrentes reaproveita a mesma lógica de sort/busca implementada na issue #36 — extrair como
composição de signals seguindo o mesmo padrão, não como serviço/diretiva compartilhada nova
(dois usos não justificam abstração ainda; reavaliar se um terceiro aparecer).

## Critério de aceite

- [ ] Selecionar uma ou mais linhas na tabela de Lançamentos (desktop) habilita uma ação em lote
      visível de marcar como pago
- [ ] Confirmar a ação em lote atualiza o status de todas as linhas selecionadas e limpa a
      seleção
- [ ] Uma falha ao atualizar uma das linhas do lote não impede as demais de serem atualizadas, e
      informa quais falharam
- [ ] Excluir um lançamento mostra um toast com opção "Desfazer" em vez de remover a linha
      imediatamente
- [ ] Clicar "Desfazer" dentro da janela de tempo mantém o lançamento intacto (nenhuma chamada
      DELETE é feita)
- [ ] Deixar o toast expirar sem desfazer efetivamente exclui o lançamento
- [ ] A tabela de Recorrentes ganha busca por descrição e ordenação clicável nas colunas
      Descrição/Categoria/Tipo/Valor padrão, com o mesmo comportamento (client-side, sem chamada
      nova ao backend) validado na issue #36
- [ ] Categorias e Pessoas continuam sem busca/ordenação — nenhuma mudança nessas duas telas

## Questões em aberto

- Duração exata da janela de desfazer (usar os ~4s do auto-dismiss atual do `ToastService`, ou um
  valor maior específico pra ações destrutivas?) — decidir na implementação, não bloqueia o
  design geral.
