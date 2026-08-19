# Plano — D6 · Estado vazio do painel deixa de mentir

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D6 de `specs/02-upload-de-extrato.tarefas.md`
**Camada:** FRONT-INTEGRADO
**Depende de:** D2 (existirem lançamentos)

## O escopo, e o que ele não é

**Não é o painel.** Potes, gasto por categoria, comparação com o mês anterior:
tudo isso depende da classificação existir, e tem spec própria.

A D6 resolve uma frase. Depois de você importar 54 lançamentos, `/dashboard`
dizia "Nenhum mês fechado ainda". Uma tela que nega o que você acabou de fazer
ensina a não confiar nela — e a partir daí nenhum número que ela mostrar vai
valer muito.

## O que a tela passa a dizer

| Número | De onde vem |
|---|---|
| Lançamentos | `count(*)` |
| Sem categoria | `status = 'importado' and categoria_id is null` |
| Para revisar | `status = 'revisao_pendente'` |
| Fora do cálculo | `status = 'excluido'` |
| Meses no banco | `select distinct mes_referencia` |

Mais um aviso dizendo, com todas as letras, que **o painel ainda não existe** e
que classificar é o próximo passo. Sem isso a tela viraria uma segunda mentira,
mais sutil: números reais sugerindo que os potes estão logo ali.

`count(*) filter (where …)` faz as quatro contagens numa varredura só.

## `/revisao` entra junto

Não estava na lista, e entra pelo mesmo motivo. Assim que a importação passou a
marcar pares que se anulam, `"Nada para revisar"` virou mentira ali também.
Corrigir o painel e deixar a outra mentindo seria mudar o problema de lugar.

Ela também não ganha a tela de decidir — diz quantos esperam e que a tela de
decisão é spec própria.

## Edge cases

| Situação | Tratamento |
|---|---|
| Nenhum lançamento | O estado vazio de antes, intacto. Ali ele é verdade |
| Importou e desfez | Volta ao estado vazio: a contagem é ao vivo |
| Só lançamentos excluídos | `total > 0`, então mostra o resumo. Eles existem |
| Lançamentos de outro dono | `where user_id` — verificado contra o banco |

## Critério de pronto (da Etapa 2)

- [ ] Com lançamentos, `/dashboard` para de dizer "nada por aqui ainda"
- [ ] Diz quantos esperam classificação
- [ ] Aponta para a próxima etapa — inclusive dizendo que ela ainda não existe
