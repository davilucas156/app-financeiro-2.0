"use server";

import { revalidatePath } from "next/cache";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import {
  criarEClassificar,
  type ResultadoDeCriarEClassificar,
} from "./criarEClassificar.service";

/**
 * O que o "+ Nova categoria" da revisão chama (tarefa D2).
 *
 * ⚠ Do cliente vêm o nome, o emoji e dois ids. O `user_id` sai de
 * `garantirUsuario()`, e pote e lançamento são conferidos contra ele no
 * serviço.
 */
export async function criarEUsarAqui(entrada: {
  nome: string;
  emoji: string;
  poteId: string;
  lancamentoId: string;
}): Promise<ResultadoDeCriarEClassificar> {
  if (!entrada.poteId || !entrada.lancamentoId) {
    return { ok: false, erro: "Não entendi esse pedido. Recarregue a tela." };
  }

  const usuario = await garantirUsuario();

  try {
    const resultado = await criarEClassificar(usuario.id, entrada);

    if (resultado.ok) {
      // A revisão avança sozinha: o que foi decidido some da fila. O painel
      // ganhou uma categoria e perdeu uma pendência; a `/categorias` ganhou
      // uma linha; o upload conta pendências.
      revalidatePath("/revisao");
      revalidatePath("/dashboard");
      revalidatePath("/upload");
      revalidatePath("/categorias");
    }

    return resultado;
  } catch (erro) {
    console.error("[revisao] falha ao criar e classificar", erro);
    return {
      ok: false,
      erro: "Não conseguimos criar. Nada foi salvo — tente de novo.",
    };
  }
}
