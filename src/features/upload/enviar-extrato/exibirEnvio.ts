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
};

/** O que a consulta precisa trazer para montar uma linha da tela. */
export type LinhaDeImportacao = {
  id: string;
  mesReferencia: string;
  origem: "csv_conta" | "csv_cartao";
  nomeArquivo: string;
  lancamentosImportados: number;
  criadoEm: Date;
};

const ROTULO_DE_ORIGEM: Record<LinhaDeImportacao["origem"], string> = {
  csv_conta: "conta",
  csv_cartao: "cartão",
};

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
    rotuloDeOrigem: ROTULO_DE_ORIGEM[linha.origem],
    nomeArquivo: linha.nomeArquivo,
    lancamentos: linha.lancamentosImportados,
    enviadoEm: enviadoEmPtBr(linha.criadoEm),
  };
}
