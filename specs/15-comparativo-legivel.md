# Spec — O comparativo legível

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Depende de:** spec 06, que criou as barras; spec 09, que deu tela própria ao
comparativo; spec 12, que o recortou por ano e trouxe os cartões de topo;
spec 08, que resolveu a cor do pote nos dois temas; spec 10, que criou os
degraus de tamanho de letra
**Pedido do Davi:** _"melhore o layout da tela de comparativo, está feio, as
letras estão ilegíveis, precisa de os cards serem mais parecidos com a estrutura
do arquivo html original"_ — junto de _"não quero que a meta mude de acordo com
o que entrou no mês, quero que seja fixado de acordo com a renda declarada"_
**Status:** ⚠ **rascunho, não aprovado.**

> ⚠ Nenhum dado real neste documento. Os valores do
> `planejamento_anual_davi.html` aparecem como **estrutura** — tamanho, peso e
> ordem — e nunca como dado. Os números do banco do Davi que motivaram a
> Descoberta 2 ficaram **fora** daqui de propósito: eles são a renda dele.

---

## O que esta funcionalidade resolve

A tela do comparativo tem a informação certa e não deixa lê-la. São três
defeitos separados, e só um deles é gosto:

1. **Contraste abaixo do mínimo, medido.** A linha mês a mês de cada cartão usa
   `text-dim2` a 9px. Contra o fundo do cartão isso dá **1,69:1**. O mínimo do
   WCAG para texto é 4,5:1. Não é "pequeno demais": é o token de **texto
   desabilitado** carregando o conteúdo que mais ocupa espaço no cartão.
2. **A hierarquia do cartão está achatada.** Cinco níveis de texto dentro de
   uma faixa de 5px, e o número principal é o terceiro mais chamativo. O
   original faz o contrário, e é por isso que ele se lê de relance.
3. **A grade nunca passa de duas colunas.** `grid-cols-2` sem variante
   responsiva, dentro de um contêiner de 1024px. Num monitor, cada cartão fica
   com meia tela para exibir um número de 14px.

---

## O que eu medi antes de desenhar

### Descoberta 1 — a meta **já** é fatia da renda declarada, e nada mais

O pedido de corrigir a meta descreve o comportamento que já existe. Segui o
caminho inteiro antes de mexer em qualquer coisa:

- `metaDoPote` (`painel/somar-o-mes/meta.ts`) tem uma fórmula só:
  `renda declarada × percentual ÷ 100`. Ela não recebe nada que venha de
  lançamento.
- `rendaDoMes` (`painel/renda-do-mes/rendaDoMes.service.ts`) lê **só** a tabela
  `monthly_income`, que é preenchida pelo campo "Renda do mês" e por mais nada.
- `entrouCentavos` — o que de fato entrou — vive num caminho separado. Ele
  aparece em dois lugares na tela inteira: o número "Entrou" do `TopoDoMes` e a
  prévia do mapeamento de formato. **Nenhum dos dois toca em meta.**

Ou seja: **não há correção de código a fazer neste ponto.** O que existe é um
defeito de *régua*, e ele é a Descoberta 2.

### Descoberta 2 — a régua está velha, e a tela não avisa

A renda declarada da conta foi informada duas vezes, com o mesmo valor, e esse
valor é **o sugerido pelo campo** — `SUGERIDA_CENTAVOS` em `CampoDeRenda.tsx`,
que é a base do painel HTML original.

A entrada realmente medida nos extratos é **muito maior que essa base**, e é
assim em todo mês importado.

Consequência: as metas são fatias de uma renda menor que a real, todo pote
aparece perto de estourar ou estourado, e **nada na tela diz que a régua é a
sugestão de fábrica e não um número que alguém decidiu**. A defesa que existe
hoje só cobre o outro caso: `CampoDeRenda` avisa quando a renda é *herdada* de
outro mês, mas não quando ela é a *sugerida*.

⚠ **Isto não está no escopo desta spec** — é a Pendência 1, para o Davi decidir.
Ele pode resolver hoje digitando a renda certa; o que a spec pergunta é se o app
deve avisar sozinho.

### Descoberta 3 — a ilegibilidade tem número, e não é opinião

Medido contra o fundo do cartão (`--card`), com a fórmula do WCAG:

| Token | Hex | Contraste | Serve para texto? |
|---|---|---|---|
| `--text` | `#e8e8f0` | 15,45:1 | sim |
| `--gold` | `#ffc94d` | 12,29:1 | sim |
| `--green` | `#00e5a0` | 11,40:1 | sim |
| `--primary` | `#FF5000` | 5,74:1 | sim |
| `--dim` | `#5a5a70` | **2,81:1** | **não** |
| `--dim2` | `#3a3a4a` | **1,69:1** | **não** |

⚠ **Os dois cinzas reprovam, e o `--dim` é usado como texto secundário no app
inteiro.** O `--dim2` está documentado no `design-system.md` como *"texto
desabilitado"* — usá-lo para conteúdo foi o erro; ele está cumprindo exatamente
o papel que o nome dele promete.

O pior par da tela é a linha mês a mês do cartão: `text-4xs` (9px) em `dim2`
(1,69:1). É a maior mancha de texto de cada cartão e a menos legível da tela.

### Descoberta 4 — o cartão original tem três níveis, o nosso tem cinco

O `.cstat` do `planejamento_anual_davi.html`:

| | Tamanho | Peso | Cor |
|---|---|---|---|
| `.cstat-lbl` | 9px, mono, caixa alta | 400 | dim |
| `.cstat-val` | **19px** | **900** | **a cor do pote** |
| `.cstat-sub` | 10px | 400 | dim |

O nosso `CartaoDoAnoNaTela` hoje: bolinha + emoji + nome (11px, bold) → valor
(14px, medium, **cor neutra**) → "no ano de" (9px) → média (10px) + amostra
(10px em dim2) → série (9px em dim2).

Duas diferenças que explicam a sensação de bagunça:

1. **O número não é o protagonista.** 14px medium contra um nome de pote em
   11px bold é quase empate. No original o número é 19px/900 — ele ganha de
   longe, e o olho sabe onde pousar.
2. **A cor do pote virou uma bolinha de 8px.** No original a cor **é o número**.
   É o que deixa varrer seis cartões sem ler um rótulo.

### Descoberta 5 — pintar o número exige uma função que ainda não existe

`estiloDoPote` resolve a cor do pote nos dois temas, mas para **preenchimento**:
`corParaFundoClaro` mira em **3:1**, e o docblock diz por quê — *"a cor do pote
nunca é texto"*. Deixa de ser verdade no momento em que o número recebe a cor.

Medi as oito cores como **texto** sobre o cartão escuro (mínimo 4,5):

| Pote | Contraste | |
|---|---|---|
| Metas / Sonhos | 12,29:1 | ok |
| Liberdade Financeira | 11,40:1 | ok |
| Transporte | 9,15:1 | ok |
| Manutenção | 8,91:1 | ok |
| Conforto & Lazer | 5,84:1 | ok |
| Custos Fixos | 5,74:1 | ok |
| Conhecimento | 4,85:1 | ok |
| **Outros / Repasses** | **2,81:1** | **reprova** |

⚠ **Sete das oito passam. A oitava reprova, e o motivo é bonito:** a cor do pote
Outros é `#5a5a70` — **exatamente o valor do token `--dim`**. O pote cinza é
literalmente o cinza de texto secundário, e por isso falha pelo mesmo número.

Então pintar o número pede uma irmã de `corParaFundoClaro`: uma
`corParaTexto(hex, fundo)` que mire em 4,5 e sirva aos **dois** temas, porque no
tema claro a lista de reprovadas é outra.

### Descoberta 6 — a série mês a mês aparece duas vezes na mesma tela

O cartão traz "jan R$ … · fev R$ … · mar R$ …" em 9px, e logo abaixo a seção de
barras desenha **os mesmos números**, um por linha, com barra e alinhamento.

A repetição é fiel ao original (o `.cstat-sub` de lá faz isso), mas lá não havia
a seção de barras logo abaixo — o `comp-bars` era um cartão ao lado, com escala
compartilhada, e o `.cstat-sub` era a única forma de ver o mês a mês daquele
pote. Aqui as duas convivem, e a versão ilegível é a redundante.

---

## O que muda

### A · A régua da legibilidade

**`dim2` deixa de carregar texto nesta tela.** Ele continua sendo o token de
desabilitado, e continua servindo para isso.

Toda linha de conteúdo passa a ter no mínimo `text-3xs` e cor `dim` ou acima.

⚠ **`dim` ainda é 2,81:1** — abaixo do mínimo. Corrigir o token muda o app
inteiro e é a Pendência 2. Esta spec **não** o altera por conta própria; ela
para de empilhar o problema (9px + dim2) e deixa a decisão explícita.

### B · O cartão com a estrutura do `.cstat`

Três níveis, na ordem do original:

1. **Rótulo** — emoji + nome do pote, mono, caixa alta, pequeno, `dim`.
   A bolinha colorida sai: a cor passa para o número, onde ela vale mais.
2. **Valor** — o total do ano, grande e pesado, **na cor do pote**, com a
   `corParaTexto` da Descoberta 5.
3. **Sub** — média por mês e o tamanho da amostra, numa linha só, legível.

A série mês a mês continua (Descoberta 6), como quarta linha e **legível** —
não como o rodapé apagado de hoje.

### C · A grade que usa a tela

`grid-cols-2` no celular, **três colunas a partir de `md`**, como o
`repeat(3,1fr)` do original. O contêiner já tem 1024px; hoje eles são
desperdiçados.

### D · As barras, pela mesma régua

Os rótulos de mês e os valores da `SecaoDoComparativo` são `text-3xs` em `dim` —
e a linha "média" é `dim2`. Ela recebe o mesmo tratamento da A: a média é
conteúdo, não decoração.

### E · `corParaTexto`, irmã de `corParaFundoClaro`

Módulo puro, testado, ao lado da existente. Mira 4,5 em vez de 3, aceita o fundo
como parâmetro em vez de assumir branco, e preserva o matiz pelo mesmo motivo
escrito lá: a cor **é** a identidade do pote.

---

## O que **não** muda

- **A fórmula da meta.** Descoberta 1: ela já é o que o Davi pediu.
- **Os dados da tela.** Nenhuma consulta nova, nenhum campo novo.
  `cartaoDoAno.ts` e `comparativo.ts` não são tocados — isto é layout.
- **A ordem das seções.** Cartões antes das barras continua certo pelo motivo
  escrito na `TelaDoComparativo`.
- **`--color-dim` e `--color-dim2`.** Ver Pendência 2.

---

## Riscos

1. **Pintar o número de laranja/verde pode competir com o significado de cor no
   resto do app**, onde verde é positivo e vermelho é estouro. Aqui a cor é
   **identidade do pote**, não julgamento. É o que o original faz, e o rótulo
   logo acima diz o nome — mas vale conferir na tela.
2. **Três colunas com nome de pote longo.** "Liberdade Financeira" em três
   colunas a 1024px dá ~320px por cartão; cabe. A 768px (o degrau do `md`) dá
   ~230px, e é o caso a olhar.
3. **`corParaTexto` escurece a cor no tema claro** e pode aproximar dois potes
   de matiz vizinho. O teste do matiz que já existe para `corParaFundoClaro`
   cobre o mesmo risco e serve de molde.

---

## Pendências para o Davi

### 1 · A renda declarada está na sugestão de fábrica (Descoberta 2)

A régua das metas é o valor sugerido pelo campo, e a entrada real medida nos
extratos é bem maior. Ele conserta isso digitando a renda certa no painel.

**A pergunta é se o app deve avisar sozinho.** Hoje ele só avisa quando a renda
é herdada de outro mês. Uma frase para o caso "esse é o valor que eu sugeri,
não um que você decidiu" seria a mesma defesa, no outro buraco.

### 2 · `--color-dim` reprova no app inteiro (Descoberta 3)

2,81:1 contra 4,5 exigidos, e ele é o texto secundário de **todas** as telas.
Três caminhos:

- **a)** Clarear o token e aceitar que todo texto secundário do app fica mais
  visível. É a correção de verdade, e muda o visual de tudo.
- **b)** Deixar como está e tratar `dim` como decoração, nunca como conteúdo.
  Exige disciplina que nada verifica.
- **c)** Nada agora, e registrar como dívida.

**Minha recomendação é (a)**, e não por regra: a queixa foi "as letras estão
ilegíveis", e `dim` é a cor da maioria delas.

### 3 · A série mês a mês fica no cartão? (Descoberta 6)

Ela repete o que as barras logo abaixo mostram melhor. Legível, ela ocupa espaço
real no cartão. **Minha recomendação é manter** — ela responde "como foi
distribuído" sem rolar a tela, que é o serviço que o `.cstat-sub` prestava —
mas é uma escolha de quem usa a tela, não minha.
