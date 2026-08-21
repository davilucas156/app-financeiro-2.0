"use server";

import { revalidatePath } from "next/cache";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import type { FonteDeSugestao } from "@/features/classificacao/motor/sugestoes";
import {
  decidirLancamento,
  type Decisao,
  type ResultadoDaDecisao,
} from "./decidirLancamento.service";

/**
 * O que os botões da revisão chamam (tarefa D4).
 *
 * ⚠ **Do cliente vêm apenas ids e o tipo da decisão.** O `user_id` sai de
 * `garantirUsuario()`, no servidor. Todo id vindo daqui é conferido contra ele
 * no serviço (`references/architecture.md`, Thin Client / Fat Server).
 */

const FONTES: FonteDeSugestao[] = [
  "voce-ja-classificou",
  "mesma-contraparte",
  "categoria-do-banco",
  "pote-do-banco",
];

export type EntradaDaDecisao = {
  tipo: Decisao["tipo"];
  lancamentoId: string;
  categoriaId?: string;
  fonteDaSugestao?: string;
  /** "Sempre classificar assim" (D5). */
  sempre?: boolean;
};

export async function decidir(
  entrada: EntradaDaDecisao,
): Promise<ResultadoDaDecisao> {
  const usuario = await garantirUsuario();

  const decisao = montar(entrada);
  if (!decisao) {
    return { ok: false, erro: "Não entendi essa decisão. Recarregue a tela." };
  }

  try {
    const resultado = await decidirLancamento(usuario.id, decisao);

    if (resultado.ok) {
      // A revisão avança sozinha: o que foi decidido some da fila, e o
      // próximo pendente vira o primeiro. Painel e upload contam pendências.
      revalidatePath("/revisao");
      revalidatePath("/dashboard");
      revalidatePath("/upload");
    }

    return resultado;
  } catch (erro) {
    console.error("[revisao] falha ao gravar a decisão", erro);
    return {
      ok: false,
      erro: "Não conseguimos gravar. Nada foi alterado — tente de novo.",
    };
  }
}

/**
 * Traduz o que veio do cliente para a decisão do serviço, recusando o que não
 * reconhece.
 *
 * O `check` de `transactions` recusaria uma combinação inválida com erro de
 * banco; conferir aqui devolve uma frase em vez de um 500.
 */
function montar(e: EntradaDaDecisao): Decisao | null {
  if (!e.lancamentoId) return null;

  if (e.tipo === "categoria") {
    if (!e.categoriaId) return null;

    const fonteDaSugestao = FONTES.find((f) => f === e.fonteDaSugestao);

    return {
      tipo: "categoria",
      lancamentoId: e.lancamentoId,
      categoriaId: e.categoriaId,
      // Sem uma fonte reconhecida, a escolha é manual. Aceitar um rótulo
      // qualquer encheria a procedência de texto inventado — e procedência que
      // não é confiável não serve para responder "por que caiu aqui?".
      fonte: fonteDaSugestao ? "sugestao" : "manual",
      fonteDaSugestao,
      sempre: e.sempre === true,
    };
  }

  if (e.tipo === "fora-do-calculo" || e.tipo === "confirmar") {
    return { tipo: e.tipo, lancamentoId: e.lancamentoId };
  }

  return null;
}
