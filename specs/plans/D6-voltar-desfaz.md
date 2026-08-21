# Plano — D6 · Voltar desfaz

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D6 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** FRONT-INTEGRADO — **mais um pedaço de BANCO que a tarefa não previa**
**Arquivos:** `schema.ts` + migration `0009`, `desfazerDecisao.service.ts`,
`decidirLancamento.service.ts`, `listarPendentes.service.ts`,
`TelaDeRevisao.tsx`, `AcaoDeVoltar.tsx`

## O que é

O "Voltar" está apagado desde a D4. Ele reabre o lançamento anterior e desfaz a
gravação dele. Se aquela decisão criou uma regra, **a regra fica**.

## O problema que a tarefa não enxergava: desfazer precisa saber o "antes"

`UPDATE ... RETURNING` no Postgres devolve o valor **novo**. No instante em que
a decisão grava, o estado anterior deixa de existir — e sem ele não há desfazer,
só um chute.

E o chute é ambíguo de verdade. Um pendente da fila pode estar em três estados
diferentes:

| Estado | Como chegou lá |
|---|---|
| Sem categoria, `importado` | Nenhuma regra bateu |
| Sem categoria, `revisao_pendente` | Par que se anula (spec 02) |
| **Com** categoria, `revisao_pendente` | Valor alto que uma regra classificou (D1) |

Reconstruir o terceiro é o que não fecha: a categoria que a regra tinha posto foi
sobrescrita pela sua. Eu teria de ir buscar na `classification_rules` — que a D9
deixa apagar — e a cadeia de deduções vira quatro elos, cada um um lugar de estar
sutilmente errado.

## Por isso o "antes" vira uma linha no banco

Uma tabela `decision_undo`, **uma linha por usuário**, com a sombra exata das
oito colunas que a decisão escreve.

Não é registro histórico e não é log: é o rascunho do último passo. Uma linha por
usuário é a própria promessa do botão — "reabre **o anterior**", singular. Sem
`if`, sem limpeza agendada, sem pilha que cresce.

### Por que não guardar isso no navegador

Seria de graça, e teria três defeitos:

1. **Some no recarregamento.** O botão existiria numa sessão e sumiria na
   seguinte, sem nada ter mudado — meia-verdade, que é o que este projeto recusa
   desde a D6 da spec 02.
2. **Não atravessa aparelho.** Decidir no celular e desfazer no computador não
   funcionaria.
3. **Estado de negócio vindo do cliente.** O `where` protege o lançamento; o
   conteúdo do desfazer não teria quem conferisse.

### Por que colunas de verdade, e não um `jsonb`

A sombra tem `categoria_id` e `regra_id` como chaves estrangeiras **com o mesmo
`set null`** que `transactions` usa. Se a categoria for apagada entre a decisão e
o desfazer, o Postgres cuida — num `jsonb` eu descobriria pelo erro de FK na hora
de restaurar.

O `set null`, porém, pode deixar a sombra incoerente com o `check` de
`transactions` (`categoria_id is null` = `classificado_por is null`). Então o
restaurar tem uma guarda: **sombra sem categoria volta como pendente limpo**. É
honesto — a categoria não existe mais, não há para onde voltar.

E a tabela **não** ganha os mesmos `check`s: um `set null` disparado por um
`delete` de categoria falharia o check e impediria apagar a categoria. O rascunho
do desfazer não pode ter poder de veto sobre o resto do app.

## O desfazer reabre **um** lançamento, não a cascata

Se a decisão criou regra e a regra pegou mais 4 irmãos, o desfazer devolve só o
seu lançamento. Os 4 continuam classificados **pela regra**, que continua
existindo.

É o que a tarefa manda ("desfazer uma classificação não é desfazer o
aprendizado"), mas é surpreendente se ninguém avisar. Então a linha do desfazer
guarda `regra_criada` e `irmaos`, e a tela avisa **antes**:

> Voltar reabre este lançamento. A regra que você criou continua valendo, e os
> 4 que ela pegou seguem classificados.

Avisar depois seria explicar um susto. Avisar antes é informação.

## O reaberto volta para o topo sozinho

A fila é ordenada por data. Você sempre decide o primeiro — logo tudo que já saiu
é anterior ao que está na tela. Reabrir devolve o item à posição 0 por
consequência da ordenação, sem índice, sem `?n=`, sem estado de navegação.

Mesma escolha da D4: avançar é consequência, não código.

## O buraco que quase passou: desfazer a última decisão do mês

Quando você classifica o último pendente, a tela vira "Nada pendente" — e o
"Voltar" mora dentro do componente do lançamento. O botão sumiria exatamente na
decisão mais provável de se querer desfazer.

O "Voltar" vai nos **dois** estados da tela.

## Escritas

**Decidir** (dentro da transação que já existe):

1. `select ... for update` do estado atual — é daqui que sai a sombra, e o
   `for update` impede dois toques simultâneos escreverem sombras trocadas;
2. o `update` de sempre;
3. `insert ... on conflict (user_id) do update` da sombra.

Falhar em qualquer ponto volta tudo: a sombra e a decisão nascem juntas ou não
nascem.

**Desfazer** (uma transação):

1. lê a linha do usuário — não tem, não há o que desfazer;
2. escreve as oito colunas de volta, `where id = ... and user_id = ...`;
3. **apaga a linha**. Não existe refazer, e um botão que desfaz duas vezes o
   mesmo passo seria pior do que um que desfaz uma.

## Pronto quando

- "Voltar" reabre o lançamento anterior com o estado exato que ele tinha —
  inclusive a categoria e a procedência da regra, no caso do valor alto;
- a regra criada continua existindo, e a tela diz isso antes;
- desabilitado quando não há nada a desfazer, inclusive na tela vazia;
- desfazer duas vezes seguidas não faz nada na segunda;
- verificado contra o Neon real, em transação revertida.
