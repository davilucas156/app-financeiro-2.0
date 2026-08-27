# Plano — A1 a A5, o vocabulário de formato

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** A1 (data), A2 (número), A3 (`Formato` aberto), A4 (o palpite),
A5 (a prévia e a conferência)
**Spec:** `specs/11-csv-de-varios-bancos.md`

⚠ **Nada aqui muda a tela e nada toca o banco.** A fase A sobe com o leitor
sabendo ler mais coisas e continuando a ler o Inter exatamente igual. A prova é
dura e barata: **os testes de hoje passam sem uma linha alterada.**

---

## Arquivos a criar

### `src/features/upload/ler-arquivo/dialetos.ts` `INFRA`

Os dois vocabulários que hoje estão cravados dentro do `lancamentos.ts`.

```ts
export const FORMATOS_DE_DATA = ["dd/mm/aaaa", "aaaa-mm-dd", "dd-mm-aaaa", "mm/dd/aaaa"] as const;
export const FORMATOS_DE_NUMERO = ["pt-BR", "en-US"] as const;

export type FormatoDeData = (typeof FORMATOS_DE_DATA)[number];
export type FormatoDeNumero = (typeof FORMATOS_DE_NUMERO)[number];

export const FORMATO_DE_DATA_PADRAO: FormatoDeData = "dd/mm/aaaa";
export const FORMATO_DE_NUMERO_PADRAO: FormatoDeNumero = "pt-BR";

export const ROTULOS_DE_DATA: Record<FormatoDeData, string>;
export const ROTULOS_DE_NUMERO: Record<FormatoDeNumero, string>;
```

⚠ **Arquivo separado, e não dentro de `formatos.ts`**, porque a tela de
mapeamento precisa dos rótulos e `formatos.ts` é servidor-e-cliente por acaso, não
por desenho. Mesmo corte da spec 10: o mecanismo num lugar, os rótulos junto da
decisão.

⚠ **`mm/dd/aaaa` entra na lista sabendo que é armadilha.** `01/02/2026` é 1º de
fevereiro ou 2 de janeiro, e **as duas leituras são plausíveis** — nenhum
palpite resolve. Diferente do sinal, o erro não aparece num total: ele move
lançamentos de mês, e o mês é o eixo do produto. A defesa é a prévia mostrar as
datas lidas, e a A4 **nunca** propor `mm/dd` sozinha (ver abaixo).

### `src/features/upload/ler-arquivo/palpite.ts` `INFRA` — A4

```ts
export type Palpite = {
  dialeto: Dialeto;
  linhaCabecalho: number;
  colunas: Partial<Record<Papel, number>>;
  formatoData: FormatoDeData;
  formatoNumero: FormatoDeNumero;
  origem: Origem;
  sinalNegativo: "entrada" | "saida";
};

export function palpitar(texto: string): Palpite | null;
```

O método, em ordem:

1. **Dialeto** — tenta as quatro combinações (`;`/`,`/`\t`/`|` × aspas
   sim/não) e escolhe a que dá **mais linhas com o mesmo número de colunas**,
   com pelo menos 2 colunas. É a medida certa: um separador errado produz uma
   coluna só ou uma contagem que pula de linha em linha.
2. **Linha do cabeçalho** — a primeira com ≥2 células não vazias das quais
   **nenhuma** parece data ou número. Cabeçalho é a linha que não tem dado.
3. **Colunas, pelo conteúdo das linhas abaixo** — não pelo nome. A coluna de
   data é a que mais casa com algum formato de data; a de valor, a que mais casa
   com número; a de descrição, a de maior comprimento médio entre as que
   sobraram.

   ⚠ **Pelo conteúdo, e não pelo cabeçalho, de propósito.** Casar por nome é o
   que `reconhecer` já faz, e é exatamente o que falhou — se o nome batesse, o
   arquivo não teria chegado aqui.

4. **Formato de data** — o que lê **todas** as células da coluna escolhida. Se
   mais de um lê todas, vence a ordem de `FORMATOS_DE_DATA`, que começa em
   `dd/mm/aaaa`.

   ⚠ **`mm/dd/aaaa` só é proposta quando é a única que lê o arquivo inteiro** —
   isto é, quando existe um dia acima de 12 na primeira posição. Havendo
   ambiguidade, propõe-se `dd/mm`, que é a convenção do país, e a prévia mostra
   as datas para a pessoa desmentir.

5. **Sinal** — a leitura que deixa **menos linhas como entrada** vence. Numa
   fatura quase tudo é gasto; num extrato, entrada e saída se misturam mas saída
   costuma ser mais frequente. É palpite, e vem com a frase da consequência
   embaixo.
6. **Origem** — `csv_cartao` quando há coluna que parece parcelamento ou
   categoria e **não** há coluna de saldo; `csv_conta` caso contrário.

Devolve `null` só quando nem duas colunas saem de nenhum dialeto — aí não é CSV.

### `src/features/upload/ler-arquivo/palpite.test.ts`

⚠ **O teste que vale é este:** partindo de `EXTRATO_INTER` e `FATURA_INTER`, e
**sem consultar `FORMATOS`**, o palpite tem de acertar separador, aspas, linha
do cabeçalho e os três papéis obrigatórios dos dois arquivos. São os dois
formatos reais medidos, e eles se excluem — quem acerta os dois no escuro acerta
a maioria.

### `src/features/upload/ler-arquivo/previa.ts` `INFRA` — A5

```ts
export type Previa = {
  lancamentos: number;
  entrouCentavos: number;
  saiuCentavos: number;
  ignoradas: number;
  /** As primeiras linhas lidas, para a pessoa ver data e valor de verdade. */
  amostra: { data: string; descricao: string; valor: number; direcao: Direcao }[];
  saldo: ConferenciaDeSaldo | null;
};

export function previaDoMapeamento(texto: string, formato: Formato): Previa;
```

⚠ **Sai de `paraLancamentos`, e não de uma segunda conta.** A prévia tem de ser
o que o import gravaria; calculá-la à parte faria a tela prometer um número e o
banco guardar outro. Mesma lição que a spec 12 aplicou ao cartão e à barra.

**A conferência do saldo** (`conferirSaldo`): quando o mapeamento aponta a coluna
de saldo, aplicar cada valor ao saldo da linha anterior tem de dar o saldo da
linha seguinte. Devolve quantas transições batem, quantas são, e a primeira que
desencontrou.

⚠ **É a régua do `formatos-de-extrato.md`**: _"somar o que o próprio parser leu
não prova nada"_. O saldo é a única testemunha independente que um CSV genérico
pode trazer — e quando ele não vem, a prévia diz que não veio, em vez de fingir.

---

## Arquivos a modificar

### `src/features/upload/ler-arquivo/lancamentos.ts` `INFRA` — A1, A2

- `paraDataISO(texto, formato = FORMATO_DE_DATA_PADRAO)`
- `paraCentavos(texto, formato = FORMATO_DE_NUMERO_PADRAO)`

⚠ **Com padrão, e o padrão é o de hoje.** É isso que faz os testes existentes
passarem sem alteração — e o dia em que um deles falhar, falhou de verdade.

⚠ **A conta continua em texto, sem ponto flutuante.** `19.90 * 100` é
`1989.9999999999998`; o comentário que está lá continua valendo e continua no
lugar.

⚠ **`paraDataISO` mantém a ida e volta por `Date.UTC`** para recusar `31/02` —
ela é o que pega data que passa na faixa e não existe, e vale para os quatro
formatos.

⚠ **En-US recusa `1.200`** pelo mesmo motivo que pt-BR recusa `1,200`: com um
separador decimal de três casas, não é centavo. Recusar é certo — é o valor que
a A5 vai mostrar como "linha ignorada", e ignorar em voz alta é melhor que ler
mil vezes errado.

### `src/features/upload/ler-arquivo/formatos.ts` `INFRA` — A3

- `id: string` em vez da união fechada.
- `formatoData: FormatoDeData` e `formatoNumero: FormatoDeNumero`, com os dois
  formatos do Inter declarando o que já usam hoje.
- ⚠ **`banco` continua obrigatório** — a `/passos` deriva dele desde a spec 09,
  e um formato de usuário sem banco tiraria a lista de lugar.

### `src/features/upload/ler-arquivo/reconhecer.ts` — **não muda nesta fase**

Ela ganha o parâmetro dos formatos do usuário na **C1**. Aqui só compila com o
`Formato` novo.

---

## Reuso identificado

| O que                          | Onde                     | Uso aqui                                        |
| ------------------------------ | ------------------------ | ----------------------------------------------- |
| `paraGrade`, `decodificar`     | `ler-arquivo/grade.ts`   | A4 e A5 leem pelo mesmo caminho do import        |
| `paraLancamentos`              | `ler-arquivo/lancamentos.ts` | A prévia **é** ele                          |
| `EXTRATO_INTER`, `FATURA_INTER` | `ler-arquivo/amostras.ts` | O teste que vale da A4                        |
| `Dialeto`                      | `ler-arquivo/grade.ts`   | O palpite devolve um                            |

---

## Caminho feliz

Um CSV de banco desconhecido: `,` sem aspas, cabeçalho na linha 1, datas
`2026-03-04`, valores `1200.50`. `palpitar` devolve o dialeto, a linha 0, as
três colunas, `aaaa-mm-dd`, `en-US`, `csv_conta` e um sinal. `previaDoMapeamento`
diz quantos lançamentos e quanto entrou e saiu.

## Edge cases

| Caso                                       | Comportamento                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| Arquivo com uma coluna em todo dialeto     | `palpitar` devolve `null` — não é CSV                                        |
| Arquivo sem cabeçalho                      | A primeira linha vira cabeçalho e some da prévia. A pessoa corrige na tela   |
| Datas ambíguas (todo dia ≤ 12)             | Propõe `dd/mm/aaaa`; a prévia mostra as datas lidas                          |
| Coluna de valor com moeda (`R$ `, `$`)     | `paraCentavos` já tira `R$`; `$` entra na mesma limpeza                      |
| Coluna de saldo ausente                    | `saldo: null`, e a tela diz que não deu para conferir                        |
| Arquivo do Inter                           | Continua sendo lido pelos formatos de código — a A4 nem é chamada            |

## Erros

Funções puras sobre texto já lido. Não há rede, banco, `await` nem sessão.
Entrada ruim **não é exceção**: vira `null`, ou vira linha ignorada com motivo —
que é como o leitor já se comporta desde a spec 02.

## Banco de dados

**Nenhuma alteração nesta fase.** A tabela é a B1.
