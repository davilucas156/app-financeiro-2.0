/**
 * Como um banco escreve data e dinheiro (spec 11, tarefas A1 e A2).
 *
 * Até a spec 11 estas duas coisas eram constantes dentro do `lancamentos.ts`:
 * data era `dd/mm/aaaa` e número era pt-BR, porque os dois arquivos medidos —
 * os dois do Inter — escrevem assim. "CSV de vários bancos" sem isto seria ler
 * vários arquivos do mesmo banco.
 *
 * ## Arquivo próprio, e não dentro de `formatos.ts`
 *
 * Porque a tela de mapeamento precisa dos **rótulos**, e `formatos.ts` carrega
 * a tabela inteira dos formatos conhecidos. É o mesmo corte da spec 10: o
 * mecanismo num lugar, os rótulos junto da decisão que eles nomeiam.
 */

export const FORMATOS_DE_DATA = [
  "dd/mm/aaaa",
  "aaaa-mm-dd",
  "dd-mm-aaaa",
  "mm/dd/aaaa",
] as const;

export type FormatoDeData = (typeof FORMATOS_DE_DATA)[number];

/** O que os dois arquivos do Inter usam, e o que o leitor sempre supôs. */
export const FORMATO_DE_DATA_PADRAO: FormatoDeData = "dd/mm/aaaa";

export const FORMATOS_DE_NUMERO = ["pt-BR", "en-US"] as const;

export type FormatoDeNumero = (typeof FORMATOS_DE_NUMERO)[number];

export const FORMATO_DE_NUMERO_PADRAO: FormatoDeNumero = "pt-BR";

/**
 * ⚠ **`mm/dd/aaaa` está na lista sabendo que é armadilha.**
 *
 * `01/02/2026` é 1º de fevereiro ou 2 de janeiro, e **as duas leituras são
 * plausíveis**. Nenhum palpite resolve isso: só o arquivo inteiro resolve, e só
 * quando ele tem algum dia acima de 12.
 *
 * É pior que o erro do sinal de um jeito específico. O sinal errado aparece num
 * total — "R$ 4.812 de entrada" numa fatura salta aos olhos. A data errada
 * **move lançamentos de mês**, e o mês é o eixo do produto inteiro: o painel, o
 * comparativo e a média são todos por mês. Um erro desses não tem sintoma.
 *
 * Daí duas defesas, e nenhuma é uma pergunta melhor:
 *
 * 1. O palpite (`palpite.ts`) **nunca propõe `mm/dd` por preferência** — só
 *    quando ela é a única leitura que serve para o arquivo inteiro.
 * 2. A prévia mostra as datas **já lidas**, para a pessoa desmentir.
 */
export const ROTULOS_DE_DATA: Record<FormatoDeData, string> = {
  "dd/mm/aaaa": "31/12/2026 — dia, mês, ano",
  "aaaa-mm-dd": "2026-12-31 — ano, mês, dia",
  "dd-mm-aaaa": "31-12-2026 — dia, mês, ano, com traço",
  "mm/dd/aaaa": "12/31/2026 — mês, dia, ano (padrão dos EUA)",
};

export const ROTULOS_DE_NUMERO: Record<FormatoDeNumero, string> = {
  "pt-BR": "1.200,50 — vírgula nos centavos",
  "en-US": "1,200.50 — ponto nos centavos",
};
