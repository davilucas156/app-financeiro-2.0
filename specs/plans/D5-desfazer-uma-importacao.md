# Plano — D5 · Desfazer uma importação

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D5 de `specs/02-upload-de-extrato.tarefas.md`
**Camada:** BACK + FRONT-INTEGRADO
**Spec:** `specs/02-upload-de-extrato.md`
**Depende de:** C1, C2 (as tabelas), D2 (quem grava), D4 (a lista)

## Por que isto existe

Sem desfazer, o primeiro erro é permanente. Você importa a fatura no mês
errado, percebe, e a única saída seria eu abrir o banco por fora. Um app em
que o usuário não consegue corrigir o próprio engano é um app que ele usa com
medo.

## O que some, exatamente

| Some | Fica |
|---|---|
| A linha em `imports` | Todo lançamento vindo de **outro** arquivo |
| Os lançamentos daquele arquivo | Os potes, as categorias, a conta |

O `import_id` é o que torna isso preciso. Sem ele, "apagar junho" teria de
adivinhar quais linhas vieram de qual envio — e o mês de junho tem lançamentos
de dois arquivos diferentes.

## Contagem honesta

Apago os lançamentos **explicitamente**, com `returning`, e conto o que voltou.
Podia confiar no `on delete cascade` e reportar o `lancamentos_importados`
congelado no envio, mas aí o número na tela seria o que eu *esperava* apagar, e
não o que apaguei. O cascade continua no schema como rede de segurança — se
algum caminho futuro apagar um `import` por outra porta, os lançamentos ainda
vão junto.

As duas deleções numa transação só: metade desfeito é pior do que nada
desfeito.

## `user_id` no `where`, não só na leitura

```sql
delete from transactions where import_id = $1 and user_id = $2
```

O `import_id` vem do cliente — é o único caminho possível, a tela precisa dizer
*qual*. Então ele é tratado como palpite: o `user_id` da sessão entra no
`where` e é o banco que garante que um id de outra pessoa não apaga nada
(`references/architecture.md`, Thin Client / Fat Server).

**Envio inexistente e envio de outro dono devolvem a mesma mensagem.** Se a
resposta diferenciasse os dois, ela viraria uma forma de descobrir quais ids
existem.

## Reimportar depois

Funciona sozinho: o `unique (user_id, hash)` some junto com a linha, e o
`unique (user_id, impressao)` some com os lançamentos. Nada a limpar. É o mesmo
arquivo entrando de novo pela porta da frente.

## A confirmação diz o que vai sumir

O texto que você aprovou na B3, agora com os números reais:

> **Apagar 21 lançamentos de Junho / 2026?**
> Vieram de Extrato-…-CSV.csv, enviado em 18/08 às 21h. Só estes somem — o que
> veio de outros arquivos fica. Dá para enviar o mesmo arquivo de novo depois.

Um "tem certeza?" genérico pede certeza sem dar a informação que ela exige.

Não uso `confirm()` do navegador: no celular ele aparece com o nome do domínio
em cima e dois botões do sistema, e não cabe uma frase explicando o que some.

## Onde o cliente entra, e só aí

A lista continua sendo server component. O que vira `"use client"` é **uma
linha da lista** — ela precisa lembrar se está pedindo confirmação, e isso é
estado de tela, que não existe no servidor.

| Arquivo | Camada |
|---|---|
| `desfazerEnvio.service.ts` | `server-only`, a transação |
| `desfazerEnvio.action.ts` | `"use server"`, sessão + `revalidatePath` |
| `LinhaDeEnvio.tsx` | `"use client"`, o estado de confirmação |
| `MesesImportados.tsx` | servidor, só distribui |

## O arquivo no Blob — deliberadamente adiado

O critério da Etapa 2 pede que o arquivo no Blob suma junto. **Não faço isso
agora**, e não é esquecimento: a D1 ainda não existe, `url_no_blob` é nulo em
toda linha, e o `@vercel/blob` nem está instalado.

Escrever a remoção agora seria escrever um caminho que nunca executa e que eu
não teria como provar. Gravar e apagar no Blob são a mesma decisão e devem ser
testadas juntas — então esse pedaço vai para a **D1**, e a linha na lista de
tarefas foi movida para lá.

## Edge cases

| Situação | Tratamento |
|---|---|
| Tocar Desfazer duas vezes | Botão desabilitado enquanto apaga; a segunda deleção não acha nada e responde a mesma coisa |
| Envio já apagado noutra aba | "Esse envio não está mais aqui." A lista volta atualizada |
| Id de outra pessoa | Idem. Nada apagado, nada revelado |
| Id que não é uuid | Recusa antes de tocar no banco |
| Envio com zero lançamentos | Apaga a linha do `imports`. Era esse o alvo |
| Banco cai no meio | A transação desfaz sozinha. A lista continua como estava |

## Fora do escopo

- Apagar o arquivo do Blob → **D1**
- Desfazer o desfazer → não existe. É o que a confirmação está protegendo
- Editar um lançamento solto → spec de revisão

## Critério de pronto (da Etapa 2)

- [ ] Apagar um envio remove os lançamentos dele **e mais nada**
- [ ] Exige confirmação
- [ ] O mesmo arquivo pode ser reenviado depois
- [ ] ~~O arquivo no Blob some junto~~ → movido para a D1
