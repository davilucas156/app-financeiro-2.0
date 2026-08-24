# Plano — D4 · Trocar a categoria de um lançamento já classificado

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D4 de `specs/04-painel-do-mes.tarefas.md`
**Camada:** FRONT-INTEGRADO
**Arquivos:** `features/painel/trocar-categoria/` (novo),
`features/painel/painel-do-mes/{poteNoPainel.ts,painelDoMes.service.ts,CartaoDoPote.tsx,TelaDoPainel.tsx}`,
`features/classificacao/revisar-lancamento/ListaDeCategorias.tsx`

## O que é

O botão "Trocar categoria" da B3 — hoje renderizado apagado — passa a abrir a
lista de categorias dentro da linha do lançamento. Escolher grava por
`decidirLancamento`, com a sombra do desfazer da D6 junto.

**É o buraco que a D9 da spec 03 expôs**, e eu o nomeei lá em voz alta: hoje
não existe caminho nenhum para corrigir um lançamento já classificado, porque
`/revisao` só mostra a fila. Corrigir a regra sem poder corrigir o que ela já
pegou é meia correção.

## Nada de novo do lado do servidor

`decidirLancamento` já faz exatamente isto desde a D4 da spec 03: confere a
categoria contra o `user_id`, lê o estado anterior com `for update`, grava, e
deixa a sombra. A action `decidir` já revalida `/dashboard`.

Esta tarefa é uma tela ligando num serviço que já existe. Se eu precisar mexer
no serviço, é sinal de que entendi a tarefa errado.

## "Sempre classificar assim" fica de fora — e não é economia

A pergunta existe na revisão e **mentiria aqui**.

`aplicarAosIrmaos` procura irmãos com `categoria_id IS NULL`: os pendentes.
Quem está no painel já está classificado, e os outros lançamentos parecidos
dele também estão. A regra nasceria, não pegaria ninguém, e a tela diria
"pronto" sobre um mês que continuaria errado em cinco linhas.

O caminho certo para "todos os Uber estão no pote errado" é a `/regras` da D9 —
corrigir a regra — e depois trocar aqui os que ela já pegou. Reclassificar em
massa o passado é tarefa própria, e continua não existindo.

## A regra continua valendo, e a tela diz isso antes

Trocar a categoria limpa `regra_id` e `regra_chave` do lançamento (o conserto
da verificação da D6): a procedência passa a ser você, porque passou a ser.

**A regra em si não é tocada.** Ela segue lá e vai classificar o próximo extrato
do mesmo jeito. Quem trocar a categoria de um lançamento que veio de regra
precisa saber disso **antes** de escolher, senão descobre no mês que vem.

O aviso mora em `trocar-categoria/troca.ts` com teste, pela mesma razão que
`avisoDoVoltar` mora em `desfazer.ts`: é a única parte com decisão dentro.

## Tocar na categoria atual não é uma decisão

E é a armadilha desta tela.

Abrir a lista para conferir onde o lançamento está e tocar no que já está
marcado gravaria uma decisão: `classificado_por` viraria `manual`,
`regra_chave` seria apagada, a sombra do desfazer seria sobrescrita — e nada
na tela mudaria de lugar. A procedência morreria em silêncio, num toque que a
pessoa fez para não mudar nada.

A categoria atual aparece na lista marcada como **atual** e não é tocável.
`ListaDeCategorias` ganha um `atualId` opcional; a revisão não muda.

## O "Voltar" não é duplicado no painel

A sombra é **uma por conta** — a chave primária de `decision_undo` é o
`user_id`, e isso é a promessa do botão: "reabre o anterior", singular.

Um segundo botão lendo a mesma linha de outra tela mostraria, no painel, um
"Voltar" para uma decisão tomada na revisão sobre um lançamento que não está
nesta tela. O botão certo no lugar errado.

Depois de trocar, a linha mostra uma frase curta com caminho para `/revisao`,
onde o "Voltar" já existe — inclusive com a fila vazia, como a D6 previu.

## Uma coluna a mais numa consulta que já roda

As categorias escolhíveis precisam do `slug` para a chave composta
`pote/categoria`. O painel já lê `categories` com `innerJoin buckets` para
montar os potes: entra `categories.slug` no `select` que já existe.

Segunda consulta seria uma segunda verdade sobre as mesmas categorias — a
mesma razão pela qual a D1 usa uma passada de lançamentos para tudo.

## O que fica de fora, e por quê

⚠ **"Marcar como fora do cálculo" a partir do painel.** O mesmo buraco, na
porta ao lado: uma transferência para si mesmo classificada por engano não tem
como sair do cálculo hoje. O "Pronto quando" desta tarefa é sobre categoria, e
eu não vou alargá-la sozinho — mas o buraco é real e fica registrado aqui.

**Trocar em lote pela lista do pote.** Marcar cinco e mandar todas para o mesmo
lugar é útil e é outra tela. Uma de cada vez resolve o mês do Davi hoje.

## Pronto quando

- o botão "Trocar categoria" abre a lista dentro da linha, do celular;
- escolher grava por `decidirLancamento` e o painel recalcula;
- a categoria atual aparece marcada e não grava nada;
- lançamento vindo de regra avisa que a regra continua valendo, com caminho
  para `/regras`;
- a sombra do desfazer é escrita, e o "Voltar" da `/revisao` restaura inclusive
  a procedência da regra;
- verificado contra o Neon real.
