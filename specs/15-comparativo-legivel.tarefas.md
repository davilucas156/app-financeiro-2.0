# Tarefas — O comparativo legível

**Etapa:** 2 (Break) do workflow `dev-workflow-davi`
**Spec:** [15-comparativo-legivel.md](./15-comparativo-legivel.md) — ✅ aprovada
pelo Davi
**Status:** ✅ **aprovada pelo Davi.** A, B, C e E entregues em 31/08/2026; a
D segue aguardando decisão dele.

> ⚠ Nenhum dado real neste documento.

---

## A descoberta que mudou a Fase A

A Pendência 2 perguntava se `--color-dim` devia clarear. Antes de propor um
valor, fui ver como o **tema claro** resolveu o mesmo problema — e ele já
resolveu, com a regra escrita no `globals.css`:

```
--claro-dim:  #61617a;  /* 5.19 — é o rótulo de 96 lugares */
--claro-dim2: #9a9ab0;  /* 2.38, baixo de propósito: é o desabilitado */
```

⚠ **O tema claro já separa os dois: `dim` passa de 4,5 e `dim2` reprova de
propósito.** O tema escuro nunca recebeu o mesmo tratamento — ali os dois
reprovam. Não é uma régua nova que estou trazendo: é **a régua do projeto,
aplicada no tema que ficou de fora**.

O `dim` escuro, medido nas três superfícies:

| Fundo | `#5a5a70` hoje |
|---|---|
| `--bg` `#060608` | 3,02 |
| `--card` `#111116` | 2,81 |
| `--card2` `#16161c` | 2,69 |

Clareando **no mesmo matiz** — a mesma técnica das cores semânticas claras — o
primeiro valor que passa nas três é **`#7d7d96`**: 5,06 no `bg`, 4,70 no `card`,
4,50 no `card2`.

---

## Fase A · A régua da cor ✅

Vem primeiro porque B e C não têm como ficar legíveis sem ela.

### A1 · `--color-dim` passa a `#7d7d96` ✅

**Pronto quando:** o token escuro está em `#7d7d96`, com o contraste medido
anotado ao lado como nas cores claras, e o comentário diz que o valor é o mesmo
matiz do anterior.

⚠ **Muda o app inteiro** — `dim` é o texto secundário de todas as telas. É o
efeito pretendido: a queixa foi "as letras estão ilegíveis".

⚠ **`--color-dim2` não muda.** Ele é o desabilitado, e o tema claro o mantém
reprovando de propósito. O que muda é **parar de usá-lo como conteúdo**, e isso
é B1 e C1.

### A2 · `corParaTexto`, irmã de `corParaFundoClaro` ✅

**Pronto quando:** existe um módulo puro que devolve a cor do pote ajustada para
servir de **texto**, com testes, ao lado de `corNoTema.ts`.

- Mira **4,5** e não 3 — a constante existente diz, com todas as letras, que
  vale porque *"a cor do pote nunca é texto"*. Deixa de valer aqui.
- Recebe o **fundo** como parâmetro, em vez de assumir branco: no escuro ela
  precisa **clarear**, no claro **escurecer**. `corParaFundoClaro` só sabe
  escurecer.
- **Preserva o matiz**, pelo mesmo motivo escrito lá: a cor é a identidade do
  pote. O teste de matiz que já existe serve de molde.

⚠ **A cor do pote Outros é `#5a5a70` — o valor do `--color-dim` antigo.** Ela é
a única das oito que reprova como texto no escuro (2,81). É o caso de teste que
prova que a função faz alguma coisa.

### A3 · O `estilo` do texto, nos dois temas ✅

**Pronto quando:** existe o par de `estiloDoPote` para **cor de letra** — as
duas cores e um `light-dark()`, na propriedade `color`.

⚠ **Pelo mesmo motivo do docblock de `estiloDoPote`: o servidor não pode
escolher.** O tema tem três estados e um deles é "seguir o sistema", que só o
navegador de quem lê resolve.

**Entregue em 31/08/2026.** 13 testes novos, 709 no total.

⚠ **Um detalhe que o plano não previa: a direção precisava de um ponto de
virada.** "Fundo escuro pede letra clara" só vira código com um limiar, e 0.5
seria errado — luminância relativa não é linear no olho. O valor é **0.179**, o
ponto em que branco e preto empatam em contraste sobre o mesmo fundo. Não é
palpite: é a divisa que a própria fórmula do WCAG produz, e está escrita como
constante nomeada em vez de solta na conta.

⚠ **O comentário falso que a A1 criou foi corrigido junto**, como o plano
mandava: o `corNoTema.test.ts` dizia "o pote Outros é `--color-dim`". Depois
da A1 os dois são `#5a5a70` **por história, não por dependência** — a cor do
pote mora em `buckets.cor`, no Postgres, e não acompanha o token.

---

## Fase B · O cartão do ano ✅

### B1 · Os três níveis do `.cstat` ✅

**Pronto quando:** `CartaoDoAnoNaTela` tem rótulo → valor → sub, na proporção do
original, e **nenhum texto em `dim2`**.

- **Rótulo:** emoji + nome, mono, caixa alta, `dim`. A bolinha sai.
- **Valor:** o total do ano, grande e pesado, **na cor do pote** (A2/A3).
- **Sub:** média por mês + tamanho da amostra, numa linha.
- **Série:** o mês a mês, legível — `text-3xs` em `dim`, nunca `4xs` em `dim2`.

⚠ **O tamanho da amostra continua colado na média.** É a disciplina do
`mediaDoComparativo`, e o docblock atual explica por que ela é mais necessária
aqui do que em qualquer outro lugar: o número acima é um total de ano com cara
de fechado.

⚠ **O ⚠ do mês pouco classificado continua**, na série e no cartão.

### B2 · Três colunas a partir de `md` ✅

**Pronto quando:** a grade é `grid-cols-2` no celular e três colunas do `md`
para cima, como o `repeat(3,1fr)` do original.

⚠ **Duas a 360px continua sendo a decisão certa**, e o motivo está escrito no
componente: nome de pote + dois números não cabem em três colunas de 120px. O
que estava errado era **parar em duas para sempre**.

---

## Fase C · As barras pela mesma régua ✅

### C1 · `dim2` sai do conteúdo da `SecaoDoComparativo` ✅

**Pronto quando:** a linha "média" — rótulo e valor — não está mais em `dim2`, e
os rótulos de mês continuam distinguindo o mês atual dos outros.

⚠ **A média é conteúdo, não decoração.** Ela é a régua contra a qual as outras
barras se leem; apagá-la até sumir esvazia a comparação.

⚠ **As larguras em `em` ficam.** `w-[5.6em]` e `w-[8em]` existem por causa dos
degraus de tamanho de letra da spec 10, e o motivo está no docblock.

---

## Fase D · O aviso da renda ❌ **cancelada pelo Davi**

**Respondida em 31/08/2026, e a resposta muda o entendimento do problema:**

> _“calcular com o que eu informei de salário é o comportamento real. Quero
> calcular as metas com a base do meu salário real. O que entra a mais do que
> é meu salário é renda extra e então não deve entrar nesse cálculo das
> metas.”_

⚠ **A diferença entre a renda declarada e o que entrou não é a régua
envelhecida: é renda extra, e ela está fora da base de propósito.** Eu tinha
lido o contrário na Descoberta 2 da spec e recomendado que ele corrigisse o
número — o número não estava errado.

O aviso teria disparado em quase todo mês, porque quase todo mês tem alguma
entrada fora do salário: repasse recebido, reembolso, renda extra. Aviso que
aparece sempre é aviso que ninguém lê.

A defesa contra o salário mudar sem ninguém notar **já existe e é a certa**: o
`CampoDeRenda` diz “herdada de junho” quando o número veio de outro mês.

A decisão ficou escrita no docblock de `painel/somar-o-mes/meta.ts`, e não só
aqui — é lá que alguém vai bater ao achar que encontrou um defeito.

### D1 · O painel avisa quando a régua destoa do que entrou

**Pronto quando:** o `CampoDeRenda` diz, quando for o caso, que a renda
declarada está bem abaixo do que entrou no mês — e nada mais muda.

⚠ **Isto **não** liga a meta ao que entrou.** A fórmula continua sendo a da
Descoberta 1: percentual × renda declarada. O que entrou aparece **só como
frase**, do lado, para a régua não envelhecer calada. É a mesma defesa que já
existe para a renda herdada, no outro buraco.

**A decidir no plano:** a partir de quanta diferença a frase aparece. Ela não
pode nascer chata: quem tem repasse recebido no mês vai ter entrada acima da
renda por motivo legítimo, e um aviso que aparece sempre é um aviso que ninguém
lê.

---

## Fase E · Os documentos ✅

### E1 · O que a régua nova precisa deixar escrito ✅

**Pronto quando:**

- `design-system.md` tem o contraste medido do `dim` escuro, como o claro já
  tem, e a regra em uma frase: **`dim2` não carrega texto**.
- `estado-do-projeto.md` registra a spec 15.
- `architecture.md` ganha a `corParaTexto` ao lado da `corParaFundoClaro`, com a
  diferença entre 3 e 4,5 dita uma vez.

---

## O que a Fase C encontrou e **não** consertou

⚠ **`dim2` carrega conteúdo em mais 30 lugares do app.** A varredura depois da
C1 mostrou que a `/comparativo` era o pior caso, não o único. Dois doem:

- `CartaoDoPote.tsx:113` — **"meta R$ 360,00"**, no painel. O número contra o
  qual a barra inteira se mede, no token do desabilitado.
- `CartaoDoPote.tsx:256` — a **procedência** ("↳ uma regra procurava por…").
  É a resposta a "por que isso caiu aqui?", que a spec 04 criou colunas no banco
  para poder dar — e que a tela entrega ilegível.

Não mexi: esta spec escreveu na tarefa C1 que o recorte era a `/comparativo`, e
sair varrendo trinta arquivos por conta própria seria decidir sozinho o visual
de todas as telas. Fica como pendência nomeada.

---

## O que fica de fora

- **A fórmula da meta** — Descoberta 1: já é o que foi pedido.
- **`cartaoDoAno.ts` e `comparativo.ts`** — nenhum dado muda. Isto é layout.
- **`--color-dim2`** — continua reprovando, de propósito, nos dois temas.
- **A tabela comparativa completa** do HTML original (`comp-table`), com uma
  coluna por mês. Ela não foi pedida, e a 360px uma tabela de dez colunas é
  outra spec.
- **Os "Tendências & Alertas"** do original — texto escrito à mão por você,
  todo mês. Virar isso em app é uma funcionalidade, não um layout.
