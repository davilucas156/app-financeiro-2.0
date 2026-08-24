# Plano — D1 · A tela de arrumação lê e grava de verdade

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D1 de `specs/05-categorias-do-usuario.tarefas.md`
**Camada:** FRONT-INTEGRADO
**Arquivos:** `features/categorias/gerir-categorias/{listarParaGerir.service.ts,gerirCategorias.action.ts,CartaoDaCategoria.tsx,TelaDeCategorias.tsx,dadosFalsos.ts}`,
`app/(app)/categorias/page.tsx`

> A fase B já sabe fazer tudo isto contra o Neon. A D1 não inventa operação
> nenhuma — ela liga fio.

## O que já existe e não se reescreve

| O que | Onde |
|---|---|
| `criarCategoria`, `renomearCategoria`, `moverCategoria` | `gerir-categorias/mexerNaCategoria.service.ts` (B1, B2) |
| `raioXDaCategoria` | `apagar-categoria/raioX.service.ts` (B3) |
| `apagarCategoria` | `apagar-categoria/apagarCategoria.service.ts` (B4) |
| `agruparParaGerir`, `podeMover`, `oQueDependeDela` | `gerir-categorias/categoriasNaTela.ts` (C1) |
| A forma da action com `garantirUsuario` + `revalidatePath` | `gerir-regras/mexerNaRegra.action.ts` (D9) |

Falta uma leitura: a B3 conta **uma** categoria, e a tela precisa de todas.

## A leitura nova conta em duas passadas, não numa junção

`transactions` e `classification_rules` apontam as duas para `categories`. Um
`left join` das três e `count(*)` daria o produto das duas pontas — 12
lançamentos e 2 regras viram 24 de cada. Não é um erro que a tela denuncia:
dobra o número e continua parecendo um número.

Duas consultas agrupadas por `categoria_id`, casadas em JS pelo id.

⚠ **Os potes vêm de `buckets`**, como na B5. Derivar da lista de categorias
faria o pote vazio sumir da única tela onde daria para criar uma categoria
dentro dele.

## O raio-X é relido no momento de apagar

O cartão já tem os números da listagem, e seria de graça reusá-los na tela de
confirmação. Não é o que a tarefa pede — ela diz *"com os números do raio-X
vindos da B3"* — e a diferença é a que importa:

A listagem foi renderizada quando a página abriu. Apagar acontece depois, e é
irreversível. Se um extrato entrou nesse meio-tempo, a tela diria "nunca foi
usada" e o botão desclassificaria trinta lançamentos em silêncio. O `apagar`
ainda faria a coisa certa com eles — a transação da B4 não depende do que a
tela mostrou — mas o **aviso** teria mentido, e o aviso é a única defesa que
esta operação tem.

Um round-trip a mais num toque que a pessoa dá de propósito.

Ele traz junto os `destinos` já ordenados pelo servidor, e com isso some a
montagem de candidatas que o protótipo fazia no cliente: duas listas com a
mesma regra de ordenação divergiriam.

## O que cada gravação revalida

| Operação | `/categorias` | `/dashboard` | `/revisao` |
|---|---|---|---|
| criar | ✅ | — | ✅ a lista de escolhas cresceu |
| renomear | ✅ | ✅ o nome aparece no painel | ✅ |
| mover | ✅ | ✅ mudou de pote, muda o rateio | ✅ |
| apagar | ✅ | ✅ | ✅ pode ter devolvido lançamentos para a fila |

Revalidar a mais é barato; revalidar a menos deixa uma tela mostrando um mundo
que já mudou.

## `dadosFalsos.ts` morre aqui

Mesma mecânica do `/painel` da spec 04, que foi apagado inteiro quando o
`/dashboard` ficou pronto. A faixa amarela sai junto com ele, e o `prototipo`
sai da assinatura da tela — uma prop que só um lado usa é uma prop que ninguém
lembra de tirar.

Deixar os dois convivendo garantiria que um dia alguém veria o falso achando
que era o real.

## O que sai de `aindaNaoLigado`

O `FormularioDeCategoria` **mantém** a prop: a C2 da revisão continua usando-a
até a D2. O que muda é quem a passa — `/categorias` para de passar, e passa
`salvando` e `erro` no lugar.

## Verificação

Rota temporária contra o Neon real, conta descartável, `finally` limpando —
a mesma forma das B1–B5. O que ela mede é só o que a D1 acrescenta:

1. `listarParaGerir` devolve os 9 potes de uma conta recém-semeada, inclusive
   um esvaziado à mão.
2. Uma categoria com 3 lançamentos (1 excluído) e 2 regras volta com
   `{ lancamentos: 3, foraDoCalculo: 1, regras: 2 }` — e não 6.
3. Criar pela action e reler: aparece no fim do pote certo.

Depois: `tsc`, `eslint`, `vitest`, `build`, e o Davi apagando uma categoria de
verdade pelo celular na E1.
