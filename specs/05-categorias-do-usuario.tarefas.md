# Tarefas — Categorias do usuário

**Etapa:** 2 (Break) do workflow `dev-workflow-davi`
**Spec de origem:** `specs/05-categorias-do-usuario.md` (pendências resolvidas)
**Status:** aguardando aprovação do Davi

Legenda de camada: `INFRA` · `FRONT-VISUAL` · `FRONT-INTEGRADO` · `BACK` · `BANCO`

---

## A parte de maior risco aqui é perda — e o banco já recusa a operação

Na spec 02 o risco morava no texto; na 03, no trecho que vira regra; na 04, na
aritmética. Aqui é **destruição**.

A descoberta 1 mediu: `delete from categories` com um lançamento dentro falha
com `transactions_classificacao_ck`. A saída errada seria afrouxar o check — ele
está certo, e é a única coisa impedindo um lançamento classificado de existir
sem dizer como. A saída certa é desenhar o que acontece com o que estava dentro
**antes** de apagar.

Por isso a fase B inteira é servidor, cada operação verificada contra o Neon
real com conta descartável, **antes** de existir tela para chamá-la. Uma tela de
apagar sobre um serviço não medido seria uma tela que apaga errado.

## Nenhuma migration nesta spec

`categories` já tem tudo: `slug`, `nome`, `emoji`, `ordem`, `bucket_id`, e os
dois únicos da descoberta 3. As chaves estrangeiras já decidiram o
comportamento — `set null` em `transactions.categoria_id`, `cascade` em
`classification_rules.categoria_id`, `set null` em `decision_undo.categoria_id`.

Esta spec não muda o formato do banco. Ela escreve a transação que o formato
sempre esperou e ninguém escreveu.

## Uma conta que a D6 já pagou

A sombra do desfazer aponta para uma categoria. Apagar essa categoria a zera
(`set null`), e restaurar `classificado_por = 'manual'` com categoria nula
bateria no mesmo check da descoberta 1.

**Já está resolvido.** `restaurar()` em `desfazerDecisao.service.ts` tem a
guarda: sombra sem categoria volta como pendente limpo. A B4 não precisa
inventar nada aqui — precisa **não desfazer** isso, e a verificação vai
confirmar apagando uma categoria com sombra pendurada.

## Reuso antes de criação

Já existe e **não** deve ser reescrito:

| O que | Onde | Para quê aqui |
|---|---|---|
| `agruparPorPote`, `CategoriaEscolhivel` | `classificacao/revisar-lancamento/categorias.ts` | A lista da revisão e o seletor de destino do apagar |
| `ListaDeCategorias` com `atualId` | `revisar-lancamento/ListaDeCategorias.tsx` | Já sabe marcar item não tocável (D4 da spec 04) |
| `decidirLancamento` | `revisar-lancamento/` | Criar-e-classificar da C2, com a sombra do desfazer |
| `ehChaveDuplicada` (Postgres `23505`) | `gerir-regras/mexerNaRegra.service.ts` | Traduzir nome repetido em frase |
| `avisoDoVoltar` — a **forma** | `revisar-lancamento/desfazer.ts` | O aviso de apagar segue o mesmo desenho: puro, testado, num `.ts` |
| `Card`, `Badge`, `SectionTitle`, `EstadoVazio` | `components/ui/` | As telas |

⚠ **`POTES_PADRAO` não entra.** É molde de seed, não fonte de verdade — a mesma
lição da D3 da spec 03, que guardava o id errado. Tudo aqui lê do banco.

---

## Fase A — As decisões puras (sem banco, sem tela)

### A1 · O slug nasce do nome e congela ali
**Camada:** BACK
**Pronto quando:** existe uma função pura que transforma um nome em slug e
resolve colisão dentro do pote. Não sabe de banco, sessão nem tela.

Descoberta 3: `slug` é identidade de dados e **não muda no renomear**. Aqui é
onde ele nasce.

Os casos que um `toLowerCase().replace(/ /g, "-")` erraria:

| Nome | Slug | Por quê |
|---|---|---|
| `Gasolina` | `gasolina` | O caso fácil |
| `Reserva de emergência` | `reserva-de-emergencia` | Acento sai, como no seed |
| `  Uber / 99  ` | `uber-99` | Espaço nas pontas, símbolo no meio, nunca dois hífens seguidos |
| `Café` num pote que já tem `Cafe` | `cafe-2` | **Nomes diferentes podem gerar o mesmo slug**, e `(bucket_id, slug)` é único |

O último é o que justifica a função existir. Recusar "Café" porque existe "Cafe"
seria incompreensível na tela — os nomes são diferentes, e a pessoa está olhando
para os dois. O sufixo resolve sem explicação nenhuma, porque ninguém vê o slug.

### A2 · Nome e emoji que valem
**Camada:** BACK
**Pronto quando:** nome e emoji são validados por função pura, com a mensagem
que a tela vai mostrar.

**Nome exige pelo menos um caractere alfanumérico**, e isso amarra na A1: sem
essa regra, um nome só de símbolos produziria slug vazio, e o vazio colidiria
com o próximo nome só de símbolos. A regra de tela e a integridade do dado são a
mesma regra.

**Emoji é exatamente um grafema.** `Intl.Segmenter` conta certo o que
`.length` conta errado — 👨‍👩‍👧 tem 8 unidades de código e é um símbolo só. A
spec já decidiu que não há seletor: campo de texto, uns poucos sugeridos.

### A3 · O que a tela diz antes de apagar
**Camada:** BACK
**Pronto quando:** dada a contagem de lançamentos e de regras e o destino
escolhido, sai a frase do aviso. Puro e testado, no formato de `avisoDoVoltar`.

É a dívida que o `schema.ts` nomeou na C1 — *"quem deve o aviso é a tela"* —
virando código. E ela é maior do que um número:

| Situação | O que a frase precisa dizer |
|---|---|
| Mover, com regras | Os N lançamentos vão para lá, **e as R regras vão junto** |
| Devolver à revisão, com regras | Os N voltam para a fila, **e as R regras são apagadas** |
| Sem nada dentro | Uma frase curta. Números zerados numa frase de susto gastam a atenção que o aviso de verdade vai precisar |
| Destino em **outro pote** | Isto move dinheiro de pote em **todos os meses**, e não só neste |

A última linha é a descoberta 4 aparecendo por outra porta: a spec proíbe mover
a *categoria* com lançamentos dentro, mas mandar os lançamentos para uma
categoria de outro pote faz o mesmo estrago. Não proibido — é escolha legítima —
mas dito em voz alta.

---

## Fase B — O servidor (cada operação medida contra o Neon)

### B1 · Criar categoria
**Camada:** BACK
**Pronto quando:** `criarCategoria(userId, { nome, emoji, poteId })` grava, com
`ordem` = a última do pote mais um, e devolve a categoria pronta para ser
escolhida.

⚠ **O `poteId` vem do cliente e é conferido contra o `userId`** — mesma regra da
D4 da spec 04, e pelo mesmo motivo: o `user_id` no `where` protege a linha, não
o destino dela. Uma categoria criada dentro do pote de outra conta vazaria por
leitura, no painel de quem não pediu.

Nome repetido no mesmo pote vira frase, não erro de banco. A tradução do `23505`
já existe na D9.

### B2 · Renomear, e mover só quando vazia
**Camada:** BACK
**Pronto quando:** dá para trocar nome e emoji sem tocar no slug, e mover de
pote **apenas** enquanto a categoria não tiver nenhum lançamento.

⚠ **"Nenhum lançamento" conta os excluídos também.** Um lançamento marcado fora
do cálculo continua com a categoria, e continua sendo passado: se ele voltar, o
rateio já terá sido reescrito. A contagem que autoriza mover não filtra status.

⚠ **Mover pode colidir no destino.** O slug congelado da A1 é único por pote:
levar `gasolina` para um pote que já tem `gasolina` estoura o mesmo `23505`, com
outra frase — não é nome repetido, é slug. A tela precisa distinguir as duas,
senão o Davi lê "já existe uma com esse nome" olhando para dois nomes
diferentes.

### B3 · O raio-X do que apagar leva junto
**Camada:** BACK
**Pronto quando:** uma consulta devolve, para uma categoria: quantos lançamentos
tem dentro, quantas regras apontam para ela, e as categorias que podem receber.

É o mesmo número que fez a D9 valer a pena: "já classificou 8" transforma uma
lista de textos numa lista de consequências. Aqui ele é a diferença entre apagar
e apagar sabendo.

As candidatas a destino são **todas as outras da conta**, com o pote na frente,
e a do mesmo pote vem primeiro. Restringir ao pote seria decidir por ele; não
ordenar seria fingir que tanto faz.

### B4 · Apagar em uma transação, com destino
**Camada:** BACK
**Pronto quando:** apagar move ou devolve o que estava dentro e remove a
categoria — tudo ou nada.

**A ordem não é preferência, é obrigação dos checks:**

| Destino | O update precisa limpar, na **mesma linha** |
|---|---|
| Mover | `categoria_id` novo, `classificado_por = 'manual'`, `regra_id` e `regra_chave` nulos, `fonte_da_sugestao` nula |
| Devolver | `categoria_id`, `classificado_por`, `regra_id`, `regra_chave`, `fonte_da_sugestao` — todos nulos de uma vez |

Dois updates em sequência falhariam **entre um e outro**:
`transactions_regra_chave_ck` exige `classificado_por = 'regra'` para a chave
existir, e `transactions_fonte_sugestao_ck` faz o mesmo com a sugestão. Zerar a
classificação antes de limpar a procedência derruba a transação inteira — e é
exatamente a forma da falha da descoberta 1.

**Mover é escolha sua, então a procedência passa a ser sua.** Mesma decisão da
D6 e da D4: quando você redireciona, a resposta para "como esta classificação
surgiu?" passa a ser você, e manter a regra pendurada diria que ela ainda
explica algo que ela não explica mais.

**As regras seguem o destino.** Mover as aponta para a categoria nova — sem
isso, apagar desligaria a classificação em silêncio e no mês seguinte os mesmos
lançamentos voltariam pendentes sem ninguém entender por quê. Devolver as apaga:
regra sem destino não tem para onde apontar, e o `cascade` já faria isso — mas
a tela precisa ter dito antes.

⚠ **Lançamento `excluido` não volta para a fila.** "Fora do cálculo" é decisão
sua e não depende de categoria nenhuma. Ele perde a classificação e mantém o
status e o motivo que você deu.

**Sem desfazer, e por isso a confirmação carrega os números.** O "Voltar" é uma
sombra por conta, desenhada para uma decisão de revisão; guardar 12 lançamentos
e 2 regras nela seria outra tabela e outra promessa. A defesa é a B3 na tela
antes do segundo toque — a mesma escolha que a D9 fez para apagar regra.

### B5 · O painel passa a ler os potes da tabela de potes
**Camada:** BACK
**Pronto quando:** um pote sem nenhuma categoria continua aparecendo no painel e
em `/categorias`.

⚠ **É um defeito que esta spec torna alcançável, e é o mais sério da lista.**

`painelDoMes.service.ts` monta os potes a partir das **categorias**
(`innerJoin buckets`). Com o seed, todo pote tem categoria e nada aparece; assim
que der para apagar a última categoria de um pote, aquele pote **some da tela** —
e a A3 da spec 04 é explícita em sentido contrário: *"Pote ausente da tela não é
o mesmo que pote vazio."*

Pior na tela de gestão: se `/categorias` também derivar dos dados, o pote
esvaziado fica **inalcançável para sempre** — não haveria onde tocar para criar
uma categoria dentro dele.

A correção é ler `buckets` e fazer `leftJoin` nas categorias, do jeito que a D9
já fez com a contagem das regras. É a mesma lição de novo: derivar a estrutura
dos dados funciona até o dia em que os dados acabam.

---

## Fase C — As telas (dados falsos, sem banco)

### C1 · A tela de arrumação
**Camada:** FRONT-VISUAL
**Pronto quando:** com dados falsos, `/categorias` mostra os nove potes com suas
categorias, e os caminhos para criar, renomear e apagar. Legível em 360px, alvos
≥44px.

Apagar mostra o raio-X da B3 e o seletor de destino **antes** do segundo toque,
com "mover para outra categoria" pré-selecionado — decisão do Davi na pendência
2: devolver 12 lançamentos para a fila é trabalho real, e quem escolhe isso deve
estar escolhendo de propósito, não por ser o caminho de menor resistência.

### C2 · "+ Nova categoria" no fim da lista da revisão
**Camada:** FRONT-VISUAL
**Pronto quando:** a lista da revisão ganha, **no fim**, o caminho para criar uma
categoria sem sair da fila.

**No fim, e isso é o controle de risco da spec inteira.** Criar categoria é fácil
e barato, e uma conta com 60 categorias tem um painel que não diz nada — o
método dos potes funciona porque a lista cabe na cabeça. A tela não impede; ela
faz você passar por todas as que já existem primeiro.

> ⛔ **Portão de aprovação do Davi.** Não seguir para a fase D sem o "ok" visual.

---

## Fase D — Integração

### D1 · A tela de arrumação lê e grava de verdade
**Camada:** FRONT-INTEGRADO
**Pronto quando:** criar, renomear, mover-se-vazia e apagar funcionam contra o
banco, do celular, com os números do raio-X vindos da B3.

### D2 · Criar na revisão resolve o lançamento ali
**Camada:** FRONT-INTEGRADO
**Pronto quando:** criar a categoria a partir da revisão **classifica o
lançamento que motivou a criação**, numa transação só.

É o que a pendência 1 pediu: você está olhando o lançamento que não cabe em
nada; criar, voltar e reencontrar seria a tela punindo você por ter um gasto
novo.

⚠ **Uma assimetria para dizer em voz alta na tela:** o "Voltar" desfaz a
classificação e **não** apaga a categoria criada. É a mesma régua da D6 —
desfazer uma classificação não desfaz o aprendizado — e é surpreendente se
ninguém disser.

**"Sempre classificar assim" não aparece neste caminho.** Criar categoria,
classificar e criar regra em um toque são três decisões, e a terceira é a que
tem consequência no mês inteiro. A regra continua nascendo de onde nasce hoje:
uma correção sobre descrição real.

### D3 · A rota nova protegida, e os caminhos até ela
**Camada:** INFRA + FRONT-INTEGRADO
**Pronto quando:** `/categorias` está em `proxy.ts` e é alcançável da `/revisao`
e do painel.

⚠ O `proxy.ts` avisa em letras garrafais: *"Rota interna nova não é protegida
automaticamente."* Foi por isso que a D9 escreveu o aviso.

**Fora da barra de navegação** — decisão do Davi na pendência 3. São 4 itens
desde a D9; a 360px um quinto deixaria 72px cada. Arrumar categoria é vontade
que nasce olhando para uma lista de categorias, não item de menu.

---

## Fase E — Deploy

### E1 · Publicar e criar uma categoria de verdade
**Camada:** INFRA
**Pronto quando:** deploy por `npx vercel deploy --prod --yes` e o Davi cria uma
categoria pelo celular, classifica um lançamento com ela e a vê somando no
painel.

---

## Resumo

| Fase | Tarefas | Depende de |
|---|---|---|
| A — As decisões puras | A1–A3 | nada |
| B — O servidor | B1–B5 | A |
| C — As telas | C1–C2 | B (a tela mostra o que o serviço já sabe fazer) |
| D — Integração | D1–D3 | aprovação visual de C |
| E — Deploy | E1 | D |

A Etapa 3 (Plan) é feita **tarefa por tarefa**, não tudo de uma vez.
