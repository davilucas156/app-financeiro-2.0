import "server-only";
import { and, desc, eq, lte } from "drizzle-orm";
import { monthlyIncome } from "@/db/schema";
import { getDb } from "@/lib/db";
import type { RendaDeclarada } from "./rendaDeclarada";

/**
 * Ler e gravar a renda declarada de um mês (tarefa C1).
 *
 * ⚠ `userId` vem de `garantirUsuario()`, nunca de fora
 * (`references/architecture.md`, Thin Client / Fat Server).
 */

export type { RendaDeclarada };

/**
 * A renda que vale para `mes` — a dele, ou a do mês declarado mais recente
 * antes dele.
 *
 * ## Herdar é leitura, não escrita
 *
 * Nenhuma linha é criada aqui. Gravar a herança seria mais fácil de consultar e
 * criaria uma mentira: doze linhas dizendo "informou R$ 1.200 em dezembro"
 * quando ele informou uma vez, em janeiro — e editar janeiro depois não
 * consertaria nenhuma das outras onze.
 *
 * ⚠ **A ordenação alfabética de `YYYY-MM` é a cronológica**, e é por isso que
 * este `order by` sobre texto funciona sem conversão de data. O formato foi
 * escolhido assim na spec 02.
 *
 * ## `null` não é zero
 *
 * "Nunca informou" faz a tela pedir o número e não mostrar meta nenhuma;
 * "informou zero" dá meta zero e faz qualquer gasto estourar. São estados
 * diferentes, e a tela trata os dois de forma diferente.
 */
export async function rendaDoMes(
  userId: string,
  mes: string,
): Promise<RendaDeclarada | null> {
  const [linha] = await getDb()
    .select({
      centavos: monthlyIncome.rendaCentavos,
      mesDeOrigem: monthlyIncome.mesReferencia,
    })
    .from(monthlyIncome)
    .where(
      and(
        eq(monthlyIncome.userId, userId),
        lte(monthlyIncome.mesReferencia, mes),
      ),
    )
    .orderBy(desc(monthlyIncome.mesReferencia))
    .limit(1);

  if (!linha) return null;

  return { ...linha, herdada: linha.mesDeOrigem !== mes };
}

/**
 * Informar a renda de um mês.
 *
 * `on conflict do update` sobre a chave primária: informar duas vezes o mesmo
 * mês **atualiza**. A idempotência mora na chave, não num `if` — duas
 * requisições simultâneas não furam uma restrição de unicidade, e nenhuma
 * checagem em código consegue prometer isso.
 */
export async function declararRenda(
  userId: string,
  mes: string,
  centavos: number,
): Promise<void> {
  await getDb()
    .insert(monthlyIncome)
    .values({ userId, mesReferencia: mes, rendaCentavos: centavos })
    .onConflictDoUpdate({
      target: [monthlyIncome.userId, monthlyIncome.mesReferencia],
      set: { rendaCentavos: centavos, atualizadoEm: new Date() },
    });
}
