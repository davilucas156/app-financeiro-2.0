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

### A6 · Medir a cobertura contra os arquivos reais ✅
**Camada:** BACK
**Pronto quando:** o motor inteiro roda contra os 54 lançamentos reais e o
resultado bate com o medido na spec: **36 classificados, 11 pendentes**. Roda
fora do repositório, contra os arquivos que só existem na máquina do Davi.

Se der diferente, é a A1–A5 que estão erradas — não a medição.

> **Deu diferente, e desta vez era a medição.** O resultado real é **30
> classificados e 17 pendentes**; os 6 de diferença estão explicados na spec e
> em `specs/plans/A6-medir-o-motor-inteiro.md`. Nenhum dos seis é defeito do
> motor: um é a regra `99` que a A5 recusou por classificar um restaurante como
> transporte, três são petshop sem categoria, e dois são transferência para si
> mesmo entrando, que ninguém acerta de fora.
>
> O harness ficou versionado como `motor/cobertura.test.ts`, e **se pula
> sozinho** onde os arquivos não existem. Na máquina do Davi, `npm test` confere
> o motor contra o extrato real toda vez.

---

## Fase B — Protótipo visual de `/revisao` (sem lógica, sem banco)

### B1 · O cartão do lançamento
**Camada:** FRONT-VISUAL
**Pronto quando:** com dados falsos, `/revisao` mostra um lançamento por vez:
descrição original **sem truncar** (é o que você lê para decidir), valor, data,
origem, contador "3 de 17" e barra de progresso. Legível em 360px, alvos ≥44px.

### B2 · Escolher a categoria
**Camada:** FRONT-VISUAL
**Pronto quando:** aparecem até 3 sugestões tocáveis e a lista completa
agrupada por pote. Mais o botão "Fora do cálculo". Os rótulos das sugestões
dizem **de onde vieram** — sugestão sem procedência é palpite anônimo.

> ⚠ **A A6 mudou o que esta tarefa tem de entregar.** Medindo o motor real
> contra o primeiro mês do Davi: **só 2 dos 17 pendentes recebem alguma
> sugestão**. O histórico está vazio e a categoria do banco quase nunca traduz.
>
> Ou seja, **no primeiro mês a lista completa não é o caminho de exceção — é o
> caminho principal**: 15 de 17 vão direto para ela.
>
> Ela precisa ser tela de primeira classe, não um `<details>` no rodapé:
> agrupada por pote, alvos ≥44px, alcançável com o polegar, sem rolagem
> infinita. A partir do segundo mês a proporção se inverte, porque o histórico
> passa a existir — mas é o primeiro mês que decide se o Davi continua usando.

### B3 · "Sempre classificar assim?" e o Voltar
**Camada:** FRONT-VISUAL
**Pronto quando:** depois de escolher, aparece a pergunta de virar regra,
mostrando **o trecho exato** que a regra vai usar e quantos outros pendentes do
mês ela pegaria junto. Mais o "Voltar", que reabre o anterior. Estado final:
"nada pendente".

> ⛔ **Portão de aprovação do Davi.** Não seguir para a fase C sem o "ok"
> visual.
>
> ✅ **Aprovado.** Espaços originais na descrição: fica. "Voltar" e "Fora do
> cálculo" logo abaixo do cartão: fica. Dois retornos:
>
> - **Contraste do andaime:** os botões de estado estavam ilegíveis no celular
>   (`text-dim` em 10px). Corrigido para texto claro, 14px em negrito e alvo de
>   44px. O cinza que serve para rótulo secundário não serve para o que se toca.
> - **Regras têm de poder ser editadas e apagadas** → virou a **D9**, e tirou
>   edição de regras da fase 2 do `readme.md`.

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
**Pronto quando:** o resumo diz "30 classificados · 17 para decidir", com link
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

### D6 · Voltar desfaz ✅
**Camada:** FRONT-INTEGRADO — **mais um pedaço de BANCO que a tarefa não previa**
**Pronto quando:** "Voltar" reabre o lançamento anterior e desfaz a gravação
dele. Se aquela decisão criou uma regra, a regra **fica** — desfazer uma
classificação não é desfazer o aprendizado, e apagar a regra em silêncio seria
pior surpresa.

> **Precisou de tabela.** `UPDATE ... RETURNING` devolve o valor **novo**: no
> instante da gravação o estado anterior deixa de existir, e sem ele o "Voltar"
> não desfaz, chuta. Nasceu a `decision_undo` (migration `0009`) — uma linha por
> usuário, a sombra exata das oito colunas que a decisão escreve. A chave
> primária ser o `user_id` **é** a promessa do botão: "reabre o anterior",
> singular. Detalhes em `specs/plans/D6-voltar-desfaz.md`.
>
> **A verificação achou um bug de produção que era da D4.** Trocar a categoria
> de um valor alto já classificado por regra — o caminho "Ou troque a categoria"
> da própria tela — deixava `classificado_por = 'manual'` com a `regra_chave`
> pendurada, batia no `transactions_regra_chave_ck` e derrubava a gravação com
> erro de banco. Corrigido: escolher categoria limpa a procedência da regra,
> porque a resposta para "como esta classificação surgiu?" passou a ser você.
>
> 13 garantias verificadas contra o Neon real, com conta descartável e serviços
> de verdade.

### D7 · Seed das regras do Davi ✅
**Camada:** BACK
**Pronto quando:** no onboarding da conta do Davi, as regras da A5 entram
prontas. Outras contas nascem com a tabela vazia. Idempotente, como o resto do
onboarding.

> **27 regras na conta dele, `origem = 'seed'`, rodar duas vezes continua 27.**
>
> **Um defeito de encaixe apareceu aqui.** A C1 diz no schema que
> `(user_id, chave)` único "impede o seed e a correção de criarem duas regras
> para a mesma coisa", e a D5 diz que usa a chave "na mesma forma que a A5 usa
> no seed". Não usava: a A5 gerava
> `semente:descricao_contem:PETROBRAS:transporte/gasolina` e a correção grava
> `descricao_contem:PETROBRAS`. Dois formatos, restrição que nunca dispara entre
> eles — corrigir uma regra semeada criava a **segunda** regra para o mesmo
> texto. `chaveDoCriterio` virou uma função só, no motor
> (`motor/chaveDaRegra.ts`), e a categoria saiu da chave.
>
> **`do nothing` no reseed, e não `do update`** — o oposto da D5, pelo mesmo
> critério: a instrução mais recente do Davi vence. Junto, corrigir uma regra
> semeada passa a marcar `origem = 'correcao'`.
>
> **Quem recebe sai de `EMAILS_COM_REGRAS_BASE`**, lista própria e não a do
> convite: `EDSON` é o mecânico dele, e convidar alguém não pode fazer essa
> pessoa herdar o mecânico dos outros.
>
> ⚠ **O seed não reclassifica o que já está no banco.** As regras valem na
> importação (D1). Os 33 lançamentos que já estão lá continuam pendentes — 23
> deles seriam resolvidos por estas regras num reenvio. Detalhes em
> `specs/plans/D7-seed-das-regras.md`.

### D8 · O painel para de pedir classificação ✅
**Camada:** FRONT-INTEGRADO
**Pronto quando:** sem pendências, o aviso "falta classificar" some do
`/dashboard` e de `/revisao`. **Não é o painel** — é a mesma régua da D6 da
spec 02: não mentir.

> **A spec 03 tornou falsas três frases do painel**, e todas foram criadas por
> ele ter sido construído: "nenhum caiu num pote ainda" (a D1 classifica na
> importação), "a próxima funcionalidade a ser construída" (foi), e o cartão
> aparecia mesmo sem nada pendente. Havia uma quarta coisa, pior de usar: ele
> **nomeava o passo que faltava e não oferecia o caminho** — nenhum link para
> `/revisao`.
>
> A causa era fundir duas verdades diferentes num cartão só: a pendência
> (que acaba) e a limitação do produto (que continua até a spec 04). Como a
> segunda é permanente, o cartão nunca sumia e a primeira ia junto para sempre.
> Agora são dois estados, e a decisão mora em `avisoDoPainel.ts`, testada.
>
> **O número do painel é o tamanho da fila por construção.** O critério da fila
> virou `filaDeRevisao.ts` e os dois lados leem de lá — terceira vez nesta spec
> que uma regra escrita duas vezes vira arquivo. Verificado contra o Neon:
> 32 = 32. Detalhes em `specs/plans/D8-painel-para-de-pedir.md`.

### D9 · Ver, mexer e apagar as regras salvas
**Camada:** FRONT-INTEGRADO + BACK
**Pronto quando:** `/regras` lista as regras da conta com **o texto que cada uma
procura** e quantos lançamentos ela já classificou; dá para trocar a categoria
de destino, corrigir o texto e apagar.

**Pedido do Davi no portão visual da fase B.** O `readme.md` colocava edição de
regras na fase 2; ele trouxe para cá. Motor que aprende sozinho e nunca
desaprende é motor em que se para de confiar no dia em que ele erra.

> ⚠ **Editar ou apagar não reescreve o passado.** A regra para de valer daqui
> para frente; o que ela já classificou fica como está. Mesma régua da D6:
> desfazer uma classificação não desfaz o aprendizado, e desfazer o aprendizado
> não desfaz as classificações.
>
> Só é possível porque a C3 grava a procedência — dá para dizer "estes 8 vieram
> desta regra" e oferecer a reclassificação como **segunda ação explícita**, se
> ele quiser, em vez de efeito colateral silencioso.

**Continua fora:** cadastrar regra do zero. Regra nasce de correção sobre
descrição real — a descoberta 3 da spec.

---

## Fase E — Deploy

### E1 · Publicar e classificar de verdade
**Camada:** INFRA
**Pronto quando:** deploy por `npx vercel --prod` e o Davi classifica junho
**pelo celular**, conferindo contra o esperado: **30 automáticos e 17 pendentes, que se resolvem
em 14 decisões** (três pendentes repetem comerciante ou contraparte de outro).

---

## Resumo

| Fase | Tarefas | Depende de |
|---|---|---|
| A — O motor | A1–A6 | spec 02 no banco |
| B — Protótipo visual | B1–B3 | A (as sugestões dependem do que o motor produz) |
| C — Banco | C1–C3 | aprovação visual de B |
| D — Integração | D1–D9 | C |
| E — Deploy | E1 | D |

A Etapa 3 (Plan) é feita **tarefa por tarefa**, não tudo de uma vez.
