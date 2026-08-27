# Plano — A1 e A2, as duas contas do comparativo anual

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** A1 (recortar o histórico por ano) e A2 (o cartão de um pote no ano)
**Spec:** `specs/12-comparativo-anual.md`

⚠ **Nada aqui muda a tela.** As duas funções sobem escritas, testadas e **ainda
não chamadas por ninguém**. É o mesmo desenho da fase A da spec 10: se estiver
certo, o app fica idêntico, e o erro aparece sem um segundo assunto por perto.

---

## A decisão que mudou o plano: o cartão nasce da linha, não do histórico

O primeiro rascunho tinha `cartoesDoAno(historico, potes)` — uma segunda leitura
do mesmo array que as barras leem. Isso cria duas contas do mesmo número, e este
projeto já sabe como isso termina: é a razão de `mediaDoComparativo` ter virado
export na spec 09, e a razão de `rotuloDeMes` ter saído do seletor do upload.

`compararMeses` **já devolve** `linhas[].serie`, que é exatamente a série do ano
depois do recorte. Então:

```ts
cartoesDoAno(comparativo.linhas);
```

O cartão e a barra **não podem divergir, por construção** — leem o mesmo array,
não o mesmo dado. Isso muda o sentido do teste da E1: ele deixa de conferir uma
coincidência e passa a **guardar a estrutura**, reprovando quem um dia fizer o
cartão buscar os próprios números.

---

## Arquivos a criar

### `src/features/painel/comparar-meses/anoDoComparativo.ts` `INFRA`

Puro, sem `server-only` — como `comparativo.ts`, e pelo mesmo motivo: não toca
banco, não lê sessão, e marcá-lo impediria testá-lo sem ganhar segurança.

```ts
/** Os anos que a conta tem, do mais antigo ao mais novo. */
export function anosDoHistorico(meses: MesComCobertura[]): string[];

/**
 * O ano a abrir: o pedido, quando existe na conta; senão o do mês de
 * referência.
 */
export function anoEscolhido(
  meses: MesComCobertura[],
  mesDeReferencia: string,
  pedido: string | undefined | null,
): string;

/** Só os meses de um ano. Genérica para servir à cobertura e ao histórico. */
export function mesesDoAno<T extends MesComCobertura>(
  meses: T[],
  ano: string,
): T[];
```

⚠ **`anoEscolhido` nunca devolve ano sem mês.** É a mesma disciplina do `mes` da
`dadosDoPainel`, que confere o valor da URL contra os meses da própria conta —
um ano inventado cai no padrão em vez de virar uma tela vazia que parece defeito.

⚠ **Ordem crescente, como a fileira de meses.** O seletor de ano fica ao lado de
uma navegação que já é cronológica; inverter um dos dois faria a tela ler em duas
direções.

⚠ **Sem `Date`.** `anoDoMes` já recorta texto, e `lib/mes.ts` explica por quê:
`"2026-06" < "2026-07"` é verdade porque o formato é fixo e zero-preenchido.

### `src/features/painel/comparar-meses/anoDoComparativo.test.ts`

| Caso                                      | Espera                                  |
| ----------------------------------------- | --------------------------------------- |
| histórico vazio                           | `anosDoHistorico` → `[]`                |
| um ano só                                 | um item                                 |
| atravessa a virada (`2025-12`, `2026-01`) | dois itens, crescente                   |
| ano repetido em vários meses              | sem duplicata                           |
| `pedido` válido                           | devolve o pedido                        |
| `pedido` inexistente na conta             | cai no ano do mês de referência         |
| `pedido` `undefined`                      | idem                                    |
| `pedido` `"<script>"`                     | idem — **nunca chega a virar consulta** |
| `mesesDoAno` com mês de outro ano         | filtra                                  |

### `src/features/painel/comparar-meses/cartaoDoAno.ts` `INFRA`

```ts
export type CartaoDoAno = {
  poteId: string;
  /** A soma do ano. Inclui mês pouco classificado — ele existe. */
  totalCentavos: number;
  /** `null` quando o ano não tem mês nenhum. */
  mediaMensalCentavos: number | null;
  /** Sobre quantos meses a média fala. Nunca 12 por padrão. */
  mesesComDado: number;
  /** A mesma série da barra, para a linha mês a mês do cartão. */
  serie: ValorNoMes[];
  /** Algum mês da série é pouco classificado. */
  temMesPoucoClassificado: boolean;
};

export function cartoesDoAno(linhas: LinhaDoComparativo[]): CartaoDoAno[];
```

⚠ **A média divide por `serie.length`, não por 12** (pendência 3). Dividir por 12
num ano com 5 meses dá um número que não descreve mês nenhum e que muda sozinho
conforme o ano avança.

⚠ **Mês pouco classificado entra no total e na média.** Excluí-lo faria
`total ÷ meses ≠ média`, e o cartão se contradiria na própria face. Ele entra e
vem **marcado** — `temMesPoucoClassificado` é o que autoriza a tela a dizer.

⚠ **`Math.round` na média, uma vez só.** Centavos são inteiros no projeto
inteiro; deixar fração escapar aqui faria `emReais` receber `12345.6666`.

### `src/features/painel/comparar-meses/cartaoDoAno.test.ts`

| Caso                           | Espera                                                 |
| ------------------------------ | ------------------------------------------------------ |
| linhas vazias                  | `[]`                                                   |
| ano com um mês                 | total = aquele mês, média = o mesmo, `mesesComDado: 1` |
| pote zerado o ano inteiro      | **aparece**, com total 0 — B5 da spec 05               |
| mês pouco classificado no meio | entra no total, e `temMesPoucoClassificado` é `true`   |
| todos confiáveis               | `temMesPoucoClassificado` é `false`                    |
| soma da série                  | **igual** a `totalCentavos`, no centavo                |
| média                          | `Math.round(total / serie.length)`, sem fração         |

---

## Arquivos a modificar

**Nenhum.** É o que torna a fase A conferível: `tsc`, `eslint` e a suíte inteira
passam, e o app fica idêntico ao pixel porque ninguém chama as funções novas
ainda.

---

## Reuso identificado

| O que                               | Onde                            | Uso aqui                          |
| ----------------------------------- | ------------------------------- | --------------------------------- |
| `anoDoMes`                          | `lib/mes.ts`                    | O recorte inteiro se apoia nela   |
| `MesComCobertura`, `MesNoHistorico` | `comparar-meses/comparativo.ts` | Os tipos de entrada, sem duplicar |
| `LinhaDoComparativo`, `ValorNoMes`  | `comparar-meses/comparativo.ts` | A entrada e a série do cartão     |

**Nada de novo em `lib/`.** As duas funções são do comparativo e só dele; a régua
do projeto é que vira arquivo de todo mundo o que **já** é usado por todo mundo,
e nada aqui é.

---

## Caminho feliz

Conta com `2025-11`, `2025-12`, `2026-01`, `2026-02`, mês de referência
`2026-02`, sem `?ano=`.

`anoEscolhido` → `"2026"`. `mesesDoAno` → dois meses. `compararMeses` recebe os
dois e devolve as linhas de janeiro e fevereiro. `cartoesDoAno` soma cada série:
total do ano e média sobre 2.

## Edge cases

| Caso                           | Comportamento                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| Conta sem mês nenhum           | `anosDoHistorico` → `[]`. Quem chama já trata: a tela vazia existe desde a spec 09 |
| Ano com um mês                 | Cartões saem; a média do comparativo se cala. É a C2 quem escreve o aviso          |
| Pote sem gasto no ano          | Cartão com R$ 0,00. **Não some** — num comparativo, pote vazio é o dado            |
| Mês posterior ao de referência | Já fica de fora: `compararMeses` filtra `m.mes <= mesAtual` antes                  |
| Virada de ano                  | Cada ano é um recorte; nada atravessa                                              |

## Erros

Não há caminho de erro nestas duas: são funções puras sobre arrays já lidos, sem
rede, sem banco e sem `await`. Entrada inválida (`?ano=` estranho) **não é erro**
— é o padrão, por decisão da A1.

## Banco de dados

**Nenhuma alteração.** Nenhuma tabela, nenhuma coluna, nenhuma migration,
nenhuma consulta nova. Descoberta 3 da spec.
