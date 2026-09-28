---
name: bug-fixer
description: Corrige um bug da Nutrail API com teste primeiro — localiza a causa, reproduz com um teste que falha pelo test-writer, corrige (direto ou pelo api-builder), verifica e revisa com o code-reviewer. Use quando algo na API se comporta errado.
when_to_use: 'Relatos como "tem um bug", "está quebrando", "retorna errado", "a meal ficou travada" ou "não funciona".'
argument-hint: "[o comportamento errado, e como provocá-lo]"
---

# Bug fixer

Um bug está corrigido quando um teste que falhava por causa dele passa, e nada mais quebrou.

Bug: $ARGUMENTS

## 1. Localize a causa

Leia o caminho do bug: `sls/functions` → handler → adapter → controller → use case → entidade →
implementação de infra, e as regras dessas camadas. Nos fluxos assíncronos, siga o estado da meal
pelo evento do S3, pela fila e pelo `ProcessMealUseCase`.

Diga a causa raiz em uma ou duas frases, com `arquivo:linha`. Se a evidência aponta para mais de uma
causa, diga em qual você acredita e por quê antes de seguir. Se o "bug" é um comportamento que o
`docs/ARCHITECTURE.md` documenta de propósito, pare e avise o usuário.

Se o bug só aparece no ambiente implantado (logs, alarme, DLQ), peça ao usuário o que você não
consegue ver daqui: não rode deploy nem chame a AWS para investigar.

## 2. Reproduza — `test-writer`

Delegue com o comportamento errado, o esperado e a causa encontrada. Ele escreve o menor teste que
falha, roda e confirma que falha pelo motivo do bug. Leia a falha você mesmo: erro de setup não é
reprodução.

## 3. Corrija

- Corrija na camada dona da regra (veja `.claude/rules/`), com a menor mudança que faz o teste
  passar. Sem refatoração no caminho.
- Poucas linhas numa camada: corrija você mesmo. Várias camadas: delegue ao `api-builder` com a
  causa, o teste que falha e o comportamento esperado.
- Se a correção muda rota, campo de resposta ou `code`, confira o `../nutrail-app/src`.

## 4. Verifique

`pnpm lint && pnpm typecheck && pnpm test`. O teste novo passa, e todo o resto também.

## 5. Revise — `code-reviewer`

Delegue com a causa, o teste e os arquivos alterados. Aplique os achados confirmados e verifique de
novo.

## 6. Relatório

Em português: a causa raiz com `arquivo:linha`, a correção, o teste que a prova, o resultado da
verificação, e que nada foi commitado nem implantado.
