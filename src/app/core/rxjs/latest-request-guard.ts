// Padrão repetido em dashboard.component.ts, transactions.component.ts e
// sidebar.component.ts (achado do /code-review, PR #43): descarta a resposta de uma
// requisição obsoleta quando uma mais recente já foi disparada (ex.: troca rápida de mês).
export function createLatestRequestGuard() {
  let latest = 0;
  return {
    next: (): number => ++latest,
    isCurrent: (id: number): boolean => id === latest,
  };
}
