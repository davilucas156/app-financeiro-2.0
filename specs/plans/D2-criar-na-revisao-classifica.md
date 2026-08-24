# Plano — D2 · Criar na revisão resolve o lançamento ali

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D2 de `specs/05-categorias-do-usuario.tarefas.md`
**Camada:** FRONT-INTEGRADO
**Arquivos:** `categorias/nomear-categoria/{criarEClassificar.service.ts,criarEClassificar.action.ts,NovaCategoriaNaRevisao.tsx}`,
`categorias/gerir-categorias/mexerNaCategoria.service.ts`,
`classificacao/revisar-lancamento/{decidirLancamento.service.ts,TelaDeRevisao.tsx}`

## Numa transação só, e o motivo não é elegância

Criar a categoria e classificar o lançamento são duas gravações. Se a segunda
falhar sozinha, sobra uma categoria vazia que ninguém pediu, no meio de uma
lista que só funciona enquanto cabe na cabeça — e o lançamento continua
pendente, então a pessoa tenta de novo e cria a segunda.

A transação não é para ser correta no papel. É para o segundo toque não
produzir "Farmácia" e "Farmácia 2".

## Nada de lógica nova: as duas metades já existem e vão ser abertas

| Metade | Onde | O que muda |
|---|---|---|
| Criar categoria | `criarCategoria` (B1) | ganha `criarCategoriaNaTransacao(tx, …)` por dentro; a função pública vira o invólucro que abre a transação |
| Classificar | `decidirLancamento` (D4 da spec 03) | ganha `decidirNaTransacao(tx, …)`; a pública vira o invólucro |

Escrever a classificação à mão aqui seria copiar a sombra do desfazer, o
`for update`, a limpeza de `regra_chave` e o `status`/`motivo` — a parte mais
sutil do projeto — para um segundo lugar que envelheceria sozinho.

⚠ **A conferência de dono da categoria entra na transação junto.** Hoje ela
roda antes de abrir a transação. Levá-la para dentro não custa nada e ela é uma
checagem que sempre pertenceu ao mesmo instante da gravação. Aqui ela relê uma
linha que acabou de ser inserida no mesmo `tx` — uma consulta a mais no caminho
mais raro dos dois.

## "Sempre classificar assim" não aparece neste caminho

Criar categoria, classificar e criar regra em um toque são três decisões, e a
terceira tem consequência no mês inteiro. A regra continua nascendo de onde
nasce hoje: uma correção sobre descrição real, na `PerguntaDeRegra`.

É a mesma razão pela qual a D4 da spec 04 não oferece "sempre" no painel.

## A assimetria dita em voz alta, antes e não depois

O "Voltar" desfaz a classificação e **não** apaga a categoria criada. É a mesma
régua da D6 — desfazer uma classificação não desfaz o aprendizado — e é
surpreendente se ninguém disser.

A frase fica **acima** do formulário, não num aviso depois de gravar: quem lê
antes decide sabendo; quem lê depois só descobre.

## Verificação

Rota temporária, conta descartável, `finally` limpando:

1. Criar-e-classificar num pendente: a categoria existe, o lançamento aponta
   para ela com `classificado_por = 'manual'`, e a sombra do desfazer guarda o
   estado anterior.
2. Nome repetido no mesmo pote: a operação é recusada **e o lançamento continua
   pendente** — é o teste de que a transação volta atrás inteira.
3. Um lançamento que uma regra já classificou: `regra_id` e `regra_chave` saem,
   como no "Ou troque a categoria".
