# Spec — Veredito do mês, insights e comparativo

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Depende de:** spec 04 (o painel mostra o número certo) e spec 05 (as categorias são suas)
**Paga uma dívida nomeada:** a linha da spec 04 — *"os insights em texto são interpretação e têm spec própria"*
**Status:** pendências decididas por mim no "continue" do Davi — ver o fim do documento; aprovado para a Etapa 2

> ⚠ Nenhum dado real neste documento. As medições foram feitas contra o Neon e
> estão aqui como **formato e proporção**, nunca como valor; os exemplos de
> texto são inventados.

## O que esta funcionalidade resolve

O painel da spec 04 responde *"quanto"*. Ele não responde *"e daí"*.

No painel estático, o Davi escrevia isso à mão, todo mês: um bloco de insights
por pote e um veredito no fim. Era a parte que ele lia primeiro e a parte que
o app ainda não faz — a única coisa no arquivo original que sobreviveu inteira
sem ser convertida.

## O que eu medi antes de desenhar

Contra o Neon, na conta real, só agregados por mês e por pote.

### Descoberta 1 — existe **um** mês, e o comparativo não é problema de código

| Mês | Lançamentos | Cobertura em dinheiro | Renda declarada |
|---|---|---|---|
| primeiro | 53 | 100% | sim |
| segundo | 1, e excluído | — | não |

O painel estático compara sete períodos. O banco tem um mês fechado e um mês
que é uma linha marcada fora do cálculo.

**Isto muda o que a spec 06 é.** O comparativo anual não está esperando código:
está esperando o Davi subir mais extratos, o que a spec 02 já permite. Uma tela
de comparação construída agora seria uma tela que diz "10 meses ainda sem
dados" — que é, palavra por palavra, o que o arquivo estático já dizia.

O desenho tem de ser **a tela que funciona com um mês e cresce sozinha**, não a
tela que espera doze.

### Descoberta 2 — hoje **quase todo pote estoura**, e um alerta que sempre toca não é alerta

Com a renda declarada e os gastos do mês fechado, medi cada pote de gasto
contra a sua meta:

| Pote | % da meta |
|---|---|
| A | 708% |
| B | 365% |
| C | 148% |
| D | 100% |
| E | 50% |
| F, G | sem meta |

Cinco dos sete potes com meta estão acima dela, dois deles em várias vezes.

Um motor que diz "você estourou o pote" dispararia em quase toda linha da tela,
e o Davi aprenderia a ignorar a cor vermelha em uma semana. Pior: estaria
gritando sobre a coisa errada. Gastar sete vezes a meta de um pote não é um
problema de disciplina — é sinal de que **a renda declarada não descreve aquele
mês**, ou de que aquele mês teve um evento grande.

O veredito não pode começar pelos potes. Ele tem de começar por perguntar se os
números batem.

### Descoberta 3 — dois potes não têm meta, e dividir por ela dá zero

`buckets.percentual_meta` é nulo em dois potes — Manutenção e Outros/Repasses
nascem assim no seed, de propósito: não são fatia do método, são o que sobra.

Medido: para eles a meta calculada é **0**, e "gastou 216 reais de uma meta de
zero" é infinito por cento. Todo cálculo de veredito precisa tratar "sem meta"
como um terceiro estado, e não como meta igual a zero.

### Descoberta 4 — a categoria dominante **existe mesmo**, e é o que salva o insight

Para cada pote, quanto do gasto está na maior categoria dele:

| Pote | Concentração da maior |
|---|---|
| A | 84% |
| B | 68% |
| C | 51% |
| D | 100% |
| E | 100% |
| F | 77% |
| G | 62% |

Nenhum pote abaixo de 51%. Quando o app disser *"quase tudo neste pote é uma
categoria só"*, isso será verdade — e é exatamente a frase que o Davi escrevia à
mão ("Gasolina domina o pote").

É a descoberta que torna a spec possível. Se a concentração fosse 20%, apontar
um protagonista seria inventar um.

## O que um insight automático pode e não pode dizer

Reli os insights que o Davi escreveu à mão. Cada um tem duas metades:

> **"Lazer: 84 acima do teto."** *(fato)*
> **"Compras online e marketplace foram os maiores itens. Mês atípico — tendem a
> não se repetir."** *(previsão)*

A primeira metade é aritmética: pote, meta, diferença, categoria que mais pesa.
O app faz.

A segunda metade é o Davi conhecendo a própria vida. O app **não** faz, e fingir
que faz é o único jeito de esta spec estragar o produto: um app que erra uma
previsão sobre o seu dinheiro perde a confiança que o número correto tinha
construído.

> **A régua:** o app diz **o que aconteceu e onde**. Quem diz **por que** e **o
> que vem depois** é o Davi.

É a mesma régua da spec 04 — *"sinal, não julgamento"* —, agora com texto.

## O desenho

### O veredito do mês, no topo do painel

Uma frase, não um parágrafo, e escolhida por ordem de gravidade. A primeira que
se aplicar é a única que aparece:

1. **A cobertura está baixa.** Se boa parte do mês não está classificada, todo o
   resto é opinião sobre dados incompletos. O veredito manda revisar e para por
   aí. *(A cobertura já existe no topo desde a D6; aqui ela ganha voz.)*
2. **A renda não bate com o mês.** Se o que saiu é muito maior do que a renda
   declarada, o veredito pergunta isso **antes** de falar de pote — descoberta 2.
3. **Um pote destoa.** O pote mais acima da meta, com quanto e com a categoria
   que explica.
4. **O mês fechou dentro.** Também é veredito, e é o que faz os outros três
   valerem alguma coisa.

O veredito **não** aparece sem renda declarada: sem ela não há meta, e sem meta
não há dentro nem fora.

### Os insights, um por pote, dentro do cartão que já existe

O `CartaoDoPote` da spec 04 já abre e mostra os lançamentos. Ganha uma linha:

- **quanto acima ou abaixo da meta**, em dinheiro e não só em porcentagem;
- **a categoria que domina**, quando ela passa de um limiar — a descoberta 4 diz
  que passa quase sempre, e o limiar existe para o dia em que não passar;
- **nada**, quando o pote não tem meta. Silêncio é melhor do que uma frase que
  divide por zero.

### O comparativo que cresce sozinho

Com um mês: a tela mostra o mês e diz, sem drama, que comparação precisa de dois
— e o caminho para subir outro extrato.

Com dois ou mais: por pote, este mês contra a média dos anteriores, com a
diferença. Sem gráfico e sem previsão.

⚠ **A média ignora meses de cobertura baixa.** Um mês metade classificado
puxaria a média para baixo e o app diria "você melhorou" sobre trabalho que
faltou fazer.

## O que fica de fora, e por quê

| Fora | Por quê |
|---|---|
| **Prever o mês que vem** | Descoberta acima. Errar previsão sobre o dinheiro do Davi custa a confiança que o número certo construiu. |
| **Chamar um gasto de "atípico"** | O app não sabe. Ele sabe que a categoria apareceu uma vez; se isso se repete é o Davi quem sabe. |
| **Gráfico** | O painel estático não tinha. Uma linha de texto com o número cabe em 360px; um gráfico de doze meses, não. |
| **Notificação / e-mail mensal** | Precisa de agendamento e de um endereço. Fase 2. |
| **Insight sobre renda por fonte** | A spec 04 já tirou o banner de fontes pelo mesmo motivo: depende de a renda estar classificada. |

## Riscos

**O veredito pode estar tecnicamente certo e ser inútil.** É o risco central, e
a descoberta 2 já o mostrou acontecendo: com os números de hoje, um veredito
ingênuo diria "você estourou cinco potes" sobre um mês em que a explicação
provável é outra. A defesa é a ordem de gravidade — cobertura, depois renda,
depois pote.

**Texto gerado envelhece pior que número.** Um número errado se conserta
reclassificando. Uma frase errada fica na memória de quem leu. Por isso toda
frase desta spec sai de uma função pura e testada, do mesmo jeito que
`avisoDeApagar` da spec 05 — nenhum texto de consequência nasce dentro de um
componente.

**Um mês só pode virar régua sem querer.** Com um único mês, "a média dos
anteriores" é aquele mês. A tela tem de dizer sobre quantos meses está falando,
sempre.

## Pendências — decididas

⚠ **O Davi respondeu "continue", não as quatro perguntas.** As respostas abaixo
são a minha recomendação, tomada para não travar o trabalho. Qualquer uma pode
ser derrubada por ele — e a que mais muda código é a 4.

**1. O veredito mostra uma frase só, ou todas as que se aplicarem?**
➡️ **Uma.** Uma frase é uma decisão de leitura: você lê. Quatro viram um
relatório, e relatório se ignora. As outras observações aparecem no cartão do
pote a que pertencem.

**2. Quando o gasto passa muito da renda declarada, o app pergunta ou afirma?**
➡️ **Pergunta.** A descoberta 4 mostrou 84% de um pote inteiro numa categoria
só — o formato de um evento grande e legítimo, não de descontrole. Afirmar "você
gastou 3x o que declarou" seria o app estar seguro sobre a única coisa que ele
não pode saber.

**3. O insight de categoria dominante entra no cartão do pote ou no topo?**
➡️ **No cartão.** Ali ele fica ao lado do número que o explica. No topo brigaria
com o veredito pelo mesmo espaço, e o veredito é uma frase só justamente para
não ter com quem brigar.

**4. Esta spec vem antes ou depois de subir mais extratos?**
➡️ **Agora, com o comparativo nascendo com um mês.** Deixá-lo de fora seria eu
encolhendo o que foi pedido; construí-lo esperando doze meses seria construir a
frase "10 meses ainda sem dados". Ele entra na última fase e, com um mês, mostra
uma linha honesta e o caminho para subir o próximo extrato. Quando houver o
segundo, a mesma tela passa a comparar sem precisar de código novo.
