---
paths:
  - "src/infra/**"
---

# Infra: DynamoDB, S3, SQS, Cognito, SES e OpenAI

Cada implementação leva o prefixo da tecnologia (`MealRepository` → `DynamoMealRepository`), recebe
`@Injectable()` e declara `implements <Port>`. O port pode vir por `import type`, porque só aparece
no `implements`; o client e o `AppConfig` do construtor **nunca**.

Os clients (`DynamoDBDocumentClient`, `S3Client`, `SQSClient`, `CognitoIdentityProviderClient`,
`SESv2Client`, `OpenAI`) chegam pelo construtor, registrados por `bindFactory` no container. Nunca
instanciar client nem exportar singleton de módulo aqui. Nomes de tabela, bucket e fila vêm do
`AppConfig`.

## DynamoDB (`infra/database/dynamo/`)

- Single-table. Chaves e access patterns são os da seção 3 de `docs/ARCHITECTURE.md`; entidade ou
  leitura nova entra primeiro lá. GSI2 e GSI3 estão livres.
- Toda chave começa pelo usuário: `PK = USER#{userId}`. Nunca `Scan`.
- `create` grava com `attribute_not_exists(PK)` e `update` com `attribute_exists(PK)`: um update
  não recria o item que outra requisição excluiu.
- A meal é regravada inteira (`PutCommand`) com o `GSI1PK` da `date` atual: trocar a data move a
  meal de dia. `GSI1SK` é `MEAL#{createdAt}`.
- `delete` que precisa responder 404 usa `ReturnValues: 'ALL_OLD'` e devolve se havia item, em vez de
  ler antes.
- Query pagina até o fim com `LastEvaluatedKey` e projeta só os atributos que o port devolve. Lista
  por ULID sai da mais nova para a mais antiga com `ScanIndexForward: false`.
- Exclusão em massa: `BatchWriteItem` de 25, repetindo os `UnprocessedItems`.
- O repositório monta a entidade a partir do item e devolve `null` quando não acha. Item do
  DynamoDB nunca atravessa o port.
- `DynamoUserIdResolver` é singleton com cache em memória (`sub → userId` nunca muda) e repete a
  consulta ao GSI1 duas vezes (100 e 200 ms) antes de desistir, porque o GSI é eventualmente
  consistente logo após o sign-up.

## S3 (`infra/storage/`)

- Upload por presigned POST com a chave exata, `Content-Type`, `content-length-range` e os metadados
  `x-amz-meta-userid` e `x-amz-meta-mealid` fixados como condição. Vale 10 minutos.
- Leitura por URL assinada de 1 hora. Grava-se a chave; a URL é gerada na leitura.
- Prefixos: `pictures/{userId}/` (fica) e `inputs/{userId}/` (expira em 7 dias pelo lifecycle).

## SQS (`infra/queue/`)

- A mensagem é `{ userId, mealId }` e mais nada: o consumer relê a meal. O formato está em
  `presentation/queue-consumers/schemas/`.

## Cognito (`infra/auth/`)

- O `CognitoAuthProvider` traduz a exceção do SDK para o erro da aplicação
  (`InvalidCredentialsError`, `EmailAlreadyInUseError`, `InvalidCodeError`, `TooManyAttemptsError`...).
  Nenhuma exceção do SDK atravessa o port.
- Auth não revela se a conta existe: o app client tem `PreventUserExistenceErrors: ENABLED`, e
  sign-in com usuário inexistente ou senha errada dá o mesmo `InvalidCredentialsError`. `deleteUser`
  ignora usuário inexistente, para a exclusão da conta poder ser repetida.
- A API usa só o **access token**.

## E-mail (`infra/email/`)

- `SesEmailSender` renderiza os templates de `templates/` (React Email) em HTML e texto. Template
  novo entra no tipo `EmailTemplates` do port e no mapa de templates. Preview com `pnpm dev:email`.
- O e-mail de recuperação de senha sai pelo Cognito, com o conteúdo do trigger `customMessage`
  renderizando `ForgotPassword`.
- Todo template existe nos dois idiomas: um objeto `COPY` por `Language` no próprio arquivo, com o
  assunto exportado (`welcomeSubject`). O idioma chega na mensagem do port; no trigger do Cognito,
  pelo `clientMetadata.language`.

## OpenAI (`infra/ai/`)

- Um adapter por port: `OpenAIMealAnalyzer`, `OpenAITranscriber`, `OpenAIRecipeGenerator`. O modelo é
  uma constante `MODEL` no adapter.
- Análise e receita usam a Responses API com Structured Outputs (`zodTextFormat`) e
  `reasoning: { effort: 'low' }`. Sem `output_parsed`, logue o `response.id` e lance o erro 502 do
  caso (`MealAnalysisFailedError`, `RecipeGenerationFailedError`).
- O adapter normaliza a saída antes de devolver: calorias inteiras, macros com uma casa decimal.
- Prompts ficam em `prompts/`, um por arquivo, com as regras compartilhadas em `mealAnalysisRules.ts`.
  O prompt decide formato; o schema Zod da resposta decide a forma.
- O idioma da saída vem do port (`language`) e entra na mensagem do usuário como
  `outputLanguage(language)`. O prompt manda escrever nesse idioma mesmo quando a entrada está em
  outro; nunca "no idioma do texto".
- Foto vai para o modelo por URL assinada, nunca por base64. O áudio é baixado da URL assinada e
  enviado como arquivo para a transcrição.
