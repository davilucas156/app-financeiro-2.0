import type { PoteNoPainel } from "@/features/painel/painel-do-mes/poteNoPainel";

/**
 * O que o comparativo precisa saber de um pote: quem é e como se desenha.
 *
 * Derivado do `PoteNoPainel`, e não copiado à mão: o `historicoDosMeses` traz
 * id e total, e é daqui que vêm nome, emoji e cor. Um campo renomeado lá quebra
 * a compilação aqui, em vez de sumir da tela.
 */
export type PoteDoComparativo = Pick<
  PoteNoPainel,
  "id" | "nome" | "emoji" | "cor"
>;
