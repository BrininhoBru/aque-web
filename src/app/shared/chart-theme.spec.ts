import { chartTheme } from './chart-theme';

describe('chartTheme', () => {
  it('deve usar cores diferentes de texto, grade e tooltip em cada tema', () => {
    const claro = chartTheme(false);
    const escuro = chartTheme(true);

    expect(escuro.foreColor).not.toEqual(claro.foreColor);
    expect(escuro.gridBorder).not.toEqual(claro.gridBorder);
    expect(claro.tooltipTheme).toBe('light');
    expect(escuro.tooltipTheme).toBe('dark');
  });

  it('deve trocar a paleta de séries entre os temas', () => {
    expect(chartTheme(true).series).not.toEqual(chartTheme(false).series);
  });

  it('deve manter receita e despesa distinguíveis nos dois temas', () => {
    // as duas primeiras séries são receita e despesa no gráfico de evolução; se
    // colapsarem na mesma cor, o gráfico deixa de dizer qualquer coisa
    for (const dark of [false, true]) {
      const [receita, despesa] = chartTheme(dark).series;
      expect(receita).not.toEqual(despesa);
    }
  });

  it('deve ter cores suficientes para as séries do dashboard', () => {
    // o donut de categorias do dashboard chega a 8 fatias antes de repetir cor
    expect(chartTheme(false).series.length).toBeGreaterThanOrEqual(8);
    expect(chartTheme(true).series.length).toBe(chartTheme(false).series.length);
  });

  it('deve devolver apenas cores literais, não custom properties', () => {
    // o ApexCharts escreve esses valores em atributos do SVG, onde var(--x) não resolve
    const todas = [...chartTheme(true).series, chartTheme(true).foreColor, chartTheme(true).gridBorder];
    for (const cor of todas) {
      expect(cor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
