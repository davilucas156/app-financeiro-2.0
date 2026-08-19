"use server";

import { revalidatePath } from "next/cache";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import {
  importarExtrato,
  type ArquivoRecebido,
  type CampoDeEnvio,
  type ResultadoImportacao,
} from "@/features/upload/importar-extrato/importarExtrato.service";

/**
 * O que o botão "Importar" chama (tarefa D2).
 *
 * ⚠ **Do cliente vêm apenas bytes e o mês.** Nenhum lançamento, nenhuma
 * contagem, nenhum `user_id` — este vem de `garantirUsuario()`, que o lê da
 * sessão no servidor. Um cliente que pudesse mandar a lista de lançamentos
 * poderia inventar qualquer valor
 * (`references/architecture.md`, Thin Client / Fat Server).
 */

const CAMPOS: CampoDeEnvio[] = ["conta", "cartao"];

export async function enviarExtrato(
  _anterior: ResultadoImportacao | null,
  dados: FormData,
): Promise<ResultadoImportacao> {
  const usuario = await garantirUsuario();

  const mes = String(dados.get("mes") ?? "");
  const arquivos: ArquivoRecebido[] = [];

  for (const campo of CAMPOS) {
    const valor = dados.get(campo);
    // Um `<input type="file">` vazio ainda manda um File de tamanho zero.
    if (!(valor instanceof File) || valor.size === 0) continue;

    arquivos.push({
      campo,
      nome: valor.name,
      bytes: new Uint8Array(await valor.arrayBuffer()),
    });
  }

  try {
    const resultado = await importarExtrato(usuario.id, mes, arquivos);

    if (resultado.ok) {
      // O histórico de envios e o painel mudaram.
      revalidatePath("/upload");
      revalidatePath("/dashboard");
    }

    return resultado;
  } catch (erro) {
    console.error("[importar-extrato] falha ao importar", erro);
    return {
      ok: false,
      erro: "Não conseguimos importar o extrato. Nada foi gravado pela metade.",
    };
  }
}
