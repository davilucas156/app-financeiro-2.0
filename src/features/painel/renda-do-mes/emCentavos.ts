/**
 * O que o Davi digita → centavos inteiros (tarefa D2).
 *
 * ## Por que não é `parseFloat(x) * 100`
 *
 * É o mesmo erro que a spec 02 pegou lendo o extrato: `19.90 * 100` dá
 * `1989.9999999999998`. A leitura do arquivo resolveu isso trabalhando em
 * inteiros, e a digitação merece o mesmo cuidado — um centavo perdido aqui
 * entra na base de **todas** as metas do mês.
 *
 * ## O que aceita
 *
 * O teclado do celular, o hábito brasileiro e o descuido:
 * `1200` · `1.200` · `1200,50` · `R$ 1.200,50` · `1200.50`
 *
 * ⚠ **Ponto e vírgula não são a mesma coisa, e o palpite é explícito.** Em
 * `1.200` o ponto é milhar; em `1200.50` é decimal. A regra: o **último**
 * separador manda, e só é decimal se sobrarem exatamente 1 ou 2 dígitos depois
 * dele. `1.200` vira 1200 reais, não 1 real e 20 centavos.
 */
export function emCentavos(texto: string): number | null {
  // O `R$` só conta no começo. Depois disso, qualquer espaço (inclusive NBSP,
  // que o teclado de alguns celulares digita) sai.
  const limpo = texto.replace(/^\s*R\$\s*/i, "").replace(/[\s ]/g, "");
  if (limpo.length === 0) return null;
  if (!/^\d[\d.,]*$/.test(limpo)) return null;

  const ultimoSeparador = Math.max(
    limpo.lastIndexOf(","),
    limpo.lastIndexOf("."),
  );

  const depois = ultimoSeparador === -1 ? "" : limpo.slice(ultimoSeparador + 1);
  const ehDecimal = depois.length === 1 || depois.length === 2;

  const parteInteira = ehDecimal ? limpo.slice(0, ultimoSeparador) : limpo;

  // Sobrou só separador, ou nada antes do decimal: ",50" não é um valor.
  if (parteInteira.length === 0) return null;
  if (!agrupamentoPlausivel(parteInteira)) return null;

  const inteiro = parteInteira.replace(/[.,]/g, "");

  const centavos = ehDecimal ? depois.padEnd(2, "0") : "00";

  const total = Number(inteiro) * 100 + Number(centavos);

  // Acima de 2^53 o ponto flutuante já perdeu centavos (ou virou Infinity).
  // Melhor recusar do que gravar um valor errado na base das metas.
  return Number.isSafeInteger(total) ? total : null;
}

/** Centavos → o que o campo mostra para edição: `1200,50`. */
export function paraOCampo(centavos: number): string {
  if (!Number.isSafeInteger(centavos) || centavos < 0) return "";

  const reais = Math.floor(centavos / 100);
  const resto = centavos % 100;

  return `${reais},${String(resto).padStart(2, "0")}`;
}

/**
 * A parte inteira só pode estar agrupada em milhar.
 *
 * ⚠ Sem isto, `1,2,3,4` virava R$ 123,40 — o código juntava os pedaços e
 * devolvia um número plausível para uma digitação que não quis dizer nada. Um
 * valor inventado na **base de todas as metas do mês** é o pior lugar possível
 * para "garbage in, garbage out".
 *
 * `1.200` e `1.234.567` passam; `1,2,3,4` e `12.34.56` não.
 *
 * ⚠ Com mais de um grupo, o primeiro não pode ser zero: `0,005` é R$ 0,005
 * (meio centavo), não "zero mil e cinco". Um `0` na frente de decimal legítimo
 * (`0,50`) não cai aqui, porque já foi separado como centavos antes.
 */
function agrupamentoPlausivel(parteInteira: string): boolean {
  const grupos = parteInteira.split(/[.,]/);

  if (grupos.some((g) => !/^\d+$/.test(g))) return false;
  if (grupos.length === 1) return true;
  if (/^0+$/.test(grupos[0])) return false;

  return (
    grupos[0].length >= 1 &&
    grupos[0].length <= 3 &&
    grupos.slice(1).every((g) => g.length === 3)
  );
}
