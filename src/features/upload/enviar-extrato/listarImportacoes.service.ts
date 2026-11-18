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
 * ⚠ **O isolamento é por convenção, não por assinatura.** A função recebe
 * `userId` e o usa no `where`, mas nada impede outro chamador de passar outro
 * id. Hoje o único chamador é a página, que passa o `usuario.id` vindo de
 * `garantirUsuario()`, e é isso que mantém o histórico de cada pessoa separado
 * (`references/architecture.md`, Thin Client / Fat Server).
 */

/**
 * A janela do seletor (`JANELA_DE_MESES`, em `mesesDisponiveis.ts`) × 2
 * arquivos = 36 envios num uso normal; 60 deixa folga sobre isso. O teto existe
 * para a consulta não crescer sem fim, não porque 60 seja um número especial.
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
      ignoradas: imports.ignoradas,
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
