# Gráficos seguindo o modo escuro

- **Issue:** #54 — https://github.com/BrininhoBru/aque-web/issues/54
- **Status:** Implemented
- **Repo:** BrininhoBru/aque-web

## Problema

O modo escuro já está completo no app: `ThemeService` alterna a classe `.dark` no
`<html>`, `styles.css` redefine toda a paleta `--color-ledger-*` sob `.dark`, e o header
tem o toggle (`header.component.html:25`). Os gráficos ApexCharts ficaram de fora.

`dashboard.component.ts` e `assets.component.ts` fixam valores da paleta clara direto nas
opções: `foreColor: '#8A7A62'`, `borderColor: '#E0D8C8'`, `tooltip: { theme: 'light' }`,
`labels.colors`, `plotOptions.pie.donut.labels.total.color` e o array `colors[]` de
séries. No modo escuro os rótulos, a legenda e o total do donut ficam em cinza-areia
sobre `#1C1810` — ilegíveis — e o tooltip aparece como um retângulo branco.

As duas telas também repetem o mesmo array de cores de série, com o dashboard tendo duas
cores a mais que o de assets.

## Escopo

**Dentro:**
- Helper compartilhado com as duas paletas de gráfico (clara e escura), em
  `src/app/shared/`
- `dashboard.component.ts` (donut de categorias e gráfico de evolução) e
  `assets.component.ts` (donut de alocação) passam a derivar as opções do tema atual
- Teste cobrindo que as opções mudam quando `ThemeService.dark()` muda

**Fora:**
- Redesenhar os gráficos, trocar tipo de gráfico ou mexer nos dados que eles exibem
- Trocar o `ng-apexcharts` por outra lib
- Qualquer mudança no `ThemeService`, na paleta do `styles.css` ou no toggle do header —
  tudo isso já funciona
- Tema do `<input type="month">` do header e outros controles nativos do navegador

## Abordagem

As opções dos três gráficos já são `computed()`. Ler `ThemeService.dark()` dentro delas é
o que falta: o signal muda no toggle, o `computed` reavalia, o `ng-apexcharts` recebe
opções novas e redesenha. Nenhuma subscription, nenhum `effect` extra.

As cores precisam ser **literais**, não `var(--color-ledger-*)`: o ApexCharts escreve
esses valores em atributos do SVG e em estilos inline, onde uma custom property não
resolve. Ler o valor computado do `<html>` com `getComputedStyle` traria a paleta do CSS
como fonte única, mas amarra o `computed` à ordem em que o `effect` do `ThemeService`
troca a classe no DOM — uma corrida por uma vantagem pequena.

Então: `src/app/shared/chart-theme.ts` exporta `chartTheme(dark: boolean)`, devolvendo
`foreColor`, `gridBorder`, `tooltipTheme` e `series: string[]`. Os hex ficam duplicados
em relação ao `styles.css`, o que é o custo consciente dessa escolha — em troca some a
duplicação atual entre os dois componentes, e as cores de gráfico passam a ter um lugar
só. Um comentário no topo do arquivo aponta pro `styles.css` como par a manter em dia.

A paleta escura das séries precisa ser própria, não a clara reaproveitada: `#2C6B3D` e
`#8B3122` sobre fundo escuro perdem contraste. O `styles.css` já resolveu isso pras cores
semânticas em `.dark` (`--color-ledger-positive: #6FBF83`, `--color-ledger-negative:
#E08A72`) — a paleta de séries escura segue essas, e as neutras vêm de
`--color-ledger-ink-lt` / `--color-ledger-border-md` na versão `.dark`.

## Verificação manual pendente

Os testes cobrem que as opções mudam; não cobrem que o ApexCharts **repinta** ao receber
opções novas — ele nem sempre reaplica tema em `updateOptions`. Isso só se vê no navegador:
alternar o tema pelo header no Dashboard e no Patrimônio. Se algum gráfico não redesenhar,
a saída é forçar remount, não insistir no binding.

## Critério de aceite

- [x] Alternar o tema faz os `computed()` dos três gráficos reemitirem opções novas
      (`assets.component.spec.ts`: cores, `foreColor` e `tooltip.theme` mudam)
- [x] `foreColor`, a cor do "Total" no centro do donut e a da legenda saem todas do tema
- [x] No modo escuro `tooltip.theme` é `'dark'`
- [x] A grade do gráfico de evolução usa `gridBorder` do tema, não `#E0D8C8` fixo
- [x] Receita e despesa continuam distinguíveis nos dois temas (`chart-theme.spec.ts`)
- [x] `dashboard.component.ts` e `assets.component.ts` não têm mais nenhum hex literal
- [x] `chartTheme()` devolve só cores literais, nunca `var(--x)` — o ApexCharts escreve
      esses valores em atributos do SVG, onde custom property não resolve
- [x] Testes escritos antes da implementação, falhando pela razão certa (TDD —
      `standards.md`)
