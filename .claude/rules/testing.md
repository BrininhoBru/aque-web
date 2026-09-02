---
paths:
  - "src/app/**/*.spec.ts"
---

# Convenções de testes

- Nomeie testes descrevendo comportamento, em português: `'deve [resultado esperado] quando
  [condição]'` — é o padrão já usado em todos os specs existentes
- Um teste testa uma coisa só — evite múltiplos asserts não relacionados no mesmo teste
- Mocks apenas para dependências externas (o backend via `HttpTestingController`); nunca mocke
  o próprio código sob teste — services reais são injetados via `TestBed`
- Toda função pública nova precisa de teste cobrindo o caminho feliz e pelo menos um caso de erro

## Framework e organização

- **Runner:** Karma + Jasmine (`npm test`), sem `karma.conf.js` próprio — configurado via
  `angular.json`/`tsconfig.spec.json` (padrão do Angular CLI)
- Specs **co-localizados**: `<nome>.service.spec.ts` ao lado de `<nome>.service.ts`
- Sem diretório de fixtures compartilhado — factory function local por arquivo de spec
  (`function summary(overrides: Partial<X>): X { return { ...defaults, ...overrides }; }`)

## Mocking HTTP

```typescript
TestBed.configureTestingModule({
  providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
});
httpMock = TestBed.inject(HttpTestingController);

httpMock.expectOne(`${base}/summary/${year}/${month}`).flush(summary({}));
```

- `http.verify()` no `afterEach` para garantir que não sobrou request pendente
- `localStorage.clear()` em `beforeEach`/`afterEach` em qualquer spec que toque `AuthService`
- Erros de subscribe são checados via flag booleana setada no callback `error`, não
  `catchError`/async-await

## Cobertura

Sem threshold obrigatório. `npx ng test --code-coverage` usa o `karma-coverage` já instalado.

Mais exemplos e padrões completos em `.claude/docs/TESTING.md`.
