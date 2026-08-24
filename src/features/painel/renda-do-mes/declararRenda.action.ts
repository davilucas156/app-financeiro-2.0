"use server";

import { revalidatePath } from "next/cache";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { declararRenda } from "./rendaDoMes.service";

/**
 * Informar a renda de um mês (tarefa D2).
 *
 * ⚠ O mês e o valor vêm do cliente; o `user_id` sai de `garantirUsuario()`.
 * O formato do mês é conferido aqui **e** no banco (`monthly_income_mes_ck`) —
 * o check recusaria com erro de banco, e conferir antes devolve uma frase em
 * vez de um 500.
 */

export type ResultadoDaRenda = { ok: true } | { ok: false; erro: string };

/** O maior valor que ainda é digitação plausível: R$ 10 milhões. */
const TETO_CENTAVOS = 1_000_000_000;

export async function informarRenda(entrada: {
  mes: string;
  centavos: number;
}): Promise<ResultadoDaRenda> {
  const usuario = await garantirUsuario();

  if (!/^\d{4}-\d{2}$/.test(entrada.mes)) {
    return { ok: false, erro: "Mês inválido. Recarregue a tela." };
  }

  if (!Number.isInteger(entrada.centavos) || entrada.centavos < 0) {
    return { ok: false, erro: "Escreva um valor válido." };
  }

  /*
   * O teto não é regra de negócio, é defesa contra dedo escorregado.
   *
   * Um zero a mais na renda divide todas as metas por dez e o painel fica
   * plausível — nenhuma barra estoura, tudo parece sob controle. É o erro
   * silencioso que esta tela existe para não cometer.
   */
  if (entrada.centavos > TETO_CENTAVOS) {
    return {
      ok: false,
      erro: "Esse valor parece alto demais. Confira antes de salvar.",
    };
  }

  try {
    await declararRenda(usuario.id, entrada.mes, entrada.centavos);

    revalidatePath("/painel");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (erro) {
    console.error("[painel] falha ao gravar a renda do mês", erro);
    return {
      ok: false,
      erro: "Não conseguimos salvar. Nada foi alterado — tente de novo.",
    };
  }
}
