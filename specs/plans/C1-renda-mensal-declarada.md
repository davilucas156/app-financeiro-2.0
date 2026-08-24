# Plano — C1 · A renda mensal declarada

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** C1 de `specs/04-painel-do-mes.tarefas.md`
**Camada:** BANCO
**Arquivos:** `db/schema.ts` + migration `0010`,
`features/painel/renda-do-mes/rendaDoMes.service.ts`

## O que é

Onde guardar o número que o Davi informa como renda do mês. É a régua de todas
as metas: `meta_do_pote = percentual_meta% × renda_declarada_do_mês`.

## Uma linha por mês, e não uma na conta

A regra que já valeu três vezes nesta base: **não reescrever o passado**.

Uma renda única no `users` faria um aumento em dezembro mudar as metas de julho
retroativamente. Julho aconteceu com a renda de julho — e o comparativo anual da
spec 06 ficaria comparando o mesmo número consigo mesmo, doze vezes.

Chave primária `(user_id, mes_referencia)`. É a idempotência morando no banco,
como em `transactions.impressao` e `classification_rules.chave`: informar duas
vezes o mesmo mês atualiza, nunca duplica.

## Herdar é leitura, não escrita

O mês novo mostra a renda do anterior **sem gravar nada**. Uma consulta só:

```sql
where user_id = ? and mes_referencia <= ?
order by mes_referencia desc limit 1
```

Gravar a herança seria mais fácil de consultar e criaria uma mentira: doze
linhas dizendo "o Davi informou R$ 1.200 em dezembro" quando ele informou uma
vez, em janeiro. Editar janeiro depois não corrigiria nenhuma delas.

⚠ `mes_referencia` é `YYYY-MM` em texto, e a ordenação alfabética **é** a
cronológica nesse formato — `2026-07` > `2026-06` > `2025-12`. É por isso que
o formato foi escolhido lá na spec 02, e é o que faz esta consulta funcionar
sem conversão de data.

## A leitura devolve **de onde** o número veio

Não só o valor. O risco que a spec nomeou:

> A renda declarada pode envelhecer em silêncio. Seis meses depois de um
> aumento, as metas continuam calculadas sobre o salário antigo e ninguém
> avisou.

Devolvendo `mesDeOrigem` e `herdada`, a tela pode dizer "R$ 1.200 · herdada de
junho" — e a defesa contra o envelhecimento fica visível em vez de escrita num
comentário.

## Renda zero é diferente de renda não informada

`null` = nunca informou → sem meta, sem barra, e a tela pede o número.
`0` = informou zero → meta zero, e qualquer gasto estoura.

São estados diferentes e o banco distingue: linha ausente contra linha com
valor. Um `default 0` na coluna apagaria a diferença e faria toda conta nova
nascer com metas zeradas.

## Pronto quando

- a tabela existe, com `(user_id, mes_referencia)` como chave;
- gravar duas vezes o mesmo mês atualiza, não duplica;
- ler um mês sem linha devolve a do mês anterior, marcada como herdada;
- ler antes de qualquer declaração devolve `null`, não zero;
- apagar o usuário leva as linhas junto;
- verificado contra o Neon real.
