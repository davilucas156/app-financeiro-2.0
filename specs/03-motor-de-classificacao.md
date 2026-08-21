# Spec — Motor de classificação

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Depende de:** spec 02 (os lançamentos existem no banco, sem categoria)
**Traz de volta:** C5 da spec 01 (`classification_rules` + seed do Davi), adiada
para ser desenhada junto com o motor que a consome
**Status:** pendências resolvidas pelo Davi; aguardando aprovação para a Etapa 2

> ⚠ Nenhum dado real deste documento veio de nome ou valor do extrato. As
> medições abaixo são contagens; os exemplos são inventados. Mesma regra de
> `references/formatos-de-extrato.md`.

## O que esta funcionalidade resolve

Hoje o `/dashboard` diz, com razão, que **falta classificar para o painel
existir**. 54 lançamentos estão no banco com `categoria_id` nulo. Esta spec é o
que os coloca nos potes.

Hoje o motor de classificação **sou eu, o Claude**, lendo o CSV à mão todo mês.
O objetivo é que isso vire código determinístico + regras no banco, para
funcionar sem ninguém no loop (`readme.md`, seção 7).

## O que eu medi antes de desenhar

Rodei as regras herdadas do `readme.md` (seção 7) contra os 54 lançamentos
reais de junho/julho. Isso mudou o desenho três vezes.

| | |
|---|---|
| Lançamentos importados | 54 |
| Já resolvidos na importação (excluídos + pares) | 7 |
| **A classificar** | **47** |
| Cobertos pelas regras do readme, como escritas | 30 (64%) |
| Cobertos após somar 3 regras que o readme não previa | **36 (77%)** |
| Sobram | **11 (23%)** |

> ⚠ **Corrigido pela A6.** Os números `36 / 11` acima estão errados e ficam
> registrados só para o histórico. A medição foi feita por mim lendo o arquivo
> com julgamento humano, antes de o motor existir. Rodando o motor de verdade
> (A1–A6), o resultado é **30 classificados e 17 pendentes**.
>
> A diferença de 6 tem nome, e nenhum dos seis é defeito do motor:
>
> | Quantos | O que | Por quê |
> |---|---|---|
> | 1 | App de corrida no cartão | A única regra que o pegaria é `99`, e ela também classifica um **restaurante** como Transporte e casa com o número da conta. A A5 recusou a regra |
> | 3 | Petshop e clínica veterinária | **Não existe categoria de pet** nos 8 potes semeados |
> | 2 | Transferência para si mesmo, entrando | Deliberado: pode ser passagem ou pode ser salário chegando de outro banco, e as duas leituras mudam a base de todos os potes |
>
> O julgamento humano contava o `99` como acerto sem enxergar o que ele leva
> junto. **A medição estava otimista, e o otimismo era meu.**

### Descoberta 1 — o readme esqueceu três regras

Não estavam na seção 7 e aparecem no mês medido: **aplicação/resgate de CDB**
(vai para Liberdade Financeira), **IOF de compra internacional**, e
**transferência para si mesmo** (o extrato traz o próprio nome do titular).
Sozinhas, levam a cobertura de 64% para 77%.

### Descoberta 2 — os pendentes são de dois tipos, e só um é problema de LLM

Números conferidos pela A6 contra o motor real:

| Tipo | Quantos | Exemplo (inventado) |
|---|---|---|
| **Comerciante no cartão** | 9 | `ACME AI SUB SAN FRANCISCO CA` |
| **Pix de/para uma pessoa** | 6 | `Pix enviado: "Cp :00000000-Fulana de Tal"` |
| **Transferência para si mesmo** | 2 | `Pix recebido: "Cp :00000000-<você>"` |

Os 9 primeiros um LLM classifica bem: o nome do comerciante diz o que ele
vende. **Menos três deles**, que são petshop e veterinário — ali não falta
palpite, falta categoria.

**Os 6 seguintes, não.** Nenhum modelo sabe que a pessoa X é sua mãe e que a
pessoa Y é o mecânico. Mandar esses para a API é pagar por um chute pior do que
perguntar. Eles precisam de uma coisa diferente: **você nomear a pessoa uma
vez**.

**Os 2 últimos ninguém acerta de fora**, nem LLM nem regra: só você sabe se o
dinheiro que chega da sua outra conta é passagem ou é salário.

Essa distinção é o eixo do desenho. "Não classificado" não é um estado só.

### Descoberta 3 — regra escrita de memória erra

Escrevi `apple.com` na lista de termos. A descrição real é `APPLE COM BILL`, sem
ponto. A regra não bateu.

Por isso, **no MVP não existe tela de cadastrar regra do zero**. Regra nasce de
uma correção sua sobre uma descrição real — o texto vem do arquivo, não da sua
memória. (`readme.md` já coloca edição de regras na fase 2.)

### Descoberta 4 — a categoria do banco é pista, nunca verdade

A coluna `Categoria` da fatura, medida: 15 `TRANSPORTE`, 7 `OUTROS`, 3
`COMPRAS`, 3 `SERVICOS`, e mais 5 categorias com 1 cada. Uma clínica veterinária
veio como `SERVICOS` enquanto outra linha do mesmo mês veio como `PETSHOP`.

Confirma a decisão da spec 02: guardar como palpite, usar para ordenar
sugestões, nunca gravar como classificação.

---

## Página: `/revisao` — decidir o que sobrou

**Propósito:** transformar o que o motor não resolveu em decisões suas, uma a
uma, no polegar. É a única tela nova desta spec.

### Componentes

| Componente | Estado inicial | Variações |
|---|---|---|
| Contador de pendentes ("3 de 17") | Posição atual | **Zero:** estado vazio "tudo classificado" |
| Cartão do lançamento (descrição original, valor, data, origem) | Um por vez | **Descrição longa:** quebra, sem truncar — é o que você usa para decidir |
| Sugestões de categoria (até 3, ordenadas) | Do motor: categoria do banco, histórico, regra fraca | **Sem sugestão:** vai direto para a lista completa |
| Lista completa de categorias, agrupada por pote | Recolhida | Busca por nome quando passar de ~20 |
| Pergunta "sempre classificar assim?" | Aparece **depois** de escolher | **Descrição sem trecho estável:** não aparece |
| Botão "Fora do cálculo" | Sempre disponível | — |
| Barra de progresso do mês | Quantos faltam | — |

### Comportamentos do usuário

| Ação do usuário | Resposta do sistema |
|---|---|
| Abre `/revisao` com pendências | Mostra o primeiro pendente, com as sugestões que o motor conseguiu |
| Toca numa sugestão | Grava a categoria, avança para o próximo, e pergunta se vira regra |
| Abre a lista completa e escolhe outra categoria | Idem — a origem da escolha não muda o efeito |
| Responde "sim, sempre" | Cria uma `classification_rule` a partir do **trecho estável** da descrição, e aplica aos outros pendentes do mesmo mês que casarem |
| Responde "só desta vez" | Grava só este. Nenhuma regra nasce |
| Marca "Fora do cálculo" | `status = excluido`, com motivo "você marcou". Continua visível no histórico |
| Erra e quer voltar | "Voltar" reabre o anterior e desfaz a gravação dele |
| Chega ao fim | Estado "nada pendente", com o número do que foi classificado e link para o painel |
| Abre `/revisao` sem nenhuma pendência | Estado vazio: "nada para revisar" — e agora isso é verdade |
| Dois aparelhos ao mesmo tempo | A gravação é por lançamento; o segundo aparelho vê o que o primeiro já decidiu ao avançar |
| Sessão expira no meio | Volta para `/entrar`; nada do que já foi decidido se perde |

### Dados envolvidos

- **Lê:** `transactions` com `categoria_id` nulo do usuário; `buckets`,
  `categories`, `classification_rules` do usuário
- **Escreve:** `transactions.categoria_id`, `status`, `motivo`;
  `classification_rules` (quando você responde "sempre")

---

## Página: `/upload` — o resumo passa a falar de classificação

**Propósito:** a mesma tela da spec 02. Só o resumo muda.

### Comportamentos do usuário

| Ação do usuário | Resposta do sistema |
|---|---|
| Importa um extrato | O motor roda **na mesma transação da importação**. O resumo mostra "30 classificados automaticamente · 17 para você decidir" |
| Toca em "Decidir agora" | Vai para `/revisao` |
| Importa um mês cujas regras já cobrem tudo | "Tudo classificado." Nenhuma visita a `/revisao` é necessária |
| Desfaz uma importação | Os lançamentos somem; as regras que nasceram deles **ficam** |

---

## Página: `/regras` — ver, mexer e apagar o que foi aprendido

**Decidido pelo Davi no portão visual da fase B.** O `readme.md` colocava isso
na fase 2; ele trouxe para cá, e a razão é boa: um motor que aprende sozinho e
nunca desaprende é um motor que você deixa de confiar no dia em que ele erra.

**Propósito:** ver todas as regras da sua conta, corrigir uma que ficou larga
demais, e apagar a que não deveria ter nascido.

### Comportamentos do usuário

| Ação do usuário | Resposta do sistema |
|---|---|
| Abre `/regras` | Lista as regras da conta, agrupadas por pote, mostrando **o texto que cada uma procura** e quantos lançamentos ela já classificou |
| Toca numa regra | Abre para editar: a categoria de destino e o texto procurado |
| Muda a categoria de destino | Vale **daqui para frente**. O que já foi classificado não se mexe |
| Apaga uma regra | Ela para de classificar. **Os lançamentos que ela já classificou ficam como estão** |
| Regra veio do seed | Aparece marcada como tal, e pode ser apagada igual às outras |
| Nenhuma regra ainda | Estado vazio explicando que regra nasce de uma correção sua na revisão |

### A decisão que sustenta as duas linhas acima

**Apagar ou editar uma regra não reescreve o passado.**

A tentação é a oposta: apagou a regra errada, reclassifica tudo que ela pegou.
Mas isso significa que um toque seu muda meses de painel de uma vez, em
silêncio — inclusive lançamentos que você tinha conferido e aprovado na
revisão.

É a mesma régua da D6: desfazer uma classificação não desfaz o aprendizado, e
desfazer o aprendizado não desfaz as classificações. Cada uma é uma decisão
sua, e nenhuma arrasta a outra sem você pedir.

Isso só é possível porque a C3 grava a **procedência**: dá para dizer "estes 8
lançamentos vieram desta regra" e oferecer a reclassificação como uma segunda
ação explícita, se você quiser. Não como efeito colateral.

---

## Página: `/dashboard` — deixa de dizer que falta classificar

Só a frase muda: quando não há mais pendências, o aviso "falta classificar"
some. O painel de verdade (potes, gráficos, comparativo) continua sendo outra
spec.

---

## Comportamentos sem tela

### O motor determinístico

Roda dentro da transação da importação, depois do preparo da spec 02.

Ordem de aplicação — **a primeira que bater vence**, e por isso a ordem importa:

1. `prioridade` da regra (número que o usuário nunca vê no MVP; o seed do Davi
   define)
2. Entre iguais, a regra mais **específica** (termo mais longo) ganha
3. Nada bateu → pendente

Tipos de regra do MVP:

| Tipo | Critério | Nasce de |
|---|---|---|
| `descricao_contem` | trecho de texto, sem acento, sem caixa | correção sua |
| `pessoa` | nome do outro lado de um Pix/transferência | correção sua num Pix |
| `valor_direcao` | faixa de valor + entrada/saída | só o seed do Davi |

O tipo `recorrencia` do `readme.md` **fica para depois**: exige histórico de
vários meses, e no primeiro mês não há o que reconhecer.

### Marcar como candidata a revisão mesmo tendo batido

Do `readme.md`, seção 7: valor alto passa pela sua vista mesmo quando uma regra
bateu. Recomendo **R$ 200** como limiar inicial, que é o que o painel usa hoje.

### O seed das regras do Davi (a C5 da spec 01)

No onboarding da conta do Davi, as regras já validadas entram prontas — mais as
três que a medição mostrou faltar. Nas outras contas, a tabela nasce vazia e
cresce por uso.

---

## Dados — tabelas tocadas

- `classification_rules` — **nova** (a C5 adiada): `id`, `user_id`,
  `tipo_regra`, `criterio` (json), `categoria_id`, `prioridade`, `origem`
  (seed / correção sua), `criado_em`
- `transactions` — passa a ter `categoria_id` preenchido; ganha registro de
  **como** foi classificado (regra, sugestão aceita, escolha manual)
- `categories`, `buckets` — só leitura

---

## Pendências — todas resolvidas

### 1. ✅ O LLM fica para depois

A medição corrigida pela A6 diz que ele resolveria **6 lançamentos de 47** — os
comerciantes do cartão, tirando os três de petshop e veterinário, que não
precisam de palpite e sim de uma categoria que não existe. Os outros 8
pendentes ele não tem como acertar.

E são **14 decisões**, não 17: três pendentes repetem comerciante ou
contraparte de outro, e a D5 aplica a regra nova aos outros pendentes do mesmo
mês. Cada correção apaga o caso no mês seguinte. Ligar a API agora custaria
chave, custo por mês, tratamento de erro e um caminho a mais para testar — em
troca de seis toques.

A estrutura nasce pronta para recebê-lo: as sugestões da tela de revisão são
uma **lista ordenada de fontes**, e o LLM entra como mais uma fonte, sem
reescrever nada. Se em três meses o resíduo continuar alto, ele se paga.

### 2. ✅ Entrada não cai em pote

Os 8 potes repartem o que você **gasta**. Entrada recebe uma categoria de
renda (salário, renda extra, repasse recebido) e forma o total do mês — que é
a base dos percentuais dos potes. Sem isso as metas em reais não têm de onde
sair.

**Consequência que a Etapa 3 tem de resolver:** `categories.bucket_id` é
`not null`, então uma categoria de renda precisa de um pote para pendurar. E
`percentual_meta` nulo não serve para escondê-la — Manutenção e Outros já são
nulos e aparecem na tela.

O caminho é `buckets` ganhar um **tipo** (`gasto` / `renda`), com um pote de
renda semeado e filtrado fora das telas de pote. Vira migration e entra na
fase de banco.

### 3. ✅ O motor roda dentro da transação da importação

47 linhas é nada, você já está esperando a tela, e o resumo passa a dizer a
verdade completa no mesmo instante. Classificar só ao abrir `/revisao` faria
o resumo da importação mentir por omissão — o problema que a D6 acabou de
consertar em duas telas.

### 4. ✅ Valor alto = R$ 200

É o número que o painel usa hoje. No mês medido, 6 lançamentos passam disso.
Configurável só na fase 2.

---
## Fora do escopo

- Tela de **cadastrar** regra do zero → fase 2 (`readme.md`, seção 3). Continua
  fora: regra nasce de correção sobre descrição real, nunca da sua memória
  (descoberta 3)
- Fallback via LLM → decidido: depois, quando o resíduo justificar
- O painel de verdade: potes com barra, gráficos, comparativo anual → spec própria
- Fechar o mês / veredito / insights → spec própria
- Regra por recorrência → precisa de histórico que ainda não existe
- Metas por pote configuráveis → fase 2
