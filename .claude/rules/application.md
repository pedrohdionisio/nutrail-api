---
paths:
  - "src/domain/**"
  - "src/application/**"
---

# Domínio e aplicação

## Domínio (`src/domain/`)

- Não importa nenhuma lib externa nem nada de fora de `src/domain/`.
- **Entidades ricas.** Estado que muda fica em campo privado, exposto por getter (a `Meal`); o que
  não muda é `readonly` (`User`, `Recipe`). Toda mudança é um método que valida a regra e lança o
  erro de domínio quando ela não vale (`meal.edit()`, `meal.retry()`, `meal.saveAs()`,
  `savedMeal.toMeal()`). Uma entidade que vira outra faz isso por método, não no use case.
- **A máquina de status da `Meal` mora na entidade.** `UPLOADING → QUEUED → PROCESSING → SUCCESS |
  FAILED`, com `requeue()` e `retry()` voltando para `QUEUED`. Transição nova é método novo na
  entidade, nunca um `if` no use case.
- **Totais são derivados.** Calorias e macros da `Meal` e da `SavedMeal` saem de `sumMacros(items)`
  (`value-objects/Macros`); nunca são gravados à parte nem recebidos do cliente.
- Enums são arrays `as const` com o tipo derivado (`MEAL_STATUSES` / `MealStatus`). O schema Zod
  que aceita o enum inteiro reusa o array (`z.enum(GOALS)`).
- `GoalCalculator` é puro e recebe "agora" por parâmetro. Mifflin-St Jeor, fator de atividade,
  ±500 kcal pelo objetivo, proteína 2 g/kg, gordura 0,9 g/kg e carboidrato completando. Metas
  editadas mantêm 4 kcal/g para proteína e carboidrato e 9 kcal/g para gordura.
- Erro de regra de negócio estende `DomainError` em `domain/errors/`, um por arquivo, com mensagem
  técnica em inglês, `code` em `SCREAMING_SNAKE_CASE` e o status HTTP.

## Ports (`src/application/ports/`)

- `abstract class` só com métodos abstratos, uma por arquivo, com o nome "limpo" (`MealRepository`,
  `FileStorage`, `MealAnalyzer`). Os tipos que o port recebe e devolve ficam no mesmo arquivo.
- **Repositório** carrega e grava entidade (`findById`, `create`, `update`, `delete`). **Query**
  é leitura para a tela e devolve dado plano (`MealDetails`, `ProfileWithGoals`), sem passar pela
  entidade. Não misture os dois papéis.
- O port descreve o que o use case precisa, não como o adapter funciona: nada de `PK`, `GSI1`,
  `Command`, bucket ou nome de modelo.
- Resultado esperado volta no retorno, não em exceção: `findById` devolve `null`, `delete` que
  precisa distinguir "não existia" devolve `boolean`.

## Use cases (`src/application/usecases/<módulo>/`)

- Uma classe por operação, `@Injectable()`, com um único `execute(input)`. O input é um objeto
  (`type Input` no próprio arquivo) que sempre carrega o `userId` quando a operação é do usuário.
- Ordem: carregar → não existe, `<Recurso>NotFoundError` → aplicar a regra pela entidade → gravar
  pelo port → efeitos colaterais.
- Não existindo para aquele `userId` é 404, nunca 403: a chave já é do usuário, então o recurso de
  outro simplesmente não é encontrado.
- **Efeito colateral que não pode desfazer a operação é engolido e logado**, como o e-mail de
  boas-vindas no sign-up. Efeito que precisa desfazer a operação vai para a `Saga`.
- **`Saga`** (`application/services/Saga.ts`): registre a compensação logo depois do passo que ela
  desfaz, dentro do `saga.run()`. A `Saga` é `transient`, e todo use case que a recebe também.
- Chaves, tipos e limite de tamanho dos arquivos de refeição vêm de `application/services/mealFiles.ts`
  (`mealFileKey`, `MEAL_FILES`, `MAX_MEAL_FILE_SIZE_BYTES`). Nunca montar a chave à mão.
- Nada de `new Date()`, `Date.now()` ou `ulid()`: use `Clock` e `IdGenerator`.

## Erros de aplicação (`src/application/errors/`)

- Estendem `ApplicationError`, um por arquivo, com mensagem, `code` e status fixos no construtor
  (`MealNotFoundError` → 404 `MEAL_NOT_FOUND`). O use case lança sem argumentos.
- Falha de um provedor externo que o usuário pode repetir é 502 (`MEAL_ANALYSIS_FAILED`,
  `RECIPE_GENERATION_FAILED`). Senha atual errada é 400 `INVALID_CURRENT_PASSWORD`, nunca 401: o
  app trata 401 como sessão expirada.
- `code` novo é contrato: o app precisa de uma mensagem em português e em inglês para ele nos
  dicionários de
  `../nutrail-app/src/data/config/apiError.ts`.
