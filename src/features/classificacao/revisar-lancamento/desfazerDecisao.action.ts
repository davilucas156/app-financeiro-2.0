"use server";

import { revalidatePath } from "next/cache";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import {
  desfazerDecisao,
  type ResultadoDoDesfazer,
} from "./desfazerDecisao.service";

/**
 * O que o "Voltar" chama (tarefa D6).
 *
 * ⚠ **Sem parâmetro nenhum, e isso é a proteção.** O cliente não escolhe o que
 * desfazer — ele pede "desfaça", e o que volta sai da sombra que o servidor
 * gravou sob o `user_id` da sessão. Não há id do navegador para conferir
 * porque não há id do navegador.
 */
export async function desfazer(): Promise<ResultadoDoDesfazer> {
  const usuario = await garantirUsuario();

  try {
    const resultado = await desfazerDecisao(usuario.id);

    if (resultado.ok) {
      // O lançamento reaberto volta para a fila e — porque a fila é ordenada
      // por data e você sempre decide o primeiro — volta para o topo dela.
      // Painel e upload contam pendências, então também mudaram.
      revalidatePath("/revisao");
      revalidatePath("/dashboard");
      revalidatePath("/upload");
    }

    return resultado;
  } catch (erro) {
    console.error("[revisao] falha ao desfazer a decisão", erro);
    return {
      ok: false,
      erro: "Não conseguimos desfazer. Nada foi alterado — tente de novo.",
    };
  }
}
