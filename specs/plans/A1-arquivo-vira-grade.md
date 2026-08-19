# Plano — A1 · Camada 1: arquivo vira grade de células

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** A1 de `specs/02-upload-de-extrato.tarefas.md`
**Camada:** BACK
**Spec:** `specs/02-upload-de-extrato.md`, "Ler o arquivo"
**Formatos medidos:** `references/formatos-de-extrato.md`

## O que esta camada faz, e o que ela se recusa a fazer

**Faz:** bytes → texto → matriz de strings.

**Não faz:** não sabe o que é data, o que é dinheiro, nem qual banco mandou o
arquivo. Não descarta linha em branco, não apara espaço, não adivinha nada.

A ignorância é o ponto. É ela que permite trocar CSV por XLSX depois mexendo
só aqui: se esta camada souber que a terceira coluna é um valor em reais, o
XLSX vai precisar saber também, e a troca deixa de ser barata.

## Decisão: o projeto ganha um test runner (Vitest)

Até aqui toda verificação minha foi feita em rota temporária dentro do Next,
porque tudo dependia de banco ou de sessão. Isso funcionou, mas **as
verificações morreram junto com as rotas** — nenhuma sobrou no repositório.

Esta camada é o oposto: função pura, sem banco, sem sessão, sem rede. E é
código que converte **dinheiro**. Um erro aqui não quebra, mente — importa
R$ 1.234,00 no lugar de R$ 1.234,56 e o app segue sorrindo.

Então entra o **Vitest**: `npm test`, TypeScript direto, sem configuração de
build. Os testes ficam no repositório e rodam de novo a cada mudança, em vez
de eu jurar que rodei uma vez.

> Escopo: o Vitest cobre as camadas puras (A1–A4). O que depende de banco
> continua sendo verificado dentro do runtime do Next — `server-only` bloqueia
> esses módulos fora dele, e é assim que deve ser.

## Interface

```
type Dialeto = { separador: string; aspas: boolean }

decodificar(bytes: Uint8Array): string
paraGrade(texto: string, dialeto: Dialeto): string[][]
```

**Por que o dialeto vem de fora e não é adivinhado.** Contar separadores para
chutar entre `;` e `,` erra justamente no arquivo do Davi: o extrato tem 2
vírgulas por linha (as decimais) e 3 ponto-e-vírgulas. Chega perto demais.

Quem decide é a A2, que conhece os formatos e sabe qual cabeçalho espera —
tenta cada dialeto conhecido e fica com aquele cujo cabeçalho bate. Reconhecer
pelo **conteúdo** é o que a spec pede, e é o que sobrevive a um arquivo salvo
pelo Excel em português (que grava com `;`).

## Decodificação

1. Tira o BOM (`EF BB BF`) se houver — a fatura tem, o extrato não.
2. Tenta UTF-8 **estrito** (`TextDecoder` com `fatal: true`).
3. Falhou? Relê como **Latin-1**.

Os dois arquivos medidos são UTF-8 válidos. O passo 3 existe porque banco
brasileiro exporta Latin-1 com frequência, e o sintoma — "AlimentaÃ§Ã£o" — é
daqueles que passam despercebidos até alguém olhar a tela.

## Dois modos de separar

| Modo | Quem usa | Como |
|---|---|---|
| `aspas: false` | Extrato da conta | Quebra em linhas, quebra cada linha no separador. **Aspas são texto comum** |
| `aspas: true` | Fatura do cartão | Varredura caractere a caractere: `"` abre e fecha campo, `""` vira uma aspa literal, separador e quebra de linha **dentro** de aspas são conteúdo |

**Os dois modos existem porque os dois arquivos se excluem** (medido):

- A fatura tem vírgula dentro do campo de valor em **todas** as 33 linhas de
  dados. Sem tratamento de aspas, toda linha quebra.
- O extrato tem aspas soltas no meio de campo não citado em **21 de 21** linhas
  (`Pix recebido: "Cp :123-FULANO"`). Com tratamento de aspas, um parser
  estrito rejeita ou embaralha.

Não é preferência: nenhuma configuração única lê os dois.

## O que **não** é aparado nem descartado

Nem espaço em branco, nem linha vazia, nem linha curta.

A A2 precisa **achar** a linha do cabeçalho no meio das 5 linhas de metadados
do extrato. Se esta camada já tivesse comido as vazias, "pular 5 linhas"
viraria um número mágico que quebra no dia em que o Inter acrescentar uma
linha. Guardando tudo, a A2 procura pelo cabeçalho e não conta linhas.

## Amostras de teste

Vivem como **strings em TypeScript**, em `amostras.ts` — não como `.csv`.
Arquivo de extrato está no `.gitignore` (dado real), e amostra em código fica
obviamente sintética, não some do repositório e mostra o formato exato,
incluindo o BOM, escrito como `﻿`.

## Edge cases

| Situação | Tratamento |
|---|---|
| Arquivo vazio | Grade vazia, sem erro |
| Só BOM | Grade vazia |
| `\r\n` e `\n` misturados | Ambos quebram linha; `\r` não sobra na última célula |
| Última linha sem quebra | Vira linha normal |
| Aspas não fechadas até o fim | Fecha implicitamente no fim do texto; não trava nem lança |
| `""` dentro de campo citado | Vira uma aspa literal |
| Aspas no meio de campo citado (`"ab"cd"`) | Preservado como texto, sem lançar erro |
| Quebra de linha dentro de campo citado | É conteúdo, não fim de linha |
| Bytes inválidos em UTF-8 | Relê tudo como Latin-1 |

## Thin Client / Fat Server

Sem `import "server-only"`, e isso é deliberado: o módulo não toca banco, não
lê sessão e não guarda segredo — é conversão de texto. Marcá-lo como exclusivo
do servidor impediria de testá-lo no Vitest sem ganhar segurança nenhuma. O
que **é** do servidor é quem o chama (D2), e o `user_id` que vem de `auth()`.

## Fora do escopo

- Reconhecer qual banco mandou o arquivo → **A2**
- Data, dinheiro e direção → **A3**
- XLSX → outra implementação desta mesma camada, quando fizer falta

## Critério de pronto (da Etapa 2)

- [ ] BOM
- [ ] `;` sem aspas
- [ ] `,` com aspas
- [ ] Campo citado contendo vírgula
- [ ] Campo **não** citado contendo aspas
- [ ] Linha em branco
- [ ] `\r\n`
- [ ] Não sabe nada de banco, data nem dinheiro
- [ ] Amostras como strings em TypeScript
