// Compartilhado entre command-palette.component.spec.ts e app-shell.component.spec.ts
// (achado do /code-review, PR #43) — ambos simulam o atalho global de teclado.
export function press(key: string, opts: Partial<KeyboardEventInit> = {}): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, ...opts }));
}
