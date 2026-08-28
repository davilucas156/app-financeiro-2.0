# Spec — Metas por pote configuráveis

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Depende de:** spec 03, que semeou os potes com o rateio do painel original;
spec 04, que criou a meta calculada e tornou a **renda** editável — mas não o
rateio; spec 05, que fez potes e categorias serem do usuário e deu a eles a
tela `/categorias`
**Pedido do Davi:** item da fase 2 do `readme.md`, escolhido por ele como a
próxima: _"Metas por pote configuráveis — a renda virou editável na spec 04; o
rateio entre os potes, não"_
**Status:** ⚠ **rascunho, não aprovado.** Pendências decididas por mim — ver o
fim do documento.

> ⚠ Nenhum dado real neste documento. Os percentuais citados (30/25/15/15/10/5)
> são a **semente versionada** em `potes-padrao.ts`, não gasto de ninguém.

## O que esta funcionalidade resolve

**O app tem uma opinião sobre como o Davi deve repartir o dinheiro, e não deixa
discordar dela.** Os seis potes nascem com 30/25/15/15/10/5 e morrem assim: não
existe tela, ação nem caminho que mude um percentual depois do onboarding.

Isso tem três consequências, em ordem de gravidade:

1. **A meta é do método, não da pessoa.** Quem gasta 40% com moradia vê "Custos
   Fixos estourado" todo mês, para sempre, sem que a tela erre — e sem que ela
   sirva para nada. Um alarme que sempre toca vira ruído, e aí o pote inteiro
   deixa de ser lido.
2. **Convidar alguém entrega o rateio do Davi junto.** A spec 01 separou
   `EMAILS_CONVIDADOS` de `EMAILS_COM_REGRAS_BASE` justamente para que _"convidar
   alguém não faça essa pessoa herdar o mecânico do Davi"_ — mas o rateio, que é
   uma decisão bem mais pessoal que um mecânico, continua herdado e imutável.
3. **Os dois potes sem meta não têm volta.** Manutenção e Outros/Repasses nascem
   com `percentual` nulo. Se um dia Manutenção virar previsível, não há como lhe
   dar meta; e não há como tirar a meta de um pote que deixou de fazer sentido.

---

## O que eu medi antes de desenhar

### Descoberta 1 — a meta já existe, já é calculada e já funciona

Não há motor a escrever. `metaDoPote` está em
`src/features/painel/somar-o-mes/meta.ts` desde a spec 04, e faz a conta inteira:

```
meta = renda declarada × percentual do pote ÷ 100
```

e devolve os quatro estados que a tela distingue sem ler o número (`vazio`,
`sem-meta`, `negativo`, `estourado`). O `percentual` vem de
`buckets.percentual_meta`, que é **por usuário** — cada linha da tabela é de uma
conta.

⚠ **Isto muda o tamanho da spec.** O que falta não é a meta: é **uma escrita**.
A coluna existe, é por usuário, e nada além do seed a grava. A funcionalidade
inteira cabe em "deixar o usuário escrever num campo que o painel já lê".

### Descoberta 2 — os seis somam exatamente 100, e nada no app depende disso

30 + 25 + 15 + 15 + 10 + 5 = 100. É tentador transformar isso em regra e
obrigar o usuário a fechar em 100 também.

⚠ **Mas o app não soma potes em lugar nenhum**, e isso foi decidido de
propósito. O comentário de `meta.ts` é explícito:

> _"A soma das metas pode ficar alguns centavos longe da renda por causa do
> arredondamento, e isso não incomoda ninguém: **não existe '% do gasto' nesta
> tela**. Cada pote se mede contra a própria meta, e nenhum número soma os potes
> entre si."_

Ou seja: os 100 são uma propriedade **da semente**, não uma invariante do
sistema. Forçar 100 na edição criaria uma restrição que o resto do app não tem —
e transformaria "quero apertar o Transporte" numa conta de fechar caixa que a
pessoa não pediu para fazer.

### Descoberta 3 — existe uma coluna dormindo, e ela é uma bifurcação

`buckets.valor_meta_centavos` existe no schema e **não é lida por ninguém**. O
`meta.ts` diz por quê, em aviso:

> _"⚠ `buckets.valor_meta_centavos` não é lido aqui. A meta passa a ser
> calculada; a coluna fica para o dia em que alguém quiser uma meta fixa que
> sobreponha o percentual."_

Este é o dia em que alguém poderia querer. E a resposta desta spec é **não** —
ver a Pendência 2. A coluna continua dormindo, e o motivo está escrito lá.

### Descoberta 4 — mudar o percentual muda o passado, e não há como não mudar

A meta **não é guardada em lugar nenhum**: ela é recalculada a cada abertura de
tela, a partir do percentual de hoje. Então mudar Transporte de 10% para 8% em
setembro faz **março, abril e maio** passarem a ser julgados por 8% — e um mês
que estava "dentro" pode virar "estourado" sem que nada tenha acontecido em
março.

⚠ **A renda não tem esse problema, e a diferença é instrutiva.** A renda é
declarada **por mês**, com herança em leitura (`rendaDoMes`): declarar em janeiro
vale para fevereiro até alguém declarar outra coisa, e **corrigir janeiro não
reescreve fevereiro**. O percentual não tem essa estrutura, e dar uma a ele
significaria uma linha por pote **por mês** — 6 potes × 12 meses = 72 números
por ano para manter, para responder a uma pergunta que quase ninguém faz.

A decisão está na Pendência 4: o percentual é **um só**, e o efeito retroativo é
**dito na tela** em vez de escondido.

### Descoberta 5 — "sem meta" não é 0%, e a tela já sabe disso

`potes-padrao.ts` guarda uma `observacao` para os potes sem percentual —
"eventual" em Manutenção, "sem meta" em Outros — e a regra escrita é **nunca
mostrar "0%"**. `legendaDoPote` respeita: sem percentual, mostra a observação.

Então o campo de edição tem de distinguir **três** coisas, não duas:

| No campo | Significa | Na tela do painel |
| -------- | --------- | ----------------- |
| `10`     | meta de 10% da renda | barra, e "X% da meta" |
| vazio    | **sem meta** | sem barra, mostra a observação |
| `0`      | meta de zero — **qualquer gasto estoura** | barra sempre cheia |

⚠ **`0` e vazio não podem cair no mesmo lugar.** É o mesmo erro que a spec 04
já nomeou para a renda: _"'nunca informou' faz a tela pedir o número; 'informou
zero' dá meta zero e faz qualquer gasto estourar. São estados diferentes."_

### Descoberta 6 — a tela onde isso mora já existe, e já carrega tudo

`/categorias` (spec 05) já desenha **um cabeçalho por pote**, com emoji e nome,
e as categorias dentro. `listarParaGerir` já busca todos os potes do usuário. O
que falta no `PoteNaGestao` é um campo: `percentual`.

⚠ **Isso evita uma rota nova** — e com ela o `src/proxy.ts`, que é onde este
projeto já tropeçou antes: _rota interna nova não é protegida automaticamente_.
Zero linha de proxy nesta spec.

---

## Página: `/categorias` — cada pote ganha sua meta

A tela continua sendo o que é: a arrumação dos potes e categorias. A meta entra
como **mais um atributo do pote**, no cabeçalho que já existe, e não como uma
seção nova.

### Componentes

| Componente | Novo? | O que faz |
| ---------- | ----- | --------- |
| `TelaDeCategorias` | modificado | passa o percentual adiante |
| Cabeçalho do pote | modificado | mostra `30%` ao lado do nome, ou a observação |
| `CampoDeMeta` | **novo** | o campo em si: clicar no percentual abre, salvar fecha |
| `SomaDasMetas` | **novo** | uma linha, no fim da lista de potes |
| `mexerNaMeta.service.ts` | **novo** | a escrita, `server-only` |

### Comportamentos do usuário

1. **Ver** — o percentual aparece no cabeçalho de cada pote de gasto. Sem meta,
   aparece a observação ("eventual"), nunca "0%".
2. **Mudar** — toca no percentual, digita, salva. O painel do mês seguinte já
   usa o número novo, sem novo upload: a meta é calculada.
3. **Tirar a meta** — apaga o campo e salva. O pote passa a "sem meta" e sai do
   julgamento, como Manutenção hoje.
4. **Dar meta a quem não tinha** — o mesmo campo, no pote que hoje mostra a
   observação.
5. **Ver a soma** — uma linha no fim: _"seus potes somam 100% da renda"_. É
   informação, **não trava** — ver Pendência 3.
6. **Voltar ao padrão** — um caminho discreto que restaura 30/25/15/15/10/5 e
   devolve Manutenção e Outros a "sem meta".

### Dados envolvidos

- Leitura: `buckets.percentual_meta`, já carregado por `listarParaGerir`.
- Escrita: `update buckets set percentual_meta = ? where id = ? and user_id = ?`.
  ⚠ O `and user_id` não é decoração: é o que impede mexer no pote de outra conta.
- **Nenhuma tabela nova. Nenhuma migration.** A coluna já está lá.

---

## O pote de renda não recebe meta, e isso não é esquecimento

`buckets.tipo` distingue `gasto` de `renda` desde a spec 03. O pote Renda existe
para as categorias de entrada terem onde se pendurar — _"os 8 potes repartem o
que você **gasta**"_.

Dar um percentual a ele seria dizer "sua meta é receber 20% da sua renda", que
não quer dizer nada. O campo **não aparece** em pote de tipo `renda`, e a
recusa também vale no servidor.

---

## Riscos

| # | Risco | Defesa |
| - | ----- | ------ |
| 1 | `0` e vazio confundidos, e todo mês estoura | Campo vazio = sem meta, explicitamente; `0` só se digitado (Descoberta 5) |
| 2 | Mexer na meta sem renda declarada e não ver efeito nenhum | A tela diz: _"as metas só aparecem depois que você informar a renda do mês"_, com link |
| 3 | O passado muda de veredito em silêncio | A tela diz que vale para todos os meses, **antes** de salvar (Pendência 4) |
| 4 | Somar 250% e nunca perceber | A linha da soma, sempre visível |
| 5 | Percentual absurdo (`-5`, `1000`, `abc`) | Validação no servidor: inteiro de 0 a 100, ou nulo |
| 6 | Mexer no pote de outra conta | `and user_id` na escrita, `userId` de `garantirUsuario()` |
| 7 | A observação "eventual" continuar aparecendo depois de o pote ganhar meta | `legendaDoPote` já resolve: com percentual **e** renda declarada, o estado deixa de ser `sem-meta` e a observação sai do caminho. Sem renda, tudo mostra observação — e é o risco 2, não este |

---

## Pendências — decididas

**1. Onde mora: `/categorias`, e não tela nova.** A tela já lista os potes, já
os carrega, e já é o lugar de "arrumar as coisas". Uma `/metas` separada
significaria duas telas que listam potes, e a pergunta "em qual eu mexo?" toda
vez. Custo: `/categorias` fica um pouco mais cheia.

**2. Só percentual. `valor_meta_centavos` continua dormindo.** Meta em reais
parece mais simples e é mais cara: ela precisaria da mesma herança mês a mês que
a renda tem, e conviveria com o percentual criando duas metas possíveis para o
mesmo pote — com uma regra de precedência para explicar em toda tela. O
percentual sobre renda declarada é o desenho da spec 04, e ele funciona. Se um
dia fizer falta, a coluna está lá e o motivo de ela existir está escrito.

**3. A soma aparece, mas não trava.** Nada no app soma potes (Descoberta 2), e
forçar 100 transformaria "apertar o Transporte" numa conta de fechar caixa. Mas
somar 250% sem nunca saber também não serve. A saída é a mesma da spec 11 com o
sinal do extrato: **mostrar a consequência em vez de impedir**. A linha diz
quanto somou; se passar de 100, diz que as metas juntas pedem mais do que a
renda.

**4. Um percentual só, e o efeito retroativo é dito.** Percentual por mês
seriam 72 números por ano para manter. Mas mudar o rateio hoje re-julgar março é
o tipo de coisa que, não sendo dita, vira "o app mudou meu histórico". Então a
tela diz, no momento de salvar: _"vale para todos os meses, inclusive os já
importados"_.

**5. Existe volta ao padrão.** Quem mexe até se perder precisa de um caminho de
volta que não seja apagar a conta, e a semente já está versionada em
`potes-padrao.ts` — restaurar é ler o arquivo que já é a fonte, não escrever uma
lista nova à mão.

---

## O que fica de fora, e por quê

- **Meta em reais** — Pendência 2.
- **Meta por categoria** (dentro do pote) — o método é de potes; metas em dois
  níveis pedem uma regra de "a soma das categorias tem de caber no pote", que é
  exatamente a trava que a Pendência 3 recusa.
- **Histórico de mudanças de meta** ("em maio era 30%") — é a versão cara da
  Descoberta 4, e ninguém pediu.
- **Sugerir percentuais a partir do gasto real** ("você gasta 42% em Custos
  Fixos, quer virar meta?") — é funcionalidade de conselho, não de configuração.
  Fica anotado como possível spec futura.

---

## Como saber que funcionou

1. Mudar Transporte de 10% para 8% e ver a barra do painel mudar **sem novo
   upload** — prova que a meta é calculada e que a escrita chegou.
2. Apagar o campo de Conhecimento: o pote sai do julgamento e passa a mostrar
   texto, não "0%".
3. Dar 10% a Manutenção: a observação "eventual" **some** e a barra aparece.
4. Somar mais de 100 e ver a linha avisar — sem que o salvamento seja impedido.
5. Abrir `/categorias` sem renda declarada e ver a tela dizer que a meta ainda
   não vai aparecer, com o caminho para declarar.
6. Restaurar o padrão e conferir contra `potes-padrao.ts`: 30/25/15/15/10/5, e
   os dois potes sem meta de volta a sem meta.
