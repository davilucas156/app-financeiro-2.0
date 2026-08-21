# Tarefas — O painel do mês

**Etapa:** 2 (Break) do workflow `dev-workflow-davi`
**Spec de origem:** `specs/04-painel-do-mes.md` (decisões tomadas)
**Status:** aguardando aprovação do Davi

Legenda de camada: `INFRA` · `FRONT-VISUAL` · `FRONT-INTEGRADO` · `BACK` · `BANCO`

---

## A parte de maior risco aqui é aritmética, não interface

Nas specs 02 e 03 o risco morava no texto: reconhecer o formato, extrair o
trecho que vira regra. Aqui é a **conta**.

Um pote somado errado não parece errado. Não há exceção, não há tela quebrada,
não há linha vermelha no terminal — há um número plausível que decide se o Davi
acha que gastou demais. É o mesmo tipo de erro silencioso que a A2 da spec 03
tinha, com dinheiro em vez de texto.

Por isso a fase A é pura e medida contra os arquivos reais **antes** de existir
qualquer tela, e o portão visual continua no fim da fase B.

## Uma decisão de desenho que simplifica a conta inteira

**Não existe "% do gasto" nesta tela.** Cada pote se mede contra a **própria**
meta, e a meta vem da renda declarada (decisão 1 da spec).

Isso elimina uma pergunta que pareceria inevitável: se houvesse um "% do total
gasto", eu teria de decidir se transferência para si mesmo entra no denominador
— e ela é passagem, não gasto. Sem denominador comum, a pergunta some.

As porcentagens que aparecem na medição da spec são lente minha para escolher o
desenho, não número de tela.

## Reuso antes de criação

Já existe e **não** deve ser reescrito:

| O que | Onde | Para quê aqui |
|---|---|---|
| `emReais`, `diaEMes` | `lib/dinheiro.ts` | Todo valor da tela |
| `rotuloDeMes` | `upload/enviar-extrato/SeletorDeMes.tsx` | Seletor de mês |
| `agruparPorPote`, `CategoriaEscolhivel` | `classificacao/revisar-lancamento/categorias.ts` | Trocar a categoria na D4 |
| `decidirLancamento` | `classificacao/revisar-lancamento/` | A gravação da D4, com a sombra do desfazer |
| `Card`, `Badge`, `SectionTitle`, `EstadoVazio` | `components/ui/` | A tela inteira |
| `POTES_PADRAO` | `onboarding/potes-padrao.ts` | A base de R$ 1.200 sugerida |

---

## Fase A — A conta (sem tela, sem banco)

### A1 · Somar um mês em potes e categorias
**Camada:** BACK
**Pronto quando:** existe uma função pura que, dados os lançamentos já
classificados de um mês, devolve por pote e por categoria: quanto saiu, quanto
entrou, o saldo, e quantos lançamentos. Não sabe de banco, sessão nem tela.

Os sinais, explícitos porque é onde o erro silencioso mora:

| Caso | O que a conta faz |
|---|---|
| Saída em pote de gasto | Soma |
| **Entrada** em pote de gasto | **Abate** (decisão 2) |
| Entrada em pote de renda | Soma na renda realizada |
| Saída em pote de renda | Abate a renda realizada — é erro de classificação, e a conta não o esconde |
| `status = 'excluido'` | Fica de fora inteiro |
| Sem categoria | Não entra em pote nenhum, mas entra na cobertura da A3 |

### A2 · A cobertura em dinheiro
**Camada:** BACK
**Pronto quando:** a mesma passada devolve **quanto do dinheiro do mês está
classificado**, separado por entrada e saída — não a contagem de lançamentos.

É a descoberta 2 virando número: "32 para decidir" trata uma assinatura de
R$ 20 e um aporte como iguais. Sem isto, o painel parece completo quando 37% do
dinheiro está fora dele.

### A3 · Meta, barra e estouro
**Camada:** BACK
**Pronto quando:** dada a renda declarada e o percentual do pote, sai a meta em
centavos, a fração da barra e se estourou. Cobre os quatro casos que a tela
precisa distinguir e que um `if` solto erraria:

- pote **sem percentual** — sem meta, sem barra, nunca "0%";
- pote **vazio** — zero de verdade, diferente de não classificado (descoberta 3);
- pote **negativo** — reembolso maior que o gasto; a barra vai a zero e o número
  mostra o negativo;
- pote **estourado** — passou de 100%.

### A4 · O par de valor idêntico dentro do pote
**Camada:** BACK
**Pronto quando:** entrada e saída de **mesmo valor** no mesmo pote saem
marcadas para conferência. Os dois continuam visíveis e continuam abatendo — o
aviso é para o Davi olhar, não para o app decidir.

> ⚠ **Não é o "par que se anula" da spec 02.** Aquele roda na importação, cruza
> os dois arquivos por data próxima e tira os dois do cálculo. Este roda no
> painel, dentro de um pote, depois da classificação. Momentos diferentes,
> resultados diferentes — e o código vai dizer isso em comentário, porque
> confundir os dois seria fácil e caro.

### A5 · Medir contra os arquivos reais
**Camada:** BACK
**Pronto quando:** a conta inteira roda contra os dois extratos do Davi e o
resultado bate com a medição da spec: **63% do que saiu e 10% do que entrou
classificados**, 1 de 8 potes de gasto vazio, nenhuma entrada em pote de gasto.

Versionado e **se pulando sozinho** onde os arquivos não existem, como a A6 da
spec 03. Conta; nunca imprime nome nem valor.

Se der diferente, é a A1–A4 que estão erradas — a medição desta vez foi feita
pelo código, não por mim lendo o arquivo.

---

## Fase B — Protótipo visual (dados falsos, sem banco)

### B1 · O topo honesto
**Camada:** FRONT-VISUAL
**Pronto quando:** com dados falsos, o painel mostra seletor de mês, **o que
entrou / o que saiu / a diferença**, e a cobertura em dinheiro com caminho para
a `/revisao`. Legível em 360px, alvos ≥44px.

A ordem é a da confiança: o que entrou e saiu não depende de classificação
nenhuma — só de `direcao`. É o número mais sólido da tela e vem primeiro.

### B2 · Os potes
**Camada:** FRONT-VISUAL
**Pronto quando:** os nove potes aparecem com valor, meta, barra e contagem. Os
quatro casos da A3 têm aparência própria e distinguível **sem ler o número**:
sem meta, vazio, negativo, estourado. Estourado em vermelho **na barra e no
número**.

Mais a renda declarada do mês, visível e editável ali — ela é a régua de tudo
que está acima dela.

### B3 · Dentro do pote
**Camada:** FRONT-VISUAL
**Pronto quando:** tocar num pote abre as categorias dele com valores, e a lista
dos lançamentos daquele pote, cada um com um caminho para trocar a categoria.

**Expande no lugar, não vira rota.** Os dados do mês já estão carregados; uma
rota nova custaria proteção no `proxy.ts`, segunda consulta e mais um item para
o breadcrumb que não existe. Se a lista crescer a ponto de incomodar, aí vira
rota — e aí haverá motivo.

> ⛔ **Portão de aprovação do Davi.** Não seguir para a fase C sem o "ok"
> visual.

---

## Fase C — Banco

### C1 · A renda mensal declarada
**Camada:** BANCO
**Pronto quando:** existe onde guardar a renda **por mês** (`user_id` +
`mes_referencia` + valor), com o mês novo herdando a do anterior na leitura.

Por mês, e não uma na conta, pela regra que já valeu três vezes nesta base: um
aumento em dezembro não pode mudar as metas de julho. É também o que torna o
comparativo anual possível — sem base por mês, comparar dois meses seria
comparar o mesmo número consigo mesmo.

⚠ Nenhuma coluna nova em `buckets`. `valor_meta_centavos` **para de ser lida** e
fica onde está, para o dia em que alguém quiser uma meta fixa que sobreponha o
percentual.

---

## Fase D — Integração

### D1 · O painel lê o mês de verdade
**Camada:** FRONT-INTEGRADO
**Pronto quando:** `/dashboard` mostra o mês mais recente **com lançamentos**,
lido do banco por `user_id`, com a conta da fase A. O seletor troca de mês.

### D2 · Declarar e editar a renda do mês
**Camada:** BACK + FRONT-INTEGRADO
**Pronto quando:** o Davi informa a renda do mês e as metas recalculam. O valor
sugerido é **R$ 1.200** — a base do painel HTML dele, que produz exatamente os
360/300/180/180/120/60 já versionados. Sugerido e visível, nunca aplicado em
silêncio.

Mês sem renda declarada mostra os valores gastos e **não** mostra meta nem
barra. Inventar uma base seria inventar a renda dele.

### D3 · A lista do pote lê do banco
**Camada:** FRONT-INTEGRADO
**Pronto quando:** a lista da B3 mostra os lançamentos reais daquele pote, com
descrição, data, valor e de onde veio a classificação (a procedência da C3).

"Por que isso caiu em Lazer?" passa a ter resposta na tela, seis meses depois —
que é a única razão de a C3 existir.

### D4 · Trocar a categoria de um lançamento já classificado
**Camada:** FRONT-INTEGRADO
**Pronto quando:** dá para corrigir a categoria de um lançamento a partir da
lista, reusando `decidirLancamento` — inclusive a sombra do desfazer da D6.

**É o buraco que a D9 da spec 03 expôs.** Hoje `/revisao` só mostra a fila:
assim que um lançamento é classificado ele some, e a decisão vira permanente.
Corrigir a regra sem poder corrigir o que ela já pegou é meia correção.

### D5 · O `/dashboard` vira o painel
**Camada:** FRONT-INTEGRADO
**Pronto quando:** `ResumoDoQueEntrou` sai e o painel entra. O aviso da D8 **não
some** — vira a cobertura em dinheiro da A2, que é a mesma promessa medida
melhor.

Nenhuma frase da tela pode afirmar algo que esta spec tornou falso. Foi
exatamente isso que a D8 teve de consertar, e a lição é que a tela do painel é a
que envelhece mais rápido.

---

## Fase E — Deploy

### E1 · Publicar e ver junho no celular
**Camada:** INFRA
**Pronto quando:** deploy por `npx vercel --prod` e o Davi abre o painel do
mês **pelo celular**, com os potes conferindo contra o extrato dele.

> ⚠ **Depende da E1 da spec 03, que é dele.** Hoje a conta tem 33 lançamentos e
> **32 pendentes** — o painel abriria com quase tudo fora. Antes disto: desfazer
> o envio arquivado no mês errado, reenviar a fatura como **Julho/2026** e
> mandar o extrato da conta junto, e então classificar.
>
> Sem esse passo o painel funciona e mostra a verdade — e a verdade é uma tela
> quase vazia com "cobertura: 3%".

---

## Resumo

| Fase | Tarefas | Depende de |
|---|---|---|
| A — A conta | A1–A5 | spec 03 no banco |
| B — Protótipo visual | B1–B3 | A (a tela mostra o que a conta produz) |
| C — Banco | C1 | aprovação visual de B |
| D — Integração | D1–D5 | C |
| E — Deploy | E1 | D, e a classificação do Davi |

A Etapa 3 (Plan) é feita **tarefa por tarefa**, não tudo de uma vez.
