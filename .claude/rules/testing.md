---
paths:
  - "tests/**"
  - "vitest.config.ts"
---

# Testes

Vitest, com o `unplugin-swc` no `vitest.config.ts` para emitir a metadata dos decorators (sem ela o
container não resolve nada). `aws-sdk-client-mock` simula os clients da AWS. Nada fala com a AWS ou
a OpenAI de verdade, então `pnpm test` roda sem Docker e sem credenciais.

## Onde fica cada coisa

- Teste **nunca** fica em `src/`. `tests/` espelha `src/`, e o arquivo tem o nome do que cobre:
  `src/domain/entities/Meal.ts` → `tests/domain/entities/Meal.test.ts`.
- `tests/support/` guarda a infraestrutura e não espelha nada:

| Caminho | Para quê |
|---|---|
| `setup.ts` | `reflect-metadata` e as variáveis de ambiente de teste |
| `fixtures/` | `build<Entidade>(overrides)`: `buildUser`, `buildMeal`, `buildPendingMeal`, `buildMealAnalysis`, `buildRecipe`, `buildSavedMeal`... |
| `fakes/` | um fake em memória por port, todos montados por `createFakes()` sobre um `InMemoryDatabase` |
| `app.ts` | harness dos testes de feature: `invoke`, `givenSignedInUser`, `fakes()`, `errorBody`, `validationErrorBody`, `s3Event`, `sqsEvent` |
| `dynamo.ts` | `createDynamo()`: `DynamoDBDocumentClient` com `mockClient` e o `AppConfig` de teste |

- O tempo é o do `FixedClock` (`2026-09-26T15:00:00.000Z`) e os ids são sequenciais (`id-1`,
  `id-2`...), então as asserções usam valores exatos.

## Qual tipo de teste

- **Domínio e serviços** (`tests/domain`, `tests/application/services`): unitário direto. Toda
  transição da `Meal` tem o caso permitido e o recusado.
- **Use case** (`tests/application/usecases`): instanciado à mão com os fakes de `createFakes()`,
  sem container. Afirme o estado final (o que ficou no `InMemoryDatabase`, o que foi publicado na
  fila, o que o storage apagou, o e-mail enviado), não as chamadas.
- **Feature** (`tests/main/functions`): um arquivo por função, chamando o `handler` real com
  `invoke()`. O `app.ts` troca cada port do container por um fake recriado a cada teste;
  `givenSignedInUser()` cria o usuário e o `as` da requisição faz o papel do authorizer. Cubra o
  caminho feliz com o body exato, cada erro de negócio (status e `code`, com `errorBody`) e a
  validação (400 com `validationErrorBody('<campo>')`). O `describe` é a rota: `'POST /meals/manual'`.
- **Infra** (`tests/infra`): o adapter com o SDK simulado (`mockClient`) ou o client da OpenAI
  espionado (`vi.spyOn(client.responses, 'parse')`). Afirme o comando enviado (chaves, índice,
  condição, `ReturnValues`) e o mapeamento da resposta e dos erros.
- **Adapters e container** (`tests/main/adapters`, `tests/main/container`): mapeamento de erro para
  HTTP, partial batch response, e todo port resolvendo para a implementação certa.

## Escrevendo

- Títulos em inglês, começando com `should`: `it('should refuse a meal that did not fail, without publishing', ...)`.
- Fake novo entra em `createFakes()` **e** num `bindToCurrent` do `app.ts`. Port novo sem fake quebra
  os testes de feature que o resolvem.
- O fake de um provedor externo expõe o que recebeu (`textCalls`, `published`) e deixa o teste
  configurar a resposta ou a falha (`analysis`, `error`).
- Setup que dois testes precisam vai para `support/`, não para um helper local.
- Correção de bug começa por um teste que falha pelo motivo do bug e passa depois da correção.

## Rodando

`pnpm test` roda tudo; `pnpm vitest run <arquivos>` roda só os que você tocou;
`pnpm test:coverage` mede a cobertura (sem `main/functions` e prompts).
