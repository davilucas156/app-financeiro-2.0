import "server-only";
import { and, eq } from "drizzle-orm";
import { buckets } from "@/db/schema";
import { getDb } from "@/lib/db";
import { lerPercentual } from "./percentual";

/**
 * Gravar o percentual de meta de um pote (tarefa B2).
 *
 * ## A recusa é cláusula, não `if`
 *
 * Três condições têm de valer para a escrita acontecer: o pote **existe**, é
 * **seu**, e é de **gasto**. O caminho óbvio seria ler o pote, conferir as
 * três e então gravar — duas idas ao banco, com uma janela entre elas.
 *
 * Aqui elas são a mesma frase dita ao banco uma vez só:
 *
 * ```sql
 * update buckets set percentual_meta = ?
 *  where id = ? and user_id = ? and tipo = 'gasto'
 * ```
 *
 * Nenhuma delas pode ser esquecida num `if` que alguém remova depois, e não há
 * instante entre conferir e gravar.
 *
 * ⚠ **O preço é que a falha fica muda.** Zero linhas não diz *qual* das três
 * condições falhou, e elas precisam de frases diferentes. Daí a consulta de
 * desempate — que só roda **quando algo deu errado**, e por isso não custa nada
 * ao caminho normal.
 *
 * ⚠ `userId` vem de `garantirUsuario()`, nunca de fora
 * (`references/architecture.md`, Thin Client / Fat Server).
 */

export type ResultadoDaMeta = { ok: true } | { ok: false; erro: string };

/** A mesma frase para "não existe" e "não é seu" — a régua da D5 da spec 02. */
const NAO_ENCONTRADO = "Esse pote não existe mais. Recarregue a tela.";

const POTE_DE_RENDA =
  "O pote de renda não tem meta — ele é o que entra, não o que se reparte.";

export async function definirMeta(
  userId: string,
  poteId: string,
  texto: string,
): Promise<ResultadoDaMeta> {
  /*
   * Antes de tocar no banco: recusa do usuário não merece uma ida ao Postgres.
   *
   * É a **mesma** função que o campo chamou no cliente — compartilhar o
   * mecanismo, não a decisão. O cliente valida para responder rápido; aqui
   * valida porque é quem grava.
   */
  const lido = lerPercentual(texto);
  if (!lido.ok) return { ok: false, erro: lido.mensagem };

  if (!poteId) return { ok: false, erro: NAO_ENCONTRADO };

  const db = getDb();

  const atualizados = await db
    .update(buckets)
    .set({ percentualMeta: lido.percentual })
    .where(
      and(
        eq(buckets.id, poteId),
        eq(buckets.userId, userId),
        // A regra da spec, em SQL: os potes de gasto repartem o que sai, e
        // entrada não se reparte.
        eq(buckets.tipo, "gasto"),
      ),
    )
    .returning({ id: buckets.id });

  if (atualizados.length > 0) return { ok: true };

  return { ok: false, erro: await porQueFalhou(userId, poteId) };
}

/**
 * Só no caminho de falha: descobrir o que dizer.
 *
 * ⚠ Repara que o `where` aqui **também** carrega o `userId`. Consultar só por
 * `id` diria, pela frase escolhida, que o pote existe — para quem não é dono
 * dele. A frase é a mesma de "não existe" justamente para não contar isso.
 */
async function porQueFalhou(userId: string, poteId: string): Promise<string> {
  const [pote] = await getDb()
    .select({ tipo: buckets.tipo })
    .from(buckets)
    .where(and(eq(buckets.id, poteId), eq(buckets.userId, userId)))
    .limit(1);

  if (!pote) return NAO_ENCONTRADO;

  return pote.tipo === "renda" ? POTE_DE_RENDA : NAO_ENCONTRADO;
}
