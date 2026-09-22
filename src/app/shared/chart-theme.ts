/**
 * Paleta dos gráficos por tema.
 *
 * Os valores são literais de propósito: o ApexCharts escreve essas cores em atributos do
 * SVG e em estilos inline, onde `var(--color-ledger-*)` não resolve. Ler do DOM com
 * `getComputedStyle` traria a paleta do CSS como fonte única, mas amarraria o `computed`
 * que chama isso à ordem em que o `effect` do `ThemeService` troca a classe no `<html>`.
 *
 * **Par a manter em dia:** os tokens `--color-ledger-*` em `src/styles.css` (bloco `@theme`
 * para o claro, bloco `.dark` para o escuro). Mudou lá, muda aqui.
 */
export interface ChartTheme {
  /** cor de rótulos, legenda e eixos */
  foreColor: string;
  /** cor das linhas de grade do gráfico de evolução */
  gridBorder: string;
  tooltipTheme: 'light' | 'dark';
  /** cores das séries, na ordem: receita, despesa, depois as demais categorias */
  series: string[];
}

const LIGHT: ChartTheme = {
  foreColor: '#8A7A62', // --color-ledger-ink-lt
  gridBorder: '#E0D8C8', // --color-ledger-border-lt
  tooltipTheme: 'light',
  series: [
    '#2C6B3D', // --color-ledger-positive (receita)
    '#8B3122', // --color-ledger-negative (despesa)
    '#7A5C1E',
    '#3D5A7A',
    '#5C3D5C',
    '#2A6B5C',
    '#7A4A1E',
    '#3D4A6B',
  ],
};

// as semânticas seguem o que o .dark já define no styles.css; as demais foram clareadas
// na mesma medida, porque as do tema claro perdem contraste sobre --color-ledger-page
// escuro (#1C1810)
const DARK: ChartTheme = {
  foreColor: '#8F836A', // --color-ledger-ink-lt (.dark)
  gridBorder: '#3A3324', // --color-ledger-border-lt (.dark)
  tooltipTheme: 'dark',
  series: [
    '#6FBF83', // --color-ledger-positive (.dark) (receita)
    '#E08A72', // --color-ledger-negative (.dark) (despesa)
    '#D9B85C',
    '#7FA3CC',
    '#B08AB0',
    '#5FB8A6',
    '#CC9A5F',
    '#8A9BC4',
  ],
};

export function chartTheme(dark: boolean): ChartTheme {
  return dark ? DARK : LIGHT;
}
