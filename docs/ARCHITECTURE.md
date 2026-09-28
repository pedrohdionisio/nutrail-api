# Nutrail — Arquitetura da API

Documento de referência com as decisões tomadas para a API do Nutrail. Sempre que houver dúvida entre "o que o foodiary faz" e "o que está aqui", **este documento vence**: o foodiary é apenas inspiração.

---

## 1. Produto

App de controle de calorias e macros (calorias, proteínas, carboidratos e gorduras) com IA no centro da experiência. Bilíngue (pt-BR e en).

**Fluxos principais**

1. **Onboarding:** objetivo (perder, manter ou ganhar peso), gênero, data de nascimento, altura, peso, nível de atividade e criação de conta. Ao final, a API calcula as metas diárias de calorias e macros. O usuário pode editar as metas depois.
2. **Cadastro de refeição**, com três entradas que convergem para o mesmo resultado (itens + macros):
   - **Foto:** a IA identifica os alimentos e estima as porções. Assíncrono.
   - **Áudio:** transcrição para texto e, em seguida, análise do texto. Assíncrono.
   - **Manual:** o usuário descreve os itens e a IA gera os macros. Síncrono por enquanto.
   - Qualquer refeição pode ter uma **foto de registro** opcional, independente do tipo de entrada.
3. **Sugestão de receita:** o usuário informa os ingredientes que tem em casa, e a IA sugere uma receita considerando o objetivo e quanto ainda falta de calorias e macros no dia. A receita só é salva se o usuário aceitar.

---

## 2. Stack

**API**
- Node.js + TypeScript
- AWS 100% serverless com Serverless Framework
- Lambda, API Gateway (HTTP API), DynamoDB (single-table), S3, SQS (+ DLQ), Cognito, SES
- OpenAI para análise de refeições, transcrição de áudio e geração de receitas
- Zod para validação
- ULID para ids

**App** (fora do escopo deste documento): Expo, React Native, TypeScript, React Query, Axios, React Hook Form.

---

## 3. Modelagem (DynamoDB single-table)

### 3.1 Chaves

| Entidade | PK | SK | GSI1PK | GSI1SK |
|---|---|---|---|---|
| User (perfil + metas) | `USER#{id}` | `PROFILE` | `COGNITO#{sub}` | `PROFILE` |
| Meal | `USER#{id}` | `MEAL#{id}` | `MEAL#{userId}#{date}` | `MEAL#{createdAt}` |
| Recipe | `USER#{id}` | `RECIPE#{id}` | – | – |
| SavedMeal | `USER#{id}` | `SAVED_MEAL#{id}` | – | – |

GSI2 e GSI3 estão livres para necessidades futuras.

### 3.2 Access patterns

| Access pattern | Índice | Operação |
|---|---|---|
| Buscar perfil e metas do usuário | Main table | `GetItem` PK=`USER#{id}`, SK=`PROFILE` |
| Resolver `userId` a partir do `sub` do Cognito | GSI1 | `Query` GSI1PK=`COGNITO#{sub}` |
| Buscar refeição por id | Main table | `GetItem` PK=`USER#{id}`, SK=`MEAL#{mealId}` |
| Listar refeições do usuário num dia | GSI1 | `Query` GSI1PK=`MEAL#{userId}#{date}` |
| Listar receitas do usuário | Main table | `Query` PK=`USER#{id}`, `begins_with(SK, 'RECIPE#')` |
| Buscar refeição salva por id | Main table | `GetItem` PK=`USER#{id}`, SK=`SAVED_MEAL#{savedMealId}` |
| Listar refeições salvas do usuário | Main table | `Query` PK=`USER#{id}`, `begins_with(SK, 'SAVED_MEAL#')` |

### 3.3 Atributos

**User**

| Atributo | Tipo | Observação |
|---|---|---|
| `id` | string | ULID (id interno) |
| `externalId` | string | `sub` do Cognito |
| `name` | string | |
| `email` | string | Apenas exibição; unicidade garantida pelo Cognito |
| `gender` | enum | |
| `height` | number | cm |
| `weight` | number | kg |
| `goal` | enum | `LOSE` \| `MAINTAIN` \| `GAIN` |
| `birthDate` | string | `YYYY-MM-DD` |
| `activityLevel` | enum | `SEDENTARY` \| `LIGHT` \| `MODERATE` \| `HEAVY` \| `ATHLETE` |
| `calories` | number | Meta diária |
| `protein` | number | Meta diária (g) |
| `carbohydrate` | number | Meta diária (g) |
| `fat` | number | Meta diária (g) |
| `createdAt` | string | ISO 8601 |

As metas ficam embutidas no item do usuário porque a home sempre precisa das duas coisas juntas (um único `GetItem`).

**Meal**

| Atributo | Tipo | Observação |
|---|---|---|
| `id` | string | ULID |
| `name` | string | Tipo da refeição, gerado pela IA (ex.: "Almoço") |
| `items` | `Item[]` | |
| `calories`, `protein`, `carbohydrate`, `fat` | number | Totais, **sempre derivados dos itens** |
| `status` | enum | `UPLOADING` \| `QUEUED` \| `PROCESSING` \| `SUCCESS` \| `FAILED` |
| `inputType` | enum | `PICTURE` \| `AUDIO` \| `MANUAL` (refeições cadastradas de uma refeição salva ou de uma receita também são `MANUAL`) |
| `inputFileKey` | string \| null | Chave S3 do arquivo que a IA processa |
| `inputText` | string \| null | Texto manual ou transcrição do áudio |
| `pictureKey` | string \| null | Chave S3 da foto de registro (opcional) |
| `attempts` | number | Tentativas de processamento |
| `date` | string | `YYYY-MM-DD` na data **local** do usuário |
| `time` | string | `HH:mm` no horário **local** do usuário; usado pela IA para nomear a refeição |
| `createdAt` | string | ISO 8601 |

**Recipe**

| Atributo | Tipo | Observação |
|---|---|---|
| `id` | string | ULID |
| `name` | string | |
| `ingredients` | `Ingredient[]` | |
| `instructions` | string | |
| `calories`, `protein`, `carbohydrate`, `fat` | number | |
| `createdAt` | string | ISO 8601 |

**SavedMeal**

| Atributo | Tipo | Observação |
|---|---|---|
| `id` | string | ULID |
| `name` | string | Dado pelo usuário ao salvar (ex.: "Café de sempre") |
| `items` | `Item[]` | Copiados da refeição de origem |
| `calories`, `protein`, `carbohydrate`, `fat` | number | Totais, derivados dos itens |
| `createdAt` | string | ISO 8601 |

**Tipos auxiliares**

```ts
type Item = {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbohydrate: number;
  fat: number;
};

type Ingredient = {
  name: string;
  quantity: number;
  unit: string;
};
```

### 3.4 Convenções

- **Ids:** ULID, gerado via port `IdGenerator` (nunca direto na entidade).
- **Datas:** o DynamoDB não tem tipo Date. `createdAt` em ISO 8601 (UTC). `date` e `birthDate` em `YYYY-MM-DD`.
- **Data local:** o app envia a data local (`YYYY-MM-DD`) na criação da refeição. Nunca derivar `date` a partir do UTC, senão uma janta às 22h em UTC-3 cai no dia seguinte.
- **Arquivos:** guardar sempre a **chave** do S3, nunca a URL. URLs são geradas na leitura.
- **Refeições do dia:** o `GET /meals?date=` devolve a lista e os totais juntos. A lista traz as refeições em `QUEUED`, `PROCESSING`, `SUCCESS` e `FAILED`, com `status` e `time`, ordenadas pelo `time` (e pelo `createdAt` no empate); só ficam de fora as meals em `UPLOADING`, cujo upload nunca terminou. Assim o app mostra a análise em andamento e a falha, que o usuário pode reprocessar ou excluir. A ordenação é feita em memória, porque a query já lê o dia inteiro e o GSI1SK (`MEAL#{createdAt}`) não acompanha o horário editado.
- **Totais do dia:** calculados somando só as refeições em `SUCCESS`. Não existe item agregado. O `GET /meals/{mealId}` devolve a refeição em qualquer status (é o endpoint de polling).

---

## 4. Autenticação

- **Cognito** com fluxo padrão. A API usa **apenas o access token**.
- O app **sempre passa pela API** para sign-up, sign-in, refresh e forgot password.
- O `id` do usuário é um ULID próprio. O `sub` do Cognito fica salvo como `externalId`.
- O e-mail com o código de recuperação de senha continua sendo enviado pelo Cognito, mas o conteúdo vem do trigger `CustomMessage`, que renderiza o template `ForgotPassword` de `infra/email/templates`.

### 4.1 Resolução do usuário (`sub` → `userId`)

O access token traz só o `sub`. A conversão para o `userId` interno acontece **no adapter HTTP**, antes do controller:

1. O adapter lê o `sub` dos claims do JWT.
2. Chama o port `UserIdResolver`.
3. O `DynamoUserIdResolver` consulta o GSI1 (`COGNITO#{sub}`).
4. Entrega o controller já com `userId`. Nenhum controller ou use case conhece o Cognito.

Regras do resolver:
- **Singleton com cache em memória** (`Map<sub, userId>`). O mapeamento é imutável, então não há invalidação.
- **Retry curto em caso de miss** (1 ou 2 tentativas, ~100–200 ms). GSIs são eventualmente consistentes, e a primeira requisição logo após o sign-up pode não encontrar o item ainda.
- Se continuar sem encontrar: **401**.

### 4.2 Sign-up

O sign-up acontece no fim do onboarding e recebe dados da conta e do perfil juntos.

1. Calcula as metas com o `GoalCalculator` (domínio).
2. Gera o ULID do usuário.
3. `SignUp` no Cognito → retorna o `sub`.
4. Registra a compensação na Saga: `AuthProvider.deleteUser(sub)`.
5. `PutItem` do PROFILE, com `externalId = sub` e `GSI1PK = COGNITO#{sub}`.
6. Envio do e-mail de boas-vindas pelo `EmailSender`, fora da Saga. Uma falha no envio é logada e não desfaz o cadastro.
7. Sign-in e retorno dos tokens.

Se o passo 5 falhar, a Saga remove o usuário do Cognito, evitando um usuário sem perfil. Como as metas estão embutidas no PROFILE, é uma gravação só e não precisa de UnitOfWork.

### 4.3 Troca de senha

`PUT /me/password` → `ChangePasswordUseCase` recebe `{ currentPassword, newPassword }` (nova senha com pelo menos 8 caracteres, a política do pool). O `AuthProvider.changePassword` confere a senha atual com um `InitiateAuth` (`USER_PASSWORD_AUTH`, os tokens gerados são descartados) e grava a nova com `AdminSetUserPassword`, o mesmo comando do sign-up. Assim o controller não precisa do access token bruto, que o `ChangePassword` do Cognito exigiria. Senha atual errada → 400 `INVALID_CURRENT_PASSWORD`, nunca 401, para o app não confundir com sessão expirada. As sessões abertas continuam válidas.

### 4.4 Exclusão da conta

`DELETE /me` → `DeleteAccountUseCase` apaga tudo do usuário, nesta ordem:

1. Arquivos no S3 por prefixo (`pictures/{userId}/` e `inputs/{userId}/`), o que pega também arquivos não referenciados por nenhuma meal.
2. Usuário no Cognito (`AuthProvider.deleteUser`, que ignora usuário inexistente).
3. Toda a partição `USER#{id}` no DynamoDB (perfil, meals e receitas), em `BatchWriteItem` de 25, com retry dos itens não processados.

A ordem garante que uma falha possa ser repetida pelo próprio usuário: enquanto o perfil existir, o `UserIdResolver` resolve e o `DELETE /me` pode ser chamado de novo. O único estado sem retomada pela API é uma falha no passo 3 depois do passo 2; ela fica logada para limpeza manual. O access token continua válido até expirar (o authorizer só confere a assinatura). Instâncias de Lambda sem o `sub` no cache do resolver respondem 401, porque o perfil não existe mais; uma instância que já tinha o `sub` em cache ainda resolveria o `userId` até o token expirar, e uma gravação nesse intervalo criaria dados órfãos. O risco foi aceito por ser estreito (o mesmo usuário agindo logo após excluir a conta).

---

## 5. Arquitetura

### 5.1 Princípios

- **Dependency Inversion + Dependency Injection juntos.** A regra de negócio depende de abstrações (ports) definidas por ela mesma. A infra implementa essas abstrações. O container injeta as implementações.
- **As dependências apontam para dentro:** `main → presentation → application → domain`, e `infra → application/domain`.
- **O domínio não importa nenhuma lib externa.**
- **A application não importa nada de `infra`**, nem SDKs da AWS ou da OpenAI.
- **O `main` é o único lugar que sabe qual implementação atende cada port** (composition root).

### 5.2 Estrutura de pastas

```
src/
├── domain/
│   ├── entities/          # User, Meal, Recipe (entidades ricas, com regras)
│   ├── value-objects/     # Macros, etc.
│   ├── services/          # GoalCalculator (puro)
│   └── errors/            # erros de domínio
├── application/
│   ├── ports/             # abstract classes: repositórios, queries, gateways
│   ├── usecases/          # um use case por arquivo, agrupados por módulo
│   ├── services/          # Saga
│   └── errors/            # erros de aplicação (ResourceNotFound, EmailAlreadyInUse...)
├── infra/
│   ├── database/dynamo/   # Dynamo*Repository, Dynamo*Query, mappers de item
│   ├── storage/           # S3FileStorage
│   ├── queue/             # SqsMealProcessingQueue
│   ├── ai/                # OpenAI*, prompts, schemas de resposta
│   ├── auth/              # CognitoAuthProvider, DynamoUserIdResolver
│   ├── email/             # SesEmailSender, templates/ em React Email (pnpm dev:email para preview)
│   └── shared/            # UlidIdGenerator, SystemClock
├── presentation/
│   ├── controllers/       # controllers + schemas zod
│   ├── file-events/       # handlers de eventos do S3
│   └── queue-consumers/   # consumers do SQS
├── main/
│   ├── container/         # bindings (composition root)
│   ├── adapters/          # lambdaHttpAdapter, lambdaS3Adapter, lambdaSQSAdapter
│   └── functions/         # handlers das Lambdas (uma linha cada)
├── kernel/
│   ├── di/                # Container
│   └── decorators/        # @Injectable, @Schema
└── shared/
    └── config/            # AppConfig, env
```

### 5.3 Ports e implementações

Os ports são **abstract classes** (só com métodos abstratos). Elas funcionam como interfaces (`implements` funciona com elas), mas existem em runtime, o que permite o auto-wiring via `design:paramtypes`.

Convenção de nomes: o port tem o nome "limpo" e a implementação leva o prefixo da tecnologia.

| Port | Implementação | Escopo |
|---|---|---|
| `UserRepository` | `DynamoUserRepository` | singleton |
| `MealRepository` | `DynamoMealRepository` | singleton |
| `RecipeRepository` | `DynamoRecipeRepository` | singleton |
| `ListMealsByDayQuery` | `DynamoListMealsByDayQuery` | singleton |
| `GetMealQuery` | `DynamoGetMealQuery` | singleton |
| `GetProfileQuery` | `DynamoGetProfileQuery` | singleton |
| `UserIdResolver` | `DynamoUserIdResolver` | singleton (cache) |
| `AuthProvider` | `CognitoAuthProvider` | singleton |
| `EmailSender` | `SesEmailSender` | singleton |
| `FileStorage` | `S3FileStorage` | singleton |
| `MealProcessingQueue` | `SqsMealProcessingQueue` | singleton |
| `MealAnalyzer` (`analyzeImage`, `analyzeText`) | `OpenAIMealAnalyzer` | singleton |
| `Transcriber` | `OpenAITranscriber` | singleton |
| `RecipeGenerator` | `OpenAIRecipeGenerator` | singleton |
| `ListRecipesQuery` | `DynamoListRecipesQuery` | singleton |
| `IdGenerator` | `UlidIdGenerator` | singleton |
| `Clock` | `SystemClock` | singleton |
| `Saga` | `Saga` | **transient** |

Os clients da AWS e da OpenAI (`DynamoDBDocumentClient`, `S3Client`, `SQSClient`, `CognitoIdentityProviderClient`, `SESv2Client`, `OpenAI`) também são injetados via container (factory, singleton). Nunca importados como singleton de módulo.

`Clock` existe porque a data local da refeição e o cálculo de idade dependem de "agora". Com ele, os testes controlam o tempo.

### 5.4 Container de DI

Container próprio, em `kernel/di`.

**Regras**
- A chave de registro é o **construtor** (a referência da classe). **Nunca usar `class.name`**: o esbuild minifica e renomeia as classes.
- O binding é **explícito** no composition root (`main/container`). O `@Injectable()` só marca a classe para emitir a metadata dos parâmetros; ele não registra nada sozinho.
- **Escopos:** `singleton` (uma instância por container, reaproveitada entre invocações da mesma instância da Lambda) e `transient` (nova instância a cada resolve).
- **Singletons não podem depender de transients** (captive dependency). O container deve lançar um erro se isso acontecer. Na prática: use cases que usam `Saga` são transient.
- **Fail fast:** uma dependência sem binding estoura erro no cold start, não no meio de uma requisição.
- Suporte a `bind(port, impl, { scope })`, `bindFactory(token, factory, { scope })` e bind de classe concreta nela mesma (use cases, controllers).

**Exemplo**

```ts
// application/ports/MealRepository.ts
export abstract class MealRepository {
  abstract findById(userId: string, mealId: string): Promise<Meal | null>;
  abstract save(meal: Meal): Promise<void>;
}

// infra/database/dynamo/DynamoMealRepository.ts
@Injectable()
export class DynamoMealRepository implements MealRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}
  // ...
}

// application/usecases/meals/CreateMealUseCase.ts — não importa nada de infra
@Injectable()
export class CreateMealUseCase {
  constructor(
    private readonly meals: MealRepository,
    private readonly storage: FileStorage,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}
}

// main/container/index.ts
container.bindFactory(DynamoDBDocumentClient, () => DynamoDBDocumentClient.from(new DynamoDBClient({})), { scope: 'singleton' });
container.bind(MealRepository, DynamoMealRepository, { scope: 'singleton' });
container.bind(Saga, Saga, { scope: 'transient' });
container.bind(CreateMealUseCase, CreateMealUseCase, { scope: 'transient' });
```

### 5.5 Camada de apresentação e adapters

- **Controllers** estendem uma classe base `Controller<'public' | 'private'>` e declaram o schema com `@Schema(zodSchema)`. Rotas privadas recebem `userId` já resolvido.
- **Adapters** (`main/adapters`) traduzem o evento da Lambda para o formato do controller/handler e mapeiam erros:
  - `ZodError` → 400 com a lista de campos
  - Erros HTTP → status do erro
  - Erros de aplicação/domínio → status definido no erro (padrão 400)
  - Qualquer outro erro → 500 (logado)
- `lambdaHttpAdapter` resolve o `userId` via `UserIdResolver` em rotas privadas.
- `lambdaS3Adapter` recebe o evento `Object Created` do S3 via EventBridge (um objeto por evento). `lambdaSQSAdapter` processa os records. No SQS, usar **partial batch response** (`reportBatchItemFailures`) para que uma falha não reprocesse o lote inteiro.
- **Handlers** das Lambdas são uma linha: `export const handler = lambdaHttpAdapter(CreateMealController);`

### 5.6 Regras de domínio

- **Entidades ricas:** as transições de status da `Meal` são métodos da entidade (`markAsQueued()`, `markAsProcessing()`, `complete(result)`, `fail()`), que validam a transição. Os use cases não setam `status` diretamente.
- **Totais derivados:** os macros totais da `Meal` são sempre calculados a partir de `items`. Editar um item recalcula os totais sem chamar a IA.
- **Edição:** `PUT /meals/{mealId}` substitui `name` e `items` (os macros de cada item vêm do app) e, opcionalmente, `date` e `time`, e devolve a meal com os totais recalculados. Só meals em `SUCCESS` podem ser editadas (`edit()`), e sempre com pelo menos um item. Trocar a `date` move a meal de dia: a gravação regrava o item inteiro, com o GSI1PK da nova data.
- **Macros de um item editado:**
  - Mesma unidade, só a quantidade mudou: o **app** recalcula por regra de três sobre os valores do item (`novo = atual × novaQuantidade / quantidadeAtual`), sem chamar a API.
  - Qualquer outra mudança (troca de unidade, alimento novo): o app chama `POST /meals/items/analysis` com `{ text }` (ex.: "2 colheres de sopa de azeite", até 500 caracteres) e recebe `{ items }`, analisados pela IA de forma síncrona (`MealAnalyzer.analyzeItems`, timeout de 29 s). O endpoint não grava nada; o app monta a lista e envia no `PUT`. Sem alimento no texto → 422 `MEAL_WITHOUT_ITEMS`.
- **Exclusão:** `DELETE /meals/{mealId}` apaga primeiro os arquivos no S3 (`inputFileKey` e `pictureKey`) e depois o item, para que uma falha no meio nunca deixe arquivos órfãos sem meal (o usuário pode repetir a exclusão). Uma meal excluída durante o processamento não é recriada: as gravações do processamento exigem que o item exista (`attribute_exists`).
- **`GoalCalculator`:** serviço de domínio puro que calcula calorias e macros a partir do perfil (idade, gênero, peso, altura, nível de atividade, objetivo). Recebe a data atual como parâmetro (vinda do `Clock`).
  - Taxa metabólica basal pela **Mifflin-St Jeor**, a equação mais validada para a população geral entre as que não exigem composição corporal. Idade exata, considerando mês e dia.
  - Gasto total = TMB × fator de atividade (1,2 a 1,9), mais ou menos 500 kcal conforme o objetivo.
  - Proteína de 2 g/kg e gordura de 0,9 g/kg; o carboidrato completa as calorias.
- **Metas e perfil:** `PUT /profile` recalcula as metas e sobrescreve qualquer ajuste manual. `PUT /goals` edita as metas sem mexer no perfil e mantém calorias e macros coerentes (4 kcal/g de proteína e carboidrato, 9 kcal/g de gordura). O body é `{ calories }` ou `{ protein, carbohydrate, fat }`: com calorias, proteína e gordura ficam e o carboidrato completa (erro 422 se não couber); com macros, as calorias são a soma. Devolve `{ goals }`.

### 5.7 Observabilidade

CloudWatch, dentro do free tier (10 alarmes padrão e 5 GB de logs por mês). Cada stage tem 5 alarmes, então `dev` e `prod` juntos cabem no gratuito.

- Os alarmes notificam o tópico SNS `${service}-${stage}-alerts` ao disparar e ao voltar ao normal. O e-mail vem de `ALERT_EMAIL` no deploy, e a inscrição precisa ser confirmada pelo link que a AWS envia.
- **5xx do HTTP API** (3 ou mais em 5 minutos): cobre de uma vez todas as rotas HTTP, incluindo erro não tratado, timeout de Lambda e falha da OpenAI (502). Por isso não existe alarme de erro por função HTTP: o adapter converte exceção em resposta, e a Lambda não registra `Errors`.
- **Erros das Lambdas assíncronas** (1 ou mais em 5 minutos): `mealUploaded` (o arquivo chegou e a meal não entrou na fila), `processMeal` (crash ou timeout; falha de análise vira nova tentativa e DLQ, não erro) e `customMessage` (o e-mail de recuperação de senha não sai).
- **Mensagem na DLQ:** uma meal esgotou as tentativas de processamento.
- Logs das Lambdas com retenção de 30 dias (`provider.logRetentionInDays`).

---

## 6. Armazenamento de arquivos (S3)

### 6.1 Layout do bucket

```
inputs/{userId}/{mealId}.m4a     # áudios que a IA processa
pictures/{userId}/{mealId}.jpg   # fotos de refeição (registro e/ou input de IA)
```

- No fluxo de **foto**, a foto é ao mesmo tempo input da IA e registro: `inputFileKey` e `pictureKey` apontam para **a mesma chave** em `pictures/`. Não duplicar o arquivo.
- No fluxo de **áudio**, `inputFileKey` aponta para `inputs/`, e `pictureKey` é opcional.
- No fluxo **manual**, `inputFileKey` é `null`, e `pictureKey` é opcional.

### 6.2 Upload

- **Presigned POST** com condições: chave exata, `Content-Type` e `content-length-range`.
- Metadata `x-amz-meta-userid` e `x-amz-meta-mealid` no objeto, para o handler do evento identificar a refeição.
- Para leitura (app e OpenAI), gerar URL assinada (1 hora) a partir da chave. As leituras de meal (`GET /meals` e `GET /meals/{mealId}`) devolvem `pictureUrl`, nunca a chave.
- Chaves, tipos (`image/jpeg`, `audio/m4a`) e limite de 10 MB ficam em `application/services/mealFiles.ts`.

### 6.3 Eventos e lifecycle

- O bucket publica os eventos no **EventBridge**, e a regra `MealFileUploadedRule` filtra `Object Created` em **`inputs/` e `pictures/`** e chama a Lambda `mealUploaded`. A notificação nativa do S3 para a Lambda criaria um ciclo no CloudFormation (o bucket apontaria para a função, que já depende do bucket via `BUCKET_NAME`).
- O handler lê os metadados do objeto (`HeadObject`) para achar a meal e confere que a chave é o `inputFileKey` dela.
- O handler só segue para a fila se a meal estiver com `status = UPLOADING` e `inputType` for `PICTURE` ou `AUDIO`. Em qualquer outro caso (ex.: foto de registro de uma meal manual já em `SUCCESS`), o evento é ignorado.
- **Lifecycle:** `inputs/` expira após 7 dias (o áudio não tem uso após a transcrição; a janela cobre a investigação de falhas). `pictures/` é mantido.

---

## 7. Fluxos

### 7.1 Refeição por foto ou áudio (assíncrono)

1. `POST /meals` → `CreateMealUseCase`: cria a meal com `UPLOADING`, a `date` local e as chaves. Retorna o `mealId` e a assinatura do upload.
2. O app faz o upload direto no S3.
3. Evento do S3 → `MealUploadedUseCase`: valida a meal, `markAsQueued()`, publica na `MealProcessingQueue`.
4. SQS → `ProcessMealUseCase`:
   - `markAsProcessing()` e incrementa `attempts`
   - Se for áudio: `Transcriber` → salva o texto em `inputText`
   - `MealAnalyzer.analyzeImage()` ou `analyzeText()` → `complete(result)`
   - Em caso de erro: volta para `QUEUED` enquanto houver tentativas, e depois `FAILED`
5. O app faz polling em `GET /meals/{mealId}` até `SUCCESS` ou `FAILED`.

**Detalhes**
- `POST /meals` recebe `{ date, time, inputType: PICTURE | AUDIO }` e devolve `{ mealId, upload: { url, fields } }`. O presigned POST vale 10 minutos, aceita até 10 MB e fixa `image/jpeg` (foto) ou `audio/m4a` (áudio).
- Máximo de **3 tentativas**, alinhado ao `maxReceiveCount: 3`. Erros de domínio (ex.: nenhum alimento identificado) vão direto para `FAILED`. Na última tentativa a meal vira `FAILED` e a mensagem é confirmada; a DLQ recebe só falhas inesperadas (mensagem malformada, queda da Lambda).
- Se o `publish` falhar depois do `markAsQueued()`, um novo evento do S3 republica (o handler publica enquanto a meal estiver em `QUEUED`). O consumer só processa meals em `QUEUED`, o que descarta duplicatas.
- A transcrição (`gpt-transcribe`) é salva em `inputText` antes da análise; numa nova tentativa, o áudio não é transcrito de novo.
- A foto vai para a OpenAI por URL assinada (10 minutos, `detail: high`). Sem texto para detectar o idioma, os nomes saem em pt-BR.
- **Reprocessamento:** `POST /meals/{mealId}/reprocess` aceita só meals por foto ou áudio em `FAILED` (`retry()`): volta para `QUEUED`, zera `attempts` (as 3 tentativas valem de novo), publica na fila e responde 202. A transcrição já salva em `inputText` é reaproveitada, então funciona mesmo depois que o áudio expirou em `inputs/`.
- Lambda `processMeal` com timeout de 150 s (menor que o `VisibilityTimeout` de 180 s) e `batchSize: 1`.

Fila com **DLQ** e alarme no CloudWatch para mensagens na DLQ.

### 7.2 Refeição manual (síncrono)

1. `POST /meals/manual` → `CreateManualMealUseCase`: salva `inputText`, chama `MealAnalyzer.analyzeText()` na própria requisição, `complete(result)`, salva com `SUCCESS`.
   - A meal nasce em `PROCESSING` em memória e só é gravada uma vez, já em `SUCCESS`. Se a análise falhar (502 `MEAL_ANALYSIS_FAILED`) ou não identificar nenhum alimento (422 `MEAL_WITHOUT_ITEMS`), nada é gravado e o app pode reenviar.
   - O app envia também o horário local (`time`, `HH:mm`), persistido na meal. O nome da meal é o tipo da refeição: o que o usuário disser explicitamente ("almocei...") ou, se ele não disser, o deduzido pelo horário (faixas definidas no prompt).
   - Modelo `gpt-6-luna` com `reasoning.effort: low` e Structured Outputs. O client da OpenAI tem timeout de 25 s e 1 retry, e a Lambda tem timeout de 29 s (o HTTP API corta em 30 s).
2. Se o usuário quiser foto de registro, `POST /meals/{mealId}/picture` devolve um presigned POST para `pictures/{userId}/{mealId}.jpg`. Vale para meals manuais e de áudio já finalizadas (`SUCCESS` ou `FAILED`); meals por foto recusam (409), porque a foto já é o input. O `pictureKey` só é gravado quando o evento do upload chega (`attachPicture()`), para nunca apontar para um arquivo inexistente. Exigir a meal finalizada evita que o processamento, que regrava o item inteiro, sobrescreva o `pictureKey`.

**Migração futura para a fila:** como o texto fica em `inputText` e o `ProcessMealUseCase` já sabe processar texto, mover para o fluxo assíncrono é trocar a chamada direta ao analyzer por `MealProcessingQueue.publish()`.

### 7.3 Sugestão e salvamento de receita (síncrono)

1. `SuggestRecipeUseCase` recebe o texto com o que o usuário tem em casa e a data local:
   - Lê as metas (`GetProfileQuery`) e o consumo do dia (`ListMealsByDayQuery`)
   - Calcula o restante do dia
   - Chama o `RecipeGenerator`
   - **Retorna a sugestão sem persistir**
2. Se o usuário aceitar, o app envia a receita de volta e o `SaveRecipeUseCase` grava.

O cliente reenvia a receita inteira. O risco de adulteração dos macros é aceitável, porque os dados são do próprio usuário, e isso evita guardar rascunhos.

**Detalhes**
- `POST /recipes/suggestions` recebe `{ date, text }`, com o texto livre do que o usuário tem em casa (até 1000 caracteres, ex.: "tenho metade de um queijo mussarela, uns 5 ovos..."), e devolve `{ recipe }`. A IA extrai os alimentos e trata as quantidades citadas como limite. O restante do dia é `meta - consumido` por macro, nunca abaixo de zero; o consumo considera só refeições em `SUCCESS`.
- **Tamanho da receita:** quem decide é o usuário, no próprio texto ("monte uma receita com cerca de 400 kcal"). Sem pedido, a receita é uma porção normal de **no máximo ~500 kcal**; passa disso só se o usuário pedir. O restante do dia serve só para equilibrar os macros (ex.: priorizar proteína) e nunca reduz a porção.
- A receita é sempre montada em volta dos alimentos citados; itens de despensa só temperam ou cozinham.
- Pode usar itens básicos de despensa (sal, temperos, água, um pouco de óleo ou manteiga) além dos informados. Nome, ingredientes e passos saem no idioma do texto. `instructions` são passos numerados, um por linha.
- Nenhum alimento no texto → 422 `NO_FOOD_INGREDIENTS`. Resposta vazia do modelo → 502 `RECIPE_GENERATION_FAILED`.
- Modelo `gpt-6-luna` com `reasoning.effort: low`; Lambda com timeout de 29 s, como a refeição manual.
- `DELETE /recipes/{recipeId}` apaga a receita (404 se não existir, verificado pelo `ALL_OLD` do próprio `DeleteItem`).
- `GET /recipes` devolve todas as receitas, da mais nova para a mais antiga (`ScanIndexForward: false`; o id é ULID).

**Migração futura para a fila:** mesma estratégia das refeições manuais, se a geração ficar lenta.

### 7.4 Refeições salvas e receita → refeição (síncrono, sem IA)

Uma refeição salva é um modelo reutilizável: o usuário salva uma refeição já analisada com um nome e, depois, cadastra refeições a partir dela sem abrir a original e sem chamar a IA.

- `POST /saved-meals` com `{ mealId, name }` → `SaveMealUseCase`: `meal.saveAs()` copia os `items` para um item `SAVED_MEAL#{id}`. Só meals em `SUCCESS` podem ser salvas (409 `MEAL_NOT_SAVABLE`); meal inexistente → 404 `MEAL_NOT_FOUND`. O nome tem até 60 caracteres. O modelo é independente da original: editar ou excluir a meal não muda o que foi salvo.
- `GET /saved-meals` devolve `{ savedMeals }`, da mais nova para a mais antiga, cada uma com `id`, `name`, `items`, totais e `createdAt`.
- `DELETE /saved-meals/{savedMealId}` apaga o modelo (404 `SAVED_MEAL_NOT_FOUND` se não existir, pelo `ALL_OLD`). As meals já cadastradas a partir dele continuam.
- `POST /saved-meals/{savedMealId}/meal` com `{ date, time }` → `CreateMealFromSavedMealUseCase`: `savedMeal.toMeal()` cria uma meal `MANUAL` em `SUCCESS`, com o nome e os itens do modelo, sem `inputFileKey`, `inputText` nem `pictureKey` (a meal aceita foto de registro própria).
- `POST /recipes/{recipeId}/meal` com `{ date, time }` → `CreateMealFromRecipeUseCase`: cria uma meal `MANUAL` em `SUCCESS` com o nome da receita e **um item** `1 porção`, com os macros da receita. Os ingredientes não têm macros individuais, então dividi-los inventaria números. Com um item só, os totais continuam derivados dos itens, e comer meia receita é editar a quantidade para `0,5`. Receita inexistente → 404 `RECIPE_NOT_FOUND`.
- As rotas que criam meal respondem 201 com a meal criada (`id`, `name`, `status`, `inputType`, `date`, `time`, `items`, totais, `createdAt`).
- A exclusão da conta já cobre as refeições salvas, porque apaga todos os itens de `USER#{id}`.

### 7.5 Endpoints (proposta inicial, ajustar durante o desenvolvimento)

| Método | Rota | Auth |
|---|---|---|
| POST | `/auth/sign-up` | pública |
| POST | `/auth/sign-in` | pública |
| POST | `/auth/refresh-token` | pública |
| POST | `/auth/forgot-password` | pública |
| POST | `/auth/forgot-password/confirm` | pública |
| GET | `/me` | privada |
| DELETE | `/me` | privada |
| PUT | `/me/password` | privada |
| PUT | `/profile` | privada |
| PUT | `/goals` | privada |
| POST | `/meals` | privada |
| POST | `/meals/manual` | privada |
| GET | `/meals?date=YYYY-MM-DD` | privada |
| GET | `/meals/{mealId}` | privada |
| PUT | `/meals/{mealId}` | privada |
| DELETE | `/meals/{mealId}` | privada |
| POST | `/meals/{mealId}/picture` | privada |
| POST | `/meals/{mealId}/reprocess` | privada |
| POST | `/meals/items/analysis` | privada |
| POST | `/recipes/suggestions` | privada |
| POST | `/recipes` | privada |
| GET | `/recipes` | privada |
| DELETE | `/recipes/{recipeId}` | privada |
| POST | `/recipes/{recipeId}/meal` | privada |
| POST | `/saved-meals` | privada |
| GET | `/saved-meals` | privada |
| DELETE | `/saved-meals/{savedMealId}` | privada |
| POST | `/saved-meals/{savedMealId}/meal` | privada |

---

## 8. Inspiração: foodiary

### 8.1 O que aproveitar
- Separação por camadas e handlers de uma linha usando adapters por tipo de evento (HTTP, S3, SQS).
- Controller base com `@Schema(zod)`.
- Saga com compensações no sign-up.
- Queries separadas dos use cases para leituras (CQRS-lite).
- Pipeline de meal: presigned POST com condições e metadata → evento S3 → SQS com DLQ e alarme → Lambda de processamento, com máquina de status e `attempts`.
- Organização do `serverless.yml` em arquivos separados (`sls/functions`, `sls/resources`, `sls/config`).

### 8.2 O que NÃO repetir
- **Use cases importando infra concreta.** Aqui eles dependem só de ports.
- **Queries acessando o `dynamoClient` direto dentro de `application`.** Aqui as queries são ports implementados na infra.
- **Clients da AWS como singletons de módulo importados.** Aqui eles são injetados.
- **Gateway de IA acoplado à OpenAI e ao gateway de storage concreto.** Aqui são ports separados (`MealAnalyzer`, `Transcriber`, `FileStorage`).
- **Entidade gerando o próprio id com uma lib.** Aqui o id vem do `IdGenerator`.
- **Registry indexado por `class.name` com minify ligado.** Aqui a chave é o construtor.
- **Trigger do S3 em qualquer objeto do bucket.** Aqui os prefixos são filtrados e o handler valida status e tipo.
- **Uso do access token com custom attribute via Pre Token Generation V2** (exige plano Essentials). Aqui o `sub` é resolvido pelo GSI com cache.

---

## 9. Pendências e decisões futuras

- **Servir arquivos via CloudFront**, se as URLs assinadas do S3 ficarem caras ou lentas. O formato da resposta (`pictureUrl`) não muda.
- **Mover a refeição manual e a sugestão de receita para a fila**, se a latência síncrona ficar ruim.

### 9.1 Features futuras (em ordem de prioridade)

Critério: só entra o que reduz o atrito de registrar ou mostra progresso, que é o que mantém o usuário no app depois das primeiras semanas.

1. **Histórico de peso.** `POST /weights` e `GET /weights?from=&to=`, item `USER#{id}` / `WEIGHT#{date}`. O registro mais recente atualiza o peso do perfil e recalcula as metas (a regra do `PUT /profile` já existe).
2. **Resumo por período.** `GET /summary?from=&to=` com totais por dia, médias e dias dentro da meta. O GSI1 é por dia (um mês = 30 queries); se pesar, gravar um resumo diário.

**Depois:** lembretes para registrar (dependem de push no app) e leitura de código de barras (base externa com cobertura irregular no Brasil; a foto já cobre boa parte).

**Fora de escopo:** chat com coach de IA, gamificação, recursos sociais e micronutrientes. São caros e não atacam o atrito de registrar.
