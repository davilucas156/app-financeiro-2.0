"use server";

import { revalidatePath } from "next/cache";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { enviosDoMes } from "./enviosDoMes.service";
import { oQueSaiDoMes, type OQueSaiDoMes } from "./oQueSaiDoMes";
import { removerOMes, type ResultadoDaRemocao } from "./removerOMes.service";

/**
 * O que a confirmação de "remover este mês" chama (tarefas C2 e D2).
 *
 * ⚠ Do cliente vem **só o mês**. O `user_id` sai de `garantirUsuario()`, e é
 * ele que decide o que existe — o mês sozinho não autoriza nada.
 */

export type ResultadoDoResumo =
  { ok: true; resumo: OQueSaiDoMes } | { ok: false; erro: string };

const NAO_ENCONTRADO = "Esse mês não está mais aqui. A tela foi atualizada.";

const FALHA = "Não deu para remover agora. Nada foi apagado pela metade.";

/**
 * O que sairia, para a tela mostrar **antes** de apagar.
 *
 * É aqui que a consulta (B2) e a regra (B1) se juntam, e é por isso que nenhuma
 * das duas fazia isso sozinha: o service ficaria impossível de testar sem
 * banco, e a regra existe para ser testável.
 *
 * ⚠ **É uma action e não uma consulta da rota**, de propósito. A `/dashboard` é
 * a tela mais carregada do app e remover um mês acontece uma vez a cada muitos
 * meses. Pendurar esta consulta em todo carregamento do painel faria todo mundo
 * pagar pelo caso raro — a tela pergunta quando o dedo toca.
 */
export async function resumoDaRemocao(mes: string): Promise<ResultadoDoResumo> {
  const usuario = await garantirUsuario();

  try {
    const resumo = oQueSaiDoMes(mes, await enviosDoMes(usuario.id, mes));

    /*
     * ⚠ **Mês sem envio vira recusa, e não um resumo vazio.** Assim a tela tem
     * uma ramificação só e nunca chega a desenhar uma confirmação de "apagar
     * nada" — que é o que ela mostraria se o mês tivesse saído noutra aba.
     */
    if (resumo.envios.length === 0) return { ok: false, erro: NAO_ENCONTRADO };

    return { ok: true, resumo };
  } catch (erro) {
    console.error("[remover-o-mes] falha ao resumir", erro);
    return { ok: false, erro: FALHA };
  }
}

/**
 * Apagar, de verdade.
 *
 * ⚠ **Não redireciona.** Um `redirect()` aqui mataria o retorno, e com ele a
 * única chance de dizer que deu errado. Quem navega é o componente, depois de
 * ver `ok: true`.
 */
export async function removerMes(
  _anterior: ResultadoDaRemocao | null,
  dados: FormData,
): Promise<ResultadoDaRemocao> {
  const usuario = await garantirUsuario();
  const mes = String(dados.get("mes") ?? "");

  try {
    const resultado = await removerOMes(usuario.id, mes);

    if (resultado.ok) revalidarOndeOMesAparece();

    return resultado;
  } catch (erro) {
    console.error("[remover-o-mes] falha ao remover", erro);

    /*
     * "Nada foi apagado pela metade" é **verdade por construção** e não
     * promessa: as duas deleções estão na mesma transação.
     */
    return { ok: false, erro: FALHA };
  }
}

/**
 * ⚠ **`/revisao` é a menos óbvia das quatro.** Remover um mês pode levar
 * lançamentos que estavam esperando decisão — e o tamanho dessa fila aparece no
 * painel. As outras três são diretas: o painel perdeu um mês, a lista de envios
 * encolheu, e o ano do comparativo perdeu um mês.
 */
function revalidarOndeOMesAparece() {
  revalidatePath("/dashboard");
  revalidatePath("/upload");
  revalidatePath("/comparativo");
  revalidatePath("/revisao");
}
