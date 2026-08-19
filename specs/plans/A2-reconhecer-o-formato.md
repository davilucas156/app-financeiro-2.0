# Plano — A2 · Reconhecer o formato

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** A2 de `specs/02-upload-de-extrato.tarefas.md`
**Camada:** BACK
**Spec:** `specs/02-upload-de-extrato.md`, "Ler o arquivo"
**Depende de:** A1 (commit `82d2336`)

## O que esta tarefa responde

"Que arquivo é este, e onde está o cabeçalho dele?"

Entra: os bytes. Sai: qual formato, a grade já separada com o dialeto certo, em
que linha está o cabeçalho, e **em que coluna está cada coisa**.

## Reconhecer pelo conteúdo, nunca pelo nome

O nome do arquivo mente. O do Davi chama-se `Extrato-02-06-2026-a-02-07-2026-CSV.csv`
num caso e `fatura-inter-2026-07.csv` no outro — nenhum dos dois é padrão do
banco, os dois foram renomeados por gente. A extensão mente igual: Excel em
português salva CSV com ponto e vírgula.

Então o método é: **tentar cada formato conhecido com o dialeto dele e ver de
quem o cabeçalho bate.**

Isso resolve de graça o problema que a A1 deixou em aberto — contar separadores
para adivinhar entre `;` e `,` erraria no extrato do Davi, que tem 2 vírgulas
por linha (as decimais) contra 3 ponto-e-vírgulas.

**Por que a tentativa cruzada não dá empate:** lido com o dialeto errado, cada
arquivo vira uma coluna só. O extrato não tem vírgula no cabeçalho, então com
dialeto de fatura vira a célula única `Data Lançamento;Descrição;Valor;Saldo`.
A fatura não tem ponto e vírgula em lugar nenhum. Nenhum dos dois se parece com
o outro.

## Achar o cabeçalho, não contar linhas

O extrato tem 5 linhas antes do cabeçalho (4 de metadados, 1 em branco).
`pular 5` funcionaria hoje e quebraria no dia em que o Inter acrescentar uma
linha — e quebraria em silêncio, tratando o cabeçalho como lançamento.

Então: varre as primeiras linhas procurando aquela que **contém todas as
colunas obrigatórias** do formato. A primeira que bater é o cabeçalho.

## Papel, não posição

O resultado devolve um mapa `papel → índice da coluna`:

| Papel | No extrato | Na fatura |
|---|---|---|
| `data` | `Data Lançamento` | `Data` |
| `descricao` | `Descrição` | `Lançamento` |
| `valor` | `Valor` | `Valor` |
| `saldo` | `Saldo` | — |
| `categoria` | — | `Categoria` |
| `tipo` | — | `Tipo` |

A A3 vai perguntar "onde está a descrição?", não "pegue a coluna 2". Se o
banco reordenar as colunas amanhã, a A3 não muda nem percebe.

Repare que o **mesmo papel tem nomes diferentes** nos dois arquivos — `data` é
`Data Lançamento` num e `Data` no outro, e `descricao` é `Descrição` num e
`Lançamento` no outro. É exatamente por isso que o mapa existe.

## Comparação de nome de coluna

Normaliza antes de comparar: apara, minúsculas, tira acento, junta espaços
repetidos. Assim `Descrição`, `DESCRIÇÃO` e `Descricao ` são a mesma coluna.

Tirar acento parece exagero até lembrar que o mesmo banco entrega um arquivo em
UTF-8 com BOM e outro sem — quem trata acento assim inconsistentemente uma hora
manda `Descricao`.

## Erro que diz o que falta

Devolve resultado, não exceção — arquivo errado é caso comum de uso, não falha
de programa.

Quando nenhum formato bate, o erro aponta o **candidato mais próximo** e
nomeia as colunas que faltaram. "Não reconheci o arquivo" não ajuda ninguém;
"parece o extrato do Inter, mas faltou a coluna Valor" ajuda.

## Isto **não** decide se o arquivo está no campo certo

A A2 diz o que o arquivo é. Comparar com o campo em que o usuário o colocou —
extrato no lugar do cartão — é da D3, que sabe qual campo foi usado. Aqui só
sai a verdade sobre o arquivo.

## Interface

```
type Papel = "data" | "descricao" | "valor" | "saldo" | "categoria" | "tipo"

reconhecer(bytes: Uint8Array): Reconhecimento

  ok    → { formato, grade, linhaCabecalho, coluna: Record<Papel, number>, linhasDeDados }
  erro  → { motivo: "vazio" | "desconhecido", mensagem, candidato?, faltando? }
```

Recebe **bytes** e não texto: a decodificação e a retirada do BOM são da A1, e
deixá-las para quem chama seria plantar o erro de comparar `"﻿Data"` com
`"Data"` e nunca entender por quê.

## Edge cases

| Situação | Tratamento |
|---|---|
| Arquivo vazio, ou só BOM | `motivo: "vazio"` |
| Só as linhas de metadados, sem cabeçalho | `desconhecido`, apontando o candidato mais próximo |
| Cabeçalho existe mas falta uma coluna obrigatória | `desconhecido` nomeando a que faltou |
| Cabeçalho depois de muitas linhas de lixo | Procura nas primeiras 30 linhas; além disso, desiste |
| Colunas fora de ordem | Funciona — o mapa é por nome |
| Coluna extra desconhecida | Ignorada |
| Cabeçalho com acento, caixa ou espaço diferentes | Normalização resolve |
| Nenhuma linha de dados depois do cabeçalho | `ok`, com `linhasDeDados` vazio. Quem decide se isso é erro é a D2 |
| Arquivo que casa com dois formatos | Impossível pelos cabeçalhos atuais; se um dia acontecer, vence o primeiro da lista, e a ordem é explícita |

## Fora do escopo

- Converter data, dinheiro e direção → **A3**
- Dizer se o arquivo foi posto no campo errado → **D3**

## Critério de pronto (da Etapa 2)

- [ ] Identifica extrato x fatura **pelo cabeçalho**, nunca por extensão ou nome
- [ ] Cabeçalho desconhecido devolve erro dizendo qual coluna faltou
- [ ] As 5 linhas de metadados do extrato são puladas — achando o cabeçalho, não contando
