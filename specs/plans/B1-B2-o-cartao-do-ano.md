# Plano — Fase B · O cartão do ano

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** B1 e B2 de
[15-comparativo-legivel.tarefas.md](../15-comparativo-legivel.tarefas.md)
**Depende de:** Fase A ✅ — `estiloDoTextoDoPote` já existe e não tem chamador
**Status:** ⚠ **rascunho, não aprovado.**

> ⚠ Nenhum dado real neste documento.

---

## Uma coisa que descobri lendo o original antes de copiá-lo

O `.cstat-val` do `planejamento_anual_davi.html` é assim:

```css
.cstat-val { font-size:19px; font-weight:900; letter-spacing:-.5px; }
```

Duas coisas dentro disso mudam o plano:

**1. Ele não é monoespaçado.** Não há `font-family`, então ele herda o corpo, que
é **Syne**. No original, DM Mono aparece via a classe `.mono`, e ela está nas
**células da tabela** — onde os números precisam alinhar em coluna. A regra do
arquivo, quando se olha os dois lados, é: *mono onde os números formam coluna;
sans onde o número é manchete.*

**2. O peso 900 não existe.** O `<link>` do original carrega
`Syne:wght@400;600;700;800`. **Ele pediu um peso que não baixou** — o navegador
clampou em 800 ou fingiu. O que o Davi vê e gosta é Syne em 800.

⚠ **E o nosso DM Mono publica só 300, 400 e 500** — está escrito no
`layout.tsx`. Um `font-bold` sobre ele é **negrito sintético**: o navegador
engorda o desenho. A 9px, que é onde o app faz isso hoje, quase não aparece. A
18px, num número que é o protagonista do cartão, apareceria como borrão.

### A decisão, e por que não é copiar

Fico com **DM Mono no peso 500** — o máximo real dele — e tiro a hierarquia de
**tamanho e cor**, que é de onde ela vem de verdade no original.

Trocar para Syne 800 copiaria o original com mais fidelidade e quebraria a regra
do app inteiro, onde **todo dinheiro é mono**: `TopoDoMes`, `CampoDeRenda`,
`CartaoDoPote`, as barras. O cartão do comparativo viraria o único lugar em que
R$ tem outra letra, e a diferença apareceria lado a lado, na mesma rolagem.

⚠ **O que faz o `.cstat` funcionar não é o peso: é o salto de 9px para 19px e a
cor.** Isso eu consigo inteiro sem negrito falso.

---

## B1 · Os três níveis do `.cstat`

### Arquivo

`src/features/painel/comparar-meses/CartoesDoAno.tsx` — só ele.

### A forma

| | Hoje | Fica |
|---|---|---|
| Bolinha + emoji + nome | `text-2xs font-bold`, bolinha `estiloDoPote` | **rótulo**: emoji + nome, `font-mono text-4xs font-bold tracking-[1.5px] text-dim uppercase` |
| Total do ano | `font-mono text-sm font-medium`, cor neutra | **valor**: `font-mono text-lg font-medium`, **na cor do pote** |
| "no ano de 2026" | linha própria, `text-4xs` | **some** — vira duas palavras no sub |
| Média + amostra | `text-3xs text-dim` + `text-dim2` | **sub**: `font-mono text-3xs text-dim`, a amostra inclusa |
| Série mês a mês | `text-4xs text-dim2` | `font-mono text-3xs text-dim`, separada por um filete |

Resultado, em quatro linhas:

```
🏠 CUSTOS FIXOS
R$ 2.796,39
no ano · R$ 399,48/mês · 7 meses
jan R$ 164,30 · fev R$ 179,30 · …
```

### As decisões pequenas, com o motivo

- **A bolinha sai.** A cor passou para o número, que é maior e diz a mesma
  coisa. Manter as duas seria a cor dita duas vezes no mesmo cartão.
- **`text-lg` e não `text-sm`.** 18px, e ele **não escala** com os degraus de
  letra da spec 10 — a regra de lá é *"até 14px escala; acima, não"*, e o
  `CampoDeRenda` já usa `text-lg` para a renda pelo mesmo motivo.
- **"no ano de 2026" perde a linha própria.** O título da seção logo acima já
  diz **Comparativo 2026**; repetir o ano em oito cartões é ruído. As duas
  palavras "no ano" no sub bastam para o número grande não ser confundido com
  uma média — que é o único mal-entendido possível ali.
- **O filete antes da série.** Ela e o sub ficam no mesmo tamanho e na mesma
  cor; sem uma divisa, viram um parágrafo só. Um `border-t border-border` custa
  uma classe e separa sem inventar um sexto nível de texto.

### O que **não** muda, e é de propósito

- ⚠ **O tamanho da amostra continua colado na média.** É a disciplina do
  `mediaDoComparativo`, e o docblock atual explica por que ela é mais necessária
  aqui: o número acima é um total de ano com cara de fechado.
- ⚠ **O ⚠ do mês pouco classificado continua**, em `text-gold` — que dá 12,29
  sobre o cartão e é a única cor de aviso que não depende do cinza.
- ⚠ **`cartaoDoAno.ts` não é tocado.** Nenhum dado muda. Se este plano
  precisasse mexer lá, ele teria deixado de ser layout.

### Caminho feliz, borda e erro

- **Feliz:** oito cartões legíveis, cada número na cor do seu pote.
- **Borda — pote sem mês no ano:** `mediaMensalCentavos` é `null` e a série é
  vazia. O sub diz "sem mês neste ano" e a série não desenha nem o filete.
- **Borda — nome de pote longo:** "Liberdade Financeira" em caixa alta a 9px
  cabe em duas linhas; o `break-words` fica.
- **Borda — o pote Outros / Repasses:** é o único cuja cor precisa clarear para
  virar letra. A A2 já resolve, e o teste dela é justamente esse.
- **Erro:** nenhum caminho novo. `porId.get` já devolve `null` para pote
  desconhecido e o cartão não renderiza — comportamento atual, mantido.

---

## B2 · Três colunas a partir de `md`

### Arquivo

O mesmo.

### O que muda

```diff
-<div className="mt-4 grid grid-cols-2 gap-2">
+<div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
```

### As contas

O contêiner é `max-w-5xl` com `px-5` — 984px úteis. A três colunas com 12px de
vão, cada cartão fica com **~320px**. No degrau do `md` (768px), **~237px**.
"Liberdade Financeira" a 9px cabe nos dois.

⚠ **Duas colunas a 360px continua certo**, e o motivo está escrito no
componente: nome de pote e dois números não cabem em três colunas de 120px. O
defeito era **parar em duas para sempre**, dentro de um contêiner de 1024px.

⚠ **O vão cresce junto.** 8px entre cartões de 320px encosta um no outro; o
original usa 12px, e é o que `md:gap-3` dá.

---

## O que fica fora desta fase

- **A `SecaoDoComparativo`** — é a C1, e é outra tela dentro da mesma rolagem.
  Misturar as duas na mesma revisão faria "o cartão ficou bom?" e "a barra ficou
  boa?" virarem uma pergunta só.
- **Qualquer consulta, qualquer campo, qualquer teste de domínio.** Isto é
  layout: o Vitest deste projeto não olha `.tsx`, e a conferência é sua.

---

## Como confiro antes de te entregar

- `npm test` — os 709, para provar que **nada** de domínio se mexeu.
- `npx tsc --noEmit`, `npm run lint`, `npm run format:check`, `npm run build`.
- ⚠ **A tela é sua.** Vale olhar em três larguras — 360px, o degrau do `md`, e o
  monitor — e nos três estados de tema.
