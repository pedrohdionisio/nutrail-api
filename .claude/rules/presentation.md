---
paths:
  - "src/presentation/**"
  - "src/main/adapters/**"
  - "src/main/functions/**"
---

# Apresentação: controllers, adapters e o contrato

## Controllers (`src/presentation/controllers/<módulo>/`)

- Estendem `Controller<'public' | 'private', TBody>`, recebem `@Injectable()` e declaram o body com
  `@Schema(zodSchema)`. O `Controller` base valida o body antes do `handle()`. A query é validada
  no controller com o schema dela (`listMealsByDaySchema.parse(queryParams)`), e o path param
  ausente vira o `NotFoundError` do recurso.
- Rota privada recebe o `userId` pronto em `request.userId`. O controller nunca lê o token nem o
  `sub`.
- Toda requisição traz `request.language` (`pt-BR` | `en-US`), resolvido do `Accept-Language` pelo
  adapter. Use case que gera texto para o usuário (IA, e-mail, unidade) recebe o `language`.
- Escrita chama o use case. Leitura simples pode chamar a query direto (`GetMealController` usa
  `GetMealQuery`), sem use case de passagem.
- A resposta é montada campo a campo no controller: nenhuma entidade, item do DynamoDB ou chave do
  S3 vai inteira para o body. Chave de arquivo vira URL assinada (`FileStorage.getReadUrl`) e sai
  como `pictureUrl`.
- Status: `201` com o recurso criado, `200` com o dado lido ou atualizado, `202` quando o trabalho
  segue na fila (reprocessamento), `204` sem body para exclusão e para ação sem retorno. Lista sai
  embrulhada com o nome do recurso (`{ recipes }`, `{ savedMeals }`).

## Schemas (`controllers/<módulo>/schemas/`)

- Um arquivo por controller, `<nome>Schema.ts`, exportando o schema (`signUpSchema`) e o tipo
  inferido (`SignUpBody`). Nunca declarar o schema dentro do controller.
- Formatos do contrato: `z.iso.date()` para `date` e `birthDate`, `z.iso.time({ precision: -1 })`
  para `time` (`HH:mm`), texto livre com `.trim()`, `.min(1)` e um `.max()` explícito (1000 para
  descrição de refeição e ingredientes, 500 para análise de item, 60 para nome de refeição salva).
- O app espelha esses schemas no formulário. Apertar uma regra aqui exige apertar lá.

## Handlers de evento

- `presentation/file-events/`: recebe `{ key }` do evento do S3 e decide pelo estado da meal; evento
  que não interessa é ignorado, nunca vira erro.
- `presentation/queue-consumers/`: valida a mensagem com Zod (`queue-consumers/schemas/`) e chama o
  use case. Lançar é o que faz a mensagem voltar para a fila.

## Adapters e functions (`src/main/`)

- Handler de Lambda tem uma linha: `export const handler = lambdaHttpAdapter(XController);`, com
  `lambdaS3Adapter` e `lambdaSQSAdapter` para os eventos.
- O `lambdaHttpAdapter` é o único lugar que mapeia erro para HTTP:
  - `ZodError` → 400 `VALIDATION`, com `details: [{ field, message }]`;
  - `HttpError`, `ApplicationError` e `DomainError` → o `statusCode` e o `code` do erro;
  - qualquer outro → 500 `INTERNAL`, logado.
  O body de erro é sempre `{ error: { code, message, details? } }`.
- `HttpError` é só da apresentação e dos adapters (`UNAUTHORIZED`, `INVALID_JSON`). Use case e
  domínio lançam os próprios erros.
- O `lambdaSQSAdapter` devolve `batchItemFailures`: uma mensagem com erro não reprocessa o lote.

## O contrato com o app

- O `nutrail-app` escreve os services à mão contra estas rotas e traduz cada `code` para português e
  inglês nos dicionários de `data/config/locales`. A `message` é técnica, em inglês, e o app não a exibe.
- Remover ou renomear campo de resposta, mudar status ou `code`, ou apertar a validação quebra o
  app: antes, procure a rota e o campo em `../nutrail-app/src` e diga quais arquivos são afetados.
- Rota nova ou alterada vai para a tabela de endpoints (seção 7.5) de `docs/ARCHITECTURE.md`.
