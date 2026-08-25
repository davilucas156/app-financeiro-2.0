# Tarefas — Veredito do mês, insights e comparativo

**Etapa:** 2 (Break) do workflow `dev-workflow-davi`
**Spec de origem:** `specs/06-veredito-e-insights.md` (pendências decididas)
**Status:** ✅ **concluída.** Todas as fases entregues; a E1 confirmada pelo
Davi — ele leu o veredito do mês fechado e disse que a frase está certa.

Legenda de camada: `INFRA` · `FRONT-VISUAL` · `FRONT-INTEGRADO` · `BACK` · `BANCO`

---

## O risco aqui não é perder dado — é dizer bobagem com confiança

Na spec 02 o risco morava no texto; na 03, no trecho que vira regra; na 04, na
aritmética; na 05, na destruição. Aqui é **credibilidade**.

Um número errado se conserta reclassificando, e some. Uma frase errada fica na
memória de quem leu, e contamina os números certos ao lado dela. A descoberta 2
já mostrou o modo de falha: com os dados de hoje, um veredito ingênuo diria
"você estourou cinco potes" sobre um mês cuja explicação provável é outra.

Por isso **toda frase desta spec nasce de uma função pura e testada**, e a fase
A é inteira de decisão sem tela — mesma forma do `avisoDeApagar` da spec 05 e do
`avisoDoVoltar` da spec 03.

## Nenhuma migration, e quase nenhum servidor novo

O veredito e os insights se calculam com o que `painelDoMes.service.ts` **já**
devolve: potes com total, categorias com total, renda declarada e cobertura.

Só o comparativo precisa de leitura nova, porque só ele olha mais de um mês.

## Reuso antes de criação

Já existe e **não** deve ser reescrito:

| O que | Onde | Para quê aqui |
|---|---|---|
| `estadoDoPote` com `"sem-meta"` | `painel/painel-do-mes/poteNoPainel.ts` | A descoberta 3 **já está resolvida** ali; o insight só precisa respeitá-la |
| `coberturaDoMes`, `Cobertura` | `painel/somar-o-mes/cobertura.ts` | O primeiro degrau do veredito |
| `PoteNoPainel`, `CategoriaNoPainel` | `poteNoPainel.ts` | A entrada dos insights, sem tipo novo |
| `RendaDeclarada` | `painel/renda-do-mes/rendaDeclarada.ts` | Sem ela não há meta, e sem meta não há veredito |
| `TopoDoMes`, `CartaoDoPote` | `painel/painel-do-mes/` | Os dois lugares onde o texto entra |
| `Card`, `SectionTitle`, `EstadoVazio` | `components/ui/` | O comparativo |
| O protótipo atrás de `?estado=` | o que a B1 da spec 04 fez no `/painel` | A fase B, pelo mesmo motivo |

⚠ **`legendaDoPote` não vira o insight.** Ela é a linha embaixo da barra, curta
e sempre presente. O insight é outra frase, mais longa e às vezes ausente.
Esticar a legenda faria um texto servir a dois donos.

---

## Fase A — As decisões puras (sem banco, sem tela)

### A1 ✅ · O veredito, em ordem de gravidade
**Camada:** BACK (puro)
**Arquivo:** `features/painel/veredito-do-mes/veredito.ts` + teste
**Pronto quando:** dada a cobertura, a renda declarada, o total que saiu e os
potes, a função devolve **uma** frase — ou `null`.

A ordem **é** a funcionalidade, e é o que a descoberta 2 comprou:

| # | Quando | O que diz |
|---|---|---|
| 1 | cobertura baixa | manda revisar, e para aí — o resto seria opinião sobre dado incompleto |
| 2 | saiu ≫ renda declarada | **pergunta** se a renda mudou (pendência 2) |
| 3 | um pote destoa | o mais acima da meta, com quanto |
| 4 | fechou dentro | também é veredito |

`null` quando não há renda declarada: sem meta não há dentro nem fora. O painel
já tem o `CampoDeRenda` para esse caso e não precisa de duas cobranças.

⚠ Os limiares ("baixa", "muito acima") são **constantes nomeadas no arquivo**,
não números soltos no meio do `if`. Eles vão ser ajustados quando houver mais
meses, e quem ajusta precisa achá-los.

### A2 ✅ · O insight de um pote
**Camada:** BACK (puro)
**Arquivo:** `features/painel/veredito-do-mes/insightDoPote.ts` + teste
**Pronto quando:** dado um pote e a meta dele, devolve a linha do cartão — ou
`null`.

Duas metades, e as duas podem faltar:
- a diferença para a meta **em dinheiro**, e não só em porcentagem (708% não
  cabe numa barra; "R$ 2.100 acima" cabe numa frase);
- a categoria que domina, **quando passa do limiar**. A descoberta 4 mediu
  51% a 100%, então ela quase sempre passa — o limiar existe para o mês em que
  não passar, e nesse mês a frase simplesmente não sai.

⚠ **`"sem-meta"` devolve `null`.** Não é um pote que fechou dentro; é um pote
que não tem dentro. É a descoberta 3, e `estadoDoPote` já sabe distingui-la.

### A3 ✅ · O comparativo, e o que ele faz com um mês só
**Camada:** BACK (puro)
**Arquivo:** `features/painel/comparar-meses/comparativo.ts` + teste
**Pronto quando:** dada uma lista de meses com gasto por pote e cobertura,
devolve, por pote, este mês contra a média dos anteriores — ou o estado
"ainda não dá para comparar".

⚠ **Meses de cobertura baixa saem da média.** Um mês metade classificado
puxaria a média para baixo e o app diria "você melhorou" sobre trabalho que
faltou fazer. É a mesma régua do degrau 1 do veredito.

⚠ **A tela sempre diz sobre quantos meses está falando.** Com um mês anterior,
"a média" é aquele mês — e chamar isso de média sem dizer seria a tela dando
peso estatístico a uma amostra de um.

---

## Fase B — As telas, com os quatro estados à mostra

⚠ **A B1 e a B2 saíram ligadas em dados reais, e não em protótipo.** Montando
os componentes apareceu que `vereditoDoMes` e `insightDoPote` não precisam de
nada que a tela já não receba: cobertura, renda e potes já são props do
`TelaDoPainel`, e a meta de cada pote é a mesma conta que o `CartaoDoPote` faz
para desenhar a barra. Não há consulta nova.

Desenhar com número inventado uma frase que o mês de verdade já produz daria
ao Davi uma aprovação sobre texto que ele nunca viu no mês dele — o oposto do
que este portão existe para fazer. **A D1 encolheu para "apagar o protótipo".**

O protótipo continua existindo por outro motivo: o mês real produz **um** dos
quatro vereditos.

### B1 ✅ · O veredito no topo, e os quatro juntos numa tela de protótipo
**Camada:** FRONT-VISUAL
**Pronto quando:** o Davi vê **os quatro vereditos ao mesmo tempo**, com dados
inventados, atrás de `?estado=` — a mesma mecânica da B1 da spec 04.

É o motivo de existir uma fase visual aqui. Nos dados dele hoje só um dos
quatro aparece (o degrau 2, pela descoberta 2), e aprovar um texto que se lê
uma vez por mês olhando só para um quarto dele seria aprovar no escuro.

### B2 ✅ · A linha do insight dentro do `CartaoDoPote`
**Camada:** FRONT-VISUAL
**Pronto quando:** a linha aparece no cartão aberto, e o pote sem meta continua
sem linha nenhuma.

### B3 ✅ · O comparativo, nos três estados
**Camada:** FRONT-VISUAL
**Pronto quando:** com um mês e com vários, os dois desenhados com dado
inventado.

> ⛔ **Portão de aprovação do Davi.** Não seguir para a fase C sem o "ok"
> visual. É texto: se a frase soar errada para ele, o resto não importa.

---

## Fase C — O servidor

### C1 ✅ · O histórico por mês e por pote
**Camada:** BACK
**Arquivo:** `features/painel/comparar-meses/historicoDosMeses.service.ts`
**Pronto quando:** devolve, para cada `mes_referencia` da conta, o gasto por
pote e a cobertura em dinheiro daquele mês.

⚠ **Uma consulta agrupada, não uma por mês.** Doze meses viram doze idas ao
banco numa página que já faz cinco.

⚠ **Os potes vêm da tabela de potes**, como na B5 da spec 05 — um pote sem
gasto em nenhum mês tem de aparecer com zero, não sumir da comparação.

✅ **Verificado contra o Neon** com conta descartável, dez conferências, todas
passando e a conta apagada no `finally`:

- dois meses, em ordem;
- cobertura de 100% num mês e 50% no outro — e a renda crua **não** conta
  contra, porque a cobertura aqui é só do que sai;
- reembolso dentro do pote abate o gasto dele (600 de gasolina menos 100 de
  estorno viram 500), como o `orientar` do `somarOMes`;
- pagamento de fatura (`excluido`) não conta em lugar nenhum;
- **pote sem gasto em mês nenhum aparece com zero** — a lição da B5;
- pote de renda fica fora do histórico;
- e o comparativo em cima disso: junho comparado com maio, e maio sozinho
  devolvendo `primeiro-mes` sem enxergar junho na série.

---

## Fase D — Integração

### D1 ✅ · Apagar o protótipo
**Camada:** FRONT-INTEGRADO
**Pronto quando:** `PrototipoDasFrases.tsx` e o `?estado=frases` da
`dashboard/page.tsx` deixam de existir.

⚠ **Encolheu na fase B**, que já entregou o veredito e o insight ligados no mês
de verdade. O que sobrou aqui é a limpeza do andaime.

### D2 ✅ · O comparativo ligado
**Camada:** FRONT-INTEGRADO
**Pronto quando:** a seção lê o histórico de verdade e, com um mês, mostra a
linha honesta e o caminho para subir outro extrato.

---

## Fase E — Deploy

### E1 ✅ · Publicar e ler o veredito do mês fechado
**Camada:** INFRA
**Pronto quando:** deploy por `npx vercel deploy --prod --yes` e o Davi lê, no
celular, o veredito do mês que ele já fechou — e diz se a frase está certa.

⚠ **A E1 aqui não é confirmação de que funcionou; é revisão de texto.** Ele é a
única pessoa que sabe se "o mês saiu bem acima da renda declarada" é a coisa
certa a dizer sobre aquele mês.

✅ **Aprovada pelo Davi.** A frase está certa sobre o mês dele — o que valida
junto a ordem de gravidade da A1: com os dados de hoje o veredito que sai é o
degrau 2, exatamente como a descoberta 2 previu.

---

## Resumo

| Fase | Tarefas | Depende de |
|---|---|---|
| A — As decisões puras ✅ | A1–A3 | nada |
| B — As telas ✅ | B1–B3 | A (a tela mostra o que a função já decide) |
| C — O servidor ✅ | C1 | aprovação visual de B |
| D — Integração ✅ | D1–D2 | C |
| E — Deploy | E1 | D |

A Etapa 3 (Plan) é feita **tarefa por tarefa**, não tudo de uma vez.
