# Plano — A3 · Extrair a pessoa de um Pix ou transferência

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** A3 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** BACK (pura)
**Arquivos:** `src/features/classificacao/motor/pessoa.ts` e `pessoa.test.ts`

## Por que este tipo de regra existe

O extrato tem uma classe de lançamento que nenhum LLM resolve. Um Pix não diz
**o que** você comprou — diz **para quem** o dinheiro foi. Que uma dessas
pessoas seja sua mãe e outra o mecânico é conhecimento seu, não do modelo.

Foi o que a medição da spec mostrou: dos 11 pendentes, 5 são exatamente isso.
Mandá-los para uma API seria pagar por um chute pior do que perguntar uma vez.

**"Pessoa" quer dizer contraparte, não ser humano.** Empresas que você paga por
Pix caem no mesmo tipo de regra, e é o comportamento certo — o que identifica o
lançamento é quem está do outro lado.

## Olhei o texto inteiro primeiro

Na A2 eu trabalhei sobre uma listagem truncada e quase desenhei em cima do que
não estava vendo. Aqui a primeira coisa foi imprimir as 14 descrições distintas
do extrato **inteiras**. Duas coisas só apareceram assim.

### 1. A mesma contraparte, dois números de conta

Uma contraparte apareceu no mesmo mês com **dois números diferentes**, e escrita
de duas maneiras — uma toda em maiúsculas, outra não. Uma regra amarrada ao
número teria falhado na segunda vez, no mesmo mês.

É a evidência que fecha a decisão: a regra casa pelo **nome**.

### 2. A mesma pessoa em dois formatos

O extrato usa duas formas para dizer a mesma coisa: `Cp :<número>-<nome>` nos
Pix, e `<banco> <agência> <conta> <nome>` nas transferências. A mesma pessoa
apareceu nas duas, com grafias diferentes. As duas precisam sair iguais depois
de normalizadas.

## Grafia preservada, comparação normalizada

O nome sai daqui **como está escrito**, só com o espaço arrumado. Quem
normaliza para comparar é a A1.

Assim a tela pergunta "criar regra para Fulana de Tal?" em vez de gritar
"FULANA DE TAL", e o casamento continua insensível a acento e caixa. Uma coisa
para o olho, outra para a máquina.

## Sem lista de eventos conhecidos

Poderia gatear por `Pix enviado`, `Pix recebido`, `Transferencia enviada`. Não
faço: bancos inventam nomes de evento — `Pix recebido devolvido` é um deles, e
está no arquivo. Uma lista quebraria no próximo nome novo, em silêncio.

O que identifica é a **forma do conteúdo**, e ela é estável: número de conta
antes do nome.

## Dois grupos de dígitos, no mínimo

Na forma `<banco> <agência> <conta> <nome>`, exigir **pelo menos dois** grupos
numéricos antes do nome. Com um só, qualquer descrição que comece com número
viraria uma contraparte inventada.

## Edge cases

| Situação | Tratamento |
|---|---|
| Pagamento de fatura, aplicação em CDB | Devolve nada — não são transferência |
| O banco escreve `null` no lugar do nome | Devolve nada. **Não é bug meu:** o extrato traz a palavra literal num Pix devolvido |
| Sobra só número depois do traço | Devolve nada — é documento, não contraparte |
| Nome com menos de 3 letras | Devolve nada |
| Nome com espaço repetido | Colapsado |
| Evento com nome que eu nunca vi | Funciona, se a forma do conteúdo bater |

## Resultado medido

14 descrições distintas do extrato: **11 contrapartes extraídas, 3 recusadas**
(o `null` do banco, o pagamento de fatura, a aplicação). Conferidas uma a uma.

## Fora do escopo

- Decidir se a regra criada é de `pessoa` ou de texto → **D5**
- Casar a regra → **A1**, já feita
- Sugerir categoria para uma contraparte nova → **A4**

## Critério de pronto (da Etapa 2)

- [ ] Separa o nome do outro lado do prefixo do banco, agência, conta e `Cp :`
- [ ] Descrição que não é transferência devolve nada
- [ ] Nenhum nome real entra no repositório
