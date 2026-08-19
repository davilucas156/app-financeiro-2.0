"use server";

import { revalidatePath } from "next/cache";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import {
  desfazerImportacao,
  type ResultadoDesfazer,
} from "@/features/upload/desfazer-envio/desfazerEnvio.service";

/**
 * O que o botão "Apagar" da confirmação chama (tarefa D5).
 *
 * ⚠ Do cliente vem **só o id do envio**. O `user_id` vem de
 * `garantirUsuario()`, e é ele que decide o que pode ser apagado — o id
 * sozinho não autoriza nada.
 */
export async function desfazerEnvio(
  _anterior: ResultadoDesfazer | null,
  dados: FormData,
): Promise<ResultadoDesfazer> {
  const usuario = await garantirUsuario();
  const importId = String(dados.get("importId") ?? "");

  try {
    const resultado = await desfazerImportacao(usuario.id, importId);

    if (resultado.ok) {
      // A lista perdeu uma linha e o painel perdeu lançamentos.
      revalidatePath("/upload");
      revalidatePath("/dashboard");
    }

    return resultado;
  } catch (erro) {
    console.error("[desfazer-envio] falha ao desfazer", erro);
    return {
      ok: false,
      erro: "Não deu para desfazer agora. Nada foi apagado pela metade.",
    };
  }
}
