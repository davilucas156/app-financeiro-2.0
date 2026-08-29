import { POTES_DE_GASTO } from "@/features/onboarding/potes-padrao";

/**
 * O rateio de fábrica, para quem quiser voltar a ele (tarefa D1).
 *
 * ## Lê a semente, e não uma lista escrita à mão
 *
 * A tentação é escrever `{ "custos-fixos": 30, "liberdade-financeira": 25, … }`
 * aqui. Seria correto hoje e falso no primeiro dia em que alguém mexesse no
 * `potes-padrao.ts` — e falso **em silêncio**, porque "voltar ao padrão"
 * continuaria funcionando, só que voltando para um padrão que não é mais o do
 * app.
 *
 * ⚠ **Por slug, e nunca por nome.** A spec 05 tornou o nome do pote editável.
 * Quem renomeou "Transporte" para "Carro" continua com o pote de slug
 * `transporte`, e é ele que tem de receber os 10% de volta.
 *
 * ## Os potes sem meta voltam a **não ter meta**
 *
 * Manutenção e Outros nascem com `percentual: null`, e restaurar devolve
 * `null` a eles — não zero. Quem deu 10% a Manutenção e depois restaurou
 * espera o padrão de volta, e o padrão ali é ausência de meta.
 */

export type MetaDoPadrao = {
  slug: string;
  percentual: number | null;
};

/**
 * Só os potes de gasto: o de renda não tem meta, e escrever `null` nele seria
 * escrever numa linha que a `definirMeta` recusa por princípio.
 */
export const METAS_DO_PADRAO: MetaDoPadrao[] = POTES_DE_GASTO.map((pote) => ({
  slug: pote.slug,
  percentual: pote.percentual,
}));
