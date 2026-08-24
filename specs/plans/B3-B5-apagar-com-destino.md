# Plano — B3, B4 e B5 · Apagar com destino, e o pote que sumiria

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** B3, B4 e B5 de `specs/05-categorias-do-usuario.tarefas.md`
**Camada:** BACK
**Arquivos:** `features/categorias/apagar-categoria/{raioX.service.ts,apagarCategoria.service.ts,aviso.ts}`,
`features/painel/painel-do-mes/painelDoMes.service.ts`

## Por que as três juntas

B3 e B4 são a mesma operação em dois tempos: contar para avisar, e então
executar o que foi avisado. Separá-las em entregas diferentes deixaria uma
contagem sem uso e uma execução sem aviso.

B5 entra porque **a B4 é quem torna o defeito alcançável**. Apagar a última
categoria de um pote passa a ser possível nesta entrega; sem a B5 no mesmo
commit, o pote sumiria da tela e ninguém saberia por quê.

## B3 — o raio-X

`raioXDaCategoria(userId, categoriaId)` devolve o que está pendurado e quem pode
receber. É o mesmo número que fez a D9 valer a pena: "já classificou 8"
transforma uma lista de textos numa lista de consequências.

### Um número que eu quase deixei mentir

O aviso da A3 diz *"os 12 voltam para a revisão"*. Mas um lançamento marcado
**fora do cálculo** que tinha categoria não volta para a fila: sair do cálculo
foi decisão do Davi e não depende de categoria nenhuma. Ele perde a
classificação e continua fora.

Então "12 voltam" seria falso quando 1 dos 12 está excluído — e falso exatamente
na tela de confirmação de uma operação destrutiva, que é o pior lugar possível.

O raio-X conta os dois: `lancamentos` (todos) e `foraDoCalculo` (o subconjunto
excluído). A A3 ganha a linha extra **só quando o subconjunto existe**, pela
mesma regra que já vale ali: número zerado numa frase de susto gasta atenção.

Para **mover** a distinção não importa — os excluídos vão junto com os outros, e
continuam excluídos no destino.

### Os destinos são todas as outras da conta

Restringir ao mesmo pote seria decidir por ele. Não ordenar seria fingir que
tanto faz. As do mesmo pote vêm primeiro, e o alerta da A3 cobre o resto.

## B4 — apagar

Uma transação, três passos: o que estava dentro vai para algum lugar, as regras
seguem o mesmo destino, a categoria some.

### A ordem das colunas não é preferência, é obrigação dos checks

| Destino | O `set` precisa, **na mesma linha** |
|---|---|
| Mover | `categoria_id` novo, `classificado_por = 'manual'`, `regra_id`, `regra_chave` e `fonte_da_sugestao` nulos |
| Devolver | os cinco nulos de uma vez |

`transactions_regra_chave_ck` exige `classificado_por = 'regra'` para a chave
existir; `transactions_fonte_sugestao_ck` faz o mesmo com a sugestão. Zerar a
classificação num update e limpar a procedência no seguinte derruba a transação
**entre um e outro** — a mesma forma da falha da descoberta 1.

### Mover é escolha sua, então a procedência passa a ser sua

`classificado_por = 'manual'`, com regra e chave limpas, e `classificado_em`
marcando agora. Mesma decisão da D6 e da D4 da spec 04: quando você redireciona,
a resposta para "como esta classificação surgiu?" passa a ser você, e manter a
regra pendurada diria que ela ainda explica algo que ela não explica mais.

⚠ **`status` e `motivo` não se mexem no mover.** Um valor alto em
`revisao_pendente` continua pedindo conferência; um excluído continua excluído.
Nenhum dos dois tem a ver com qual categoria o lançamento tem.

### Devolver trata o excluído à parte

Dois updates, separados **por status** e não por coluna: cada um zera as cinco
colunas de uma vez, então nenhum passa por estado inválido.

- não excluído → `revisao_pendente`, com `motivo` dizendo que a categoria foi
  apagada. Sem esse motivo, o lançamento reapareceria na fila sem explicação;
- excluído → mantém `status` e `motivo`. Ressuscitar uma decisão de "fora do
  cálculo" porque a categoria mudou seria pior do que qualquer coisa que a
  categoria pudesse causar.

### As regras seguem o destino

**Mover** as aponta para a categoria nova. Sem isso, apagar desligaria a
classificação em silêncio: no mês seguinte os mesmos lançamentos voltariam
pendentes e nada na tela explicaria por quê.

A chave não muda, então o `(user_id, chave)` único não tem como estourar — o que
elas procuram continua o mesmo, só o destino mudou.

**Devolver** as apaga. O `cascade` já faria isso ao remover a categoria; apagar
explicitamente é o que permite contá-las e o que deixa a intenção escrita, em vez
de depender de um efeito colateral três tabelas adiante.

### Sem desfazer, e por isso a confirmação carrega os números

O "Voltar" é uma sombra por conta, desenhada para uma decisão de revisão.
Guardar 12 lançamentos e 2 regras nela seria outra tabela e outra promessa. A
defesa é a B3 na tela antes do segundo toque — a mesma escolha que a D9 fez.

⚠ **A sombra existente sobrevive**, porque a D6 já pagou essa conta: o `set null`
zera `decision_undo.categoria_id` e `restaurar()` devolve o lançamento como
pendente limpo. A verificação vai confirmar apagando uma categoria com sombra
pendurada — não para consertar nada, mas para provar que a B4 não desfez o que
a D6 fez.

### Mover para a própria categoria é recusado

Não é o toque repetido do `moverCategoria` — ali o estado pedido já era o
estado atual. Aqui a operação é impossível: o destino está prestes a deixar de
existir. Aceitar em silêncio apagaria os 12 lançamentos junto com a categoria.

## B5 — o pote que sumiria

`painelDoMes.service.ts` monta os potes a partir das **categorias**
(`innerJoin buckets`). Com o seed todo pote tem categoria, então isso nunca
apareceu.

**A B4 é quem torna o defeito alcançável.** Apagar a última categoria de um pote
faria o `innerJoin` não devolver linha nenhuma para ele — e a A3 da spec 04 é
explícita em sentido contrário: *"Pote ausente da tela não é o mesmo que pote
vazio."*

Correção: **os potes vêm da tabela de potes.** Duas consultas em vez de um join,
e não um `leftJoin`, porque uma seleção plana de duas tabelas num `leftJoin` não
carrega a nulidade no tipo — o TypeScript prometeria colunas que viriam nulas.
Duas consultas dizem a verdade sem depender disso, e as duas já cabem no
`Promise.all` que existe.

É a mesma lição de novo, terceira vez nesta base: derivar a estrutura dos dados
funciona até o dia em que os dados acabam.

## O que fica de fora

**A tela.** C1 e D1. Aqui nada sabe de requisição.

**Apagar em lote.** Nomeado na spec como atraente e perigoso: cada categoria
leva regras junto. Uma de cada vez, com o número na frente.

## Pronto quando

- o raio-X conta lançamentos, excluídos e regras, e lista os destinos possíveis;
- o aviso da A3 só menciona os excluídos quando existem;
- mover leva lançamentos e regras, com a procedência virando sua, sem tocar em
  `status`;
- devolver zera a classificação, manda os não excluídos para a fila com motivo,
  e apaga as regras;
- categoria e destino de outra conta são recusados; destino igual à categoria
  também;
- um pote sem categoria nenhuma continua no painel;
- verificado contra o Neon real com conta descartável.
