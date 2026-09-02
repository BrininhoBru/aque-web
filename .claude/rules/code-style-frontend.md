---
paths:
  - "src/app/**/*.ts"
  - "src/app/**/*.html"
---

# Estilo de código — Frontend (Angular/TypeScript)

- Identificadores (classes, funções, variáveis) em inglês; comentários em português —
  ver regra geral em `standards.md`
- Standalone components apenas — nunca `NgModule`
- Estado com **Signals**, nunca `BehaviorSubject`/store externo: `signal()` privado com
  prefixo `_`, exposto como `readonly` público via `.asReadonly()`; `computed()` para
  derivado; `effect()` só para side effect (ex.: disparar carga inicial no construtor)
- Formulários com **Signal Forms** (`@angular/forms/signals`) — nunca `ReactiveFormsModule`.
  Referência: `src/app/features/transactions/transaction-form/transaction-form.component.ts`
- Um service por recurso do backend em `src/app/core/services/`, sempre
  `@Injectable({ providedIn: 'root' })`, com `Observable<T>` nos métodos HTTP; interfaces de
  payload/filtro ficam no mesmo arquivo do service, não em `core/models/`
- Guards/interceptors como funções (`CanActivateFn`, `HttpInterceptorFn`), nunca classes
- Exports nomeados; um componente/service/pipe por arquivo, nome do arquivo = `<nome>.<tipo>.ts`
- Tipagem explícita em props e retornos; evitar `any` (ver débitos conhecidos em
  `.claude/docs/CONCERNS.md`)
- Tailwind v4 via utilitários já definidos em `src/styles.css` (`.ledger-*`, `.btn-*`,
  `.badge-*`) — reutilize antes de criar classe nova; estilo local pequeno via `styles: [...]`
  inline no componente, não arquivo `.css` separado
- Sem ESLint neste projeto — formatação garantida só por Prettier (config em `package.json`)

Padrões mais profundos (arquitetura, fluxo de dados, convenções de nomenclatura completas) estão
em `.claude/docs/CONVENTIONS.md` e `.claude/docs/ARCHITECTURE.md` — consulte antes de duplicar
regra aqui.
