import "server-only";

import { cookies } from "next/headers";
import { VALIDADE_DO_COOKIE_SEG } from "./preferenciaDoAparelho";

/**
 * Gravar uma preferência do aparelho (spec 10, tarefa B1).
 *
 * Extraído do `escolherTema.action.ts` quando a segunda preferência chegou. As
 * cinco opções abaixo são **decisão**, e cada uma tem um porquê que vale para
 * qualquer preferência de aparência — por isso elas ficam aqui, e não repetidas
 * em duas actions.
 *
 * ⚠ **Não valida nada, e é de propósito.** Quem chama já passou o valor por
 * `escolhaValida`. Validar aqui dentro exigiria receber a lista, e aí este
 * módulo saberia sobre tema e sobre letra — exatamente o acoplamento que ele
 * existe para não ter.
 */
export async function gravarPreferencia(
  cookie: string,
  valor: string,
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(cookie, valor, {
    /*
     * ⚠ **Sem `httpOnly`, e isso é decisão.** Não há nada secreto numa
     * preferência de aparência, e deixar o JavaScript ler ajuda: o cliente
     * confere o que está gravado sem mais uma ida ao servidor.
     */
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VALIDADE_DO_COOKIE_SEG,
  });
}
