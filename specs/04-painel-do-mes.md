# Spec — O painel do mês

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Depende de:** spec 03 (os lançamentos têm categoria, e a categoria tem pote)
**Fecha um buraco:** a D9 expôs que não existe caminho nenhum para trocar a
categoria de um lançamento já classificado
**Status:** pendências resolvidas pelo Davi; aguardando aprovação para a Etapa 2

> ⚠ Nenhum valor em reais deste documento veio do extrato. As medições são
> **proporções e contagens** rodadas contra os arquivos reais; a ferramenta
> imprimiu só porcentagens e foi apagada. Os R$ 1.200 citados são a base do
> painel HTML do próprio Davi, já versionada em `potes-padrao.ts`.

## O que esta funcionalidade resolve

É o produto. Tudo até aqui foi encanamento: ler o arquivo, guardar, classificar,
corrigir. O `/dashboard` ainda diz, com razão, que os potes com valores são a
próxima etapa a ser construída.

Esta spec é a etapa.

## O que eu medi antes de desenhar

Rodei o motor da spec 03 contra os dois arquivos reais e agreguei por pote — o
que o painel mostraria **hoje**, se existisse. Três números mudaram o desenho.

### Descoberta 1 — a renda medida não serve de base para nada

| | Classificado pelo motor |
|---|---|
| Dinheiro que **saiu** | **63%** |
| Dinheiro que **entrou** | **10%** |

O motor é um motor de gastos. Renda quase não bate regra, e por decisão
consciente: a A5 recusou semear "transferência para si mesmo entrando" porque
pode ser o mesmo dinheiro voltando ou o salário chegando de outro banco, e as
duas leituras mudam a base de **todos** os potes.

Um painel que calculasse "meta do pote = 30% da renda **do mês**" estaria
calculando 30% de 10% da renda. Todo número da tela sairia errado, e sairia
errado com aparência de certo.

**Foi por isso que a base virou um número declarado** — ver a decisão 1. A
medição não escolheu a arquitetura; ela mostrou qual das opções era armadilha.

### Descoberta 2 — a contagem de pendentes não mede o buraco

O `/dashboard` de hoje diz "32 para decidir". Isso conta lançamentos, e
lançamento não é dinheiro: uma assinatura de R$ 20 e um aporte contam igual.

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

Um pote zerado na tela diz "você não guardou nada este mês". Pode ser falso, e a
causa é uma decisão de engenharia, não um fato financeiro.

**Pote vazio precisa distinguir "não houve" de "não foi classificado".** Com a
cobertura em dinheiro da descoberta 2, a distinção sai de graça.

### O resto da medição, para referência

- 47 lançamentos normais, 7 fora do cálculo (pagamento de fatura + pares).
- 1 de 8 potes de gasto ficou vazio.
- **Nenhuma entrada caiu em pote de gasto** neste mês — o estorno da decisão 2
  não aconteceu ainda, mas o código decide antes de acontecer.
- Transporte tem 14 lançamentos; Liberdade Financeira tem 1 que pesa metade do
  gasto classificado. Os dois extremos no mesmo mês, e a tela serve aos dois.

---

## Decisões

### 1. A meta é percentual sobre a renda mensal **declarada**

> "a meta do pote é porcentagem em cima do que foi definido como renda mensal"

`meta_do_pote = percentual_meta% × renda_declarada_do_mês`

O ponto está em **declarada**. A base não é o que o motor conseguiu classificar
como renda — a descoberta 1 mostra que isso seria 10% da verdade. É um número
que o Davi informa, e que não depende de arquivo, de regra nem de revisão.

**Consequências:**

- Nasce a renda mensal como dado. O valor sugerido é **R$ 1.200**, que não é
  invenção minha: é a base do painel HTML dele, e é o que produz exatamente os
  360/300/180/180/120/60 já versionados em `potes-padrao.ts`. Sugerido e
  visível, nunca aplicado em silêncio.
- **`valor_meta_centavos` para de ser lido.** A meta passa a ser calculada. A
  coluna fica para o dia em que alguém quiser uma meta fixa que sobreponha o
  percentual — e enquanto isso não existir, ela não manda em nada.
- Os potes sem percentual (Manutenção, Outros/Repasses) continuam sem meta e sem
  barra. `potes-padrao.ts` já guarda o texto ("eventual", "sem meta") e é
  explícito: **nunca mostrar "0%"**.

**A renda declarada é por mês, e o mês novo herda a do anterior.**

Isso não foi perguntado, e é a aplicação de uma regra que já foi decidida três
vezes nesta base: não reescrever o passado. Um aumento em dezembro não pode
mudar as metas de julho retroativamente — julho aconteceu com a renda de julho.
Herdar do mês anterior significa que ele digita uma vez e só volta lá quando
mudar de verdade.

É também o que torna o comparativo anual (spec 06) possível: sem base por mês,
comparar dois meses seria comparar o mesmo número consigo mesmo.

### 2. Entrada em categoria de gasto abate o pote, e valor idêntico pede conferência

> "estorno abate no pote sim" · "Abate, mas avisa quando zera exato"

Um lançamento de **entrada** classificado numa categoria de pote de gasto
subtrai do total daquele pote. Estorno é a compra desfeita; deixá-lo de fora
faria o pote mostrar um gasto que não existiu.

Vale para valor parcial (abate parte) e para valor maior que o gasto — nesse
caso **o pote fica negativo, e a tela mostra o negativo**. Esconder daria um
zero que não é verdade.

**Quando a entrada tem exatamente o mesmo valor de uma saída do mesmo pote, o
par é marcado para conferência.** Valor idêntico é ambíguo: pode ser um
reembolso de verdade, ou a mesma transferência aparecendo nos dois arquivos. Os
dois lançamentos continuam visíveis e continuam abatendo — o aviso é para você
olhar, não para o app decidir sozinho.

⚠ **Não é o "par que se anula" da spec 02**, e a diferença importa. Aquele roda
na **importação**, cruza os dois arquivos por data próxima, e tira os dois do
cálculo. Este roda no **painel**, dentro de um pote, depois de os dois terem
sido classificados. Mecanismos diferentes, momentos diferentes, resultados
diferentes — e um comentário no código vai dizer isso, porque a confusão entre
eles seria fácil e cara.

### 3. O painel abre no mês mais recente com lançamentos

> "o painel abre no mes atual lançado"

Não no mês do calendário. Abrir num mês vazio no dia 2 de agosto seria uma tela
em branco sem nada de errado ter acontecido.

### 4. Pote estourado: vermelho na barra **e** no número

> "numero tambem"

É o único sinal da tela que pede ação, e a spec dos insights vai construir em
cima dele.

---

## O desenho

### A tela, de cima para baixo

1. **Seletor de mês.** `transactions.mes_referencia` já é o eixo do produto
   inteiro, e a lista de meses já existe em `resumoDeLancamentos`.

2. **A honestidade primeiro.** Antes de qualquer número grande: quanto do
   dinheiro do mês estes números cobrem, e um caminho para a `/revisao` se
   faltar. Um painel incompleto que não se anuncia é pior do que nenhum painel —
   mesma régua da D6 da spec 02 e da D8.

3. **O que entrou e o que saiu**, com a diferença. Responde "fechei o mês no
   azul?" e **não depende de classificação nenhuma** — só de `direcao`. É o
   número mais confiável da tela, e por isso vem antes dos potes.

4. **A renda declarada do mês**, editável ali mesmo. Ela é a régua de tudo que
   vem abaixo; escondê-la numa tela de configuração faria as metas parecerem
   leis da natureza.

5. **Os potes, com barra de progresso.** Quanto saiu, a meta, a barra, quantos
   lançamentos. Sem meta, sem barra.

6. **Dentro do pote, as categorias.** É onde "20% em Transporte" vira "tanto em
   gasolina e tanto em ônibus", que é a informação sobre a qual dá para agir.

### Tocar num pote abre a lista, e a lista fecha o buraco da D9

Os cards clicáveis do `readme.md` seção 9 não são enfeite: é onde os lançamentos
daquele pote aparecem, e é a **única tela onde faz sentido trocar a categoria de
algo já classificado**.

Hoje isso não existe em lugar nenhum. `/revisao` só mostra a fila; assim que um
lançamento é classificado ele some, e a decisão vira permanente. A D9 deixou
isso exposto ao permitir corrigir a regra sem poder corrigir o que ela já pegou.

A lista filtrada resolve os dois: você vê o que caiu ali e conserta o que estiver
errado, reusando a gravação da D4 — inclusive a sombra do desfazer da D6.

### Sinal, não julgamento

O pote estourado ganha vermelho e **um número**, não um adjetivo. Os insights em
texto ("você gastou demais em lazer") são interpretação e têm spec própria. Esta
mostra o fato.

## O que fica de fora, e por quê

| Fora | Por quê |
|---|---|
| **Lançar dinheiro em espécie à mão** | Decisão do Davi: *"não se preocupe com dinheiro por enquanto, fica como melhoria pra depois do MVP pronto"*. Custaria migration (`transactions.import_id` é `not null`), tela nova, e ensinar o desfazer da spec 02 a não apagar o que foi digitado. O estorno que **vem do extrato** abate desde o primeiro dia. |
| **Insights automáticos e veredito do mês** | Interpretação sobre o número. O número tem de estar certo primeiro. |
| **Comparativo anual** | Precisa de vários meses fechados. Hoje há um, e ele nem está no mês certo. |
| **Editar percentual do pote** | Fase 2 no readme. A **renda** vira editável aqui; o rateio entre potes, não. |
| **Banner de fontes de renda** | Depende de a renda estar classificada, que a descoberta 1 mostra ser 10%. Volta quando houver o que mostrar. |
| **Exportar** | Fase 2. |

## Riscos

**O painel pode mentir com a verdade.** Todo número aqui é uma soma correta de
dados incompletos. A defesa é a cobertura em dinheiro no topo, e ela não pode
ser um rodapé cinza — se não for lida, o resto da tela engana.

**O mês de referência não é o mês do gasto.** Uma parcela antiga na fatura de
julho tem `data` de março e `mes_referencia` de julho. Já está resolvido no
banco desde a spec 02, mas a tela precisa dizer qual dos dois está mostrando, ou
o Davi vai procurar um gasto de março em março e não achar.

**A renda declarada pode envelhecer em silêncio.** Herdar do mês anterior é
conveniente e tem um custo: seis meses depois de um aumento, as metas continuam
calculadas sobre o salário antigo e ninguém avisou. O painel deve mostrar a
renda do mês **na tela**, não escondida — é a defesa mais barata que existe.
