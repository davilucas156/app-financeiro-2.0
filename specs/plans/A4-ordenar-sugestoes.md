# Plano — A4 · Ordenar as sugestões

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** A4 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** BACK (pura)
**Arquivos:** `src/features/classificacao/motor/sugestoes.ts` e `sugestoes.test.ts`

## O que é

Quando **nenhuma regra bate** (A1), o lançamento vai para a revisão. Esta
tarefa decide o que aparece nos até 3 botões de sugestão daquela tela.

Sugestão não classifica nada sozinha — só encurta o caminho até o toque certo.

## Cada sugestão carrega de onde veio

Não é enfeite. Uma sugestão anônima é um palpite que você tem de aceitar no
escuro; com a procedência, você sabe se está confiando em você mesmo do mês
passado ou num palpite do banco que já se provou errado.

E é o que permite o LLM entrar depois como **mais uma fonte**, sem reescrever
nada — a decisão registrada na spec.

## As quatro fontes, em ordem

| # | Fonte | Por quê |
|---|---|---|
| 1 | Você já classificou esta mesma descrição | O sinal mais forte que existe: é você concordando com você |
| 2 | Você já classificou esta contraparte | Mesma força, pelo outro eixo — quem, e não o quê |
| 3 | A categoria do banco, quando ela é específica | Barata e às vezes certa |
| 4 | O pote que a categoria do banco indica, mais o seu histórico dentro dele | Aproveita o maior sinal do arquivo sem fingir precisão que ele não tem |

Empatou na categoria, a primeira fonte vence — por isso a ordem é a lista
acima, e não um peso numérico.

## Por que a fonte 1 não é redundante com a A1

Se você já classificou isso antes, por que não virou regra? Porque você pode
ter respondido **"só desta vez"**. O histórico é exatamente esse caso: a
memória do que você decidiu sem se comprometer para sempre.

## O histórico casa pelo trecho, não pela descrição crua

Reuso a A2: o espaçamento das colunas da fatura muda entre arquivos, e o
trecho não.

**Escrevi aqui, antes de implementar, que a mesma loja em outra cidade
continuaria batendo. Está errado** — o teste pegou. A A2 mantém a cidade
quando ela tem coluna própria, justamente para errar para o lado longo. Então
loja igual em cidade diferente não casa.

Corrigi a afirmação, não o código: é o erro barulhento de sempre. A sugestão
não aparece, você escolhe na lista, e nada foi classificado errado em
silêncio.

## A categoria do banco: pouca coisa aproveita

Medido na fatura: 15 `TRANSPORTE`, 7 `OUTROS`, 3 `COMPRAS`, 3 `SERVICOS`, e 5
outras com 1 cada.

**`OUTROS`, `COMPRAS`, `SERVICOS` e `PAGAMENTOS` não viram sugestão nenhuma.**
Traduzir "outros" para alguma categoria seria ruído vestido de sugestão — e
ruído com a etiqueta "sugerido" é pior que silêncio, porque convida ao toque
distraído.

Sobram as específicas, que viram sugestão direta.

**`TRANSPORTE` é o caso interessante:** é o rótulo mais comum do arquivo, mas
aponta para um pote com quatro categorias, e a medição já pegou o banco
chamando uma compra em loja online de transporte. Então ele não vira sugestão
de categoria — vira **sugestão de pote**, resolvida com o seu histórico dentro
daquele pote. Se você nunca classificou nada em transporte, ele não sugere
nada.

## Uma coisa que a medição revelou e não é desta tarefa

O banco classificou um lançamento como `PETSHOP` e **não existe categoria de
pet** nos 8 potes semeados. Não invento a categoria aqui; fica registrado para
a fase de banco decidir se o seed ganha uma.

## Chave de categoria é composta

`assinaturas` existe **duas vezes** no seed — uma em Custos Fixos, outra em
Conforto & Lazer. A unicidade no banco é `(bucket_id, slug)`, então qualquer
tradução que use só o slug escolheria a errada metade das vezes.

A tabela de tradução usa `pote/categoria`.

## Edge cases

| Situação | Tratamento |
|---|---|
| Histórico vazio e sem categoria do banco | Devolve lista vazia. A tela vai direto para a lista completa |
| Duas fontes apontam a mesma categoria | Aparece uma vez, com a fonte mais forte |
| Mais de 3 sugestões possíveis | Corta em 3 — a tela tem polegar, não espaço |
| Categoria do histórico que o usuário apagou | O contexto vem do banco já filtrado; id que não existe mais não entra |
| Lançamento sem contraparte | A fonte 2 é pulada |
| Descrição sem trecho estável | A fonte 1 casa pela descrição normalizada inteira |

## Fora do escopo

- Sugerir via LLM → decidido: depois
- Aprender pesos por frequência → fase 2; hoje a ordem é fixa e explicável
- Criar a categoria de pet → fase de banco

## Critério de pronto (da Etapa 2)

- [ ] Até 3 sugestões, ordenadas, cada uma com a origem
- [ ] Fontes na ordem definida
- [ ] Pura: sem banco, sem sessão, sem tela
