# Plano — D4 · Gravar a decisão

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D4 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** BACK + FRONT-INTEGRADO
**Arquivos:** `decidirLancamento.service.ts`, `decidirLancamento.action.ts`,
`AcaoDeDecidir.tsx`, e os três lugares que decidem

## O que é

Tocar numa categoria grava e avança. `/revisao` deixa de ser uma tela de leitura.

## Dois ids vêm do cliente, e os dois precisam ser conferidos

O `user_id` sai de `garantirUsuario()`. Mas **dois** ids chegam do navegador, e
é fácil proteger só um deles:

| Id | Conferência |
|---|---|
| `lancamentoId` | Entra no `where` **junto** com o `user_id`, nunca sozinho — mesma regra do desfazer da spec 02 |
| `categoriaId` | Um `select` antes do update, filtrado por `user_id` |

O segundo é o que quase escapa. O `user_id` no `where` protege **o lançamento**,
não o destino dele: sem conferir a categoria, um id de outra conta entraria em
`transactions.categoria_id`, e o painel de outra pessoa passaria a somar um
gasto que não é dela.

## Três decisões, um caminho

| Toque | O que grava |
|---|---|
| Sugestão ou categoria da lista | `categoria_id`, `classificado_por`, `classificado_em`, `status = importado`, `motivo` limpo |
| "Fora do cálculo" | `status = excluido` e o motivo "você marcou" |
| "Está certo" | Mantém tudo o que a regra gravou; só o pedido de conferência sai |

**Escolher limpa o `motivo`** de propósito: o aviso de valor alto ou de par que
se anula deixa de valer no instante em que você olhou. Deixá-lo faria a tela
continuar pedindo atenção para algo já resolvido.

**Confirmar não reescreve nada** — categoria, regra e chave congelada continuam
como estavam. Confirmar é dizer "a regra acertou", não classificar de novo.

## A procedência que vem do cliente é filtrada, não confiada

O botão de sugestão manda qual das quatro fontes da A4 ele representa. A action
só aceita uma das quatro; qualquer outra coisa vira escolha **manual**.

Não é defesa contra ataque — mentir sobre a própria procedência só prejudica
quem mente. É que procedência não confiável não serve para responder "por que
isso caiu aqui?", que é a única razão de a C3 existir.

E o `check` de `transactions` recusaria a combinação inválida com erro de banco;
filtrar aqui devolve uma frase em vez de um 500.

## O toque duplo não pode gravar duas vezes

O botão fica desabilitado enquanto a gravação está em voo. Sem isso, dois
toques no celular — que acontecem — gravariam duas decisões para o mesmo
lançamento.

Por isso `AcaoDeDecidir` é um componente só, usado nos três lugares com
aparências diferentes: duplicar o `useTransition` garantiria que um deles
esqueceria.

## Avançar é consequência, não código

`revalidatePath("/revisao")` e o lançamento decidido sai da fila; o próximo vira
o primeiro. Não existe índice, nem `?n=`, nem estado de navegação para
dessincronizar.

E é isso que faz dois aparelhos ao mesmo tempo funcionarem, como a spec pede: o
segundo vê o que o primeiro já decidiu ao avançar.

**Sucesso não mostra aviso.** O próximo lançamento aparecendo no lugar deste
**é** o aviso. Só o erro fala.

## O "Voltar" continua apagado

Ele é a D6: desfazer a gravação anterior é outra escrita. Fingir que funciona
seria pior do que ele estar visivelmente desabilitado.

## Provado contra o banco de verdade

| | |
|---|---|
| Grava a decisão do dono | ok |
| Outra conta não altera nada — 0 linhas | ok |
| A categoria continua sendo a do dono | ok |
| A conferência pega categoria de outra conta — 0 linhas | ok |
| Categoria sem dizer como continua recusada | ok |
| "Fora do cálculo" marca sem inventar categoria | ok |

Transação revertida; nada ficou no banco.

## Edge cases

| Situação | Tratamento |
|---|---|
| Id de outra conta | 0 linhas, e a mesma mensagem de "não encontrado" |
| Categoria de outra conta | Recusada antes do update |
| Lançamento já decidido noutro aparelho | 0 linhas, mensagem pedindo recarregar |
| Toque duplo | Botão desabilitado em voo |
| Erro inesperado | Frase, e nada alterado |

## Fora do escopo

- A pergunta "sempre classificar assim?" → D5
- "Voltar" desfazer → D6

## Critério de pronto (da Etapa 2)

- [ ] Tocar numa categoria grava e avança
- [ ] `user_id` sempre da sessão
- [ ] O id do lançamento entra no `where` junto com o `user_id`
