# Plano — A1 · Casar uma regra contra um lançamento

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** A1 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** BACK (pura — sem banco, sem sessão, sem tela)

## O que é

Uma função: dada a lista de regras do usuário e um lançamento, devolve **a
regra vencedora ou nada**. É o coração determinístico do motor — a parte que
roda sem custo, sem rede e sem chute.

## Arquivos

- `src/features/classificacao/motor/regras.ts` — os tipos e o casamento
- `src/features/classificacao/motor/regras.test.ts`

Pasta nova `classificacao/motor/`, no mesmo espírito de `upload/ler-arquivo/`:
uma camada pura inteira num lugar só, sem `server-only`, alcançável pelo Vitest.
As tarefas A2–A5 entram como arquivos vizinhos.

## Reuso

`normalizarDescricao` (`upload/ler-arquivo/preparar.ts`) já faz exatamente o
pré-processamento que o casamento precisa: tira acento, sobe para maiúsculas,
colapsa espaço. **Não vou reescrever.**

Isso cria um import de `classificacao` para `upload`. Aceito de propósito: é
função pura, sem dependência, e duas normalizações diferentes no mesmo produto
seriam bem piores — regra criada com uma e casada com a outra deixaria de bater
sem ninguém entender por quê.

## Os três tipos

| Tipo | Critério | Quem cria |
|---|---|---|
| `descricao_contem` | um trecho de texto | correção sua (A2 extrai o trecho) |
| `pessoa` | o nome do outro lado do Pix | correção sua num Pix (A3 extrai o nome) |
| `valor_direcao` | faixa de valor + entrada/saída | só o seed |

O tipo `pessoa` casa contra um campo `pessoa` que **vem pronto no alvo** — quem
o preenche é a A3. Assim a A1 não fica esperando a A3 para existir nem para ser
testada; nos testes eu passo o nome direto.

## Quem ganha quando duas regras batem

Duas etapas, nesta ordem:

1. **`prioridade` menor vence.** Menor = avaliada antes, como `nice` no Unix. O
   seed usa 10, 20, 30 — com buracos de sobra para encaixar regra nova entre
   duas existentes sem renumerar tudo.
2. **Empatou: o termo mais longo vence.** `PAGAR ME` perde para
   `PAGAR ME ESTACIONAMENTO`. Regra específica ganhando de regra genérica é o
   comportamento que não surpreende.

`valor_direcao` tem comprimento **zero** de propósito: numa faixa de valor não
há texto, e ela é a mais genérica das três. Empatada com qualquer regra de
texto, perde.

Estabilidade: com prioridade e comprimento iguais, ordeno pelo `id` para o
resultado não depender da ordem em que o banco devolveu as linhas. Duas
chamadas iguais têm que dar o mesmo resultado.

## Edge cases

| Situação | Tratamento |
|---|---|
| Nenhuma regra | Devolve nada. Não é erro — é o mês normal de quem começou ontem |
| Termo vazio ou só espaço | **Regra inválida, nunca casa.** `"".includes` casaria com tudo e classificaria o extrato inteiro numa categoria só |
| `valor_direcao` sem nenhum limite | Inválida. Sem mínimo nem máximo ela é "toda saída", que não é uma regra, é um apagão |
| Faixa invertida (mín > máx) | Inválida |
| Alvo sem `pessoa` | Regras `pessoa` simplesmente não casam |
| Acento e caixa diferentes | Batem: os dois lados passam por `normalizarDescricao` |
| Termo maior que a descrição | Não casa, sem estourar |
| Limite exatamente igual ao valor | **Casa.** Faixa fechada dos dois lados; "R$ 200 ou mais" é como se fala |
| Regra de categoria de outra pessoa | Fora do escopo daqui — quem filtra por `user_id` é a consulta (C1/D3) |

## O que esta tarefa **não** faz

- Extrair o trecho que vira regra → **A2**
- Extrair a pessoa do Pix → **A3**
- Sugerir quando nada bate → **A4**
- Marcar valor alto para revisão → **D1**, junto com a importação
- Ler ou gravar qualquer coisa → fases C e D

## Critério de pronto (da Etapa 2)

- [ ] Função pura: regras + lançamento → regra vencedora ou nada
- [ ] Os três tipos do MVP
- [ ] Desempate por `prioridade`, depois pelo termo mais longo
- [ ] Não sabe de banco, sessão nem tela
