import "server-only";
import { and, eq, isNotNull, isNull, ne, or, type SQL } from "drizzle-orm";
import { transactions } from "@/db/schema";

/**
 * Quem está na fila de `/revisao` — a definição, num lugar só (tarefa D8).
 *
 * ## Por que isto virou arquivo
 *
 * Estava escrito uma vez, dentro do `where` de `listarPendentes`. A D8 precisa
 * do mesmo critério no painel, para dizer "N para decidir" e levar até lá.
 *
 * Copiar garantiria que um dia os dois divergem — e a divergência aqui tem
 * nome: o painel diz 17, a tela abre com 23. É exatamente a mentira por omissão
 * que a D2 acabou de consertar no resumo do upload.
 *
 * Terceira vez nesta spec que uma regra escrita duas vezes vira arquivo
 * (`criterioDaCorrecao.ts` na D5, `chaveDaRegra.ts` na D7), e sempre pelo mesmo
 * motivo: as duas cópias não divergem hoje, divergem no dia em que alguém
 * ajustar uma delas.
 *
 * ## Dois tipos de pendência, e os dois pedem decisão
 *
 * - **sem categoria** — nenhuma regra bateu, você escolhe;
 * - **`revisao_pendente`** — par que se anula (spec 02) ou valor alto que uma
 *   regra classificou (D1), e você confirma.
 *
 * O excluído fica de fora com cláusula própria porque ele **também** tem
 * categoria nula: sem ela, pagamento de fatura entraria na fila, e ele não pede
 * decisão nenhuma — é justamente o que a spec 02 já resolveu.
 */
export function naFilaDeRevisao(): SQL {
  return and(
    or(
      isNull(transactions.categoriaId),
      eq(transactions.status, "revisao_pendente"),
    ),
    ne(transactions.status, "excluido"),
  )!;
}

/**
 * O contrário exato: já tem categoria e não foi excluído.
 *
 * ⚠ **Não é o complemento de `naFilaDeRevisao`.** O lançamento de valor alto
 * está classificado **e** na fila — ele conta nos dois. A sobreposição é real,
 * é a mesma que a D2 documentou em `paraDecidir`, e escolher um dos dois lados
 * esconderia metade do fato.
 */
export function jaClassificado(): SQL {
  return and(
    ne(transactions.status, "excluido"),
    isNotNull(transactions.categoriaId),
  )!;
}
