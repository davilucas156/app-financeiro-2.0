# Tarefas — Motor de classificação

**Etapa:** 2 (Break) do workflow `dev-workflow-davi`
**Spec de origem:** `specs/03-motor-de-classificacao.md` (pendências resolvidas)
**Status:** aguardando aprovação do Davi

Legenda de camada: `INFRA` · `FRONT-VISUAL` · `FRONT-INTEGRADO` · `BACK` · `BANCO`

---

## Por que o motor vem antes da tela, de novo

Mesma inversão da spec 02, pelo mesmo motivo — e agora com uma evidência a
mais.

A tela de revisão mostra **sugestões**. Desenhá-la antes de existir quem as
produza é inventar uma lista e depois torcer para o motor caber nela.

E a parte de maior risco continua sendo texto, não interface: eu já errei uma
regra escrevendo `apple.com` para uma descrição que era `APPLE COM BILL`.
Extrair de uma descrição real o trecho que vira regra é exatamente o tipo de
coisa que só se resolve medindo contra os 54 lançamentos reais.

O portão visual continua existindo: fim da fase B, antes de qualquer
integração.

## Reuso antes de criação

Já existe e **não** deve ser reescrito:

| O que | Onde | Para quê aqui |
|---|---|---|
| `normalizarDescricao` | `upload/ler-arquivo/preparar.ts` | Comparar descrição sem acento e sem caixa |
| `Card`, `Button`, `Badge`, `EstadoVazio`, `SectionTitle` | `components/ui/` | A tela inteira da fase B |
| `rotuloDeMes` | `upload/enviar-extrato/SeletorDeMes.tsx` | Cabeçalho do mês em revisão |
| `garantirUsuario` | `autenticacao/garantir-usuario/` | `user_id` de toda leitura e escrita |

---

## Fase A — O motor (sem tela, sem banco)

### A1 · Casar uma regra contra um lançamento
**Camada:** BACK
**Pronto quando:** existe uma função pura que, dada uma lista de regras e um
lançamento, devolve a regra vencedora ou nada. Cobre os três tipos do MVP
(`descricao_contem`, `pessoa`, `valor_direcao`). Desempate: `prioridade`
primeiro, depois o termo mais **longo** — regra mais específica ganha de regra
genérica. Não sabe de banco, sessão nem tela.

### A2 · Extrair o trecho estável de uma descrição
**Camada:** BACK
**Pronto quando:** dada uma descrição real, a função devolve o pedaço que faz
sentido virar regra — sem a cidade, sem o país, sem o número do documento, sem
a data. É o que a tela oferece quando você responde "sempre classificar assim".

> Esta é a tarefa de maior risco da spec. Uma extração ruim cria regra que não
> bate no mês seguinte (falso negativo, você reclassifica de novo) ou que bate
> demais (falso positivo, silencioso e pior).

**Pronto quando, de verdade:** roda contra as 54 descrições reais e o resultado
é conferido uma a uma.

### A3 · Extrair a pessoa de um Pix ou transferência
**Camada:** BACK
**Pronto quando:** das descrições de Pix e transferência, a função separa o
**nome do outro lado** do resto (prefixo do banco, agência, conta, o `Cp :`).
Descrição que não é Pix devolve nada. É o que sustenta o tipo de regra
`pessoa`, que existe porque nenhum LLM sabe quem é quem na sua vida.

### A4 · Ordenar as sugestões
**Camada:** BACK
**Pronto quando:** para um lançamento pendente, o motor devolve até 3
sugestões, ordenadas, cada uma com a origem. Fontes do MVP, nesta ordem:
categoria já usada para descrição parecida no histórico → categoria do banco
traduzida → nada.

A lista é **ordenada e com origem** justamente para o LLM entrar depois como
mais uma fonte, sem reescrever esta tarefa.

### A5 · As regras-base do Davi, como dados
**Camada:** BACK
**Pronto quando:** as regras da seção 7 do `readme.md` existem como estrutura
de dados versionada, **mais as três que a medição mostrou faltar** (aplicação e
resgate de CDB, IOF internacional, transferência para si mesmo).

### A6 · Medir a cobertura contra os arquivos reais
**Camada:** BACK
**Pronto quando:** o motor inteiro roda contra os 54 lançamentos reais e o
resultado bate com o medido na spec: **36 classificados, 11 pendentes**. Roda
fora do repositório, contra os arquivos que só existem na máquina do Davi.

Se der diferente, é a A1–A5 que estão erradas — não a medição.

---

## Fase B — Protótipo visual de `/revisao` (sem lógica, sem banco)

### B1 · O cartão do lançamento
**Camada:** FRONT-VISUAL
**Pronto quando:** com dados falsos, `/revisao` mostra um lançamento por vez:
descrição original **sem truncar** (é o que você lê para decidir), valor, data,
origem, contador "3 de 11" e barra de progresso. Legível em 360px, alvos ≥44px.

### B2 · Escolher a categoria
**Camada:** FRONT-VISUAL
**Pronto quando:** aparecem até 3 sugestões tocáveis e a lista completa
agrupada por pote, recolhida por padrão. Mais o botão "Fora do cálculo". Os
rótulos das sugestões dizem **de onde vieram** — sugestão sem procedência é
palpite anônimo.

### B3 · "Sempre classificar assim?" e o Voltar
**Camada:** FRONT-VISUAL
**Pronto quando:** depois de escolher, aparece a pergunta de virar regra,
mostrando **o trecho exato** que a regra vai usar e quantos outros pendentes do
mês ela pegaria junto. Mais o "Voltar", que reabre o anterior. Estado final:
"nada pendente".

> ⛔ **Portão de aprovação do Davi.** Não seguir para a fase C sem o "ok"
> visual.

---

## Fase C — Banco

### C1 · Tabela `classification_rules` (a C5 da spec 01)
**Camada:** BANCO
**Pronto quando:** criada com `user_id`, `tipo_regra`, `criterio` (jsonb),
`categoria_id`, `prioridade`, `origem` (`seed` / `correcao`), `criado_em`.
Índice por `user_id`. Apagar a categoria não pode deixar regra órfã apontando
para o nada.

### C2 · Pote de renda
**Camada:** BANCO
**Pronto quando:** `buckets` ganha `tipo` (`gasto` / `renda`), nasce um pote de
renda no seed com suas categorias (salário, renda extra, repasse recebido), e
as telas de pote filtram `tipo = 'gasto'`.

Existe porque `categories.bucket_id` é `not null` — categoria de renda precisa
de um pote para pendurar — e `percentual_meta` nulo não serve para escondê-la:
Manutenção e Outros já são nulos e aparecem.

### C3 · Registrar como cada lançamento foi classificado
**Camada:** BANCO
**Pronto quando:** `transactions` guarda a **procedência** da classificação
(regra, sugestão aceita, escolha manual) e, quando veio de regra, qual. Sem
isso, "por que isso caiu em Lazer?" não tem resposta seis meses depois.

---

## Fase D — Integração

### D1 · Classificar dentro da importação
**Camada:** BACK
**Pronto quando:** o motor roda na **mesma transação** da spec 02, depois do
preparo. Lançamento que bate regra nasce classificado; o resto nasce pendente.
Falha no motor não pode deixar a importação pela metade.

### D2 · O resumo do upload conta a classificação
**Camada:** FRONT-INTEGRADO
**Pronto quando:** o resumo diz "36 classificados · 11 para decidir", com link
para `/revisao`. Mês em que tudo bateu diz "tudo classificado" e não manda você
para uma tela vazia.

### D3 · `/revisao` lê os pendentes de verdade
**Camada:** FRONT-INTEGRADO
**Pronto quando:** a tela da B1/B2 lê do banco, filtrada por `user_id`, com as
sugestões reais da A4.

### D4 · Gravar a decisão
**Camada:** BACK + FRONT-INTEGRADO
**Pronto quando:** tocar numa categoria grava e avança. `user_id` sempre da
sessão; o id do lançamento vem do cliente e por isso entra no `where` junto com
o `user_id`, como no desfazer da spec 02.

### D5 · A correção vira regra
**Camada:** BACK + FRONT-INTEGRADO
**Pronto quando:** responder "sempre" cria a `classification_rule` a partir do
trecho da A2 e **aplica aos outros pendentes do mesmo mês** na mesma transação.
Responder "só desta vez" não cria nada.

### D6 · Voltar desfaz
**Camada:** FRONT-INTEGRADO
**Pronto quando:** "Voltar" reabre o lançamento anterior e desfaz a gravação
dele. Se aquela decisão criou uma regra, a regra **fica** — desfazer uma
classificação não é desfazer o aprendizado, e apagar a regra em silêncio seria
pior surpresa.

### D7 · Seed das regras do Davi
**Camada:** BACK
**Pronto quando:** no onboarding da conta do Davi, as regras da A5 entram
prontas. Outras contas nascem com a tabela vazia. Idempotente, como o resto do
onboarding.

### D8 · O painel para de pedir classificação
**Camada:** FRONT-INTEGRADO
**Pronto quando:** sem pendências, o aviso "falta classificar" some do
`/dashboard` e de `/revisao`. **Não é o painel** — é a mesma régua da D6 da
spec 02: não mentir.

---

## Fase E — Deploy

### E1 · Publicar e classificar de verdade
**Camada:** INFRA
**Pronto quando:** deploy por `npx vercel --prod` e o Davi classifica junho
**pelo celular**, conferindo contra o esperado: 36 automáticos e 11 decisões.

---

## Resumo

| Fase | Tarefas | Depende de |
|---|---|---|
| A — O motor | A1–A6 | spec 02 no banco |
| B — Protótipo visual | B1–B3 | A (as sugestões dependem do que o motor produz) |
| C — Banco | C1–C3 | aprovação visual de B |
| D — Integração | D1–D8 | C |
| E — Deploy | E1 | D |

A Etapa 3 (Plan) é feita **tarefa por tarefa**, não tudo de uma vez.
