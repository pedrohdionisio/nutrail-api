# Nutrail API

Backend do Nutrail, um diário alimentar com IA: o usuário registra a refeição por foto, áudio ou
texto e recebe os itens com calorias e macros; também pede receitas com o que tem em casa. Projeto
de portfólio, feito com padrão de produção.

O Nutrail são três repositórios lado a lado:

- `nutrail-api` (este): API 100% serverless na AWS
- `../nutrail-app`: app React Native (Expo), o único cliente da API
- `../nutrail`: README do produto

A fonte de verdade da arquitetura é [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): modelagem do
DynamoDB, fluxos, endpoints e o motivo de cada decisão. Em caso de conflito com o foodiary ou com
qualquer outra referência, o documento vence.

## Como trabalhar aqui

- **Faça só o que foi pedido.** Sem passos, refatorações ou arquivos que o pedido não chamou.
  Achou um problema em outro lugar, relate em vez de corrigir no caminho.
- **Converse em português.** Código, identificadores, mensagens de erro da API, títulos de teste,
  commits e o README ficam em inglês.
- **Commit só quando pedido**, na branch atual. Nunca criar branch, dar push ou amend sem pedido.
- **Verificação depois de toda mudança: `pnpm lint && pnpm typecheck && pnpm test`**, relatada com
  o resultado. Os testes não dependem de AWS nem de Docker.
- **Nunca rode `pnpm run deploy`, `serverless deploy` ou `pnpm upload:meal` sem pedido explícito.** Os
  três falam com a AWS e a OpenAI de verdade.
- **Sem comentários de código.** Explicações vão na conversa, não no arquivo. Só são permitidos
  comentários funcionais (`biome-ignore`, `@type` em JS e similares).

## Onde ficam as regras

As regras de cada camada ficam em `.claude/rules/` e carregam quando um arquivo do caminho é lido:

| Regra | Cobre |
|---|---|
| `application.md` | entidades, value objects, erros, ports, queries, use cases, Saga |
| `presentation.md` | controllers, schemas Zod, adapters, handlers, o contrato com o app |
| `infra.md` | DynamoDB, S3, SQS, Cognito, SES, OpenAI e prompts |
| `composition.md` | container de DI, `AppConfig`, `serverless.yml` e `sls/` |
| `testing.md` | Vitest, fakes, fixtures, testes de use case, feature e infra |

Os fluxos de trabalho são skills que orquestram subagents especialistas:

- `/feature-builder` — uma feature de ponta a ponta: spec → `api-builder` → `test-writer` →
  verificação → `code-reviewer` → docs.
- `/bug-fixer` — reproduz com um teste que falha, corrige, verifica e revisa.

## Stack

- Node.js 24 + TypeScript (strict, decorators legados) · Zod 4 · ULID
- Container de DI próprio (`kernel/di`), com auto-wiring por `design:paramtypes`
- AWS via Serverless Framework v4 (`us-east-1`, `nodejs24.x`, arm64): Lambda, API Gateway HTTP API,
  DynamoDB single-table, S3, EventBridge, SQS + DLQ, Cognito, SES, CloudWatch e SNS
- OpenAI (Responses API com Structured Outputs e transcrição) · React Email
- Vitest + `aws-sdk-client-mock` · Biome · pnpm

## Arquitetura

Clean architecture com inversão de dependência. As dependências apontam para dentro:
`main → presentation → application → domain`, e `infra → application/domain`. `main/container` é o
único lugar que liga cada port à sua implementação.

```
src/
  domain/         entidades ricas, value objects, GoalCalculator e erros de domínio; nenhuma lib
  application/    ports (abstract classes), use cases por módulo, Saga, mealFiles e erros
  infra/          Dynamo*, S3, SQS, Cognito, SES + templates, OpenAI + prompts, Ulid e SystemClock
  presentation/   controllers + schemas Zod, handler de evento do S3, consumer do SQS
  main/           container (composition root), adapters das Lambdas e functions (uma linha)
  kernel/         Container, @Injectable e @Schema
  shared/config/  AppConfig
sls/
  functions/      uma função por arquivo
  resources/      DynamoDB, S3, SQS, Cognito e monitoramento
```

## Convenções

- Imports internos usam o alias `@/`. Imports relativos só dentro da mesma pasta ou para a pasta
  vizinha imediata.
- Aspas simples, indentação de 2 espaços, LF. O Biome e o `.editorconfig` garantem isso.
- Uma linha em branco entre contextos: entre `if`s consecutivos, entre um bloco de `const`s
  relacionados e o próximo, entre um `const` e o `if` que o testa, e antes de todo `return` ou
  `throw` que não seja a primeira linha do bloco.
- Um use case, controller, port ou implementação por arquivo. O nome do arquivo é o nome da classe
  (`CreateMealUseCase.ts`).
- Não criar abstrações, configurações ou pontos de extensão especulativos.

## Regras inegociáveis

1. **Todo dado pertence ao usuário da sessão.** O `userId` vem do `lambdaHttpAdapter`, resolvido
   pelo `UserIdResolver` a partir do `sub` do access token, e nunca de body, params ou query. Toda
   chave do DynamoDB e todo prefixo do S3 começam pelo `userId` (`USER#{userId}`,
   `pictures/{userId}/`). Toda rota privada tem o authorizer `cognito` no `sls/functions`.
2. **`domain` e `application` não conhecem a infra.** `domain` não importa lib nenhuma;
   `application` não importa `infra`, SDK da AWS nem da OpenAI.
3. **A DI depende da metadata dos construtores.** Ports são `abstract class`, nunca `interface`;
   classes recebidas no construtor nunca vêm por `import type`; a chave do container é o construtor,
   nunca `class.name`. A regra `useImportType` do Biome fica desligada; não religar.
4. **O status da `Meal` só muda pelos métodos da entidade** (`markAsQueued()`, `complete()`,
   `fail()`, `retry()`...), e os totais de calorias e macros são sempre derivados dos `items`.
   Nenhum use case seta `status` nem totais.
5. **`date` e `time` da refeição são locais e vêm do app.** Nunca derivar de UTC. Ids vêm do port
   `IdGenerator` e "agora" do port `Clock`; nunca `ulid()` ou `new Date()` em domain ou application.
6. **No S3 guarda-se a chave, nunca a URL.** As leituras devolvem URL assinada (`pictureUrl`).
7. **O pipeline assíncrono tolera repetição.** O consumer só processa meal em `QUEUED`, as gravações
   do processamento exigem que o item exista (`attribute_exists`), o SQS usa partial batch
   response e as 3 tentativas acompanham o `maxReceiveCount: 3`.
8. **Rota síncrona com IA cabe nos 30 s do HTTP API**: Lambda com `timeout: 29` e client da OpenAI
   com 25 s e 1 retry.
9. **Exclusão apaga os arquivos antes do item** (meal e conta), para que uma falha no meio possa ser
   repetida pelo próprio usuário e nunca deixe arquivo órfão.
10. **O `code` do erro e os campos de resposta são contrato.** O app traduz cada `code` para
    português e inglês e lê os campos pelo nome. Renomear ou remover exige conferir o `../nutrail-app`.

11. **Texto gerado para o usuário segue o idioma da requisição** (`request.language`, do
    `Accept-Language`): IA, e-mails e unidades. A meal guarda o `language` para a análise
    assíncrona, e nada é traduzido depois de gravado.

## Fora de escopo por enquanto

- Histórico de peso e resumo por período: são as próximas features, desenhadas na seção 9 do
  documento de arquitetura.
- CloudFront na frente do S3, e refeição manual e sugestão de receita pela fila: só se custo ou
  latência pedirem.
- Chat com coach de IA, gamificação, recursos sociais e micronutrientes.
