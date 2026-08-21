/**
 * A meta do pote, a barra e o estouro (tarefa A3).
 *
 * ## A meta é percentual sobre a renda **declarada**
 *
 * Decisão do Davi na spec: *"a meta do pote é porcentagem em cima do que foi
 * definido como renda mensal"*. O peso está em **definido**.
 *
 * A medição da spec mostrou por quê: o motor classifica 63% do dinheiro que sai
 * e só **10%** do que entra. Uma meta calculada sobre a renda *medida* seria
 * 30% de 10% da verdade — e sairia errada com aparência de certa.
 *
 * ⚠ **`buckets.valor_meta_centavos` não é lido aqui.** A meta passa a ser
 * calculada; a coluna fica para o dia em que alguém quiser uma meta fixa que
 * sobreponha o percentual.
 *
 * ## Quatro estados que a tela precisa distinguir sem ler o número
 *
 * Um `if` solto na tela erraria pelo menos um deles, e o erro seria mudo.
 */

export type MetaDoPote = {
  /** `null` quando o pote não tem percentual, ou a renda não foi declarada. */
  metaCentavos: number | null;
  /**
   * A fração da barra, de 0 para cima. Passa de 1 quando estourou.
   *
   * `null` sem meta — e a tela **não** desenha barra nesse caso.
   * `potes-padrao.ts` é explícito: nunca mostrar "0%".
   */
  fracao: number | null;
  estourou: boolean;
  /** Reembolso maior que o gasto. A barra vai a zero; o número mostra o negativo. */
  negativo: boolean;
  /** Nenhum lançamento caiu aqui — diferente de "não foi classificado" (A2). */
  vazio: boolean;
};

export function metaDoPote(pote: {
  /** `buckets.percentual_meta` — nulo em Manutenção e Outros/Repasses. */
  percentual: number | null;
  /** A renda declarada do mês. Nula enquanto o Davi não informar. */
  rendaDeclaradaCentavos: number | null;
  /** `SomaDoPote.totalCentavos`, já orientado pelo tipo do pote. */
  totalCentavos: number;
  lancamentos: number;
}): MetaDoPote {
  const base = {
    negativo: pote.totalCentavos < 0,
    vazio: pote.lancamentos === 0,
  };

  if (pote.percentual === null || pote.rendaDeclaradaCentavos === null) {
    return { ...base, metaCentavos: null, fracao: null, estourou: false };
  }

  /*
   * Centavos inteiros, como tudo neste projeto.
   *
   * A soma das metas pode ficar alguns centavos longe da renda por causa do
   * arredondamento, e isso não incomoda ninguém: **não existe "% do gasto"
   * nesta tela**. Cada pote se mede contra a própria meta, e nenhum número
   * soma os potes entre si — foi a decisão de desenho da Etapa 2 que tirou
   * essa pergunta do caminho.
   */
  const metaCentavos = Math.round(
    (pote.rendaDeclaradaCentavos * pote.percentual) / 100,
  );

  if (metaCentavos <= 0) {
    // Renda declarada zerada. Sem meta com que comparar, mas gasto é gasto:
    // qualquer coisa acima de zero estourou uma meta de zero.
    return {
      ...base,
      metaCentavos,
      fracao: null,
      estourou: pote.totalCentavos > 0,
    };
  }

  return {
    ...base,
    metaCentavos,
    // Negativo vira barra vazia. Uma barra que anda para trás não existe, e
    // desenhar zero aqui não esconde nada: o número ao lado mostra o negativo.
    fracao: Math.max(0, pote.totalCentavos / metaCentavos),
    estourou: pote.totalCentavos > metaCentavos,
  };
}
