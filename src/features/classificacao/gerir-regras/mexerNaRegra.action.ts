"use server";

import { revalidatePath } from "next/cache";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import {
  apagarRegra,
  editarRegra,
  type ResultadoDeMexer,
} from "./mexerNaRegra.service";

/**
 * O que os botões de `/regras` chamam (tarefa D9).
 *
 * ⚠ Do cliente vêm apenas ids e o texto. O `user_id` sai de
 * `garantirUsuario()`, e todo id é conferido contra ele no serviço.
 */

async function comRevalidacao(
  operacao: (userId: string) => Promise<ResultadoDeMexer>,
  falha: string,
): Promise<ResultadoDeMexer> {
  const usuario = await garantirUsuario();

  try {
    const resultado = await operacao(usuario.id);

    if (resultado.ok) {
      revalidatePath("/regras");
      // A revisão mostra sugestões e o painel conta pendências; nenhum dos dois
      // muda **agora** por causa disto (mexer não reescreve o passado), mas os
      // dois leem regras na próxima importação. Revalidar é barato e evita
      // uma tela mostrando um mundo que já mudou.
      revalidatePath("/revisao");
    }

    return resultado;
  } catch (erro) {
    console.error("[regras] falha ao mexer na regra", erro);
    return { ok: false, erro: falha };
  }
}

export async function editar(entrada: {
  id: string;
  categoriaId: string;
  texto?: string;
}): Promise<ResultadoDeMexer> {
  if (!entrada.id || !entrada.categoriaId) {
    return { ok: false, erro: "Não entendi essa edição. Recarregue a tela." };
  }

  return comRevalidacao(
    (userId) => editarRegra(userId, entrada),
    "Não conseguimos salvar. Nada foi alterado — tente de novo.",
  );
}

export async function apagar(id: string): Promise<ResultadoDeMexer> {
  if (!id) {
    return { ok: false, erro: "Não entendi essa exclusão. Recarregue a tela." };
  }

  return comRevalidacao(
    (userId) => apagarRegra(userId, id),
    "Não conseguimos apagar. Nada foi alterado — tente de novo.",
  );
}
