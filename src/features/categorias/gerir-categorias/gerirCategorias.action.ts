"use server";

import { revalidatePath } from "next/cache";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import {
  apagarCategoria,
  type DestinoEscolhido,
  type ResultadoDeApagar,
} from "@/features/categorias/apagar-categoria/apagarCategoria.service";
import {
  raioXDaCategoria,
  type RaioXDaCategoria,
} from "@/features/categorias/apagar-categoria/raioX.service";
import {
  criarCategoria,
  moverCategoria,
  renomearCategoria,
  type ResultadoDeCriar,
  type ResultadoDeMexer,
} from "./mexerNaCategoria.service";

/**
 * O que os botões de `/categorias` chamam (tarefa D1).
 *
 * A fase B inteira já foi medida contra o Neon. Aqui não há operação nova —
 * há `garantirUsuario()`, `revalidatePath` e a tradução de uma exceção em
 * frase.
 *
 * ⚠ Do cliente vêm apenas ids e texto. O `user_id` sai de `garantirUsuario()`,
 * e todo id — categoria, pote, destino — é conferido contra ele no serviço.
 */

const NAO_ENTENDI = "Não entendi esse pedido. Recarregue a tela.";

/**
 * Quem mexeu em categoria mexeu nas três telas.
 *
 * O nome aparece no painel, a lista de escolhas aparece na revisão, e apagar
 * pode ter devolvido lançamentos para a fila. Revalidar a mais é barato;
 * revalidar a menos deixa uma tela mostrando um mundo que já mudou.
 */
function revalidarTudo() {
  revalidatePath("/categorias");
  revalidatePath("/dashboard");
  revalidatePath("/revisao");
}

async function comRevalidacao<T extends { ok: boolean }>(
  operacao: (userId: string) => Promise<T>,
  falha: T,
  ondeFalhou: string,
): Promise<T> {
  const usuario = await garantirUsuario();

  try {
    const resultado = await operacao(usuario.id);
    if (resultado.ok) revalidarTudo();
    return resultado;
  } catch (erro) {
    console.error(`[categorias] ${ondeFalhou}`, erro);
    return falha;
  }
}

export async function criar(entrada: {
  nome: string;
  emoji: string;
  poteId: string;
}): Promise<ResultadoDeCriar> {
  if (!entrada.poteId) return { ok: false, erro: NAO_ENTENDI };

  return comRevalidacao(
    (userId) => criarCategoria(userId, entrada),
    {
      ok: false,
      erro: "Não conseguimos criar. Nada foi salvo — tente de novo.",
    },
    "falha ao criar",
  );
}

export async function renomear(
  id: string,
  entrada: { nome: string; emoji: string },
): Promise<ResultadoDeMexer> {
  if (!id) return { ok: false, erro: NAO_ENTENDI };

  return comRevalidacao(
    (userId) => renomearCategoria(userId, id, entrada),
    {
      ok: false,
      erro: "Não conseguimos salvar. Nada foi alterado — tente de novo.",
    },
    "falha ao renomear",
  );
}

export async function mover(
  id: string,
  poteId: string,
): Promise<ResultadoDeMexer> {
  if (!id || !poteId) return { ok: false, erro: NAO_ENTENDI };

  return comRevalidacao(
    (userId) => moverCategoria(userId, id, poteId),
    {
      ok: false,
      erro: "Não conseguimos mover. Nada foi alterado — tente de novo.",
    },
    "falha ao mover",
  );
}

/**
 * O raio-X relido **no momento de apagar**, e não reaproveitado da listagem.
 *
 * A listagem foi renderizada quando a página abriu; apagar acontece depois e
 * não tem volta. Se um extrato entrou nesse meio-tempo, a tela diria "nunca foi
 * usada" e o toque desclassificaria trinta lançamentos em silêncio. A transação
 * da B4 ainda faria a coisa certa com eles — mas o **aviso** teria mentido, e o
 * aviso é a única defesa que esta operação tem.
 *
 * Ele traz junto os destinos já ordenados pelo servidor: duas listas com a
 * mesma regra de ordenação divergiriam.
 */
export async function verOQueVaiJunto(
  id: string,
): Promise<RaioXDaCategoria | null> {
  if (!id) return null;

  const usuario = await garantirUsuario();

  try {
    return await raioXDaCategoria(usuario.id, id);
  } catch (erro) {
    console.error("[categorias] falha ao ler o raio-X", erro);
    return null;
  }
}

export async function apagar(
  id: string,
  destino: DestinoEscolhido,
): Promise<ResultadoDeApagar> {
  if (!id) return { ok: false, erro: NAO_ENTENDI };
  if (destino.tipo === "mover" && !destino.categoriaId) {
    return { ok: false, erro: NAO_ENTENDI };
  }

  return comRevalidacao(
    (userId) => apagarCategoria(userId, id, destino),
    {
      ok: false,
      erro: "Não conseguimos apagar. Nada foi alterado — tente de novo.",
    },
    "falha ao apagar",
  );
}
