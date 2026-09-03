# Auditoria de fluxos de usuário e UI (web)

- **Issue:** #12 — https://github.com/BrininhoBru/aque-web/issues/12
- **Status:** Auditoria concluída — achados confirmados e decisões do autor registradas; fixes ficam para issues separadas
- **Repo:** BrininhoBru/aque-web

## Problema

As telas de `transactions`, `recurring`, `split`, `categories`, `persons` e `dashboard`
foram implementadas em momentos diferentes, cada uma com seu próprio tratamento de
loading/erro/validação. Sem uma revisão cruzada, é fácil ter uma tela que não trata erro
401/403 do jeito que o `auth.interceptor`/`error.interceptor` espera, um formulário que
permite submeter um estado que o backend vai rejeitar (ex.: split que não soma 100%), ou
uma tela que quebra ao trocar de mês/ano via `month-year.service`. Isso vira bug relatado
pelo usuário em vez de pego em revisão.

## Escopo

**Dentro:**
- Revisão de fluxo e UI das telas: login, transactions (lista + `transaction-form`),
  recurring, split, categories, persons, dashboard.
- Checagem de estados de loading/erro/vazio em cada tela.
- Checagem de validação client-side nos formulários (`transaction-form`, `split`,
  `recurring`) comparada com o que o backend (`aque-backend`) realmente valida/exige —
  cruzar com a spec irmã aque-backend#17 quando relevante.
- Checagem do fluxo de autenticação: `auth.guard`, `auth.interceptor`, `error.interceptor`
  (o que acontece na UI em 401 vs. 403).
- Checagem de `month-year.service` (side effects ao trocar mês/ano) e dos pipes
  `brl-currency`/`month-year` em casos de borda (valores negativos, mês/ano inválido).
- Registro de cada achado (bug de fluxo, inconsistência com o backend, ou dúvida) num
  checklist nesta spec, com pergunta ao autor antes de virar tarefa de fix.

**Fora:**
- Implementar os fixes dos achados — decidido item a item com o autor, vira issue/PR
  separada.
- Revisão de regra de negócio pura do backend — coberta pela spec irmã em
  `aque-backend` (issue aque-backend#17); aqui só entra a regra de negócio que vaza pra
  UI (ex.: validação duplicada ou divergente).
- Auditoria de acessibilidade, performance ou testes visuais/e2e novos.
- Adicionar testes novos como parte desta auditoria (pode virar recomendação, não
  execução).

## Abordagem

Revisão manual guiada, tela por tela, lendo componente + template (`.ts` + `.html`) e os
services em `core/services`/`core/auth`/`core/http` que eles consomem. Cada tela gera uma
lista de achados classificados como:
- **Bug de fluxo** — a UI se comporta de um jeito que o usuário não esperaria (loading
  que não termina, erro engolido, navegação que perde estado).
- **Inconsistência com o backend** — a UI assume uma regra de negócio diferente da que o
  backend aplica (validação de formulário mais frouxa/rígida que a API, formatação que
  não bate com o dado real).
- **Dúvida** — comportamento ambíguo que só o autor do produto pode resolver (ex.: o que
  a UI deveria mostrar quando uma transação recorrente tem override?).

Toda dúvida é levantada ao autor via pergunta direta antes de ser registrada como bug ou
fechada como intencional — não presumir a resposta.

## Critério de aceite

- [x] Todas as telas listadas em Escopo foram lidas e revisadas (component + template +
      services consumidos, não só a tela renderizada).
- [x] Cada achado (bug de fluxo ou inconsistência) está documentado nesta spec com: tela,
      arquivo, descrição do problema, e se foi confirmado ou é hipótese pendente de
      resposta do autor.
- [x] Toda dúvida ambígua foi perguntada ao autor e a resposta está registrada aqui antes
      da spec ser marcada como concluída.
- [x] Nenhum fix é aplicado nesta spec — achados confirmados como bug real viram
      referência para uma issue/PR separada (linkada aqui quando existir).

## Achados

Telas e serviços lidos por completo: login, transactions (lista + `transaction-form`),
recurring, split, categories, persons, dashboard, `core/auth`, `core/http`,
`core/services/*`, `shared/pipes/*`, `shared/services/toast.service.ts`,
`layout/header`, `layout/sidebar`, `app.routes.ts`. Cruzado com os DTOs reais do
`aque-backend` (`TransactionRequest`, `RecurringTransactionRequest`,
`SplitRuleItemRequest`, `CategoryService`) para confirmar divergência real, não
suposição. `.claude/docs/CONCERNS.md` deste repo está desatualizado — cita como pendente
o `environment.ts` (issue #5) e o error handling centralizado (issue #6), que já estão
implementados no `main` atual; não repeti esses itens como achados novos.

- **BUG** transaction-form — `transaction-form.component.ts:79-86` +
  `transaction-form.component.html` (input `referenceYear`) — o campo de ano de
  referência é um `<input type="number">` validado só com `required` no client; o
  backend (`TransactionRequest.java`) também só tem `@NotNull` em `referenceYear`, sem
  `@Min`/`@Max`. Nenhuma das duas camadas impede um ano absurdo (0, negativo, 99999).
  Isso contamina filtros por mês/ano e a agregação do dashboard
  (`DashboardService.getEvolution(year)`) com lançamentos fora de qualquer faixa
  plausível. — status: confirmado (gap client + server). Fix rastreado em #13.
- **BUG** transaction-form — `transaction-form.component.ts:172` (`save()`) — o campo
  `amountPaid` não tem validador `min()` (diferente de `amountExpected`, que exige > 0),
  então o usuário consegue digitar um valor negativo em "Valor pago". Ao salvar,
  `data.amountPaid && data.amountPaid > 0 ? data.amountPaid : null` descarta o valor
  negativo silenciosamente (vira `null`) sem nenhuma mensagem de erro — o usuário não
  entende por que o valor que digitou "sumiu". — status: confirmado. Fix rastreado em #13.
- **BUG** split — `split.component.ts:71-72` (`totalValid`/`totalPercentage`) — a
  validação de "soma bate 100%" no client compara `number` com `===100` após somar
  `parseFloat` dos percentuais digitados. Como o backend (`SplitRuleService.validatePercentages`)
  compara com `BigDecimal.compareTo`, uma divisão como 33,33/33,33/33,34 pode não bater
  exatamente 100 em ponto flutuante no client (ex.: 99.99999999999999), bloqueando o
  botão "Salvar" mesmo quando os valores digitados são matematicamente válidos e o
  backend aceitaria. — status: confirmado (bug de precisão de ponto flutuante). Fix
  rastreado em #14.
- **BUG (race condition)** transactions / split / dashboard —
  `transactions.component.ts:112-115`, `split.component.ts:90-93`,
  `dashboard.component.ts:243-246` — os três reagem a `monthYear.selected()` via
  `effect()` e disparam um novo `.subscribe()` a cada troca de mês/ano, sem cancelar a
  requisição anterior (sem `switchMap`/`takeUntil`). Os botões `‹`/`›` do header
  (`header.component.html:8,14`) não têm debounce. Clicar rápido entre meses pode fazer
  uma resposta antiga e mais lenta chegar depois da mais nova e sobrescrever a tela com
  dados do mês errado. — status: confirmado. Fix rastreado em #15.
- **BUG (menor)** auth — `auth.interceptor.ts:15-18` + `auth.service.ts:41-45` — uma
  tentativa de login com credencial errada (`POST /auth/login` → 401) passa pelo mesmo
  `authInterceptor` das rotas protegidas, que chama `auth.logout()` — semanticamente
  estranho chamar "logout" numa tentativa de login que nunca autenticou. Hoje é
  inofensivo (limpa um `localStorage` já vazio e navega para `/login`, onde o usuário já
  está), mas é frágil: qualquer efeito colateral futuro adicionado a `logout()` (ex.:
  evento de analytics "usuário saiu") dispararia em toda tentativa de senha errada. —
  status: confirmado, severidade baixa. Fix rastreado em #16.
- **BUG (gap de UI)** transaction — `core/models/index.ts:25` (`isOverride`) — o campo
  existe no modelo e é setado pelo backend sempre que uma instância gerada por recorrente
  é editada, mas não é exibido em nenhum lugar da UI (grep confirma uso só em arquivos de
  teste). O usuário não tem como saber, olhando a lista de lançamentos, quais instâncias
  de um recorrente já foram customizadas manualmente para aquele mês. — status:
  **confirmado pelo autor** — deve aparecer na UI (ex.: indicador "editado manualmente" na
  lista de lançamentos e/ou no formulário). Fix rastreado em #13.
- **HEADS-UP (cross-repo, redesenho fora do escopo)** split — a spec irmã do backend
  (`aque-backend` issue #17) registrou uma decisão de produto: `SplitRule` deve deixar de
  ser uma configuração por mês/ano e virar uma parametrização única e onipresente (válida
  para todos os meses), com meses passados mantendo o split que estava vigente na época
  (versionado por data de vigência). Isso muda a premissa do `split.component.ts` atual,
  que hoje reage à troca de mês/ano igual às outras telas (assumindo uma regra por mês). Não
  é um achado desta auditoria de UI, é um aviso para quando o redesenho do backend for
  planejado — a tela de split precisará ser repensada junto (provável mudança de "editar a
  regra do mês X" para algo como "editar a regra vigente, com histórico de vigências").

## Auditoria ao vivo (browser, sessão 2026-09-02)

Extensão da auditoria original: app rodando de verdade (aque-backend em Docker local,
aque-web via `npm start`), navegado via Chrome, testando os fluxos fim a fim em vez de só
ler código. Módulos cobertos: login, categories, persons, split, transactions (lista +
form), recurring, dashboard.

- **BUG (alta severidade, causa raiz confirmada no código)** transaction-form —
  `transaction-form.component.html:79-88` — o `<select>` de "Mês de referência" usa
  `[value]="transactionForm.referenceMonth().value()"` (property binding simples do
  Angular em vez de `[(ngModel)]`/reactive forms), enquanto o model já inicia com
  `referenceMonth: this.monthYear.month()` (`transaction-form.component.ts:65`) — ou seja,
  o valor real já nasce correto (ex.: 9/Setembro), mas o `<select>` não reflete isso no
  primeiro render e mostra visualmente "Janeiro" (primeira opção da lista) até o usuário
  tocar no campo. **Reproduzido ao vivo**: criei um lançamento com o mês visualmente em
  "Janeiro" sem tocar no campo, e o registro foi salvo com `reference_month=9` (Setembro,
  o mês globalmente selecionado) — confirmado direto no Postgres. Usuário não tem como
  saber, olhando a tela, para qual mês o lançamento está realmente sendo criado. —
  status: confirmado, causa raiz identificada. Fix rastreado em #18.
- **BUG** dashboard — a "Divisão do mês" dispara `GET /api/dashboard/split/{ano}/{mes}`
  **duas vezes** ao carregar a tela; quando a regra não está configurada (404), isso gera
  dois toasts de erro idênticos empilhados ("Regra de divisão não configurada para
  X/YYYY") em vez de um. — status: confirmado, causa exata não localizada nesta sessão
  (candidato: efeito duplicado ou dupla subscription em `dashboard.component.ts`). Fix
  rastreado em #19.
- **BUG (regra de negócio, provavelmente backend)** persons — nada impede cadastrar duas
  pessoas com o nome exatamente igual (testado: duas pessoas "Bruno" criadas com sucesso,
  `POST /api/persons` retornou 201 nas duas vezes). Isso deixa ambíguo qual "Bruno" está
  sendo referenciado nas telas de Split e no formulário de lançamento, que só mostram o
  nome. — status: confirmado; validação de unicidade não existe nem no client nem
  (aparentemente) no backend. Fix rastreado em aque-backend#23.
- **BUG (menor)** categories — o botão "Salvar" do modal de nova categoria fica habilitado
  com um nome contendo só espaços (`"   "`), porque a checagem de client não faz `trim()`.
  O backend rejeita corretamente com 400, mas o usuário só descobre isso depois de clicar
  Salvar (toast de erro), em vez do botão já vir desabilitado como acontece com nome
  vazio. — status: confirmado, severidade baixa (backend já protege o dado). Fix rastreado
  em #20.
- **CONFIRMAÇÃO AO VIVO** dos achados já registrados acima: bug de precisão de float no
  split reproduzido com valores reais (0.02/64.07/35.91 soma
  `99.99999999999999` em ponto flutuante) — e pior do que o esperado: **o erro bruto em
  notação científica (`1.4210854715202004e-14%`) aparece literalmente na tela** para o
  usuário, não só bloqueia o botão silenciosamente. Também confirmado ao vivo: lançamento
  recorrente gerado sem `dueDate` (campo "Vencimento" fica "—").
- **OBSERVAÇÃO (confiança baixa, não confirmado como bug de produto)** durante a sessão,
  em alguns momentos após navegação repetida para `/login`, o console acusou
  `InvalidStateError: Transition was aborted because of invalid state` (Angular Router) e
  campos de formulário pararam de refletir texto digitado via automação até a página ser
  recarregada. Não foi possível isolar se é um bug real de navegação rápida/duplicada no
  app ou um artefato da própria automação do browser. Vale um olhar rápido se o time notar
  telas "travadas" após navegação rápida entre rotas, mas não estou registrando como bug
  confirmado.

### Achado de infraestrutura (não é bug de UI, mas bloqueava todo o login)

Login via o fluxo de dev documentado (`aque-web` proxy → `aque-backend` em `:8080`) **falha
com 403** (não 401) a menos que `CORS_ALLOWED_ORIGINS` inclua a origem do dev server (ex.:
`http://localhost:4200`). Causa: `SecurityConfig.corsConfigurationSource()` no
`aque-backend` monta uma lista de origens permitidas vazia por padrão
(`app.cors.allowed-origins=${CORS_ALLOWED_ORIGINS:}`), e o proxy do Angular
(`changeOrigin: true`) faz o backend enxergar `Host` e `Origin` diferentes — o que o
Spring trata como cross-origin de verdade, não same-origin. Isso não está documentado em
lugar nenhum (`.env.example` do backend nem cita a variável) — qualquer setup local do
zero esbarra nisso. Detalhe cross-repo: como o fix é 100% do lado do `aque-backend`
(documentação/`.env.example`), o achado formal fica registrado na spec irmã
(`aque-backend/docs/specs/17-audit-business-rules-and-code.md`) para não duplicar.

## Questões em aberto

Nenhuma da auditoria original (indicador de `isOverride`, já respondida). Da auditoria ao
vivo, nenhuma pergunta de produto nova — os achados acima são bugs técnicos, não decisões
de negócio; ver mensagem de fechamento para as perguntas de agrupamento de issues.
