import type { Direcao } from "@/features/upload/ler-arquivo/lancamentos";

/**
 * O que a tela do painel precisa saber de um pote (tarefas B2 e B3).
 *
 * Puro, e num `.ts` de propósito: os componentes são `.tsx` e o Vitest só olha
 * `.ts`. A decisão que vale teste é `estadoDoPote` — os quatro estados que a
 * tela precisa distinguir **sem ler o número**.
 */

export type CategoriaNoPainel = {
  id: string;
  nome: string;
  emoji: string;
  totalCentavos: number;
  lancamentos: number;
};

export type LancamentoNoPainel = {
  id: string;
  data: string;
  descricao: string;
  valorCentavos: number;
  direcao: Direcao;
  categoriaId: string;
  categoriaNome: string;
  categoriaEmoji: string;
  /**
   * A frase que responde "por que isso caiu aqui?" (C3).
   *
   * Seis meses depois, a resposta tem de estar na tela — e não num `join` que
   * ninguém vai escrever.
   */
  procedencia: string;
  /**
   * A classificação veio de uma regra? (D4 da spec 04)
   *
   * A procedência acima é frase para ler; esta é o sinal para decidir. Trocar
   * a categoria de um lançamento que veio de regra precisa avisar que **a
   * regra continua valendo** — e "a frase começa com 'uma regra'" seria uma
   * condição de tela apoiada em texto.
   */
  veioDeRegra: boolean;
  /** Par de valor idêntico dentro do pote (A4). */
  conferir: boolean;
};

export type PoteNoPainel = {
  id: string;
  slug: string;
  nome: string;
  emoji: string;
  /** Hex ou `var(--color-…)`, direto do banco — nunca token do Tailwind. */
  cor: string;
  tipo: "gasto" | "renda";
  percentual: number | null;
  /** "eventual", "sem meta" — o texto que `potes-padrao.ts` guarda. */
  observacao: string | null;
  totalCentavos: number;
  lancamentos: number;
  categorias: CategoriaNoPainel[];
  lista: LancamentoNoPainel[];
};

/**
 * Os quatro estados, mais o normal.
 *
 * ⚠ **Vazio, zerado e negativo mostrariam "R$ 0,00" numa tela descuidada**, e
 * significam coisas diferentes:
 *
 * | | O que aconteceu |
 * |---|---|
 * | `vazio` | Nada caiu aqui |
 * | `negativo` | Reembolso maior que o gasto |
 * | `normal` com zero | Entrou e saiu o mesmo — os dois lançamentos estão na lista |
 *
 * A ordem das perguntas importa: **vazio vem antes de tudo**, porque um pote
 * sem lançamento nenhum não estourou coisa alguma, e "sem meta" vem antes de
 * comparar com a meta que não existe.
 */
export type EstadoDoPote =
  | "vazio"
  | "sem-meta"
  | "negativo"
  | "estourado"
  | "normal";

export function estadoDoPote(
  pote: Pick<PoteNoPainel, "percentual" | "totalCentavos" | "lancamentos">,
  metaCentavos: number | null,
): EstadoDoPote {
  if (pote.lancamentos === 0) return "vazio";
  if (pote.totalCentavos < 0) return "negativo";
  if (pote.percentual === null || metaCentavos === null) return "sem-meta";
  if (pote.totalCentavos > metaCentavos) return "estourado";

  return "normal";
}

/**
 * A linha embaixo da barra, em uma frase.
 *
 * `potes-padrao.ts` é explícito e a regra vale aqui: **nunca mostrar "0%"** num
 * pote que não tem meta. Sem meta não há percentual nenhum a mostrar — há uma
 * observação ("eventual", "sem meta"), que é outra coisa.
 */
export function legendaDoPote(
  estado: EstadoDoPote,
  pote: Pick<PoteNoPainel, "observacao" | "tipo">,
  fracao: number | null,
): string {
  switch (estado) {
    case "vazio":
      return "nada caiu aqui este mês";
    case "sem-meta":
      return pote.observacao ?? "sem meta";
    case "negativo":
      return "devolveram mais do que saiu";
    default:
      return fracao === null
        ? (pote.observacao ?? "sem meta")
        : `${Math.round(fracao * 100)}% da meta`;
  }
}
