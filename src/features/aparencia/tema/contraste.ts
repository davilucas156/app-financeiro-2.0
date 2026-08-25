/**
 * A régua de contraste (tarefa A1 da spec 08).
 *
 * ## Por que isto é um arquivo, e não uma conta dentro do teste
 *
 * A A3 escurece a cor do pote até ela aparecer num fundo claro. Sem uma régua,
 * "escureci o bastante" é opinião — e a descoberta 2 mostrou o tamanho do erro
 * que a opinião comete aqui: `#00e5a0` parece uma cor forte, e sobre branco dá
 * **1.65** de contraste. Ela some.
 *
 * A fórmula é a do WCAG 2.1: luminância relativa dos dois lados, mais claro
 * sobre mais escuro, com o `0.05` que evita divisão por zero no preto puro.
 *
 * ⚠ **O teste fixa valores conhecidos antes de qualquer cor do projeto passar
 * por aqui** — preto contra branco tem de dar exatamente 21, e uma cor contra
 * ela mesma exatamente 1. Uma régua torta aprovaria a paleta errada com números
 * convincentes, e ninguém desconfiaria de um "3.2" plausível.
 */

export type Rgb = readonly [number, number, number];

/** Branco puro: o fundo mais claro possível, e por isso o caso mais difícil. */
export const BRANCO: Rgb = [255, 255, 255];

/**
 * `#rgb` ou `#rrggbb`, com ou sem `#`, em qualquer caixa.
 *
 * ⚠ **Devolve `null` em vez de lançar.** A cor do pote vem de `buckets.cor`,
 * que é `text` no Postgres: nada no banco garante que ali tem um hex. Uma
 * exceção aqui derrubaria o painel inteiro por causa de uma barra colorida.
 */
export function emRgb(cor: string): Rgb | null {
  const limpo = cor.trim().replace(/^#/, "");

  if (/^[0-9a-f]{3}$/i.test(limpo)) {
    const [r, g, b] = limpo.split("");
    return [
      Number.parseInt(r + r, 16),
      Number.parseInt(g + g, 16),
      Number.parseInt(b + b, 16),
    ];
  }

  if (/^[0-9a-f]{6}$/i.test(limpo)) {
    return [
      Number.parseInt(limpo.slice(0, 2), 16),
      Number.parseInt(limpo.slice(2, 4), 16),
      Number.parseInt(limpo.slice(4, 6), 16),
    ];
  }

  return null;
}

/** Luminância relativa, no espaço linear — não é o brilho do HSL. */
export function luminancia([r, g, b]: Rgb): number {
  const canal = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/**
 * A razão de contraste entre duas cores. De 1 (iguais) a 21 (preto e branco).
 *
 * As duas réguas que esta spec usa:
 * - **4.5** é o mínimo para texto;
 * - **3** é o mínimo para uma forma preenchida — uma barra, uma faixa — ser
 *   percebida como elemento contra o que está em volta.
 */
export function contraste(a: Rgb, b: Rgb): number {
  const la = luminancia(a);
  const lb = luminancia(b);

  const [claro, escuro] = la > lb ? [la, lb] : [lb, la];

  return (claro + 0.05) / (escuro + 0.05);
}
