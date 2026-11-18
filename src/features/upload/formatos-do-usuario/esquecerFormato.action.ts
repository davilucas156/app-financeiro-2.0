"use server";

import { revalidatePath } from "next/cache";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { ehUuid } from "@/lib/uuid";
import { apagarFormato } from "./formatosDoUsuario.service";

export type RespostaDeEsquecer = { ok: true } | { ok: false; erro: string };

export async function esquecerFormato(id: string): Promise<RespostaDeEsquecer> {
  const usuario = await garantirUsuario();

  if (!ehUuid(id)) return { ok: false, erro: "Formato não encontrado." };

  const apagado = await apagarFormato(usuario.id, id);
  if (!apagado) return { ok: false, erro: "Formato não encontrado." };

  revalidatePath("/formatos");
  revalidatePath("/upload");

  return { ok: true };
}
