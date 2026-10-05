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
 * Rótulo curto `"Jun 26"` a partir de `"2026-06"`.
 *
 * ⚠ **Existe para a fileira de abas, que rola de lado.** Lá o rótulo longo
 * custa caro de um jeito específico: `"Junho / 2026"` dá pilulas de ~110px, e
 * num aparelho de 360px caberiam duas e meia — a fileira deixaria de mostrar
 * "cada mês ao lado do outro", que é a razão de ela existir. Com três letras e
 * dois dígitos cabem quatro ou cinco.
 *
 * O ano fica, abreviado, e não sai: a conta atravessa o ano, e `"Jan"` sozinho
 * entre dezembro e fevereiro não diz **qual** janeiro.
 *
 * ⚠ **Não substitui `rotuloDeMes`.** O longo continua onde há espaço e onde o
 * texto é lido com calma — o seletor do upload, o histórico, o topo das telas.
 * Abreviar lá seria economizar onde não aperta.
 */
export function rotuloCurtoDeMes(mes: string): string {
  const [ano, m] = mes.split("-");
  const nome = MESES[Number(m) - 1];

  if (!nome) return mes;

  const tres = `${nome.charAt(0).toUpperCase()}${nome.slice(1, 3)}`;
  return `${tres} ${ano.slice(2)}`;
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
