# Spec — O painel do mês

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Depende de:** spec 03 (os lançamentos têm categoria, e a categoria tem pote)
**Fecha um buraco:** a D9 expôs que não existe caminho nenhum para trocar a
categoria de um lançamento já classificado
**Status:** aguardando as pendências do Davi

> ⚠ Nenhum valor em reais neste documento. As medições são **proporções e
> contagens** rodadas contra o extrato real do Davi; a ferramenta imprimiu só
> porcentagens e morreu em seguida. Mesma regra de
> `references/formatos-de-extrato.md`.

## O que esta funcionalidade resolve

É o produto. Tudo até aqui foi encanamento: ler o arquivo, guardar, classificar,
corrigir. O `/dashboard` ainda diz, com razão, que os potes com valores são a
próxima etapa a ser construída.

Esta spec é a etapa.

## O que eu medi antes de desenhar

Rodei o motor da spec 03 contra os dois arquivos reais e agreguei por pote — o
que o painel mostraria **hoje**, se existisse. Três números mudaram o desenho.

### Descoberta 1 — a base de cálculo é a parte menos classificada

| | Classificado pelo motor |
|---|---|
| Dinheiro que **saiu** | **63%** |
| Dinheiro que **entrou** | **10%** |

O motor é um motor de gastos. Renda quase não bate regra, e por decisão
consciente: a A5 recusou semear "transferência para si mesmo entrando" porque
pode ser o mesmo dinheiro voltando ou o salário chegando de outro banco, e as
duas leituras mudam a base de **todos** os potes.

**Consequência direta:** um painel que calcule "meta do pote = 30% da renda do
mês" estaria calculando 30% de 10% da renda. Todo número da tela sairia errado,
e sairia errado com aparência de certo.

Isto é a pendência 1, e é a decisão mais consequente da spec inteira.

### Descoberta 2 — a contagem de pendentes não mede o buraco

O `/dashboard` de hoje diz "32 para decidir". Isso conta lançamentos, e
lançamento não é dinheiro: uma assinatura de R$ 20 e um aporte de R$ 2.000
contam igual.

Medido: **37% do dinheiro que saiu ainda não tem categoria**, e nesse mês um
único lançamento responde por metade de um pote inteiro.

**O painel tem de mostrar a cobertura em dinheiro**, não em contagem. "Estes
números cobrem 63% do que saiu" é a diferença entre um painel honesto e um
painel que parece completo.

### Descoberta 3 — pote com meta pode ficar vazio por decisão minha

`metas-sonhos` fica com **zero** lançamentos, e não porque o Davi não guardou:
a regra que alimentaria esse pote foi deliberadamente **não semeada** (está em
`FORA_DE_PROPOSITO`, na A5 — o readme pede duas camadas decididas pela conta
destino, e nenhum critério do MVP lê conta destino).

Um pote zerado na tela diz "você não guardou nada este mês". Pode ser falso, e
a causa é uma decisão de engenharia, não um fato financeiro.

**Pote vazio precisa distinguir "não houve" de "não foi classificado".** Com a
cobertura em dinheiro da descoberta 2, a distinção sai de graça.

### O resto da medição, para referência

- 47 lançamentos normais, 7 fora do cálculo (pagamento de fatura + pares).
- 1 de 8 potes de gasto ficou vazio.
- **Nenhuma entrada caiu em pote de gasto** neste mês — o caso "estorno reduz o
  pote" não aconteceu, mas o desenho precisa decidi-lo antes que aconteça.
- Transporte tem 14 lançamentos e é o pote com mais movimento; Liberdade
  Financeira tem 1 lançamento que pesa metade do gasto classificado. Os dois
  extremos existem no mesmo mês, e a tela tem de servir aos dois.

## O desenho

### A tela, de cima para baixo

1. **Seletor de mês.** `transactions.mes_referencia` já é o eixo do produto
   inteiro; a lista de meses já existe em `resumoDeLancamentos`.

2. **A honestidade primeiro.** Antes de qualquer número grande: quanto do
   dinheiro do mês estes números cobrem, e um caminho para a `/revisao` se
   faltar. Um painel incompleto que não se anuncia é pior do que nenhum painel —
   é a mesma régua da D6 da spec 02 e da D8.

3. **O que entrou e o que saiu**, com a diferença. É o número que responde "eu
   fechei o mês no azul?", e não depende de classificação nenhuma para estar
   certo — só de `direcao`. É o número mais confiável da tela e por isso vem
   antes dos potes.

4. **Os potes, com barra de progresso.** Cada um: quanto saiu, a meta, a barra,
   e quantos lançamentos. Os potes sem meta (Manutenção, Outros/Repasses)
   mostram o valor sem barra — `potes-padrao.ts` já guarda o texto para isso
   ("eventual", "sem meta") e o comentário de lá é explícito: **nunca mostrar
   "0%"**.

5. **Dentro do pote, as categorias.** É onde "20% em Transporte" vira "R$ X em
   gasolina e R$ Y em ônibus", que é a informação sobre a qual dá para agir.

### Tocar num pote abre a lista, e a lista fecha o buraco da D9

Os cards clicáveis do `readme.md` seção 9 não são enfeite: é onde os lançamentos
daquele pote aparecem, e é a **única tela onde faz sentido trocar a categoria de
algo já classificado**.

Hoje isso não existe em lugar nenhum. `/revisao` só mostra a fila; assim que um
lançamento é classificado, ele some e a decisão vira permanente. A D9 deixou
isso exposto ao permitir corrigir a regra sem poder corrigir o que ela já pegou.

A lista filtrada resolve os dois: você vê o que caiu ali e conserta o que estiver
errado, reusando a mesma gravação da D4.

### Sinal, não julgamento

O pote estourado ganha destaque visual e **um número**, não um adjetivo. Os
insights em texto ("você gastou demais em lazer") são a spec seguinte, e são
outra coisa: interpretação. Esta spec mostra o fato.

## O que fica de fora, e por quê

| Fora | Por quê |
|---|---|
| **Insights automáticos e veredito do mês** | São interpretação sobre o número. O número tem de estar certo primeiro, e a lista dos 10 insights do readme merece spec própria. |
| **Comparativo anual** (gráfico + tabela) | Precisa de vários meses fechados. Hoje há um, e ele nem está no mês certo. |
| **Editar meta e percentual do pote** | Fase 2 no readme, e a spec 05 explica por que mexer no rateio é outra funcionalidade. |
| **Banner de fontes de renda** | Depende de a renda estar classificada, que a descoberta 1 mostra ser 10%. Volta quando houver o que mostrar. |
| **Exportar** | Fase 2. |

## Riscos

**O painel pode mentir com a verdade.** Todo número aqui é uma soma correta de
dados incompletos. A defesa é a cobertura em dinheiro no topo, e ela não pode
ser um rodapé cinza — se ela não for lida, o resto da tela engana.

**O mês de referência não é o mês do gasto.** Uma parcela antiga na fatura de
julho tem `data` de março e `mes_referencia` de julho. Isso já está resolvido no
banco desde a spec 02, mas a tela precisa dizer qual dos dois está mostrando, ou
o Davi vai procurar um gasto de março em março e não achar.

---

## Pendências — precisam da sua resposta antes da Etapa 2

**1. A meta do pote é valor fixo ou percentual da renda do mês?**

O banco guarda os dois (`percentual_meta` e `valor_meta_centavos`), então a
decisão nunca foi tomada — só adiada.

| | Como fica | Custo |
|---|---|---|
| **A — meta fixa de referência** (360/300/180/180/120/60) | Estável, comparável mês a mês, independe da renda estar classificada | Se sua renda mudar, a meta fica velha até a fase 2 permitir editar |
| **B — % da renda do mês** | Adapta sozinha | A descoberta 1 mata: 30% de 10% da renda. E "estourei o pote" perde o sentido quando a meta muda todo mês |
| **C — % da renda, com trava** | Usa a renda real **se** o mês estiver 100% classificado; senão cai na fixa e diz qual usou | Duas fórmulas na tela, e você tem de saber qual está vendo |

**Recomendo A.** É o que a medição sustenta, é estável para o comparativo anual
da spec seguinte, e "editar metas" já é item nomeado da fase 2. B é a resposta
bonita e a errada; C é a resposta certa para daqui a um ano.

**2. Entrada numa categoria de gasto: abate o pote ou é ignorada?**

Um estorno de compra classificado em "Compras online" pode reduzir o pote ou ser
tratado como entrada avulsa. Não aconteceu neste mês (medido: zero), então dá
para decidir com calma — mas o código tem de decidir antes que aconteça.

**Recomendo abater.** Estorno é a compra desfeita; deixá-lo de fora faria o pote
mostrar um gasto que não existiu.

**3. O painel abre em qual mês?**

O mais recente com lançamentos, ou o mês corrente mesmo que vazio? **Recomendo o
mais recente com lançamentos** — abrir num mês vazio no dia 2 de cada mês seria
uma tela em branco sem nada de errado ter acontecido.

**4. Pote estourado: quanto destaque?**

Vermelho na barra e no número, ou só a barra passando de 100%? **Recomendo
vermelho no número também.** É o único sinal da tela que pede ação, e a spec
seguinte vai construir os insights em cima dele.
