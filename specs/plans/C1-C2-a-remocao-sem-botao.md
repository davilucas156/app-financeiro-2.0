# Plano — C1 e C2, a remoção sem botão

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** C1 (apagar os envios de um mês, numa transação) e C2 (as duas actions)
**Spec:** `specs/14-remover-um-mes.md`, Descoberta 4 e Pendência 1

⚠ **Esta fase ganha o `delete`, e ainda não tem botão.** Ao fim dela nada na
tela mudou e nada é chamado por ninguém — o que também quer dizer que um erro
aqui não pode apagar nada de ninguém antes da fase D.

---

## A decisão que molda o plano: ler antes de apagar seria uma corrida

O rascunho óbvio reaproveita a B2: pergunta quais envios formaram o mês, e
depois apaga aqueles ids.

```ts
// ✗ o rascunho que abre uma janela
const linhas = await enviosDoMes(userId, mes); // lê com getDb()
await getDb().transaction(async (tx) => {
  /* apaga os ids que vieram */
});
```

⚠ **Entre a leitura e a transação cabe um envio novo.** Outra aba aberta na
`/upload`, um envio que estava em voo, e o mês passa a ter um terceiro arquivo
que a confirmação não mostrou e a deleção não leva. Sobra meio mês — o estado
que a spec 14 diz ser pior que o mês errado, porque a tela o mostraria como se
fosse escolha.

**Então a C1 não lê e depois apaga: ela apaga com a pergunta dentro.**

```sql
delete from transactions
where  user_id = $userId
  and  import_id in (
         select import_id from transactions
         where user_id = $userId and mes_referencia = $mes
       )
returning import_id
```

O Postgres avalia a subconsulta contra o instantâneo do início do comando, então
o conjunto é decidido e apagado sem janela entre as duas coisas. Os `import_id`
que voltam são **exatamente** os envios a remover em seguida — não uma segunda
opinião sobre quais eram.

⚠ **A confirmação da tela continua podendo ficar velha**, e isso é aceitável de
um jeito que meio mês não é: o pior caso passa a ser "saiu um envio a mais do
que a tela disse", que é o mês inteiro saindo — o que foi pedido. Nunca "saiu
metade".

---

## A conferência de dono muda de forma, e é de propósito

O `desfazerImportacao` faz um `select` de dono **antes** de qualquer deleção. Ele
precisa: recebe um `importId`, que é uma alça global — sem perguntar, um id de
outra pessoa entraria no `delete`.

⚠ **Aqui a entrada é um mês, que não é alça de nada.** `"2026-06"` só vira
conjunto de linhas depois de cruzar com `user_id`, e o `user_id` sai de
`garantirUsuario()`. O mês de outra pessoa simplesmente não casa: a subconsulta
devolve vazio e o `delete` não apaga nada.

Uma consulta de dono aqui não protegeria nada e daria a impressão de que protege.
Fica escrito no docblock, porque a diferença com o `desfazerImportacao` — que é
o arquivo ao lado e o modelo declarado — vai parecer descuido.

---

## Arquivos a criar

### `src/features/painel/remover-o-mes/removerOMes.service.ts` `BACK`

`server-only`.

```ts
export type ResultadoDaRemocao =
  | { ok: true; envios: number; lancamentos: number }
  | { ok: false; erro: string };

export async function removerOMes(
  userId: string,
  mes: string,
): Promise<ResultadoDaRemocao>;
```

Corpo, numa transação só:

1. **Recusa `mes` fora do formato** antes de tocar no banco, com a mesma regex
   do `check` do schema (`^\d{4}-\d{2}$`). É a disciplina do `UUID.test()` do
   `desfazerImportacao`: o que nunca existiria não vira consulta.
2. O `delete` de `transactions` acima, com `returning({ importId })`.
3. `delete` em `imports` com `inArray(imports.id, <ids distintos do returning>)`
   **e** `eq(imports.userId, userId)`, com `returning({ id })` para contar.
4. Devolve `{ ok: true, envios, lancamentos }`.

⚠ **Os lançamentos saem explicitamente, e não pelo `on delete cascade`.** Não é
desconfiança do cascade — ele fica no schema como rede. É que o `returning` é o
que dá o número do que **de fato** saiu, e é dele que sai a lista de envios a
apagar. É a mesma escolha do `desfazerImportacao`, pelo mesmo motivo.

⚠ **Zero envio não é erro, é mês que já saiu** — ou palpite de URL. Devolve
`{ ok: true, envios: 0, lancamentos: 0 }`, como o `restaurarMetasDoPadrao` faz
com a conta vazia. Quem transforma isso em recusa na tela é a action.

### `src/features/painel/remover-o-mes/removerOMes.action.ts` `BACK`

`"use server"`, com duas exportações e um motivo para cada uma.

```ts
export async function resumoDaRemocao(mes: string): Promise<ResultadoDoResumo>;
export async function removerMes(
  _anterior: ResultadoDaRemocao | null,
  dados: FormData,
): Promise<ResultadoDaRemocao>;
```

**`resumoDaRemocao`** — `garantirUsuario()` → `enviosDoMes` (B2) →
`oQueSaiDoMes` (B1). É aqui que consulta e regra se juntam, e é por isso que
nenhuma das duas fazia isso sozinha.

⚠ **Mês sem envio vira `{ ok: false }` com a frase de recusa**, e não um resumo
vazio. Assim a tela tem uma ramificação só, e nunca chega a desenhar uma
confirmação de "apagar nada".

**`removerMes`** — assinatura de `useActionState`, como o `desfazerEnvio`. Do
cliente vem **só o mês**; o `user_id` sai de `garantirUsuario()`.

⚠ **A revalidação inclui `/revisao`**, e é a menos óbvia das quatro: remover um
mês pode levar lançamentos que estavam esperando decisão, e o contador da fila
aparece no painel. As outras três são `/dashboard` (perdeu um mês), `/upload` (a
lista de envios encolheu) e `/comparativo` (o ano perdeu um mês).

⚠ **A action não redireciona.** Um `redirect()` dentro dela mataria o retorno, e
com ele a única chance de dizer que deu errado. Quem navega é o componente, na
fase D, depois de ver `ok: true`.

**Uma frase só para qualquer recusa**, como no `desfazerImportacao`: mês
inexistente, mês de outra pessoa e mês mal formado dizem o mesmo. Respostas
diferentes viram um jeito de descobrir o que existe.

---

## O que **não** entra nesta fase, e por quê

| O quê                                   | Por quê                                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Apagar `monthly_income` do mês           | Pendência 2: a renda foi **digitada**, não importada — e ela anda para a frente, então apagá-la mudaria o painel de meses vizinhos |
| Apagar regras criadas na revisão         | Pendência 3: regra é conhecimento, não dado do mês                                                        |
| Apagar `decision_undo`                   | Descoberta 5: `on delete cascade` no `transaction_id` já limpa. Uma deleção explícita aqui seria a segunda a fazer a mesma coisa |
| Apagar formatos do usuário (spec 11)     | Não têm relação com mês nenhum                                                                            |
| Qualquer `revalidatePath` em `/formatos` | Nada lá muda                                                                                              |

---

## Caminho feliz, bordas e erros

**Feliz:** mês com dois envios, nenhum atravessando a virada. Some o mês, somem
os dois envios da `/upload`, e o painel abre no mês vizinho pela regra da fase A.

**Bordas:**

- **Envio que atravessa a virada** — sai inteiro, com os lançamentos do mês
  vizinho. É a Pendência 1, aprovada pelo Davi, e a tela avisa antes.
- **Mês já removido noutra aba** — `envios: 0`; a action recusa com a frase.
- **`mes` mal formado** — recusado antes do banco.
- **Mês de outra pessoa** — não casa; indistinguível de mês inexistente, de
  propósito.
- **Conta sem nenhum lançamento** — mesmo caminho do mês inexistente.
- **Um envio cujos lançamentos estão todos noutro mês** — não entra, porque não
  tem linha no mês pedido. A subconsulta é a definição de "formou este mês".

**Erros:** exceção de banco é capturada na action, com a frase do
`desfazerEnvio.action.ts` — _"Não deu para desfazer agora. Nada foi apagado pela
metade."_ ⚠ E ela é **verdade por construção**, não promessa: as duas deleções
estão na mesma transação.

---

## Verificação

1. `npx vitest run` — a suíte inteira. ⚠ **Sem teste novo nesta fase, e é
   honesto dizer**: as duas peças são banco e sessão, e este projeto não tem
   teste de banco. O que dava para provar já foi provado na fase B; o resto é a
   conferência do Davi na fase E.
2. `npx tsc --noEmit`, `npx eslint .`, `npm run format:check`, `npx next build`.
3. ⚠ **Nada a conferir na tela** — se a fase C estiver certa, o app está
   idêntico. Um `delete` que ninguém chama é um `delete` que não apaga.
