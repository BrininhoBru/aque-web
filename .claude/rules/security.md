# Segurança

Este repo é só o frontend (SPA Angular) — validação de entrada, queries parametrizadas e
regras de autorização de endpoint são responsabilidade do `aque-backend`. As regras abaixo
cobrem o que é responsabilidade do frontend.

- Nunca commitar segredos, tokens ou senhas — usar variáveis de ambiente e `.env` (gitignorado);
  hoje o projeto não usa `.env`/env vars em build (ver `.claude/docs/STACK.md`)
- Rotas autenticadas por padrão via `authGuard` (`src/app/core/auth/auth.guard.ts`); rota pública
  nova precisa de justificativa no PR
- Nunca usar `innerHTML`/`bypassSecurityTrust*` para renderizar conteúdo vindo do usuário ou do
  backend — depender da sanitização padrão do Angular
- JWT fica em `localStorage` (`aque_token`) — risco conhecido e aceito (ver
  `.claude/docs/CONCERNS.md`); não introduzir um segundo mecanismo de storage sem decisão
  explícita
- Dependências novas passam por `npm audit` antes do merge
- Dados sensíveis de usuário (CPF, e-mail, telefone) nunca aparecem em logs/console nem em
  mensagens de toast de erro
