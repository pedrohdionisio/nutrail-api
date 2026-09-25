# Nutrail API

A fonte de verdade da arquitetura é [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Em caso de conflito com o foodiary ou com qualquer outra referência, o documento vence.

## Ferramentas

- Gerenciador de pacotes: **pnpm**. Nunca usar npm ou yarn.
- Lint e formatação: **Biome** (`pnpm lint`, `pnpm lint:fix`). Não adicionar ESLint nem Prettier.
- Tipos: `pnpm typecheck`. Rodar `pnpm lint` e `pnpm typecheck` antes de considerar uma tarefa concluída.
- Deploy: Serverless Framework v4, região `us-east-1`, runtime `nodejs24.x`.
- Novas funções ficam em `sls/functions/*.yml` e novos recursos em `sls/resources/*.yml`, ambos referenciados no `serverless.yml`.

## Código

- **Sem comentários de código.** Explicações vão na conversa, não no arquivo. Só são permitidos comentários funcionais (`biome-ignore`, `@type` em JS e similares).
- **Sem testes** até serem pedidos explicitamente.
- Imports internos usam o alias `@/` (ex.: `@/application/ports/UserIdResolver`). Imports relativos só dentro da mesma pasta ou para a pasta vizinha imediata.
- Aspas simples, indentação de 2 espaços, LF. O Biome e o `.editorconfig` já garantem isso.
- Uma linha em branco entre contextos: entre `if`s consecutivos, entre um bloco de `const`s relacionados e o próximo, entre um `const` e o `if` que o testa, e antes de todo `return` ou `throw` que não seja a primeira linha do bloco.
- Um use case, controller, port ou implementação por arquivo. O nome do arquivo é igual ao nome da classe (`CreateMealUseCase.ts`).
- Não criar abstrações, configurações ou pontos de extensão especulativos. Implementar só o que a tarefa pede.

## Camadas e dependências

- As dependências apontam para dentro: `main → presentation → application → domain`, e `infra → application/domain`.
- `domain` não importa nenhuma lib externa.
- `application` não importa nada de `infra`, nem SDKs da AWS ou da OpenAI.
- `main/container` é o único lugar que liga ports a implementações.
- Clients da AWS e da OpenAI são injetados via `bindFactory`, nunca exportados como singleton de módulo.
- Ids vêm do port `IdGenerator` e "agora" vem do port `Clock`. Nunca chamar `ulid()` ou `new Date()` direto em domain ou application.

## Injeção de dependência

- Ports são `abstract class` com apenas métodos abstratos. Nunca usar `interface` como dependência injetada: ela vira `Object` na metadata e o container rejeita.
- Implementações levam o prefixo da tecnologia: `MealRepository` → `DynamoMealRepository`.
- Toda classe com dependências no construtor recebe `@Injectable()`.
- **Nunca usar `import type` para classes recebidas no construtor.** Isso apaga a metadata e quebra o auto-wiring. Por isso a regra `useImportType` do Biome fica desligada; não religar.
- A chave do container é sempre o construtor. Nunca usar `class.name` como chave.
- Todo binding novo vai em `main/container/index.ts`, com escopo explícito. Use cases que dependem de `Saga` são `transient`, e quem depende deles também.

## Apresentação

- Controllers estendem `Controller<'public' | 'private'>` e declaram o body com `@Schema(zodSchema)`.
- Schemas Zod ficam em `controllers/<módulo>/schemas/<nome>Schema.ts`, exportando o schema (`signUpSchema`) e o tipo inferido (`SignUpBody`). Nunca declarar o schema dentro do controller.
- Handlers das Lambdas têm uma linha: `export const handler = lambdaHttpAdapter(XController);`
- Erros de negócio estendem `DomainError` (domain) ou `ApplicationError` (application), com `code` e `statusCode`. `HttpError` é só para a camada de apresentação e os adapters.
- Toda rota privada precisa de authorizer no `serverless.yml`. É ele que faz o adapter resolver o `userId`.

## Dados

- DynamoDB single-table, seguindo as chaves e os access patterns da seção 3 do documento de arquitetura.
- `createdAt` em ISO 8601 UTC. `date` e `birthDate` em `YYYY-MM-DD`. A `date` da refeição vem do app e nunca é derivada do UTC.
- No S3, guardar sempre a chave, nunca a URL.
