import "server-only";
import { and, eq } from "drizzle-orm";
import { transactions } from "@/db/schema";
import { getDb } from "@/lib/db";

/**
 * Desfaz um repasse anulado e devolve os dois lados para a fila de revisão.
 *
 * ## Por que isto não é opcional
 *
 * O par que se anula passou a sair da conta **sozinho**, por decisão do Davi,
 * sabendo do risco que o código já documentava: receber e devolver R$ 60 é
 * anulação, mas receber salário e pagar aluguel do mesmo valor na mesma semana
 * não é, e o app não sabe distinguir.
 *
 * Sem este caminho de volta, um par falso apagaria renda real do mês sem
 * recurso nenhum — o lançamento sumiria do painel, não entraria na `/revisao`
 * (`naFilaDeRevisao` exclui `excluido`) e não haveria tela em lugar nenhum do
 * app onde tocá-lo. Automatizar a remoção sem automatizar o arrependimento
 * seria trocar um número errado por dinheiro desaparecido, que é pior.
 *
 * ## Volta para `revisao_pendente`, e não para `importado`
 *
 * O lançamento nunca teve categoria — ele foi excluído antes do motor rodar.
 * Devolvê-lo como `importado` sem categoria o deixaria invisível de outro
 * jeito: fora da fila de revisão e fora de todo pote. `revisao_pendente` põe
 * ele na `/revisao`, que é onde um lançamento sem destino pertence.
 */

export type ResultadoDeTrazerDeVolta =
  { ok: true; quantos: number } | { ok: false; erro: string };

/** A mesma frase para "não existe" e "não é seu" — ver a D5 da spec 02. */
const NAO_ENCONTRADO =
  "Esse lançamento não está mais fora da conta. Recarregue a tela.";

const MOTIVO =
  "você desfez a anulação — escolha onde ele entra, ou tire de novo do cálculo";

export async function trazerDeVolta(
  userId: string,
  lancamentoId: string,
): Promise<ResultadoDeTrazerDeVolta> {
  const db = getDb();

  return db.transaction(async (tx) => {
    /*
     * ⚠ `user_id` no `where` junto com o id, nunca o id sozinho: ele vem do
     * cliente (`references/architecture.md`, Thin Client / Fat Server).
     */
    const [alvo] = await tx
      .select({
        id: transactions.id,
        status: transactions.status,
        impressao: transactions.impressao,
        parDe: transactions.parDe,
      })
      .from(transactions)
      .where(
        and(eq(transactions.id, lancamentoId), eq(transactions.userId, userId)),
      )
      .for("update")
      .limit(1);

    if (!alvo || alvo.status !== "excluido") {
      return { ok: false as const, erro: NAO_ENCONTRADO };
    }

    /*
     * ⚠ **Só o par anulado volta.** Um `excluido` sem `parDe` é passagem
     * reconhecida — pagamento de fatura —, e trazê-lo de volta faria o gasto
     * do cartão sair duas vezes, que é exatamente o que a spec 02 resolveu. A
     * tela não oferece o botão ali; aqui é a mesma decisão, do outro lado.
     */
    if (alvo.parDe === null) {
      return {
        ok: false as const,
        erro: "Esse lançamento é pagamento de fatura, não um repasse anulado. Trazê-lo de volta contaria o mesmo gasto duas vezes.",
      };
    }

    const volta = {
      status: "revisao_pendente" as const,
      motivo: MOTIVO,
      // O par deixou de existir: sem isto, a tela de anulados continuaria
      // agrupando os dois e o `trazer de volta` teria o que desfazer de novo.
      parDe: null,
    };

    await tx
      .update(transactions)
      .set(volta)
      .where(
        and(eq(transactions.id, alvo.id), eq(transactions.userId, userId)),
      );

    /*
     * O outro lado, quando ele existe nesta conta.
     *
     * Pode não existir: no par que atravessa o envio só o lado novo recebe
     * `parDe`, e o antigo nunca foi marcado. Aí volta um só — que é o certo,
     * porque o outro nunca saiu da conta.
     *
     * A condição de `status` no `where` evita reabrir um pagamento de fatura
     * que por acaso tivesse a impressão apontada.
     */
    const outroLado = await tx
      .update(transactions)
      .set(volta)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.impressao, alvo.parDe),
          eq(transactions.status, "excluido"),
          eq(transactions.parDe, alvo.impressao),
        ),
      )
      .returning({ id: transactions.id });

    return { ok: true as const, quantos: 1 + outroLado.length };
  });
}
