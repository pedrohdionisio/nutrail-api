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
  da variável. Variável nova entra no `provider.environment` do `serverless.yml`; se for segredo,
  vem de `${env:NOME}` e entra no `.env.example`.

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
- Monitoramento cabe no free tier do CloudWatch: 5 alarmes por stage (5xx do HTTP API, erros de
  `mealUploaded`, `processMeal` e `customMessage`, mensagem na DLQ), todos notificando o SNS
  `alerts`. Função assíncrona nova ganha alarme de erro; rota HTTP já é coberta pelo 5xx.
- Deploy só com pedido explícito: `pnpm run deploy` (ou `pnpm run deploy --stage prod`), com
  `OPENAI_API_KEY` e `ALERT_EMAIL` no ambiente. Sem o `run`, `pnpm deploy` é outro comando do pnpm.
