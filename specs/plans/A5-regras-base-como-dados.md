# Plano — A5 · As regras-base do Davi, como dados

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** A5 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** BACK (pura)
**Arquivos:** `src/features/classificacao/motor/semente.ts` e `semente.test.ts`,
mais um campo novo em `regras.ts`

## O que é

As regras da seção 7 do `readme.md` viram estrutura de dados versionada — mais
as três que a medição da spec mostrou faltar. A D7 depois grava isso na conta
do Davi no onboarding.

## Medi os termos contra os arquivos reais antes de escrever

A descoberta 3 da spec já dizia que regra escrita de memória erra (`apple.com`
para uma descrição que é `APPLE COM BILL`). Então rodei cada termo da seção 7
contra as 58 descrições reais de junho/julho antes de gravar qualquer uma.

Achei **quatro classes de erro**, e nenhuma delas eu teria visto lendo o
readme.

### Erro 1 — o nome no readme não é o nome no arquivo

| readme | arquivo |
|---|---|
| `Total Pass` | `TOTALPASS` |
| `Pagar Me` | `PAGARME PAGAMENTOS` |
| `iCloud` | `APPLE COM BILL` |
| `apple.com` | `APPLE COM BILL` |

Três memórias erradas, exatamente o mesmo erro da descoberta 3.

### Erro 2 — termo curto é uma armadilha silenciosa

**`99` é o pior deles.** O readme manda classificar `99` como Transporte/Apps.
No mês medido, `99` casa com três coisas:

- o app de corrida — certo
- um **restaurante** cujo nome começa com 99 — errado, e vira Transporte
- o **número da conta do Davi**, que aparece no extrato — errado, e nem é
  lançamento

Uma regra dessas classifica errado em silêncio, todo mês, e só aparece no
painel meses depois. `99` **não vira regra.**

Mesma coisa, por substring:

| Termo do readme | Casaria com | Decisão |
|---|---|---|
| `99` | número de conta, restaurante | fora |
| `Epar` | r**epar**o, s**epar**ado, pr**epar**a | fora |
| `Vindi` | é gateway de pagamento, cobra por muita gente | trocado por `INVESTIDOR10`, que é o serviço |
| `Posto` | posto de saúde | fora (e 0 ocorrências) |
| `Prime` | **prime**ira | trocado por `AMAZONPRIME`, medido |

`descricao_contem` compara substring. Termo de 2 a 5 letras dentro de uma
descrição de banco casa com o que você não imagina.

### Erro 3 — categoria genérica que na verdade é segura

O caminho oposto: `BARBEARIA`, `PADARIA` e `SORVETERIA` parecem termos vagos
demais, mas são **palavras da própria categoria**. Qualquer barbearia é
Barbearia. Essas ficam, mesmo com 0 ocorrências no mês medido.

### Erro 4 — a regra do readme não cabe em nenhum critério do MVP

**Giulia fica de fora do seed.** O readme descreve uma regra de duas camadas:
"conta destino Nubank → Metas; outra conta → dia a dia". Os três tipos de
critério do MVP (`descricao_contem`, `pessoa`, `valor_direcao`) não sabem ler
conta destino, e as duas camadas são os dois Pix **enviados** — nem a direção
separa.

Semear metade dela classificaria a outra metade errado, em silêncio. Então ela
vai para a revisão, que é o erro barulhento. Uma vez por mês, e fica registrado
aqui como o primeiro pedido concreto de um quarto tipo de critério.

## Uma mudança na A1: `pessoa` ganha direção opcional

Duas das três regras que a medição pediu **não são expressáveis** sem isso:

- **Cadillac Monte Carmo:** o readme diz Pix *recebido* → Renda Extra, e compra
  no cartão → revisão manual. Sem direção, um Pix *enviado* para eles viraria
  renda.
- **Transferência para si mesmo:** sair e entrar querem respostas opostas (ver
  abaixo).

É um campo opcional a mais no critério `pessoa`. Regra sem direção continua
casando nos dois sentidos, então nada do que já existe muda.

Não é escopo novo: é a A1 terminando de servir o que a A5 descobriu.

## A transferência para si mesmo: metade vai, metade fica

O extrato traz o próprio nome do titular dos dois lados.

**Saída** — dinheiro indo para outra conta dele mesmo. É passagem, e vai para
`outros-repasses/repasses`, que é literalmente o balde de repasses e não tem
percentual nem meta: não distorce o rateio dos potes.

**Entrada** — aqui eu não sei, e não vou chutar. Pode ser dinheiro voltando da
outra conta (passagem) ou pode ser o salário dele chegando de outro banco
(renda). As duas leituras mudam a base de cálculo de **todos** os potes.
Vai para a revisão até o Davi responder. É a pergunta que a C2 precisa
responder de qualquer jeito.

## O nome do titular não entra no repositório

A regra de transferência para si mesmo precisa do nome do titular, que é dado
pessoal — e o seed é arquivo versionado.

Por isso `regrasSemente` é uma **função**, não uma constante: recebe o nome do
titular e a tradução de categoria, e monta a lista. Sem nome, a regra
simplesmente não entra. Nenhum nome real no arquivo, e de quebra funciona para
qualquer usuário, não só para o Davi.

## As regras apontam para `pote/categoria`, não para id

Mesma chave composta da A4, pelo mesmo motivo: `assinaturas` existe duas vezes
no seed, e a unicidade no banco é `(bucket_id, slug)`.

Ids só existem depois da D7 gravar. A tradução entra como parâmetro.

## Uma regra depende da C2

`renda/renda-extra` não existe: o pote de renda nasce na C2. A lista
`AGUARDANDO_C2` nomeia as chaves que ainda não existem, e o teste exige que ela
seja **exatamente** o conjunto que falta em `POTES_PADRAO`.

Quando a C2 criar o pote, o teste quebra — e a lista tem de esvaziar. É um
lembrete que não dá para esquecer.

## Nenhuma regra `valor_direcao` no seed

O tipo existe (A1) e a spec diz que ele nasce "só do seed do Davi". Medindo, o
seed **não tem nenhuma**: nada na seção 7 é uma faixa de valor.

O `> R$ 200` do readme não é regra de categoria — é a marca de "olhe isso mesmo
tendo batido", e é a D1 que aplica, separada do casamento. Digo aqui para não
parecer esquecimento.

## O que a medição mostrou e não é desta tarefa

- Um Pix para uma operadora de telefonia que o readme não lista. Cairia certo
  em `custos-fixos/telefonia`, mas inventar regra que o readme não tem é
  exatamente o erro da descoberta 3. Vai para a revisão, vira regra pela D5.
- O CDB tem **aplicação** medida e nenhum **resgate** no mês. Semeio só o que
  medi; o texto de um resgate eu não conheço e não invento.
- O banco chamou uma compra em loja online de `TRANSPORTE`. Confirma a
  descoberta 4 de novo.

## Conferência contra os arquivos reais: **30 classificados, 17 pendentes**

Não é a A6 — é uma conferência de sanidade, sem o registro de procedência nem o
resumo que a A6 pede. Mas o número já aparece, e ele **não é o 36/11 da spec**.

| | Spec | Medido agora |
|---|---|---|
| A classificar | 47 | 47 |
| Classificados | 36 | **30** |
| Pendentes | 11 | **17** |

A diferença é de **6 lançamentos**, e cada um tem nome:

| Quantos | O que é | Por quê |
|---|---|---|
| 1 | O app de corrida no cartão | A regra que o pegaria é `99`, e ela também classificaria um **restaurante** como Transporte e casaria com o número da conta. Não vale 1 acerto |
| 3 | Petshop e clínica veterinária | **Não existe categoria de pet** nos 8 potes. A A4 já tinha achado isso. Não invento categoria numa tarefa de regras |
| 2 | Transferência para si mesmo, entrando | Deliberado, ver acima: pode ser passagem ou pode ser salário |

**A medição da spec estava otimista, e o otimismo era meu.** Aquele 36 saiu de
mim lendo o arquivo com julgamento humano — e o julgamento humano contava o
`99` como acerto sem enxergar o restaurante que ele leva junto.

Não ajustei a A5 para bater o número. Ajustar seria semear de volta a regra que
acabei de mostrar que classifica errado em silêncio.

A tarefa A6 diz "se der diferente, é a A1–A5 que estão erradas, não a medição".
Neste caso é o contrário, e o lugar de consertar é a spec. A A6 fecha isso.

## Edge cases

| Situação | Tratamento |
|---|---|
| Chave de categoria que não existe na tradução | A regra não entra. Regra órfã apontando para nada é pior que regra ausente |
| Sem nome do titular | A regra de transferência para si mesmo não entra |
| Duas regras para a mesma categoria (`PETROBRAS` e `PREMMIA`) | Ficam as duas: mesmo destino, empate impossível |
| Regra inválida entrando na lista | O teste roda `regraValida` em todas |

## Fora do escopo

- Gravar no banco → D7
- Tela de editar regra → fase 2
- Criar a categoria de pet que a A4 achou → fase de banco
- Regra por recorrência → precisa de histórico

## Critério de pronto (da Etapa 2)

- [ ] As regras da seção 7 do `readme.md` como dados versionados
- [ ] Mais aplicação de CDB, IOF internacional e transferência para si mesmo
- [ ] Pura: sem banco, sem sessão, sem tela
- [ ] Nenhum nome real de pessoa no arquivo
