import type { NovaRegraSalva } from "@/db/schema";
import { regrasSemente } from "@/features/classificacao/motor/semente";
import { recebeRegrasBase } from "./quemRecebe";

/**
 * Traduz a semente da A5 para linhas de `classification_rules` (tarefa D7).
 *
 * Puro e separado do serviço pelo mesmo motivo de `concluir-onboarding/seed.ts`:
 * a gravação precisa de transação, isto aqui é só formato — e formato que
 * decide quem recebe o quê merece teste.
 *
 * Sem isto, a D1 classifica **zero**: o motor inteiro das fases A a D existe e
 * não tem uma regra para aplicar.
 */

export type DonoDaConta = {
  email: string | null;
  /**
   * O nome do titular, para a regra de transferência para si mesmo.
   *
   * ⚠ Vem do Clerk, e o extrato escreve nome completo em caixa alta. **Pode não
   * bater** — e se não bater, a regra simplesmente não casa e o lançamento vai
   * para a revisão. É a falha certa: nunca classifica errado, no máximo
   * pergunta.
   */
  nome: string | null;
};

export function linhasDeRegras(
  userId: string,
  dono: DonoDaConta,
  idPorChave: Map<string, string>,
): NovaRegraSalva[] {
  if (!recebeRegrasBase(dono.email)) return [];

  return regrasSemente({ idPorChave, nomeDoTitular: dono.nome }).map((r) => ({
    userId,
    tipoRegra: r.criterio.tipo,
    criterio: r.criterio,
    chave: r.chave,
    categoriaId: r.categoriaId,
    prioridade: r.prioridade,
    origem: "seed" as const,
  }));
}
