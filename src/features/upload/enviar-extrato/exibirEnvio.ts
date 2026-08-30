import type { LinhaIgnorada } from "@/features/upload/ler-arquivo/lancamentos";

/**
 * Linha da tabela `imports` → o que aparece na lista "Já importados" (D4).
 *
 * Puro de propósito: sem `server-only`, sem banco, sem sessão. É a parte da
 * D4 que dá para provar, e o Vitest só alcança módulos assim — quem tem
 * `import "server-only"` não carrega fora do Next.
 */

export type EnvioExibido = {
  id: string;
  mes: string;
  rotuloDeOrigem: string;
  nomeArquivo: string;
  lancamentos: number;
  enviadoEm: string;
  /**
   * As linhas que ficaram de fora, com o **motivo** de cada uma.
   *
   * Vem inteiro, e não como contagem: "3 ignoradas" meses depois não permite
   * fazer nada a respeito.
   */
  ignoradas: LinhaIgnorada[];
};

/** O que a consulta precisa trazer para montar uma linha da tela. */
export type LinhaDeImportacao = {
  id: string;
  mesReferencia: string;
  origem: "csv_conta" | "csv_cartao";
  nomeArquivo: string;
  lancamentosImportados: number;
  ignoradas: LinhaIgnorada[];
  criadoEm: Date;
};

const ROTULO_DE_ORIGEM: Record<LinhaDeImportacao["origem"], string> = {
  csv_conta: "conta",
  csv_cartao: "cartão",
};

/**
 * Exportada porque a confirmação de "remover o mês" (spec 14) também nomeia
 * envios.
 *
 * ⚠ Escrever "conta"/"cartão" de novo lá seria a **segunda tradução da mesma
 * coluna**: no dia em que uma delas mudasse, duas telas passariam a chamar a
 * mesma coisa por nomes diferentes, sem nenhuma das duas estar errada.
 */
export function rotuloDeOrigem(origem: LinhaDeImportacao["origem"]): string {
  return ROTULO_DE_ORIGEM[origem];
}

/**
 * O fuso é fixado, não herdado.
 *
 * A coluna é `timestamptz`, então o instante está certo no banco — mas a
 * Vercel roda em **UTC**, e um `Intl` sem `timeZone` usa o fuso do processo.
 * Um envio das 21h de 18/08 sairia como "19/08 às 00h": data errada para quem
 * enviou, no dia seguinte ao que aconteceu.
 */
const FUSO = "America/Sao_Paulo";

const FORMATO = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  hour12: false,
});

/** "18/08 às 21h" — o formato que a B3 aprovou. */
export function enviadoEmPtBr(instante: Date): string {
  const partes = new Map(
    FORMATO.formatToParts(instante).map((p) => [p.type, p.value]),
  );

  const dia = partes.get("day") ?? "--";
  const mes = partes.get("month") ?? "--";
  // `hour12: false` ainda devolve "24" à meia-noite em alguns runtimes.
  const hora = (partes.get("hour") ?? "--").replace(/^24$/, "00");

  return `${dia}/${mes} às ${hora}h`;
}

export function paraEnvioExibido(linha: LinhaDeImportacao): EnvioExibido {
  return {
    id: linha.id,
    mes: linha.mesReferencia,
    rotuloDeOrigem: rotuloDeOrigem(linha.origem),
    nomeArquivo: linha.nomeArquivo,
    lancamentos: linha.lancamentosImportados,
    ignoradas: linha.ignoradas,
    enviadoEm: enviadoEmPtBr(linha.criadoEm),
  };
}
