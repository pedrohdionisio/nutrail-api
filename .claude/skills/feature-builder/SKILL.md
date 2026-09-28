---
name: feature-builder
description: Constrói uma feature da Nutrail API de ponta a ponta — spec, implementação, testes, verificação, revisão e docs — orquestrando os subagents api-builder, test-writer e code-reviewer. Use para um endpoint novo, uma regra de negócio nova ou uma mudança num fluxo existente.
when_to_use: 'Pedidos como "cria o endpoint", "implementa a feature", "adiciona a rota" ou "quero que a API faça...".'
argument-hint: "[o que a feature precisa fazer]"
---

# Feature builder

Você orquestra; os subagents fazem o trabalho especialista. Eles começam sem esta conversa, então
toda delegação carrega o que eles precisam: a spec, os critérios de aceite e os arquivos envolvidos.
Eles carregam o `CLAUDE.md` e as regras de `.claude/rules/`.

Pedido: $ARGUMENTS

## 0. Dimensione

Se a mudança é de poucas linhas numa camada só (um campo a mais numa resposta, um limite, um texto
de prompt), faça você mesmo seguindo o mesmo roteiro (spec, dúvidas, mudança, teste, verificação),
sem subagents. Subagents compensam quando a mudança atravessa camadas.

## 1. Spec

Leia as partes de `docs/ARCHITECTURE.md` que a feature toca e a feature existente mais parecida.
Depois escreva a spec na conversa:

- **Rotas** — método, caminho, pública ou privada, body, resposta, status e erros com o `code`.
- **Regras** — as regras de negócio, onde cada uma é garantida (entidade, use case, condição do
  DynamoDB, schema) e quais regras inegociáveis do `CLAUDE.md` se aplicam.
- **Dados** — itens, chaves e access patterns no DynamoDB (seguindo a seção 3), prefixos no S3,
  mensagens na fila.
- **IA** — quando houver: port, modelo, prompt, schema da resposta, síncrono (29 s) ou pela fila.
- **Infra** — funções, timeouts, permissões e alarmes no Serverless.
- **Impacto no contrato** — procure em `../nutrail-app/src` tudo o que muda e liste quem quebra,
  incluindo os `code`s novos que o `apiError.ts` do app vai precisar traduzir.
- **Critérios de aceite** — numerados, cada um observável pela resposta da rota ou pelo estado dos
  fakes. Eles guiam os testes.

## 2. Tire as dúvidas com o usuário

Com a spec escrita e antes de qualquer código, liste o que continua em aberto. Uma dúvida é real
quando:

- o pedido, o código e o `docs/ARCHITECTURE.md` não a resolvem;
- respostas diferentes levam a código, contrato, dados ou testes diferentes.

Não é dúvida real quando uma convenção ou uma feature existente já responde. Decida essas você e
registre a decisão na spec.

Se sobrarem dúvidas reais, pergunte numa rodada só com AskUserQuestion, até quatro perguntas:

- cada uma concreta, com 2 a 4 opções e o custo de cada;
- sua recomendação primeiro, marcada "(Recomendado)";
- inclua do que uma boa resposta depende (qual tela do app chama, o que acontece no caso de borda,
  quanto custa em chamadas à OpenAI), para a resposta trazer contexto e não só uma escolha.

Incorpore as respostas na spec e siga. Sem dúvidas reais, pule este passo em silêncio: não peça
confirmação da spec.

## 3. Implemente — `api-builder`

Delegue com a spec completa. Espere o relatório e leia: arquivos, contrato, dados, infra e decisões.
Se ele parou com uma pergunta, responda (ou pergunte ao usuário) e continue com SendMessage.

## 4. Teste — `test-writer`

Delegue com a spec, os critérios de aceite numerados e a lista de arquivos do passo 3. Ele escreve e
roda os testes e nunca edita `src/`.

## 5. Verifique

Rode você mesmo `pnpm lint && pnpm typecheck && pnpm test`. Para cada falha, decida quem está
errado:

- código de produção → continue o `api-builder` com SendMessage, citando a asserção que falhou;
- o teste → continue o `test-writer` do mesmo jeito.

Repita até ficar verde.

## 6. Revise — `code-reviewer`

Delegue com a spec e a lista de arquivos alterados. Confira cada achado no código antes de agir.
Mande os confirmados para o agent dono do arquivo (SendMessage) e rode o passo 5 de novo. No máximo
duas rodadas de revisão; o que sobrar vai para o relatório.

## 7. Docs

- `docs/ARCHITECTURE.md` atualizado quando mudou modelagem, fluxo, regra ou endpoint (tabela da
  seção 7.5).
- `README.md` atualizado quando a feature muda o que o produto faz ou a lista de scripts.

## 8. Relatório

Em português, para o usuário:

- o que foi construído, rota a rota;
- mudanças de contrato e os arquivos do `nutrail-app` afetados, com os `code`s novos;
- dados e infra novos, e que nada foi implantado;
- o resultado da verificação, com as contagens;
- achados da revisão que não foram corrigidos, e por quê;
- que nada foi commitado.

Não faça commit nem deploy sem o usuário pedir.
