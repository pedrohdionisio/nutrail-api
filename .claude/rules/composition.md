---
paths:
  - "src/main/container/**"
  - "src/kernel/**"
  - "src/shared/**"
  - "serverless.yml"
  - "sls/**"
  - "esbuild.config.js"
---

# Composição: container de DI, configuração e Serverless

## Container (`src/main/container/index.ts`)

- É o único lugar que liga port a implementação e o único que conhece os SDKs para instanciá-los.
- Todo binding tem escopo explícito:
  - `bindFactory` para os clients da AWS e da OpenAI, `singleton`;
  - `bind(Port, Impl, { scope: 'singleton' })` para as implementações de infra;
  - use case `singleton`, exceto o que depende de `Saga` (e quem depende dele), que é `transient`;
  - controllers, handlers de evento e consumers `transient`.
- Singleton não depende de transient: o container lança erro (captive dependency).
- A chave é sempre o construtor. Nunca `class.name`: o esbuild minifica e renomeia as classes.
- `container.validate()` no fim do arquivo resolve o grafo no cold start. Um binding faltando
  quebra ali, e `tests/main/container/index.test.ts` pega isso antes do deploy.

## Kernel (`src/kernel/`)

- O auto-wiring lê `design:paramtypes`, emitido pelo SWC (`esbuild.config.js` no deploy,
  `unplugin-swc` no Vitest). Por isso:
  - toda classe com dependência no construtor recebe `@Injectable()`;
  - **nunca `import type`** para classe recebida no construtor, porque apaga a metadata;
  - parâmetro de construtor é sempre uma classe (port abstrato, implementação ou client), nunca
    `interface`, tipo primitivo ou union.
- `@Injectable()` não registra nada; o registro é explícito no container.

## Configuração (`src/shared/config/AppConfig.ts`)

- Variável de ambiente só é lida aqui, por `required(name)`, que falha no carregamento com o nome
  da variável. Variável nova entra no `provider.environment` do `serverless.yml`.
- Segredo nunca vai para `provider.environment` nem para `${env:}` ou `${ssm:}` resolvidos no
  deploy, que gravam o valor em texto puro na configuração da função. Ele fica no SSM Parameter
  Store como `SecureString` em `/${service}/${stage}/<nome>`, a Lambda recebe só o nome do parâmetro
  e lê o valor em runtime, com cache (`SsmOpenAIApiKey`).

## Serverless (`serverless.yml`, `sls/`)

- Função nova é um arquivo `sls/functions/<nome>.yml` com o mesmo nome do handler
  (`src/main/functions/<nome>.ts`), referenciado na lista `functions` do `serverless.yml`. Recurso
  novo vai em `sls/resources/*.yml`, na lista `resources`.
- Rota privada declara `authorizer: { name: cognito }`. Sem ele o evento não traz o `sub`, e o controller
  privado roda sem `userId`.
- Timeouts: padrão de 10 s; rota síncrona com IA `timeout: 29` (o HTTP API corta em 30 s);
  `processMeal` 150 s, abaixo do `VisibilityTimeout` de 180 s, com `batchSize: 1` e
  `functionResponseType: ReportBatchItemFailures`.
- `package.individually: true` fica ligado: cada bundle carrega o container inteiro, e um zip único
  estoura o limite de 250 MB da Lambda.
- Permissão nova vai em `provider.iam.role.statements`, com a ação mínima e o recurso específico.
- Só recursos pay-per-use, com nome carregando `${sls:stage}` quando nomeados. Nada sempre ligado.
- O projeto sobe em qualquer conta AWS: nada pode depender da conta do autor. O que é dele entra por
  variável opcional do `.env` (`DOMAIN`, `EMAIL_FROM`, `DEPLOYMENT_ROLE_ARN`), com fallback que
  funciona sem ela (`${env:DOMAIN, ''}`, `${env:DEPLOYMENT_ROLE_ARN, null}`). Variável vazia não é
  ausente: no `.env.example` as opcionais ficam comentadas.
- Recurso único por conta só existe na stack `prod`, pelas condições de
  `sls/resources/conditions.yml`: identity do SES e domínio da API com `UsesDomain` (`prod` com `DOMAIN`), orçamento com `IsProd`.
  Com domínio, o `prod` só responde nele (`DisableExecuteApiEndpoint` no `httpApi.yml`).
- O stage do HTTP API (`HttpApiStage`, gerado pelo Serverless) é ajustado em
  `sls/resources/httpApi.yml` por `extensions`: throttling de 10 rps com burst de 20 para todas as
  rotas. Cada chave das `Properties` da extensão substitui a gerada inteira, então
  `DefaultRouteSettings` vai completo.
- Monitoramento cabe no free tier do CloudWatch: 5 alarmes por stage (5xx do HTTP API, erros de
  `mealUploaded`, `processMeal` e `customMessage`, mensagem na DLQ), todos notificando o SNS
  `alerts`. Função assíncrona nova ganha alarme de erro; rota HTTP já é coberta pelo 5xx.
- Com `DEPLOYMENT_ROLE_ARN`, o deploy passa pela role `nutrail-api-cloudformation`
  (`provider.iam.deploymentRole`), criada por `infra/github-deploy.yml`. Recurso de um serviço novo fora do `PowerUserAccess` (IAM que não
  seja role `nutrail-api-*`) exige mudar esse template antes. O CI (`.github/workflows/ci.yml`)
  faz o deploy do `dev` na `main` e do `prod` em tag `v*`.
- Deploy só com pedido explícito: `pnpm run deploy` (ou `pnpm run deploy --stage prod`), com
  o `.env` preenchido e o parâmetro `/nutrail-api/<stage>/openai-api-key` já criado. Sem o
  `run`, `pnpm deploy` é outro comando do pnpm.
