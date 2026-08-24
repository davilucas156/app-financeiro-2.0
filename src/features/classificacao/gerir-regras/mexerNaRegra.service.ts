import "server-only";
import { and, eq } from "drizzle-orm";
import { categories, classificationRules } from "@/db/schema";
import { getDb } from "@/lib/db";
import { ehUnicidadeViolada } from "@/lib/erroDoPostgres";
import { chaveDoCriterio } from "@/features/classificacao/motor/chaveDaRegra";
import { regraValida } from "@/features/classificacao/motor/regras";
import { comTextoNovo } from "./regrasNaTela";

/**
 * Editar e apagar regra (tarefa D9).
 *
 * ## Mexer não reescreve o passado
 *
 * Nenhuma das duas operações toca em `transactions`. A regra passa a valer
 * daqui para frente; o que ela já classificou fica como está — mesma régua da
 * D6: desfazer uma classificação não desfaz o aprendizado, e desfazer o
 * aprendizado não desfaz as classificações.
 *
 * Apagar deixa `transactions.regra_id` nulo pelo `set null`, e a `regra_chave`
 * **congelada** continua respondendo "esta caiu em Transporte porque uma regra
 * procurava por PETROBRAS". Foi para este dia que a C3 guardou duas colunas.
 *
 * ⚠ **Todo id vem do cliente.** O da regra e o da categoria entram no `where`
 * junto com o `user_id`, nunca sozinhos — mesma regra da D4.
 */

export type ResultadoDeMexer = { ok: true } | { ok: false; erro: string };

const NAO_ENCONTRADA =
  "Essa regra não existe mais. Recarregue a tela.";

/**
 * A mensagem que o schema da C1 já tinha escrito para este dia.
 *
 * Duas regras com o mesmo texto e destinos diferentes seriam um empate
 * impossível de explicar — a colisão é o comportamento certo, e o trabalho da
 * tela é traduzi-la.
 */
const TEXTO_REPETIDO =
  "Já existe uma regra procurando por esse texto. Apague uma das duas ou use um texto diferente.";

export async function editarRegra(
  userId: string,
  dados: { id: string; categoriaId: string; texto?: string },
): Promise<ResultadoDeMexer> {
  const db = getDb();

  const [regra] = await db
    .select({
      id: classificationRules.id,
      criterio: classificationRules.criterio,
    })
    .from(classificationRules)
    .where(
      and(
        eq(classificationRules.id, dados.id),
        eq(classificationRules.userId, userId),
      ),
    )
    .limit(1);

  if (!regra) return { ok: false, erro: NAO_ENCONTRADA };

  // A categoria também vem do cliente, e o `where` da regra não protege o
  // destino dela — mesma conferência da D4.
  const [categoria] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        eq(categories.id, dados.categoriaId),
        eq(categories.userId, userId),
      ),
    )
    .limit(1);

  if (!categoria) return { ok: false, erro: NAO_ENCONTRADA };

  const criterio =
    dados.texto === undefined
      ? regra.criterio
      : comTextoNovo(regra.criterio, dados.texto);

  if (!criterio) {
    return {
      ok: false,
      erro: "Escreva o texto que a regra deve procurar.",
    };
  }

  // Regra que nunca casa é pior do que regra ausente: some sem avisar. A A1 já
  // tem a validação; usá-la aqui evita uma segunda definição de "válida".
  if (!regraValida(criterio)) {
    return {
      ok: false,
      erro: "Esse texto não serve como regra — sobrou vazio depois de limpo.",
    };
  }

  try {
    await db
      .update(classificationRules)
      .set({
        criterio,
        tipoRegra: criterio.tipo,
        chave: chaveDoCriterio(criterio),
        categoriaId: dados.categoriaId,
        /*
         * Editar torna a regra sua — como na D5, e pelo mesmo motivo: a coluna
         * responde "de onde saiu essa regra?", e depois que você mexeu a
         * resposta deixou de ser "veio pronta". De quebra, o reseed da D7
         * (`do nothing`) nunca a desfaz.
         *
         * ⚠ A **prioridade não muda**. Ela é outro eixo — desempate entre
         * regras que casam ao mesmo tempo — e mexer nela em silêncio mudaria
         * qual regra vence em casos que não têm nada a ver com esta edição.
         */
        origem: "correcao",
        atualizadoEm: new Date(),
      })
      .where(
        and(
          eq(classificationRules.id, dados.id),
          eq(classificationRules.userId, userId),
        ),
      );

    return { ok: true };
  } catch (erro) {
    /*
     * ⚠ **Um único só nesta tabela**, então o código do erro já diz qual foi.
     * `categories` tem dois e precisa saber qual — é por isso que
     * `erroDoPostgres.ts` também exporta `restricaoViolada`.
     */
    if (ehUnicidadeViolada(erro)) return { ok: false, erro: TEXTO_REPETIDO };
    throw erro;
  }
}

export async function apagarRegra(
  userId: string,
  id: string,
): Promise<ResultadoDeMexer> {
  const [apagada] = await getDb()
    .delete(classificationRules)
    .where(
      and(
        eq(classificationRules.id, id),
        eq(classificationRules.userId, userId),
      ),
    )
    .returning({ id: classificationRules.id });

  return apagada ? { ok: true } : { ok: false, erro: NAO_ENCONTRADA };
}

