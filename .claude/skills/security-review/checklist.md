# Checklist de revisão de segurança (frontend SPA)

Este repo é só o frontend. Validação server-side, SQL, hashing de senha e autorização de
endpoint são revisados no `aque-backend`, não aqui.

## Renderização e sanitização
- [ ] Nenhum uso de `innerHTML`, `[innerHTML]` ou `bypassSecurityTrust*` com conteúdo vindo do
  usuário ou do backend sem justificativa
- [ ] Nenhuma URL montada dinamicamente (`href`, `src`) a partir de input não validado

## Autenticação e sessão
- [ ] Rota nova sob `AppShellComponent` está protegida por `authGuard`; se for pública, o PR
  justifica por quê
- [ ] Nenhum código novo lê/escreve o token JWT fora de `AuthService`
- [ ] Resposta 401/403 continua tratada só pelo `authInterceptor`, não duplicada por componente

## Dados sensíveis
- [ ] Nenhum dado sensível (CPF, e-mail, telefone, token) aparece em `console.log`, mensagem de
  toast ou comentário deixado no código
- [ ] Erros HTTP mostrados ao usuário não vazam detalhes internos (stack trace, URL de API,
  versão de lib) — mensagem genérica via `ToastService`

## Dependências
- [ ] Dependência nova rodou `npm audit` sem vulnerabilidade alta/crítica sem mitigação
