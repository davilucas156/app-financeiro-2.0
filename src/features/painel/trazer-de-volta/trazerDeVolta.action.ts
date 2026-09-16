"use server";

import { revalidatePath } from "next/cache";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import {
  trazerDeVolta,
  type ResultadoDeTrazerDeVolta,
} from "./trazerDeVolta.service";

/**
 * O botão "trazer de volta" do painel.
 *
 * ⚠ Do cliente vem **só o id do lançamento**; o `user_id` sai de
 * `garantirUsuario()` e entra no `where` junto com ele, no serviço
 * (`references/architecture.md`, Thin Client / Fat Server).
 */

export async function desfazerAnulacao(entrada: {
  lancamentoId: string;
}): Promise<ResultadoDeTrazerDeVolta> {
  const usuario = await garantirUsuario();

  if (!entrada.lancamentoId) {
    return {
      ok: false,
      erro: "Não entendi qual lançamento. Recarregue a tela.",
    };
  }

  try {
    const resultado = await trazerDeVolta(usuario.id, entrada.lancamentoId);

    if (resultado.ok) {
      /*
       * Os três que mudam de número, e por quê:
       *
       * - o painel ganha o dinheiro de volta nas entradas e nas saídas;
       * - a `/revisao` ganha os lançamentos na fila;
       * - o `/upload` conta pendências na tela de envio.
       */
      revalidatePath("/dashboard");
      revalidatePath("/revisao");
      revalidatePath("/upload");
    }

    return resultado;
  } catch (erro) {
    console.error("[painel] falha ao desfazer a anulação", erro);
    return {
      ok: false,
      erro: "Não conseguimos desfazer. Nada foi alterado — tente de novo.",
    };
  }
}
