# Plano — B1 e B2, o pote passa a saber sua meta

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** B1 (o percentual chega à tela sem ser desenhado) e B2 (a escrita)
**Spec:** `specs/13-metas-por-pote.md`

⚠ **A tela continua idêntica.** A B1 carrega um campo que ninguém desenha; a
B2 escreve por um caminho que ninguém chama. As duas juntas são a metade
invisível da funcionalidade — e o critério de pronto é o mesmo da fase A: a
`/categorias` não muda de aparência.

---

## A decisão que molda o plano: a recusa vira cláusula, não `if`

O pote de renda não recebe meta. O desenho óbvio é ler o pote, conferir o
`tipo`, e então gravar — duas idas ao banco e uma janela entre elas.

O caminho escolhido é **uma** ida:

```sql
update buckets set percentual_meta = ?
 where id = ? and user_id = ? and tipo = 'gasto'
```

As três condições são a mesma frase dita ao banco: _"o pote existe, é seu, e é
de gasto"_. Nenhuma delas pode ser esquecida num `if` que alguém remova depois,
e não há instante entre conferir e gravar.

⚠ **O custo é que a falha fica muda:** zero linhas atualizadas não diz **qual**
das três condições falhou, e as três precisam de frases diferentes. A saída é
consultar **só no caminho de falha** — que é raro — para descobrir o que dizer.
O caminho feliz continua com uma consulta.

---

## Arquivos a modificar

### `src/features/categorias/gerir-categorias/categoriasNaTela.ts` `BACK`

`PoteNaGestao` ganha um campo:

```ts
/** `buckets.percentual_meta`. Nulo é **sem meta**, e nunca 0%. */
percentual: number | null;
```

Nada mais. `agruparParaGerir` não muda — ela distribui categorias por pote e não
olha para dentro do pote.

### `src/features/categorias/gerir-categorias/listarParaGerir.service.ts` `BACK`

Uma linha no `select` dos potes: `percentual: buckets.percentualMeta`.

⚠ **Nenhuma consulta nova.** A coluna já está na tabela que a consulta já lê;
o custo é zero e a promessa da spec ("nenhuma migration, nenhuma consulta nova")
continua verdadeira.

---

## Arquivos a criar

### `src/features/categorias/definir-meta/definirMeta.service.ts` `BACK`

`server-only`. Uma função:

```ts
export type ResultadoDaMeta =
  | { ok: true }
  | { ok: false; erro: string };

export async function definirMeta(
  userId: string,
  poteId: string,
  texto: string,
): Promise<ResultadoDaMeta>;
```

- Chama `lerPercentual` (A1) **antes de tocar no banco**. Recusa do usuário não
  merece uma ida ao Postgres, e é a mesma função que o campo usou — é
  compartilhar o mecanismo, não a decisão.
- `update … where id and user_id and tipo = 'gasto'`, com `.returning({ id })`.
- Linha atualizada → `{ ok: true }`.
- Nenhuma linha → **aí sim** um `select` do pote por `id` + `user_id`, só para
  escolher a frase:

| O que a consulta de falha achou | Frase |
| ------------------------------- | ----- |
| nada | "Esse pote não existe mais. Recarregue a tela." |
| um pote de `tipo = "renda"` | "O pote de renda não tem meta — ele é o que entra, não o que se reparte." |

⚠ **"Não existe" e "não é seu" dão a mesma frase**, que é a régua da D5 da spec
02 e já está escrita no `mexerNaCategoria.service.ts`: a tela não conta a quem
não é dono que o pote existe.

### `src/features/categorias/definir-meta/definirMeta.action.ts` `BACK`

`"use server"`. `garantirUsuario()`, chamada, `revalidatePath`, `try/catch`.

- Revalida **`/categorias` e `/dashboard`**, e **não** `/revisao`: mudar a meta
  não mexe em classificação nenhuma. É por isso que esta action não reusa o
  `revalidarTudo` do `gerirCategorias.action.ts` — o conjunto de telas afetadas
  é outro, e copiar o dele seria copiar uma decisão que não é esta.
- Do cliente vêm **`poteId` e texto**. O `userId` sai de `garantirUsuario()`.

---

## Reuso identificado

| O que | Onde | Uso aqui |
| ----- | ---- | -------- |
| `lerPercentual` | `definir-meta/percentual.ts` (A1) | A validação do servidor. A mesma do cliente |
| `mexerNaCategoria.service.ts` | `gerir-categorias/` | O **padrão** do `and(eq(userId))` e das frases de "não existe mais". Copiar a disciplina, não o código |
| `comRevalidacao` | `gerirCategorias.action.ts` | ⚠ **Não dá para importar**: um arquivo `"use server"` só exporta função assíncrona. Se um terceiro caso aparecer, o helper sai para um módulo comum — dois ainda não são padrão |
| `getDb` | `lib/db.ts` | Como todo serviço |

---

## Caminho feliz

1. (Fase C) o campo manda `poteId` e `"20"`.
2. `lerPercentual("20")` → 20.
3. Um `update`, uma linha, `{ ok: true }`.
4. `revalidatePath` nas duas telas; o painel recalcula a meta na próxima
   renderização, **sem novo upload**.

---

## Edge cases

| Caso | O que acontece |
| ---- | -------------- |
| Texto vazio | `percentual_meta = null`. É o gesto de tirar a meta, e é um sucesso |
| `poteId` vazio ou lixo | Nenhuma linha; a consulta de falha não acha nada; frase de "não existe mais" |
| Pote de outra conta | Idêntico ao de cima, **de propósito** |
| Pote de renda | Frase própria, vinda da consulta de falha |
| Mesmo valor que já estava | Uma linha atualizada, `ok: true`. Não vale a pena distinguir "não mudou nada" |
| Pote apagado entre abrir a tela e salvar | Frase de "não existe mais" |

---

## Erros

- **Recusa do usuário** (texto inválido): volta de `lerPercentual`, sem banco.
- **Recusa de estado** (pote sumiu, pote de renda): frase da consulta de falha.
- **Exceção** (banco fora, rede): `console.error` na action e uma frase genérica,
  como no `gerirCategorias.action.ts`. ⚠ O erro do Postgres **não** vai para a
  tela — ele nomeia tabela e coluna.

---

## Banco de dados

**Nenhuma migration.** Um `update` numa coluna que existe desde a spec 03, e um
`select` que só roda quando algo deu errado.

---

## ⚠ Desvio do que a tarefa B2 prometeu

A tarefa dizia: _"um teste cobre pote de renda recusado e percentual inválido
recusado"_.

**O segundo já existe** — é a A1, e o serviço chama exatamente a função testada
lá. **O primeiro não vai existir**, e é melhor dizer por quê: a recusa do pote
de renda virou `and tipo = 'gasto'` **dentro do SQL**, e este projeto não tem
teste de banco — o `vitest.config.mts` roda só `.ts` puros, sem Postgres.

Escrever um teste com o banco fingido provaria que o dublê devolve o que eu
mandei ele devolver. A garantia real é a cláusula estar lá, e ela está numa
linha só, visível na revisão.

---

## ⚠ Desvio na execução: o tipo achou um segundo leitor

O plano dizia _"`git diff` mostra duas linhas em arquivos existentes"_. São
**quatro arquivos**, e a diferença é informação, não erro.

Assim que `percentual` virou campo obrigatório de `PoteNaGestao`, o `tsc`
apontou dois outros lugares que produzem esse tipo:

| Arquivo | O que era |
| ------- | --------- |
| `revisar-lancamento/listarPendentes.service.ts` | a `/revisão` também lista potes — é onde se cria categoria nova |
| `gerir-categorias/categoriasNaTela.test.ts` | o fabricador de pote dos testes |

A escolha foi **carregar a coluna nos dois** em vez de afrouxar o tipo. Um
`percentual?: number | null` opcional deixaria o compilador quieto e criaria a
pergunta "este pote tem meta ou só não veio?" em toda leitura futura.

A `/revisão` carrega um número que não desenha. É barato — a coluna sai da
tabela que aquela consulta **já lê**, sem consulta nova — e o motivo cabe numa
frase: `PoteNaGestao` é **um pote**, e um pote tem meta.

⚠ E o episódio vale por si: **foi o tipo que encontrou o segundo leitor**, não
uma busca minha. Se o campo fosse opcional, ninguém teria sido avisado.

## Como saber que B1 e B2 ficaram prontas

1. `npm test`, `tsc`, `lint` e `format:check` limpos.
2. A `/categorias` **idêntica** — o percentual chega ao componente e ninguém o
   desenha.
3. `git diff` mostra duas linhas em arquivos existentes (o campo e o `select`);
   o resto é arquivo novo.
