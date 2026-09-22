# Input de valor em reais com máscara

- **Issue:** #53 — https://github.com/BrininhoBru/aque-web/issues/53
- **Status:** Implemented
- **Repo:** BrininhoBru/aque-web

## Problema

Os quatro campos de dinheiro do app são `<input type="number" step="0.01">` cru:

- `transaction-form.component.html:110` e `:126` — valor previsto e valor pago
- `recurring.component.html:240` — valor padrão
- `assets.component.html:212` — valor atual do ativo

Sem separador de milhar, `1250000` (valor de um imóvel, por exemplo) é uma parede de
dígitos que o usuário tem que conferir contando casas. Vírgula e ponto se comportam
diferente dependendo do locale do navegador, e a roda do mouse altera o valor sem querer
enquanto a página rola com o campo focado — num formulário de dinheiro isso é o tipo de
erro que passa direto.

Os quatro campos já repetem a mesma marcação (`.ledger-input-group` + prefixo `R$` +
fonte mono alinhada à direita) em quatro arquivos.

## Escopo

**Dentro:**
- Componente compartilhado em `src/app/shared/components/currency-input/` implementando
  `FormValueControl<number | null>`, cuidando de máscara, prefixo `R$` e alinhamento
- Trocar os quatro campos acima pelo componente, apagando as quatro cópias da marcação
- Teste cobrindo digitação, colagem, limpeza e o valor que chega ao model

**Fora:**
- `dueDay` (`recurring.component.html:249`), `referenceYear`
  (`transaction-form.component.html:96`) e o percentual do split
  (`split.component.html:79`) — são números, não dinheiro, e `type="number"` serve bem
- Campos de moeda que não sejam BRL, ou seleção de moeda
- Máscara em qualquer coisa que não seja input (tabelas, cards e gráficos já usam o
  `BrlCurrencyPipe`, que continua como está)
- Trocar o `BrlCurrencyPipe` por outra coisa — ele resolve exibição, isso aqui resolve
  entrada

## Abordagem

O Angular 21.2 já tem o contrato exato pra isso, e ele é mais simples do que o rascunho
desta spec previa. `@angular/forms/signals` exporta `FormValueControl<T>` e
`transformedValue()`, cujo exemplo na própria documentação é literalmente *"a numeric input
that displays and accepts string values but stores a number"*. E a diretiva `FormField`
documenta que aceita "a signal forms custom control that implements `FormValueControl`",
cuidando sozinha de two-way binding do valor e do relay de `disabled`/`required`.

Consequência: **os templates mantêm `[formField]` sem alteração** — só trocam `<input>` por
`<app-currency-input>`. Nada de input `[field]` customizado, nada de `value.set()` na mão.

Duas coisas o contrato não resolve, e as duas têm solução prevista nele:

- **O `transformedValue` preserva o texto como digitado**, pra não fazer o cursor pular. A
  máscara precisa do contrário. Então o `onInput` reescreve o valor formatado, no signal e
  no elemento. Escrever no elemento além do binding é necessário: digitar algo que não muda
  o formatado — uma letra, um separador — deixaria o binding igual e o caractere solto
  ficaria visível na tela.
- **`blur` não borbulha**, então o evento no input interno nunca chegaria ao host onde o
  `[formField]` está. O `FormUiControl` prevê um `touched` opcional; o componente declara
  `model(false)` e a diretiva mantém em sincronia com o `touched()` do campo.

Nada de dependência nova: `Intl.NumberFormat('pt-BR')` já é usado pelo `BrlCurrencyPipe`
e faz a formatação inteira. Uma lib de máscara aqui seria um `package.json` mais pesado
pra resolver o que cabe em algumas linhas.

**Máscara de centavos fixos**, o padrão de caixa eletrônico: o input é `type="text"` com
`inputmode="decimal"`, aceita só dígitos, e os dois últimos são sempre os centavos —
digitar `1`, `2`, `3`, `4`, `5` mostra `12,45` → `123,45` → `1.234,50` → `12.345,00`.
Isso elimina de uma vez a ambiguidade entre vírgula e ponto (não existe separador pra
digitar) e, por ser `text`, mata o bug da roda do mouse de graça.

**Contrato com o signal forms:** o model continua guardando `number | null` puro — nenhuma
validação existente (`required`, `min`) precisa mudar. Campo vazio escreve `null`, não `0`:
`amountPaid` distingue "não pago" de "pago R$ 0,00", e `transaction-form` tem um botão de
limpar (`clearAmountPaid()`) que depende disso.

O prefixo `R$` e o `.ledger-input-group` vão pra dentro do template do componente, então
as quatro telas passam a ter uma linha só no lugar do bloco atual. O botão de limpar do
`amountPaid` continua fora do componente, onde está — é específico daquele campo.

## Critério de aceite

- [x] Digitar `123456` no campo mostra `1.234,56` e grava `1234.56` no model
- [x] Campo vazio grava `null` no model (não `0`)
- [x] Valor vindo do model aparece já formatado ao abrir em Editar
- [x] Os dois últimos dígitos são sempre os centavos enquanto se digita (`1` → `0,01`)
- [x] Rolar a página com o campo focado não altera o valor — `type="text"` resolve por construção
- [x] Colar `1.234,56`, `1234,56` e `1234.56` resulta no mesmo valor no model
- [x] Letras e símbolos são ignorados, só os dígitos contam
- [x] As validações do campo continuam valendo **através** do componente — é o teste que
      prova que o contrato `FormValueControl` está ligado de verdade
- [x] O campo é marcado como touched ao perder o foco, apesar de `blur` não borbulhar
- [x] Nenhum dos quatro templates tem mais `type="number" step="0.01"`
- [x] Testes escritos antes da implementação, falhando pela razão certa — 4 das 9 specs
      falharam no primeiro run e apontaram as duas lacunas do contrato (reformatação e blur)

## Questões em aberto

Valor negativo: hoje nenhum dos quatro campos aceita (as validações barram, e o backend
também). A máscara nasce sem suporte a sinal; se algum dia entrar "ajuste negativo" no
patrimônio, é mudança de escopo, não ajuste.
