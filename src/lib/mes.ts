/**
 * O mês de referência (`"2026-06"`) virando texto para ler.
 *
 * ## Por que saiu de dentro do `SeletorDeMes.tsx`
 *
 * `rotuloDeMes` nasceu no seletor do upload e já era importado por quatro
 * telas — três delas fora do upload. O comparativo da spec 06 seria o quinto
 * consumidor e o primeiro **puro**: um `.ts` testado pelo Vitest passando a
 * depender de um componente de cliente para escrever "maio".
 *
 * Quinta vez pedindo, mesma decisão de sempre neste projeto: o que é usado por
 * todo mundo vira arquivo de todo mundo.
 *
 * ⚠ **Sem `Intl.DateTimeFormat`**, pelo mesmo motivo de `lib/dinheiro.ts`: o
 * resultado dependeria dos dados de locale do runtime, e o servidor da Vercel e
 * o celular do Davi não têm por que concordar.
 */

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Rótulo "Junho / 2026" a partir de "2026-06". */
export function rotuloDeMes(mes: string): string {
  const [ano, m] = mes.split("-");
  const nome = MESES[Number(m) - 1] ?? m;
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} / ${ano}`;
}

/**
 * O mês no meio de uma frase: `"maio"`, ou `"maio de 2025"` quando o ano é
 * outro.
 *
 * O ano só aparece quando muda porque, dentro de uma frase, "maio de 2026" lido
 * em junho de 2026 é ruído. Quando o ano **é** outro, escondê-lo faria o
 * comparativo dizer "comparado com dezembro" sobre um dezembro de doze meses
 * atrás.
 */
export function nomeDoMes(mes: string, anoDeReferencia?: string): string {
  const [ano, m] = mes.split("-");
  const nome = MESES[Number(m) - 1] ?? mes;

  return anoDeReferencia !== undefined && ano !== anoDeReferencia
    ? `${nome} de ${ano}`
    : nome;
}

/** `"2026-06"` → `"2026"`. Sem `Date`: é recorte de texto, não conta de tempo. */
export function anoDoMes(mes: string): string {
  return mes.split("-")[0];
}

/**
 * O mês de hoje, em `YYYY-MM`.
 *
 * ⚠ **UTC, e não hora local**, como todo o resto deste arquivo: o mês é um
 * rótulo, não um instante, e ler o fuso do aparelho faria a virada do mês
 * acontecer em hora diferente para cada pessoa.
 */
export function mesAtual(hoje = new Date()): string {
  const mes = String(hoje.getUTCMonth() + 1).padStart(2, "0");

  return `${hoje.getUTCFullYear()}-${mes}`;
}
