# Plano — C1 e C2 · Tabelas `transactions` e `imports`

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** C1 e C2 de `specs/02-upload-de-extrato.tarefas.md`
**Camada:** BANCO
**Spec:** `specs/02-upload-de-extrato.md`, "Dados — tabelas tocadas"
**Depende de:** fase A e aprovação visual da fase B (dada pelo Davi)

## Juntas porque são uma migration só

`transactions.import_id` aponta para `imports.id`. Criar uma sem a outra
deixaria a chave estrangeira pendurada. Mesmo precedente da C3 na spec 01, que
criou `buckets` e `categories` no mesmo passo.

## `imports` — o registro de cada arquivo enviado

Não está no `readme.md`, e existe por duas perguntas que nada mais responde:

1. **"Esse arquivo já foi enviado?"** → `unique (user_id, hash)`. Hash do
   **conteúdo**, não do nome: banco chama tudo de `extrato.csv`, e os dois
   arquivos do Davi já vieram renomeados por gente.
2. **"O que apagar quando o usuário desfizer?"** → `transactions.import_id`.
   Sem isso, desfazer viraria adivinhação sobre quais linhas vieram de qual
   envio.

| Coluna | Por quê |
|---|---|
| `user_id` | Isolamento. Toda consulta filtra por ele |
| `mes_referencia` | `YYYY-MM`. O mês que o usuário escolheu |
| `origem` | `csv_conta` / `csv_cartao` |
| `nome_arquivo` | Só para exibir. **Não** é identidade |
| `hash` | Identidade de verdade |
| `url_no_blob` | Nulo até a D1 existir |
| `lancamentos_importados`, `linhas_ignoradas` | O resumo, congelado no momento do envio |

O resumo fica guardado porque a tela de histórico (B3) o mostra meses depois, e
recontar exigiria reler o arquivo.

## `transactions`

| Coluna | Nota |
|---|---|
| `data` | Coluna `date`, lida como **string** `YYYY-MM-DD` |
| `descricao_original` | Como veio do banco, com o alinhamento por espaço |
| `valor_centavos` | Inteiro, sempre **positivo** |
| `direcao` | `entrada` / `saida` — informação de verdade, ver A3 |
| `status` | `importado` / `revisao_pendente` / `excluido` |
| `motivo` | Por que caiu em revisão ou saiu do cálculo |
| `par_de` | Impressão do outro lado do par |
| `mes_referencia` | `YYYY-MM` |
| `origem` | Casa com `imports.origem` |
| `impressao` | A chave anti-duplicata da A4 |
| `parcela`, `categoria_do_banco` | Só do cartão |
| `categoria_id` | **Nulo** até a spec de classificação |

### `data` é `date`, e é lida como string

Um `timestamp` obrigaria a escolher um horário que não existe no extrato, e a
leitura no fuso errado moveria o lançamento de dia — e às vezes de mês, num
produto cujo eixo é o mês de referência. A A3 já produz `YYYY-MM-DD` por esse
motivo; a coluna só continua a decisão.

### `par_de` guarda a impressão, não um id

Na hora de inserir, o outro lado do par ainda não tem `id`. Guardar a impressão
resolve sem exigir duas passadas de escrita, e a impressão é estável — é
exatamente a mesma se o arquivo for reimportado.

## Os dois únicos que carregam esta funcionalidade

| Restrição | O que garante |
|---|---|
| `unique (user_id, impressao)` | Reimportar não duplica lançamento |
| `unique (user_id, hash)` | Reenviar o mesmo arquivo é reconhecido |

**A idempotência mora no banco, não em `if`.** É a mesma decisão que
`(user_id, slug)` tomou pelos potes na D7 da spec 01, e funcionou: duas
requisições simultâneas não conseguem furar uma restrição de unicidade, e
nenhuma checagem em código consegue prometer isso.

`(user_id, impressao)` e não `impressao` sozinha: a impressão não inclui o
usuário, então dois usuários com o mesmo lançamento colidiriam — e o segundo
perderia um lançamento real por causa do primeiro.

## Texto com `check`, não `enum` do Postgres

`direcao`, `status`, `origem` e os formatos de `mes_referencia` viram `text`
com restrição `check`.

`enum` do Postgres daria o mesmo controle, mas acrescentar um valor exige
`ALTER TYPE` — e a spec de classificação vai acrescentar status. `check` se
troca numa migration comum.

## Apagar em cascata, e o que **não** cascateia

| Apagar | Leva junto |
|---|---|
| `imports` | Os `transactions` daquele envio — é o desfazer da D5 |
| `users` | Tudo daquele usuário |
| `categories` | **Nada.** `transactions.categoria_id` vira nulo |

A última é deliberada: apagar uma categoria não pode apagar meses de histórico
financeiro. O lançamento fica, sem categoria, e volta para revisão.

## Índices

- `(user_id)` nas duas — toda consulta começa por ele
- `(user_id, mes_referencia)` — a consulta do dashboard
- `(import_id)` — o desfazer

## Edge cases

| Situação | Tratamento |
|---|---|
| Import apagado | Lançamentos vão junto |
| Dois usuários com o lançamento idêntico | Não colidem: o único inclui `user_id` |
| Lançamento de mês diferente do `mes_referencia` do import | Permitido. É o caso da parcela de março na fatura de julho |
| `par_de` apontando para lançamento apagado | Fica pendurado; é só um palpite de revisão, não integridade |

## Fora do escopo

- Gravar → **D2**
- Blob → **D1**
- Classificar → próxima spec

## Critério de pronto (da Etapa 2)

- [ ] `transactions` com todas as colunas, índice por `user_id` e por `mes_referencia`
- [ ] `unique (user_id, impressao)`
- [ ] `imports` com `unique (user_id, hash)`
- [ ] Apagar um import leva os lançamentos dele
- [ ] Migration aplicada
