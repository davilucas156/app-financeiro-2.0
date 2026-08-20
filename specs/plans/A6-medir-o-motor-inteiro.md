# Plano — A6 · Medir a cobertura contra os arquivos reais

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** A6 de `specs/03-motor-de-classificacao.tarefas.md` — fecha a fase A
**Camada:** BACK (medição)
**Arquivos:** `src/features/classificacao/motor/cobertura.test.ts`, mais a
correção dos números na spec 03

## O que é

O motor inteiro — A1 a A5 — rodando contra os arquivos de verdade do Davi, do
byte cru até a categoria.

## O harness fica no repositório; os arquivos, não

A tarefa diz "roda fora do repositório". Li isso como: **o dado** fica fora, não
a ferramenta. Uma medição que só existe num script descartável não é medição, é
anedota — não dá para repetir depois de mexer no motor.

Então o harness é um teste normal, que **se pula sozinho** quando os arquivos
não estão na máquina. Na minha, ele pula. Na do Davi, `npm test` confere o motor
contra o extrato dele toda vez que roda.

Isso dá proteção contra regressão de graça: se eu mexer numa regra e a cobertura
cair, o teste dele quebra e diz em quanto caiu.

## Confere a entrada antes de conferir o resultado

Se o Davi trocar os arquivos por um mês novo, "30 classificados" vira uma
afirmação sobre outro conjunto de dados, e o teste falharia dizendo a coisa
errada.

Então a primeira asserção é sobre a **entrada**: quantas linhas cada arquivo
tem. Se mudou, a mensagem é "os arquivos mudaram, remeça" — e não um erro de
cobertura que não quer dizer nada.

## Um número depende do nome do titular, e isso fica explícito

A regra de transferência para si mesmo (A5) só existe quando o nome do titular
é passado, e ele não mora no repositório. Sem ele, um lançamento a menos é
classificado.

Em vez de exigir configuração, o harness **espera os dois números** e escolhe
pelo que recebeu. A diferença de exatamente 1 é a própria regra se
documentando.

## O resultado: **30 classificados, 17 pendentes** — não 36/11

| | Spec | Medido |
|---|---|---|
| Importados | 54 | 54 |
| Fora do cálculo na importação | 7 | 7 (3 excluídos + 4 pares) |
| A classificar | 47 | 47 |
| **Classificados** | 36 | **30** |
| **Pendentes** | 11 | **17** |

A tarefa A6 diz: "se der diferente, é a A1–A5 que estão erradas — não a
medição". **Neste caso é o contrário**, e os 6 de diferença têm nome:

| Quantos | O que | Por quê |
|---|---|---|
| 1 | App de corrida no cartão | Só a regra `99` pegaria, e ela também classifica um restaurante como Transporte e casa com o número da conta (A5) |
| 3 | Petshop e clínica veterinária | Não existe categoria de pet nos 8 potes |
| 2 | Transferência para si mesmo, entrando | Deliberado: pode ser passagem ou pode ser salário |

Aquele 36 saiu de mim lendo o arquivo com julgamento humano, e o julgamento
contava o `99` como acerto sem enxergar o que ele leva junto. **Corrijo a spec,
não o motor.**

## Duas medições novas que a spec não pedia e mudam a fase B

### 1. Só **2 dos 17** pendentes recebem sugestão

No primeiro mês o histórico está vazio, e a categoria do banco quase nunca
traduz. Os outros **15 vão direto para a lista completa de categorias**.

Isso é consequência do desenho da A4 — melhor silêncio que ruído com etiqueta
de "sugerido" — mas tem uma consequência prática que eu não tinha enxergado:

> **A lista completa não é o caminho de exceção da tela de revisão. No primeiro
> mês, ela é o caminho principal.**

A B2 tem de tratá-la como tela de primeira classe: agrupada por pote, alvo de
44px, alcançável com o polegar, sem rolagem infinita. Não é um `<details>`
escondido no rodapé.

A partir do segundo mês isso inverte, porque o histórico passa a existir. Mas o
primeiro mês é justamente o que decide se você continua usando o app.

### 2. **Nenhum** pendente fica sem virar regra, e 17 viram 14

Todos os 17 produzem trecho estável (A2) ou pessoa (A3) — nenhum cai no caso em
que a pergunta "sempre classificar assim?" não pode aparecer.

E os 17 lançamentos precisam de apenas **14 regras distintas**: três deles
repetem contraparte ou comerciante de outro pendente. Como a D5 aplica a regra
nova aos outros pendentes do mesmo mês, são **14 decisões**, não 17.

No mês seguinte essas 14 regras já existem, e só sobra comerciante ou pessoa
genuinamente nova.

## O que o harness mede

| Medida | Esperado |
|---|---|
| Lançamentos lidos | 54 |
| Linhas ignoradas | 0 |
| Fora do cálculo na importação | 7 |
| Classificados pelo motor | 30 (29 sem o nome do titular) |
| Pendentes | 17 (18 sem o nome do titular) |
| Pendentes com ao menos uma sugestão | 2 |
| Pendentes sem trecho **nem** pessoa | 0 |
| Regras distintas que resolvem os 17 | 14 |

## Nada de dado real sai daqui

O harness **conta**, não imprime. Nome de comerciante, nome de pessoa e valor
ficam na memória do processo e morrem lá. O que vai para o repositório são os
números acima e exemplos inventados — a mesma régua de
`references/formatos-de-extrato.md`.

## Edge cases

| Situação | Tratamento |
|---|---|
| Arquivos não existem (qualquer máquina que não a do Davi) | O bloco inteiro pula, com o motivo no nome |
| Arquivos mudaram | Falha na conferência da entrada, com mensagem própria |
| Nome do titular ausente | Espera o número sem a regra de transferência |
| Um dos dois arquivos existe e o outro não | Pula: a medição só vale com os dois, porque par que se anula cruza arquivos |

## Fora do escopo

- Criar a categoria de pet → fase de banco
- Ligar o motor à importação → D1
- Corrigir o `readme.md` seção 7 → ele é o documento de origem; quem registra o
  que foi medido é a spec

## Critério de pronto (da Etapa 2)

- [ ] O motor inteiro roda contra os 54 lançamentos reais
- [ ] O resultado é confrontado com o medido na spec
- [ ] A divergência é explicada e o documento errado é corrigido
