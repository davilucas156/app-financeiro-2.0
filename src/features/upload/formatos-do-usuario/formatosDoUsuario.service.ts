import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { userFormats } from "@/db/schema";
import { getDb } from "@/lib/db";
import type { Formato } from "@/features/upload/ler-arquivo/formatos";
import { comoFormato, type MapeamentoSalvo } from "./formatoDoUsuario";

/**
 * Os formatos que o usuário ensinou, indo e voltando do banco (spec 11, C1/C2).
 *
 * ⚠ `userId` vem sempre de `garantirUsuario()`, nunca de um parâmetro do
 * cliente — a regra de isolamento de `references/architecture.md`, que neste
 * projeto substitui o RLS que o Neon não tem.
 */

export type FormatoNaTela = {
  id: string;
  nome: string;
  banco: string;
  origem: "csv_conta" | "csv_cartao";
  colunas: Record<string, string>;
  criadoEm: Date;
};

/**
 * Para o leitor: os formatos deste usuário, **do mais recente ao mais antigo**.
 *
 * ⚠ **A ordem é a regra de desempate da pendência 5**, e ela mora aqui porque
 * é aqui que existe data. Dois bancos com cabeçalho `Data,Descrição,Valor` são
 * plausíveis; entre dois formatos do próprio usuário ganha o mais recente,
 * porque quem ensinou por último ensinou sabendo do anterior. A `reconhecer`
 * só respeita a ordem em que recebe.
 */
export async function formatosDoUsuario(userId: string): Promise<Formato[]> {
  const db = getDb();

  const linhas = await db
    .select()
    .from(userFormats)
    .where(eq(userFormats.userId, userId))
    .orderBy(desc(userFormats.criadoEm));

  return linhas.map((l) =>
    comoFormato(l.id, {
      nome: l.nome,
      banco: l.banco,
      origem: l.origem,
      dialeto: l.dialeto,
      colunas: l.colunas,
      sinalNegativo: l.sinalNegativo,
      formatoData: l.formatoData as MapeamentoSalvo["formatoData"],
      formatoNumero: l.formatoNumero as MapeamentoSalvo["formatoNumero"],
    }),
  );
}

/**
 * Para a `/formatos`: o que mostrar na lista.
 *
 * ⚠ **Sem "quantos envios este formato leu", e a ausência foi deliberada.** A
 * tarefa D4 pedia esse número na confirmação de apagar, e ele exigiria uma
 * coluna `formato_id` em `imports` — contra a promessa que esta spec fez e
 * cumpriu: **uma tabela nova, zero alteração nas existentes.**
 *
 * A confirmação diz então o que é verdade e é acionável sem o número: apagar
 * não apaga lançamento nenhum, e os próximos arquivos daquele banco voltam a
 * pedir para ser ensinados. Se a contagem fizer falta, ela é uma decisão de
 * esquema a tomar de propósito, e não de passagem.
 */
export async function formatosNaTela(userId: string): Promise<FormatoNaTela[]> {
  const db = getDb();

  return db
    .select({
      id: userFormats.id,
      nome: userFormats.nome,
      banco: userFormats.banco,
      origem: userFormats.origem,
      colunas: userFormats.colunas,
      criadoEm: userFormats.criadoEm,
    })
    .from(userFormats)
    .where(eq(userFormats.userId, userId))
    .orderBy(desc(userFormats.criadoEm));
}

export async function salvarFormato(
  userId: string,
  m: MapeamentoSalvo,
): Promise<{ ok: true; id: string } | { ok: false; erro: string }> {
  const db = getDb();

  try {
    const [linha] = await db
      .insert(userFormats)
      .values({
        userId,
        nome: m.nome,
        banco: m.banco,
        origem: m.origem,
        dialeto: m.dialeto,
        colunas: m.colunas,
        sinalNegativo: m.sinalNegativo,
        formatoData: m.formatoData,
        formatoNumero: m.formatoNumero,
      })
      /*
       * ⚠ **Nome repetido atualiza, não duplica.** É a mesma decisão que
       * `imports.hash` e `transactions.impressao` já tomaram: a idempotência
       * mora no banco, não num `if` que corre antes e perde a corrida. Aqui ela
       * também é o caminho de *editar* — a `/formatos` reenvia o mesmo nome.
       */
      .onConflictDoUpdate({
        target: [userFormats.userId, userFormats.nome],
        set: {
          banco: m.banco,
          origem: m.origem,
          dialeto: m.dialeto,
          colunas: m.colunas,
          sinalNegativo: m.sinalNegativo,
          formatoData: m.formatoData,
          formatoNumero: m.formatoNumero,
          atualizadoEm: new Date(),
        },
      })
      .returning({ id: userFormats.id });

    return { ok: true, id: linha.id };
  } catch {
    return {
      ok: false,
      erro: "Não consegui salvar este formato. Tente de novo.",
    };
  }
}

/**
 * ⚠ **Apagar formato não apaga lançamento**, e o `where` diz isso sozinho: ele
 * toca uma tabela só. Receita de leitura e comida são coisas diferentes —
 * desfazer importação já existe na `/upload` desde a spec 02, e é lá que
 * continua.
 *
 * ⚠ **O `user_id` no `where` não é redundância.** Sem ele, um `id` adivinhado
 * apagaria o formato de outra conta. É a regra do `architecture.md` aplicada ao
 * caso em que ela mais custa se esquecida.
 */
export async function apagarFormato(
  userId: string,
  id: string,
): Promise<boolean> {
  const db = getDb();

  const apagados = await db
    .delete(userFormats)
    .where(and(eq(userFormats.userId, userId), eq(userFormats.id, id)))
    .returning({ id: userFormats.id });

  return apagados.length > 0;
}
