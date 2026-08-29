"use server";

import { revalidatePath } from "next/cache";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { definirMeta, type ResultadoDaMeta } from "./definirMeta.service";
import {
  restaurarMetasDoPadrao,
  type ResultadoDaRestauracao,
} from "./restaurarMetas.service";

/**
 * O que o campo de meta chama (tarefa B2).
 *
 * ⚠ Do cliente vêm **`poteId` e texto**. O `user_id` sai de
 * `garantirUsuario()` e é conferido contra o pote dentro do serviço.
 */

const DEU_RUIM = "Não consegui salvar agora. Tente de novo.";

/**
 * Duas telas, e não três.
 *
 * O `gerirCategorias.action.ts` revalida também a `/revisao`, porque mexer em
 * categoria muda a lista de escolhas de lá. Mexer na **meta** não muda
 * classificação nenhuma — o que muda é a barra do painel e o número da própria
 * tela de arrumação.
 *
 * ⚠ É por isso que esta action não reusa o `revalidarTudo` de lá: o conjunto de
 * telas afetadas é outro, e copiar o dele seria copiar uma decisão que não é
 * esta. (E um arquivo `"use server"` só exporta função assíncrona, então o
 * helper não atravessaria mesmo.)
 */
function revalidarOndeAMetaAparece() {
  revalidatePath("/categorias");
  revalidatePath("/dashboard");
}

export async function salvarMeta(
  poteId: string,
  texto: string,
): Promise<ResultadoDaMeta> {
  const usuario = await garantirUsuario();

  try {
    const resultado = await definirMeta(usuario.id, poteId, texto);
    if (resultado.ok) revalidarOndeAMetaAparece();

    return resultado;
  } catch (erro) {
    // ⚠ O erro do Postgres nomeia tabela e coluna: fica no log do servidor, e
    // a tela recebe uma frase.
    console.error("[metas] falhou ao gravar o percentual", erro);

    return { ok: false, erro: DEU_RUIM };
  }
}

/**
 * Voltar ao rateio de fábrica (tarefa D1).
 *
 * Mesma revalidação da escrita avulsa: o que mudou foi o mesmo campo, oito
 * vezes.
 */
export async function restaurarMetas(): Promise<ResultadoDaRestauracao> {
  const usuario = await garantirUsuario();

  try {
    const resultado = await restaurarMetasDoPadrao(usuario.id);
    if (resultado.ok) revalidarOndeAMetaAparece();

    return resultado;
  } catch (erro) {
    console.error("[metas] falhou ao restaurar o padrão", erro);

    return { ok: false, erro: DEU_RUIM };
  }
}
