# Spec — Resposta ao toque

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Depende de:** spec 07, que instalou o app no celular; spec 15, que acabou de
passar a régua de contraste no app inteiro
**Pedido do Davi:** _"adicione respostas táteis visuais ao clicar em botões do
app"_
**Status:** ✅ **aprovada, e entregue em recorte** (31/08/2026).

⚠ **Só a navegação entre telas, por decisão do Davi:** _“faça só dos botões de
navegação de tela por enquanto”_. Foram seis pontos, todos `<Link>` que trocam
de rota:

| Onde | O que é |
|---|---|
| `NavegacaoPrincipal` | a barra de baixo no celular e a de cima no monitor |
| `Voltar` | o caminho de volta das cinco rotas fora da barra |
| `AbasDoPainel` | as abas de mês e a aba do comparativo |
| `SeletorDeAno` | os anos, na `/comparativo` |
| `ChamadaDoComparativo` | o convite no pé do painel |
| `CabecalhoApp` | a engrenagem |

⚠ **Os outros ~120 clicáveis continuam sem resposta ao toque** — botões de
ação, chips de categoria, seletores de tema e de letra, cabeçalho do pote. A
mecânica está pronta e é uma classe; o recorte é que foi decidido menor.

> ⚠ Nenhum dado real neste documento.

---

## O que esta funcionalidade resolve

**Hoje o app não responde a toque nenhum.** Entre o dedo encostar e a tela
mudar, não acontece nada — e quando a ação passa pelo servidor, esse nada dura o
tempo de ida e volta. É o intervalo em que a pessoa toca de novo achando que não
pegou.

---

## O que eu medi antes de desenhar

### Descoberta 1 — não é "está fraco", é **zero**

| | |
|---|---|
| Elementos clicáveis (`<button>`, `onClick`, `<Link>`) | **127** |
| Arquivos com `hover:` | **30** |
| Ocorrências de `active:` no projeto inteiro | **0** |

Nenhuma. Nunca houve estado de pressionado neste app.

### Descoberta 2 — ⚠ **toda a resposta que existe é `hover:`, e `hover:` não existe no celular**

Os 30 arquivos acima reagem ao **mouse**. Num toque, o dedo cobre o elemento e o
`hover` ou não dispara ou dispara depois, grudado. O app foi desenhado para
360px e instalado no iPhone (spec 07), e é justamente ali que ele não responde.

### Descoberta 3 — ⚠ **tátil de verdade não existe no iPhone**

A `navigator.vibrate` — a API de vibração — **não é suportada pelo Safari, em
nenhuma versão, nem no iOS nem no macOS.** Ela funcionaria só no Android.

Então "resposta tátil" aqui só pode ser **o visual que imita o tato**, que é
exatamente o que o pedido diz. Isto está escrito para ninguém tentar
`navigator.vibrate` daqui a seis meses achando que faltou.

### Descoberta 4 — o iOS já desenha uma resposta, e ela é ruim

O Safari pinta um retângulo cinza no toque, o `-webkit-tap-highlight-color`.
Ele **ignora o `border-radius`** — num botão arredondado aparece um retângulo
por baixo — e chega com atraso. Com resposta própria, viram duas respostas
concorrendo, e a nossa perde porque a do sistema vem por cima.

### Descoberta 5 — ⚠ os clicáveis **não** estão todos em componentes

`Button` e `Voltar` cobrem parte. O resto é `<button>` escrito na própria tela:
abas de mês, cabeçalho do pote, chips de categoria, seletores de tema e de
letra, sugestões. Escrever a resposta em cada um seria repetir o que a spec 15
acabou de desfazer no botão de voltar — **cinco cópias e uma já divergida**.

Uma regra em `@layer base` alcança os 127 de uma vez, **e os que ainda não
existem.**

### Descoberta 6 — o projeto nunca encostou em `prefers-reduced-motion`

Zero ocorrências. Se a resposta tiver movimento, esta é a primeira vez que o
projeto precisa respeitar quem pediu menos movimento no sistema — e é uma
preferência que existe porque movimento na tela causa enjoo em algumas pessoas.

### Descoberta 7 — `<button>` aqui é sempre controle; `<a>` não

Conferi: **nenhum `<button>` do app vive dentro de um parágrafo.** Todos são
controles com forma própria.

Já os `<a>` são duas coisas: **17 links sublinhados dentro de frases**
("Informar a renda", "Revisar os pendentes") e alguns com forma de botão
("Classificar o resto", o `Voltar`). Encolher um link no meio de uma frase
quebra a linha do texto — a mesma resposta não serve aos dois.

---

## O que muda

### A · O sistema para de desenhar por cima

`-webkit-tap-highlight-color: transparent`. A resposta passa a ser nossa,
inteira, e respeita o arredondamento.

⚠ **Na entrega, ele saiu na classe e não na raiz** — mudança em relação a este
parágrafo. Com o recorte reduzido à navegação, apagá-lo em `:root` tiraria dos
outros ~120 clicáveis o único retorno que eles têm hoje **sem dar nada em
troca**. Ele sai junto com a resposta nova, elemento a elemento.

### B · A resposta, e por que ela é opacidade **e** escala

**`opacity` + `scale(0.98)` enquanto o dedo está em cima.**

- **A opacidade é a régua do iOS.** O sistema que ele usa marca botão
  pressionado apagando, e não escurecendo. Apagar também é a única resposta que
  funciona **nos dois temas**: escurecer no escuro some, clarear no claro some.
- **A escala é o que faz parecer físico.** 2% é pouco de ver e muito de sentir;
  mais que isso vira brinquedo, e num cartão de pote inteiro chega a empurrar o
  que está do lado.

⚠ **Sem transição na ida, com transição na volta.** Pressionado tem de aparecer
no mesmo instante — uma animação de 150ms na descida é exatamente o atraso que
esta spec existe para tirar. Na soltura ela suaviza.

### C · Quem ganha o quê (Descoberta 7)

| | Opacidade | Escala |
|---|---|---|
| `<button>`, `[role="button"]`, `<summary>` | sim | **sim** |
| `<a>` sublinhado dentro de frase | sim | **não** |
| `<a>` com forma de botão | sim | **sim**, declarada na peça |

A regra base cuida das duas primeiras linhas sozinha. A terceira é uma classe em
três ou quatro lugares — e é opt-in **de propósito**: o padrão seguro para um
`<a>` é não se mexer.

### D · Quem pediu menos movimento não recebe movimento

Sob `prefers-reduced-motion: reduce`, **a escala sai e a opacidade fica**. A
resposta continua existindo; o que sai é o movimento.

---

## O que **não** muda

- **Nenhum comportamento.** Nada de estado, consulta ou dado — é só o que a tela
  faz enquanto o dedo está encostado.
- **Os `hover:` que já existem.** Continuam servindo o mouse.
- **`navigator.vibrate`** — Descoberta 3.
- **Os alvos de toque de 44px.** Já estão certos em todo o app.

---

## Riscos

1. **Escala em elemento grande.** O cabeçalho do pote é um `<button>` do tamanho
   do cartão. A 2% ele encolhe ~6px numa largura de 320 — vale conferir se
   parece intencional ou frouxo.
2. **Elemento com `overflow` ou `position` dentro.** `transform` cria contexto
   de empilhamento novo. Os menus desta base abrem em fluxo, não flutuando,
   então não deve morder — mas é o tipo de coisa que só a tela mostra.
3. **A regra base alcança clicável que eu não previ**, inclusive de terceiro: os
   componentes do Clerk nas telas de entrar e cadastrar. Provavelmente melhora;
   é para olhar.

---

## Pendências para o Davi

### 1 · Vibração no Android

O app é seu e você usa iPhone, onde não existe. Se um dia entrar alguém de
Android, `navigator.vibrate(10)` no toque é uma linha. **Não vou escrever código
que não tem como ser testado aqui** — fica registrado como escolha, não como
esquecimento.
