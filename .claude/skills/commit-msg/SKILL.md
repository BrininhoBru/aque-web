---
name: commit-msg
description: Use this skill when the user asks to "write a commit message", "generate a commit", "create a commit", "fazer commit", "mensagem de commit", "gerar commit", or when staging changes and preparing a git commit. Provides rules for Conventional Commits format in Portuguese with scope and ticket prefix from branch name, and commits directly.
version: 2.0.0
---

# Instruções de geração de mensagem de commit

## Idioma
- Sempre escreva a mensagem de commit em **português**. O tipo do Conventional Commits
  (`feat`, `fix`, etc.) é um token de formato e continua em inglês — só o resumo e o
  corpo vão em português.

## Formato
- Use o padrão **Conventional Commits**.
- Sempre inclua o **escopo** entre parênteses após o tipo.
- Escolha o tipo correto pela tabela abaixo:

| Tipo | Quando usar |
|------|------------|
| `feat` | Nova funcionalidade para o usuário ou sistema |
| `fix` | Correção de bug |
| `refactor` | Reestruturação de **código-fonte** sem mudar comportamento (renomear variáveis, extrair métodos, reorganizar classes) |
| `chore` | Manutenção que **não muda código-fonte nem testes** (configs, `.env`, `.gitignore`, dependências, scripts de build) |
| `docs` | Mudanças só em documentação (README, comentários, CLAUDE.md) |
| `style` | Formatação sem mudar lógica (espaço, indentação, ponto e vírgula) |
| `test` | Adicionar ou corrigir testes |
| `perf` | Melhoria de performance |
| `ci` | Mudanças em pipeline de CI/CD (GitHub Actions) |
| `build` | Mudanças no sistema de build (`package.json`, `angular.json`, `Dockerfile`) |
| `revert` | Reverter um commit anterior |

### Regras importantes na escolha do tipo
- Arquivos de config (`.env`, `.gitignore`, `proxy.conf.json`) → `chore`
- Mudanças em `package.json` (deps), `angular.json`, `Dockerfile` → `build`
- **Nunca** use `refactor` para arquivos que não são código-fonte (configs, scripts, docs)

## Primeira linha (subject)

### Estrutura
```
[TASK-XXX] tipo(escopo): resumo imperativo do que foi feito
```

### Regras
1. Confira o nome da branch atual.
2. Se a branch começar com um padrão de ticket (ex.: `TASK-123`, `ORD-456`, `BUG-789` —
   qualquer prefixo seguido de hífen e números), extraia essa referência e coloque no
   **início** da primeira linha entre colchetes.
3. Se a branch **não** tiver referência de ticket — caso comum neste projeto, cujas
   branches seguem `feature/nome-da-feature` ou `fix/descricao-do-bug` sem ticket —
   omita os colchetes e comece direto com o tipo.
4. O resumo deve estar no **modo imperativo** (ex.: "adiciona", "corrige", "remove",
   "atualiza").
5. Primeira letra do resumo em **minúscula**.
6. **Não** termine com ponto.
7. **Não** use emojis.

### Exemplos
- Branch `TASK-123-add-order-filter`:
  ```
  [TASK-123] feat(orders): adiciona filtro de pedidos por status
  ```
- Branch `feature/dark-mode-and-dashboard-cards` (sem ticket, padrão real deste projeto):
  ```
  feat(dashboard): adiciona modo escuro e cards de resumo
  ```

## Corpo do commit

Escreva o corpo pensando no revisor, não como changelog — o objetivo é que quem
revisa entenda o *raciocínio* sem precisar abrir o diff inteiro.

- Inclua corpo **só quando necessário** (mudanças complexas, decisões não óbvias,
  qualquer coisa que o revisor perguntaria de qualquer forma)
- Separe o corpo da primeira linha com uma **linha em branco**
- Divida o corpo em **bullet points** usando `-`
- Cada bullet explica o **porquê**, não só o quê: o raciocínio, trade-off ou contexto
  por trás da mudança — não uma repetição do diff
- Mantenha curto e objetivo; se precisar de mais de ~5 bullets, a mudança
  provavelmente é grande demais para um commit só — considere quebrar

### Exemplo com corpo
```
feat(split): adiciona cancelamento de rateio pendente

- Cancelamento só permitido antes da confirmação, pra evitar inconsistência com
  transações já geradas a partir do split
- Optei por um endpoint dedicado em vez de um PATCH genérico pra deixar a transição
  de status explícita e fácil de validar
```

### Exemplo com corpo mínimo
```
chore(config): atualiza regras do gitignore
```

## Breaking Changes

- Para mudanças que quebram compatibilidade, adicione `BREAKING CHANGE:` no
  **corpo** da mensagem.
- Descreva o que mudou e o impacto.

### Exemplo
```
refactor(auth): muda estrutura do token de autenticação

- Migra de JWT simples para JWT com claims customizadas, necessário pra carregar
  informação de papel sem uma consulta extra a cada request

BREAKING CHANGE: formato do token mudou, clientes precisam atualizar o parser
```

## Autoria do commit

- **Nunca** adicione `Co-Authored-By` ou qualquer referência ao assistente na
  mensagem de commit.
- O commit deve conter só a autoria do usuário.

## Execução

- Monte a mensagem de commit seguindo as regras acima e rode `git commit` com ela
  **diretamente** — não peça aprovação antes.
- Depois de commitar, mostre ao usuário a mensagem exata que foi commitada, pra ele
  poder corrigir com amend se algo estiver errado.
- **Nunca** rode `git push` — só commit local.
