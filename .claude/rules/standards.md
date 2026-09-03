# Padrões obrigatórios do time

Aplicam-se a todo repositório, independente de linguagem. Diferente das outras rules,
esta não deve ser removida ou relaxada ao adaptar o template — apenas os comandos e
ferramentas de exemplo devem ser ajustados para a stack de cada repositório.

## Idioma do código

Duas camadas, dois idiomas:

- **Identificadores em inglês**: nomes de variáveis, funções, métodos, classes,
  interfaces, tabelas/colunas de banco e branches
- **Prosa em português**: comentários, descrições de teste (`describe`/`it`),
  mensagens de assert e mensagens de commit (corpo e resumo — os tipos do
  Conventional Commits como `feat`/`fix` continuam em inglês, são token de formato,
  não prosa)
- Termos de domínio de negócio específicos do time (nomes próprios, siglas internas sem
  tradução natural) podem permanecer como estão — não force uma tradução artificial
- Commits seguem o mesmo padrão — ver skill `commit-msg`
- **Código legado**: essa regra vale para código novo. Não renomeie em massa
  identificadores ou traduza comentários/testes existentes só para adequá-los ao
  padrão — isso é um refactor arriscado (quebra referências, integrações, histórico
  de `git blame`). Ajustar código legado é uma decisão à parte, feita de forma
  isolada e deliberada, nunca como efeito colateral de outra tarefa

### Exemplos
```typescript
// Sim
export class TransactionService {
  // recalcula o total considerando splits pendentes, não só os pagos
  calculateTotal(transaction: Transaction): number { ... }
  isTransactionEditable(transaction: Transaction): boolean { ... }
}

describe('TransactionService', () => {
  it('deve retornar 0 quando não há splits pendentes', () => { ... });
});

// Não (comentário/teste em inglês, identificador não deveria virar português)
export class TransactionService {
  // recalculates the total considering pending splits
  calculateTotal(transaction: Transaction): number { ... }
}

export class ServicoDeTransacao {
  calcularTotal(transacao: Transacao): number { ... }
}
```

## Commits e versionamento
- Conventional Commits obrigatório: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`, `perf:`, `ci:`
- Versionamento semântico automático a partir dos commits (ex: semantic-release) —
  nunca bump de versão manual no `package.json`. **Gap conhecido no aque-web**:
  semantic-release ainda não está configurado — `package.json` fica em `0.0.0`
- Mudança que quebra compatibilidade usa `!` no tipo (`feat!:`) ou rodapé `BREAKING CHANGE:`
- Use a skill `commit-msg` para gerar a mensagem (formato completo com escopo, prefixo
  de ticket extraído da branch) e executar o commit diretamente — não escreva
  a mensagem manualmente sem seguir esse padrão

## Desenvolvimento orientado a testes (TDD)
- Ciclo red → green → refactor: escreva o teste que falha antes de implementar
- Nenhuma função ou endpoint novo é implementado sem um teste que existia primeiro e falhava
- Ao alterar código legado sem teste, adicione um teste de regressão antes de mexer

## Pre-commit hooks
- Lint e format rodam automaticamente antes de cada commit local
  (ex: Husky + lint-staged para Node, framework `pre-commit` para outras stacks)
- O commit é bloqueado localmente se lint/format falhar — não depender só do CI para isso
- **Gap conhecido no aque-web**: não há Husky/lint-staged configurado hoje — só o
  hook `PostToolUse` do Claude Code roda `prettier --write` após edições. Format
  roda, mas nada bloqueia um commit com problema de lint (não há ESLint no projeto)

## Definition of Done
Uma task só é considerada concluída quando:
- [ ] Código implementado e testado (unitário + integração quando aplicável)
- [ ] Lint e testes passando localmente e no CI
- [ ] PR revisado e aprovado por outra pessoa
- [ ] Documentação relevante atualizada (README, CLAUDE.md, comentários de API)
- [ ] Sem TODOs ou débitos técnicos não documentados/registrados

**Gap conhecido no aque-web**: o workflow do GitHub Actions (`docker-publish.yml`) só
builda e publica a imagem Docker no push pra `main` — não roda `npm test` nem lint.
"Lint e testes passando no CI" não é hoje verificável automaticamente neste repo.

## Template de Pull Request
Todo PR segue esta estrutura (a skill `/gerar-pr` já gera isso automaticamente):
- **Título**: Conventional Commits (`tipo(escopo): resumo`, `!` pra breaking change)
- **Issue relacionada**: `Closes #N` / `Relates to #N`, quando houver
- **Resumo**: o que foi feito, em 1-2 frases
- **Motivação**: o que motivou a mudança
- **Mudanças**: lista do que foi alterado
- **Como testar**: passos concretos e verificáveis (comando exato, não "teste a feature")
- **Risco/Impacto**: muda contrato com o `aque-backend` ou adiciona variável de ambiente nova?
- **Screenshot/GIF**: obrigatório quando o diff toca UI (`.html`/`.component.ts`)
- **Checklist**: testes adicionados, docs atualizadas, breaking changes (sim/não)

**Gap conhecido no aque-web**: não existe `.github/PULL_REQUEST_TEMPLATE.md` —
esse template só é aplicado quando a skill `/gerar-pr` monta a descrição.

## Logging estruturado
- Logs em formato estruturado (JSON), nunca `print`/`console.log` solto em produção
- Campos padrão em todo log: `timestamp`, `level`, `service`, `traceId` (ou correlation ID equivalente)
- Nunca logar dados sensíveis — ver `security.md`
- Nível correto: `error` para falhas reais, `warn` para degradação, `info` para eventos
  de negócio, `debug` só em ambiente de desenvolvimento
