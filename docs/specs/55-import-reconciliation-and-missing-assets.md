# Reconciliação do import e ativos ausentes na tela de Patrimônio

- **Issue:** #55 — https://github.com/BrininhoBru/aque-web/issues/55
- **Status:** Draft
- **Repo:** BrininhoBru/aque-web

## Problema

A `aque-backend#37` (PR #39) fez o import da B3 devolver quatro campos novos que não têm
onde aparecer: `missing`, `sheets` (com `totalRead`/`totalPersisted` por aba), `totalRead` e
`totalPersisted`. O `AssetImportResult` em `core/models/index.ts` só declara
`created`/`updated`/`errors`, então o Angular descarta o resto.

Duas consequências concretas:

**O total só fecha depois que alguém age, e ninguém sabe no quê.** `missing` lista os ativos
que vieram de um import anterior e não estão no arquivo novo — vendidos, vencidos, ou
extrato parcial. O import nunca apaga nada, por decisão explícita: um arquivo filtrado
subido por engano não pode custar registros. Mas enquanto esses ativos continuarem no banco,
o patrimônio total fica maior que o do extrato, e hoje não há como descobrir quais são.

**A divergência da reconciliação aparece no lugar errado.** Quando `totalPersisted` diverge
de `totalRead` numa aba, o backend emite um `AssetImportError` não-informacional com
`row: 0`, de propósito, pra que a divergência apareça na tela sem nenhuma mudança no web.
Funciona — mas ela entra em `realErrors()`, então infla a contagem do cabeçalho
"N item(ns) não importado(s)" (`assets.component.html:45`) e renderiza um "(linha 0)" que
não quer dizer nada. Foi registrado como limitação conhecida na PR #56.

## Escopo

**Dentro:**
- `AssetImportResult` e um `AssetImportSheetSummary` novo em `core/models/index.ts`
- Bloco próprio pros ativos de `missing`, com ação de excluir cada um
- Reconciliação por aba visível no resultado do import
- Divergência da reconciliação fora da contagem de "não importado(s)"
- `Asset` ganha `externalCode`, que o backend já devolve desde a #39

**Fora:**
- Qualquer mudança no contrato do backend — ver "Questões em aberto" sobre o discriminador
- Excluir os `missing` em lote, ou o import apagar sozinho: a decisão de não apagar nada
  automaticamente foi tomada na `aque-backend#37` e continua valendo
- Redesenhar a tela de Patrimônio, mexer nos gráficos ou no fluxo de upload
- Importar de outra corretora ou formato

## Abordagem

### Modelos

`AssetImportResult` ganha `missing: Asset[]`, `sheets: AssetImportSheetSummary[]`,
`totalRead: number` e `totalPersisted: number`. O `AssetImportSheetSummary` espelha o record
do backend: `sheet`, `rows`, `totalRead`, `totalPersisted`. `Asset` ganha
`externalCode: string | null`.

São campos aditivos — nada que já funciona depende deles.

### Separar a divergência dos itens não importados

`assets.component.ts:89` filtra `errors` por `isInformational` e joga tudo que sobra em
`realErrors()`. Entra um terceiro grupo: a divergência de reconciliação, identificada por
`row === 0`.

Isso é um discriminador por número mágico, e vale dizer em voz alta por quê: o backend usa
`row: 0` deliberadamente pra esse caso — linha de dados usa `rowIndex + 1` (≥ 2) e erro de
cabeçalho usa `1`, então `0` não colide com nada. Um comentário no `computed` registra o
acordo, e o campo próprio no contrato fica como melhoria futura.

Os três grupos:
- `realErrors()` — linhas que não importaram; mantém o cabeçalho atual
- `reconciliationWarnings()` — divergência por aba, bloco próprio, sem "(linha N)"
- `informationalErrors()` — rodapé da B3, como está hoje

### Bloco de `missing`

Cada entrada é um `Asset` completo, então reusa `askDelete(id)` / `confirmDelete()` /
`cancelDelete()`, que já existem (`assets.component.ts:265`) e já alimentam o diálogo de
confirmação da tabela. Nada de fluxo novo de exclusão.

O texto precisa deixar claro que não é erro: são ativos que continuam no banco e **podem**
ser removidos, não itens que falharam.

### Reconciliação por aba

`sheets` vira uma linha por aba dentro do resultado do import, com lido e persistido. Em
import normal os dois batem e isso é ruído — então o bloco só aparece quando há divergência
em alguma aba, ou recolhido por padrão. O valor dele é o dia em que não bater.

## Critério de aceite

- [x] `AssetImportResult` declara `missing`, `sheets`, `totalRead` e `totalPersisted`, e
      `Asset` declara `externalCode`
- [x] Um import que devolve `missing` renderiza um bloco listando cada ativo com nome, tipo
      e valor, separado do bloco de erros
- [x] Cada item de `missing` tem ação de excluir que passa pelo mesmo diálogo de confirmação
      já usado na tabela de ativos
- [x] Excluir um item de `missing` atualiza o patrimônio total sem recarregar a página
- [x] O texto do bloco de `missing` não usa a palavra "erro" nem "não importado"
- [x] Divergência de reconciliação (`row === 0`) **não** entra na contagem de
      "N item(ns) não importado(s)"
- [x] Divergência de reconciliação aparece em bloco próprio, sem "(linha 0)"
- [x] Linha que não importou continua aparecendo como hoje, com aba e número da linha
- [x] Rodapé da B3 continua no aviso discreto de linhas ignoradas
- [x] Import sem `missing` e sem divergência não mostra nenhum bloco novo
- [x] Testes cobrem os três grupos de erro a partir de um mesmo `AssetImportResult`, e o
      caso de `missing` vazio
- [x] Testes escritos antes da implementação, falhando pela razão certa (TDD —
      `standards.md`)
- [ ] Screenshot anexado na PR — o diff toca UI (`standards.md`)

## Questões em aberto

**O discriminador por `row === 0` é um acordo implícito entre os dois repos.** O certo seria
o `AssetImportError` carregar um campo dizendo o que ele é (linha, aba, arquivo) em vez de a
tela inferir pelo número da linha. Isso é mudança de contrato no `aque-backend` e fica pra
uma issue própria; enquanto não vier, o `computed` do web carrega o comentário explicando o
acordo.
