import "server-only";
import { desc, eq } from "drizzle-orm";
import { imports } from "@/db/schema";
import {
  paraEnvioExibido,
  type EnvioExibido,
} from "@/features/upload/enviar-extrato/exibirEnvio";
import { getDb } from "@/lib/db";

/**
 * A lista "Já importados" (tarefa D4).
 *
 * ⚠ **Não recebe `userId` de fora.** Quem chama é a página, e o id sai de
 * `garantirUsuario()`. Uma função que aceitasse qualquer id seria uma forma de
 * ler o histórico de outra pessoa, protegida apenas por ninguém chamar errado
 * (`references/architecture.md`, Thin Client / Fat Server) — a mesma decisão
 * que manteve `resolverUsuario` privado na spec 01.
 */

/**
 * 18 meses × 2 arquivos = 36. O teto existe para a consulta não crescer sem
 * fim, não porque 60 seja um número especial.
 */
const TETO = 60;

export async function listarImportacoes(
  userId: string,
): Promise<EnvioExibido[]> {
  const linhas = await getDb()
    .select({
      id: imports.id,
      mesReferencia: imports.mesReferencia,
      origem: imports.origem,
      nomeArquivo: imports.nomeArquivo,
      lancamentosImportados: imports.lancamentosImportados,
      criadoEm: imports.criadoEm,
    })
    .from(imports)
    .where(eq(imports.userId, userId))
    .orderBy(
      desc(imports.mesReferencia),
      desc(imports.criadoEm),
      // Os dois arquivos de um envio nascem na **mesma transação**, e `now()`
      // no Postgres é o instante em que ela começou: os carimbos saem
      // idênticos. Sem este terceiro critério a ordem entre conta e cartão
      // seria a que o planner quisesse, e a lista trocaria de ordem sozinha
      // entre dois carregamentos. `desc` põe `csv_conta` antes de
      // `csv_cartao` — a ordem dos campos no formulário.
      desc(imports.origem),
    )
    .limit(TETO);

  return linhas.map(paraEnvioExibido);
}
