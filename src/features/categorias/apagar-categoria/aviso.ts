/**
 * O que a tela diz antes de apagar uma categoria (tarefa A3).
 *
 * É a dívida que o `schema.ts` nomeou na C1 virando código:
 *
 * > apagar uma categoria apaga aprendizado em silêncio. O banco garante que
 * > não sobra lixo; **quem deve o aviso é a tela.**
 *
 * Puro e testado, no formato de `avisoDoVoltar` (`revisar-lancamento/
 * desfazer.ts`) e pela mesma razão: o serviço é `server-only`, a confirmação é
 * componente de cliente, e o texto é a única parte disto que tem decisão
 * dentro.
 */

/** O que está pendurado na categoria — contado pela B3, não aqui. */
export type OQueVaiJunto = {
  /** Todos os lançamentos com esta categoria, **inclusive os excluídos**. */
  lancamentos: number;
  /**
   * Quantos daqueles estão fora do cálculo.
   *
   * ⚠ Existe porque "os 12 voltam para a revisão" seria **falso** quando um
   * deles está excluído: sair do cálculo foi decisão sua e não depende de
   * categoria nenhuma. Ele perde a classificação e continua fora.
   *
   * Falso na tela de confirmação de uma operação destrutiva é o pior lugar
   * possível para um número quase certo.
   */
  foraDoCalculo?: number;
  regras: number;
};

export type DestinoDoApagar =
  | {
      tipo: "mover";
      /** O nome da categoria que vai receber, do jeito que aparece na tela. */
      categoria: string;
      /** O destino está em outro pote? */
      outroPote: boolean;
    }
  | { tipo: "revisao" };

export type AvisoDeApagar = {
  /** O que vai acontecer. */
  frase: string;
  /** O que pode surpreender, ou nada. */
  alerta: string | null;
};

/**
 * ## Duas partes, e não um texto só
 *
 * A tela as trata diferente: a frase é o que vai acontecer, o alerta é o que
 * pode surpreender. Concatenar faria o alerta herdar a cor da frase e sumir
 * dentro dela — e alerta que não se destaca não é alerta, é comprimento.
 */
export function avisoDeApagar(
  o: OQueVaiJunto,
  destino: DestinoDoApagar,
): AvisoDeApagar {
  /*
   * ⚠ **Nada dentro não ganha números.**
   *
   * "0 lançamentos e 0 regras" numa frase de susto gasta exatamente a atenção
   * que o aviso de verdade vai precisar no dia em que houver 12 e 2.
   */
  if (o.lancamentos === 0 && o.regras === 0) {
    return {
      frase:
        "Nada está usando esta categoria. Apagar não mexe em lançamento nenhum.",
      alerta: null,
    };
  }

  const frase =
    destino.tipo === "mover"
      ? `${oQueSai(o)} ${paraOndeVao(o, destino.categoria)}`
      : `${oQueSai(o)} ${voltamParaAFila(o)}`;

  return { frase, alerta: alerta(o, destino) };
}

/** "12 lançamentos e 2 regras estão nesta categoria." */
function oQueSai(o: OQueVaiJunto): string {
  const partes: string[] = [];

  if (o.lancamentos > 0) {
    partes.push(contar(o.lancamentos, "lançamento", "lançamentos"));
  }
  if (o.regras > 0) partes.push(contar(o.regras, "regra", "regras"));

  const umaCoisaSo = partes.length === 1 && o.lancamentos + o.regras === 1;

  return `${partes.join(" e ")} ${umaCoisaSo ? "está" : "estão"} nesta categoria.`;
}

function paraOndeVao(o: OQueVaiJunto, categoria: string): string {
  if (o.lancamentos === 0) {
    return `As regras passam a mandar para ${categoria}.`;
  }

  if (o.regras === 0) {
    return `${o.lancamentos === 1 ? "Ele vai" : "Eles vão"} para ${categoria}.`;
  }

  // ⚠ As regras vão junto de propósito. Sem isso, apagar desligaria a
  // classificação em silêncio, e no mês seguinte os mesmos lançamentos
  // voltariam pendentes sem ninguém entender por quê.
  return `Tudo vai para ${categoria} — inclusive as regras, que passam a mandar para lá.`;
}

function voltamParaAFila(o: OQueVaiJunto): string {
  if (o.lancamentos === 0) {
    return apagadas(o.regras);
  }

  const partes = [volta(o)];
  if (o.regras > 0) partes.push(apagadas(o.regras));

  return partes.join(" ");
}

/**
 * ⚠ Os excluídos entram na frase **só quando existem**.
 *
 * Mesma régua do "nada dentro": um "(0 deles estão fora do cálculo)" gastaria a
 * atenção que a ressalva de verdade vai precisar no dia em que houver um.
 */
function volta(o: OQueVaiJunto): string {
  const fora = o.foraDoCalculo ?? 0;
  const voltam = o.lancamentos - fora;

  if (voltam === 0) {
    return o.lancamentos === 1
      ? "Ele está fora do cálculo: perde a categoria e continua fora."
      : "Todos estão fora do cálculo: perdem a categoria e continuam fora.";
  }

  const frase =
    voltam === 1
      ? "1 volta para a revisão, sem categoria."
      : `${voltam} voltam para a revisão, sem categoria.`;

  if (fora === 0) return frase;

  return `${frase} ${
    fora === 1
      ? "O outro está fora do cálculo e continua fora."
      : `Os outros ${fora} estão fora do cálculo e continuam fora.`
  }`;
}

/** Regra sem destino não tem para onde apontar — então some. */
function apagadas(regras: number): string {
  return regras === 1
    ? "A regra é apagada: sem categoria, ela não teria para onde mandar."
    : `As ${regras} regras são apagadas: sem categoria, elas não teriam para onde mandar.`;
}

/**
 * A descoberta 4 entrando por outra porta.
 *
 * A spec proíbe mover a **categoria** com lançamentos dentro, porque isso
 * reescreve o rateio de todos os meses anteriores. Mandar os **lançamentos**
 * para uma categoria de outro pote faz exatamente o mesmo estrago.
 *
 * Não é proibido — é escolha legítima, e às vezes é o certo. Mas é dito.
 *
 * ⚠ **Só quando há lançamento para mover.** Zero lançamentos para outro pote
 * não move dinheiro nenhum, e avisar sobre um estrago que não vai acontecer
 * ensina a ignorar o aviso.
 */
function alerta(o: OQueVaiJunto, destino: DestinoDoApagar): string | null {
  if (destino.tipo !== "mover") return null;
  if (!destino.outroPote) return null;
  if (o.lancamentos === 0) return null;

  return o.lancamentos === 1
    ? "O destino está em outro pote: este lançamento muda de pote em todos os meses em que aparece, e não só neste."
    : "O destino está em outro pote: estes lançamentos mudam de pote em todos os meses em que aparecem, e não só neste.";
}

/** "1 lançamentos" faz a tela parecer descuidada no pior momento possível. */
function contar(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
