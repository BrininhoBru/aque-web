# Adaptar tela de split à SplitRule onipresente/versionada

- **Issue:** #17 — https://github.com/BrininhoBru/aque-web/issues/17
- **Status:** Draft
- **Repo:** BrininhoBru/aque-web

## Problema

`split.component.ts` e `split.service.ts` hoje tratam a regra de divisão como algo por mês: `SplitService.getByMonth`/`save` chamam `GET/PUT /split/{year}/{month}`, e o componente recarrega a configuração inteira (`loadSplit`) toda vez que `monthYear.selected()` muda (`effect()` no construtor). A issue companheira aque-backend#21 (`docs/specs/21-splitrule-versioned-by-effective-date.md`) redesenha `SplitRule` para ser uma configuração única e onipresente, versionada por vigência — a tela precisa parar de assumir "uma regra por mês" tanto na leitura quanto na gravação.

## Escopo

**Dentro:**
- `SplitService`: parar de tratar a config como "por mês" — a leitura/gravação da regra passa a usar o(s) endpoint(s) que aque-backend#21 expuser para a versão vigente (mesma URL `/split/{year}/{month}` reaproveitada com semântica nova, ou uma nova rota — acompanhar a decisão de API tomada na implementação do backend).
- `split.component.ts`: `loadSplit` deixa de ser recarregado a cada troca de mês/ano — a configuração (`items`, percentuais) só é buscada uma vez (ou quando o usuário navega para a tela), não a cada clique em `‹`/`›` do header.
- `loadExpenses`/`totalExpenseExpected` continuam reagindo à troca de mês/ano normalmente — o valor calculado por pessoa ainda depende do total de despesas do mês selecionado (isso não muda com o redesenho).
- `save()`: ao salvar, deixa claro para o usuário (cópia/mensagem) que a mudança vale a partir do mês atual em diante, não retroativamente — evitar a impressão de que está editando "o mês que está sendo visualizado" quando esse mês é passado.
- Atualizar/remover o teste de precisão de float do split (issue #14) considerando o novo fluxo, se o ponto de validação mudar de lugar.

**Fora:**
- Tela ou componente de histórico de versões (fora de escopo também no backend, aque-backend#21).
- Mudanças no modelo de dados — tratadas em aque-backend#21.
- Qualquer UI para agendar vigência futura ou editar uma versão passada (o backend não vai suportar isso nesta entrega).

## Abordagem

`MonthYearService`/`monthYear.selected()` continua sendo a fonte do mês exibido no dashboard e em `totalExpenseExpected`, mas o `effect()` do construtor de `SplitComponent` deixa de chamar `loadSplit` a cada mudança — separar em dois efeitos (ou um efeito com early-return): um que sempre roda `loadExpenses(year, month)` ao trocar de mês, e a carga da regra (`loadSplit`) rodando só em `ngOnInit` (ou ao entrar na tela), já que a regra não varia mais com a navegação de mês. Se o usuário estiver vendo um mês passado, o formulário de edição deve deixar claro (texto de apoio) que salvar altera a vigência atual, não o mês em tela — evita o usuário achar que está reescrevendo o split de um mês fechado.

`SplitService.getByMonth`/`save` mantêm a assinatura por enquanto (compatibilidade com a API atual do backend) até aque-backend#21 definir a forma final do endpoint; ajustar a chamada quando esse contrato for fechado — não vale a pena adivinhar a URL aqui antes do backend decidir.

## Critério de aceite

- [ ] Trocar de mês/ano na tela de split não dispara uma nova busca da configuração de divisão (só do valor total de despesas).
- [ ] A configuração de split (pessoas e percentuais) é carregada uma vez ao entrar na tela, refletindo a versão vigente no momento.
- [ ] Salvar uma edição atualiza a regra vigente a partir de agora, sem exigir que o usuário esteja no mês atual selecionado no header para poder editar.
- [ ] Ao visualizar um mês passado, a tela deixa claro (via texto/aviso) que a edição não altera o histórico daquele mês.
- [ ] Teste de `split.component.ts` cobrindo: carregar a tela não dispara reload da regra ao trocar de mês; salvar chama o service uma vez com os dados esperados.

## Questões em aberto

Nenhuma no momento — depende da forma final da API definida durante a implementação de aque-backend#21; se o contrato exigir mudança de UX (ex.: campo de vigência visível), reabrir discussão antes de fechar o PR desta tela.
