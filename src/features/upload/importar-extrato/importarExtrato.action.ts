"use server";

import { revalidatePath } from "next/cache";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import {
  importarExtrato,
  type ArquivoRecebido,
  type ResultadoImportacao,
} from "@/features/upload/importar-extrato/importarExtrato.service";
import { CAMPOS_DE_ENVIO, recusar } from "@/features/upload/limites";
import { ClassificacaoIncoerente } from "@/features/classificacao/classificar-importacao/classificarImportacao";
import { ehCheckViolado } from "@/lib/erroDoPostgres";

/**
 * O que o botão "Importar" chama (tarefa D2).
 *
 * ⚠ **Do cliente vêm apenas bytes e o mês.** Nenhum lançamento, nenhuma
 * contagem, nenhum `user_id` — este vem de `garantirUsuario()`, que o lê da
 * sessão no servidor. Um cliente que pudesse mandar a lista de lançamentos
 * poderia inventar qualquer valor
 * (`references/architecture.md`, Thin Client / Fat Server).
 */

export async function enviarExtrato(
  _anterior: ResultadoImportacao | null,
  dados: FormData,
): Promise<ResultadoImportacao> {
  const usuario = await garantirUsuario();

  const mes = String(dados.get("mes") ?? "");
  const arquivos: ArquivoRecebido[] = [];

  for (const campo of CAMPOS_DE_ENVIO) {
    const valor = dados.get(campo);
    // Um `<input type="file">` sem escolha manda um File sem nome (e de
    // tamanho zero). Só esse campo é descartado: um arquivo vazio **com nome**
    // segue para `recusar`, que o barra com a mensagem de arquivo vazio em vez
    // de importar só o outro campo sem avisar.
    if (!(valor instanceof File) || valor.name === "") continue;

    // O tamanho de um `File` se sabe sem ler nada: recusa antes de
    // `arrayBuffer()`. O Next já bufferizou o corpo (até o `bodySizeLimit`)
    // antes da action rodar; o que se evita aqui é a cópia para `Uint8Array`.
    // O serviço repete a checagem completa sobre os bytes.
    const problema = recusar(valor);
    if (problema) return { ok: false, erro: `${valor.name}: ${problema}` };

    arquivos.push({
      campo,
      nome: valor.name,
      bytes: new Uint8Array(await valor.arrayBuffer()),
    });
  }

  try {
    const resultado = await importarExtrato(usuario.id, mes, arquivos);

    if (resultado.ok) {
      // O histórico de envios, o painel e a fila de revisão mudaram.
      revalidatePath("/upload");
      revalidatePath("/dashboard");
      revalidatePath("/revisao");
    }

    return resultado;
  } catch (erro) {
    // O erro de classificação é do app, e a tela precisa dizer isso: sem a
    // frase própria, quem importou um arquivo certo concluiria que o arquivo
    // estava errado.
    if (erro instanceof ClassificacaoIncoerente || ehCheckViolado(erro)) {
      console.error("[importar-extrato] classificação incoerente", erro);
      return {
        ok: false,
        erro: "O problema não está no seu arquivo: o app classificou um lançamento de um jeito que não consegue gravar. Nada foi gravado — tente de novo e, se repetir, avise quem mantém o app.",
      };
    }

    console.error("[importar-extrato] falha ao importar", erro);
    return {
      ok: false,
      erro: "Não conseguimos importar o extrato. Nada foi gravado pela metade.",
    };
  }
}
