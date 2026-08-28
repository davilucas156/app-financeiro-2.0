# Tarefas — Metas por pote configuráveis

**Etapa:** 2 (Break) do workflow `dev-workflow-davi`
**Spec de origem:** `specs/13-metas-por-pote.md`, aprovada pelo Davi
**Status:** ⚠ **rascunho, não aprovado.**

Legenda de camada: `INFRA` · `FRONT-VISUAL` · `FRONT-INTEGRADO` · `BACK` · `BANCO`

---

## A ordem: primeiro o que se prova sem tela

Como nas specs 10 e 12: as decisões que valem teste sobem primeiro, escritas e
**ainda não chamadas por ninguém**. Se a fase A estiver certa, o app fica
idêntico — e um erro nela aparece no Vitest, não numa tela onde ele se confunde
com erro de layout.

1. **Fase A — o vocabulário da meta.** Ler um campo de texto e decidir o que ele
   quer dizer; e a frase da soma. Nada muda na tela.
2. **Fase B — o pote passa a saber seu percentual.** A leitura chega à tela de
   arrumação sem ser desenhada; a escrita existe sem ser chamada.
3. **Fase C — a meta na tela.** Ver, depois editar, depois a soma e o aviso.
4. **Fase D — voltar ao padrão.**
5. **Fase E — a conferência e os documentos.**

⚠ **A fase C1 é conferível sozinha.** Com o percentual só de leitura no
cabeçalho, a `/categorias` continua a de hoje mais um número — e um erro de
layout aparece ali, antes de existir campo, salvamento e soma para confundir a
leitura.

## Nenhuma migration, nenhuma rota, nenhum `proxy.ts`

`buckets.percentual_meta` **já existe** e já é por usuário (Descoberta 1).
`buckets.valor_meta_centavos` **continua sem ser lida** (Pendência 2).

**Zero coluna, zero migration, zero SQL de estrutura.** A única novidade no
banco é um `update` numa coluna que já está lá.

⚠ E **nenhuma rota nova**: o campo entra na `/categorias`, que já está no
`proxy.ts` desde a spec 05. Esta spec não toca naquele arquivo — o que também
quer dizer que ninguém precisa lembrar da armadilha dele desta vez.

## Reuso antes de criação

| O que | Onde | Para quê aqui |
| ----- | ---- | ------------- |
| `metaDoPote` | `painel/somar-o-mes/meta.ts` | **Não muda.** Ela já lê o percentual; o que falta é alguém poder escrevê-lo |
| `legendaDoPote` | `painel/painel-do-mes/poteNoPainel.ts` | **Não muda.** Já prefere o percentual e cai na observação sem ele |
| `POTES_PADRAO` | `onboarding/potes-padrao.ts` | A fonte do "voltar ao padrão" (D1). Ler o arquivo que já é a semente, em vez de escrever a lista de novo |
| `listarParaGerir` | `categorias/gerir-categorias/` | Já busca todos os potes; ganha uma coluna no `select` |
| `PoteNaGestao` | `categorias/gerir-categorias/categoriasNaTela.ts` | Ganha o campo `percentual` |
| `mexerNaCategoria.service.ts` | `categorias/gerir-categorias/` | O **padrão** da escrita com `and(eq(userId))` — copiar a disciplina, não o código |
| `gerirCategorias.action.ts` | `categorias/gerir-categorias/` | O padrão de action com `garantirUsuario()` e `revalidatePath` |
| `CampoDeRenda.tsx` | `painel/renda-do-mes/` | ⚠ **O precedente exato**: tocar no número abre o editor, salvar fecha. O `CampoDeMeta` é o mesmo gesto com outro número |
| `Card`, `SectionTitle` | `components/ui/` | A moldura, como em toda tela |

⚠ **`emCentavos.ts` não serve aqui, e a tentação é real.** Ele traduz "R$
1.200,00" em centavos. Percentual é inteiro de 0 a 100 — sem separador, sem
decimal, sem moeda. Reusar aquilo traria a régua errada para um número que não é
dinheiro.

---

## Fase A — o vocabulário da meta

### A1 · Ler o campo e decidir o que ele quer dizer `INFRA`

Um módulo puro em `categorias/definir-meta/percentual.ts` que traduz o que o
usuário digitou em uma de três respostas: **um percentual**, **sem meta**, ou
**recusa com motivo**.

- Vazio (e só espaço) → `sem meta`, que é `null` no banco.
- `"0"` → percentual **zero**, que é meta de zero e faz tudo estourar.
  ⚠ **A Descoberta 5 inteira mora nesta distinção.**
- Fora de 0–100, com vírgula, negativo, ou não-número → recusa **com frase**,
  nunca correção silenciosa (a mesma escolha do `validarMapeamento` da spec 11:
  corrigir em silêncio o número da meta seria decidir pelo dono do dinheiro).
- Uma função de volta (`paraOCampo`) para o editor mostrar o valor de hoje.

**Pronto quando:** os testes cobrem vazio, só espaço, `0`, `100`, `101`, `-5`,
`10,5`, `10.5`, `abc`, `<script>`, string gigante, e `null`.

### A2 · A frase da soma `INFRA`

Uma função que recebe os potes de gasto e devolve **quanto somam** e **a frase**
que a tela mostra.

- Três casos: abaixo de 100, exatamente 100, acima de 100.
- Potes sem meta **não entram na soma** — eles não são zero, são ausência.
- ⚠ **Nunca devolve erro.** É informação, não trava (Pendência 3). A função não
  tem como reprovar nada.

**Pronto quando:** os testes cobrem a semente (30/25/15/15/10/5 = 100), conta com
tudo sem meta, um pote só com 250%, e a soma ignorando os potes nulos e o pote
de renda.

---

## Fase B — o pote sabe seu percentual

### B1 · O percentual chega à tela de arrumação, sem ser desenhado `BACK`

`PoteNaGestao` ganha `percentual: number | null`, e `listarParaGerir` traz a
coluna que já existe.

⚠ **Nada muda na tela.** É a tarefa que se confere pelo que **não** aconteceu:
`/categorias` idêntica, `tsc` limpo, testes passando.

**Pronto quando:** o dado chega ao componente e a tela está igual.

### B2 · A escrita, com o dono do pote na cláusula `BACK`

`definir-meta/definirMeta.service.ts` (`server-only`) e a action que a chama.

- `update buckets set percentual_meta = ? where id = ? and user_id = ?`.
  ⚠ **O `and user_id` é a tarefa**, não um detalhe dela: sem ele, o `id` que
  vem do cliente mexe no pote de qualquer conta.
- Valida **com o A1**, no servidor — o cliente valida para dar resposta rápida,
  o servidor valida porque é ele quem grava. Mesma função nos dois lados: é
  compartilhar o mecanismo, não a decisão.
- **Recusa pote de tipo `renda`** (a seção própria da spec). A recusa é do
  servidor, não da ausência do botão.
- `revalidatePath` na `/categorias` **e na `/dashboard`** — a meta mudou, e é lá
  que ela aparece.

**Pronto quando:** existe e não é chamada por ninguém; um teste cobre pote de
renda recusado e percentual inválido recusado.

---

## Fase C — a meta na tela

### C1 · O percentual aparece no cabeçalho do pote `FRONT-VISUAL`

Só leitura: `30%` ao lado do nome, ou a observação ("eventual") quando não há
meta. ⚠ **Nunca "0%" para pote sem meta** — a regra escrita do
`potes-padrao.ts`.

- O pote de renda não mostra nem percentual nem observação de meta.
- A 360px, o cabeçalho já tem emoji + nome e trunca; o percentual não pode
  empurrar o nome para fora.

**Pronto quando:** a `/categorias` mostra os seis percentuais e as duas
observações, e nada mais mudou.

### C2 · O campo, e o salvamento `FRONT-INTEGRADO`

`CampoDeMeta` — tocar no percentual abre o editor, salvar fecha. O gesto e a
estrutura saem do `CampoDeRenda`.

- Teclado numérico no celular.
- Apagar e salvar = tirar a meta, e o editor **diz isso** antes ("deixar vazio
  tira a meta deste pote"), porque campo vazio salvando algo é surpresa.
- ⚠ **A frase do retroativo aparece aqui** (Pendência 4): _"vale para todos os
  meses, inclusive os já importados"_. No momento de salvar, não num rodapé.
- Erro do A1 aparece no campo, sem perder o que foi digitado.

**Pronto quando:** dá para mudar, tirar e dar meta, e o painel do mês reflete
sem novo upload.

### C3 · A soma, e o aviso de quem ainda não declarou renda `FRONT-INTEGRADO`

Duas linhas no fim da lista de potes:

- A soma (A2), sempre visível.
- ⚠ Se **não há renda declarada** para o mês corrente: _"as metas só aparecem
  depois que você informar a renda do mês"_, com o caminho para o painel. É o
  risco 2 da spec — mexer nas metas e não ver efeito nenhum, sem explicação.

**Pronto quando:** a soma muda ao salvar; e uma conta sem renda declarada vê o
aviso.

---

## Fase D — voltar ao padrão

### D1 · Restaurar o rateio da semente `FRONT-INTEGRADO`

Um caminho discreto que devolve 30/25/15/15/10/5 e põe Manutenção e Outros de
volta em "sem meta".

- Lê `POTES_PADRAO` **por slug** — não por nome, que é editável desde a spec 05,
  e não por uma lista escrita à mão aqui, que divergiria da semente no primeiro
  dia em que alguém mexesse nela.
- Pede confirmação, dizendo o que vai acontecer.
- Pote que o usuário criou e não está na semente **fica como está** — a semente
  não tem opinião sobre ele.

**Pronto quando:** restaurar produz exatamente o que o onboarding produz, e um
teste compara os dois.

---

## Fase E — a conferência e os documentos

### E1 · A ponta a ponta: escrever aqui muda o julgamento lá `INFRA`

O teste que responde "a spec funciona?": um percentual novo atravessa até o
veredito do painel.

- Mudar o percentual muda `metaDoPote` **sem novo upload**.
- Vazio e `0` produzem estados **diferentes** em `estadoDoPote` (`sem-meta` vs
  `estourado`). ⚠ É a Descoberta 5 virando teste, e é a única forma de a
  distinção não se perder numa refatoração futura.
- Pote com percentual e renda declarada **não** mostra mais a observação.

### E2 · Fechar os documentos `INFRA`

- Marcar as tarefas, com os desvios de execução registrados no lugar.
- `references/estado-do-projeto.md`: tirar **Metas por pote configuráveis** da
  fase 2 e registrar onde a meta se edita.
- ⚠ `references/architecture.md`: hoje `percentual_meta` só aparece descrito no
  schema (linha ~269) e no onboarding, e **o seed é o único que escreve nele**.
  Passa a ter um segundo escritor, e o documento tem de dizer qual — senão a
  próxima pessoa procura a origem do número no lugar errado.
