# Plano — B1, B2 e B3 · As frases na tela

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** B1, B2 e B3 de `specs/06-veredito-e-insights.tarefas.md`
**Camada:** FRONT-VISUAL — termina no ⛔ **portão de aprovação do Davi**

## Arquivos

| Arquivo | O quê |
|---|---|
| `veredito-do-mes/FaixaDoVeredito.tsx` | criar — a frase no topo |
| `veredito-do-mes/PrototipoDasFrases.tsx` | criar — **morre na D1/D2** |
| `comparar-meses/SecaoDoComparativo.tsx` | criar — barras por mês e tabela |
| `painel-do-mes/CartaoDoPote.tsx` | modificar — a linha do insight |
| `painel-do-mes/TelaDoPainel.tsx` | modificar — a faixa no topo |
| `app/(app)/dashboard/page.tsx` | modificar — o `?estado=` |

## A descoberta que muda a fase: B1 e B2 já podem ser verdade

O plano da fase A previa protótipo com dado inventado nas três. Montando os
componentes, apareceu que **o veredito e o insight não precisam de nada que a
tela já não tenha**:

| A função precisa de | O `TelaDoPainel` já recebe |
|---|---|
| `cobertura` | ✅ prop |
| `rendaDeclaradaCentavos` | ✅ `renda?.centavos` |
| `saiuCentavos` | ✅ prop |
| `metaCentavos` por pote | ✅ `metaDoPote`, que o `CartaoDoPote` já chama |

Não há consulta nova, não há serviço novo, não há `import` de servidor. Então
**B1 e B2 entram ligadas em dados reais** já nesta fase, e a D1 encolhe para
"apagar o protótipo".

Fingir o contrário — desenhar com dado inventado uma frase que os dados reais já
produzem — daria ao Davi uma aprovação sobre texto que ele nunca viu no mês
dele, que é o oposto do que o portão existe para fazer.

⚠ **Isso não vale para o comparativo.** Ele é o único que olha mais de um mês, e
essa leitura é a C1. A B3 é protótipo de verdade, com dado inventado.

## B1 · A faixa do veredito, e o `?estado=` que mostra os quatro

`FaixaDoVeredito` recebe `Veredito | null` e devolve `null` quando `null` — o
silêncio da fase A chega inteiro na tela.

Quatro graus, quatro cores, e a cor vem do `grau`, **nunca de ler a frase**:

| `grau` | Cor | Por quê |
|---|---|---|
| `revisar` | `gold` | pede trabalho, não é erro |
| `renda` | `blue` | é pergunta |
| `pote` | `red` | é o único que aponta o dedo |
| `dentro` | `green` | é boa notícia, e boa notícia precisa de cor |

⚠ **O `?estado=` existe porque os dados dele hoje só produzem um dos quatro.**
Com o mês real, sai o degrau 2 (a pergunta sobre a renda) — os outros três
ficariam invisíveis, e aprovar um texto que se lê uma vez por mês olhando para
um quarto dele seria aprovar no escuro. `?estado=frases` troca o painel inteiro
pelo protótipo; sem o parâmetro, nada muda.

## B2 · A linha do insight, dentro do cartão aberto

Primeira coisa dentro do `DentroDoPote`, antes de "Por categoria".

⚠ **Antes das categorias, e não depois dos lançamentos**: a linha resume o que
vem abaixo dela. Embaixo de trinta lançamentos, ela seria um post-scriptum.

⚠ **O pote sem meta continua sem linha nenhuma** — `insightDoPote` devolve
`null`, e o componente não desenha o espaço vazio. É a descoberta 3 chegando
até o pixel.

## B3 · O comparativo, e por que ele mudou de forma

O plano da fase A desenhava uma tabela de uma coluna: este mês contra a média.
Relendo o `planejamento_anual_davi.html`, o Comparativo Anual do Davi tem
**uma barra por período dentro de cada pote**, mais a linha da meta, mais uma
tabela com todos os períodos.

A média sozinha responde *"este mês foi acima ou abaixo do normal?"*. A série
responde *"o que está acontecendo com este pote ao longo do ano?"* — e é a
segunda que dá nome à tela.

`compararMeses` foi revisada para devolver `serie` junto, e a B3 desenha:

1. **por pote, uma barra por mês** — largura contra o maior valor da tela
   inteira, para as barras de potes diferentes serem comparáveis entre si (é o
   que o `renderCompBars` do arquivo estático faz);
2. **o mês mal classificado aparece apagado**, com legenda. Ele sai da média e
   fica na barra: some da média quem não serve de régua, some da tela quem não
   existe;
3. **a linha da média**, só quando `media.pode`;
4. **a frase**, sempre — `"comparado com maio"` ou `"média de 3 meses"`.

E os dois estados de `media.pode === false`, que apontam para lugares
diferentes: `"primeiro-mes"` manda ao `/upload`; `"anteriores-descartados"`
manda à `/revisao`.

⛔ **Não seguir para a C1 sem o "ok" visual do Davi.** É texto: se a frase soar
errada para ele, o resto não importa.

## O que fica de fora, e é decisão minha

Os **6 cartões de topo** do comparativo estático — investido acumulado, metas
acumuladas, média de gasolina, média de custos fixos, média de lazer, total de
manutenção — não entram.

Eles são agregados **por categoria e por ano**, escritos à mão. Fazê-los pedir
histórico por categoria, e não por pote, que é outra consulta e outra spec. As
barras e a tabela são por pote, que é o que o `MesNoHistorico` carrega.

⚠ **O Davi não escolheu isso.** Ele perguntou se o comparativo era o anual, e
respondeu "continue" sem decidir o escopo. Restaurei as barras e a tabela
porque são a tela; deixei os cartões de fora porque são outra consulta. Se ele
quiser os seis, é uma tarefa nova em cima do mesmo histórico.
