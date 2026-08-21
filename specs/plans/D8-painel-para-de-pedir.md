# Plano — D8 · O painel para de pedir classificação

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D8 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** FRONT-INTEGRADO
**Arquivos:** `filaDeRevisao.ts` (novo), `resumoDeLancamentos.service.ts`,
`avisoDoPainel.ts` (novo), `ResumoDoQueEntrou.tsx`, `listarPendentes.service.ts`,
`TelaDeRevisao.tsx`

## O que é

O `/dashboard` tem um cartão dourado fixo desde a D6 da spec 02. Ele diz:

> Falta classificar para o painel existir. Seus lançamentos estão guardados, mas
> nenhum caiu num pote ainda — separar gasto fixo de lazer é **a próxima
> funcionalidade a ser construída**.

Três frases, três mentiras — todas criadas pela spec 03 ter sido construída:

1. **"nenhum caiu num pote ainda"** — a D1 classifica na importação e a D4
   classifica à mão. Desde a D7 são 27 regras trabalhando.
2. **"a próxima funcionalidade a ser construída"** — foi construída.
3. **Aparece mesmo sem nada pendente**, que é literalmente o que a tarefa proíbe.

E uma quarta coisa, que não é mentira mas é pior de usar: o cartão **nomeia o
passo que falta e não oferece o caminho até ele**. Não há link para `/revisao`.

## Duas verdades, e elas não se fundem numa só

O cartão de hoje mistura duas coisas diferentes:

| | Verdade | Quando vale |
|---|---|---|
| A | "faltam N lançamentos para você decidir" | só quando N > 0 |
| B | "os potes com valores ainda não existem" | **sempre**, até a spec 04 |

Fundir as duas foi o que criou a mentira: como B é permanente, o cartão nunca
sumia, e a frase de A ia junto para sempre.

Um cartão, dois estados exclusivos:

- **N > 0** → dourado, o número, e o botão "Revisar agora".
- **N = 0** → verde, "tudo classificado", e a limitação B dita como limitação —
  não como cobrança.

Sem pendência, o app não pede nada. É a régua da D6 da spec 02: não mentir, e
não cobrar por algo que já foi feito.

## O número tem de ser o mesmo dos dois lados

O painel vai dizer "N para decidir" e mandar para `/revisao`. Se os dois
contarem diferente, é a mentira por omissão que a D2 acabou de consertar —
mostrar 17 e abrir uma tela com 23.

Hoje o critério da fila existe **escrito uma vez** dentro do `where` de
`listarPendentes`: `(categoria_id is null or status = 'revisao_pendente') and
status <> 'excluido'`. Copiá-lo para o resumo garantiria que um dia os dois
divergem.

Vai para `filaDeRevisao.ts`, e os dois passam a ler de lá. Mesmo movimento do
`criterioDaCorrecao.ts` na D5 e do `chaveDaRegra.ts` na D7 — pela terceira vez
nesta spec, e sempre pelo mesmo motivo.

## Os números da faixa mudam de significado

Hoje: **Lançamentos · Sem categoria · Para revisar**. As duas últimas são dois
terços da mesma fila, e nenhuma delas é o total dela.

Passa a: **Lançamentos · Classificados · Para decidir**, onde "Para decidir" é
exatamente o tamanho da fila de `/revisao`.

"Classificados" só passou a ser um número interessante agora — antes da spec 03
ele era zero por construção.

⚠ Os dois se sobrepõem no lançamento de valor alto: ele **está** classificado e
**pede** confirmação. A sobreposição é real, e é a mesma que a D2 documentou em
`paraDecidir`. Escolher um dos dois lados esconderia metade do fato.

## `/revisao` também tem uma frase que envelheceu

O estado vazio promete: *"O painel pode contar a história inteira do mês."* Ele
não pode — os potes com valores são a spec 04. Mesma família de mentira, mesma
correção.

## Pronto quando

- sem nada pendente, o `/dashboard` não pede classificação em lugar nenhum;
- com pendências, ele diz **quantas** e leva até lá num toque;
- o número do painel é igual ao tamanho da fila de `/revisao`, por construção e
  não por coincidência;
- nenhuma frase da tela afirma algo que a spec 03 tornou falso.
