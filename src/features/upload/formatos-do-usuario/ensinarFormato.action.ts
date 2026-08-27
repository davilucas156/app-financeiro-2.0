"use server";

import { revalidatePath } from "next/cache";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import {
  FORMATOS_DE_DATA,
  FORMATOS_DE_NUMERO,
  FORMATO_DE_DATA_PADRAO,
  FORMATO_DE_NUMERO_PADRAO,
  type FormatoDeData,
  type FormatoDeNumero,
} from "@/features/upload/ler-arquivo/dialetos";
import { decodificar, paraGrade } from "@/features/upload/ler-arquivo/grade";
import { palpitar, type Palpite } from "@/features/upload/ler-arquivo/palpite";
import {
  previaDoMapeamento,
  type Previa,
} from "@/features/upload/ler-arquivo/previa";
import { TAMANHO_MAXIMO } from "@/features/upload/limites";
import { validarMapeamento } from "./formatoDoUsuario";
import { apagarFormato, salvarFormato } from "./formatosDoUsuario.service";

/**
 * Ensinar o app a ler um arquivo (spec 11, tarefas C2, D2 e D4).
 *
 * ## O arquivo vem junto em toda chamada, e não fica guardado
 *
 * ⚠ **É a decisão estrutural da spec**, e as três saídas foram pesadas:
 *
 * - **Gravar o CSV num storage temporário** contraria a spec 02, C3, que
 *   decidiu não guardar o arquivo: extrato carrega número de conta, nomes de
 *   pessoas e o gasto do mês inteiro.
 * - **Mandar o texto decodificado para o cliente** poria a separação por `;` e a
 *   busca do cabeçalho no navegador — regra de negócio no front, contra o
 *   `references/architecture.md`.
 * - **O `File` fica na aba e cada chamada o reenvia** — o que se faz aqui.
 *
 * O custo é reenviar até 2 MB por ajuste, num arquivo que o limite já prende em
 * 2 MB, e são poucos ajustes, cada um deliberado. Em troca, os bytes nunca
 * tocam disco e o parsing nunca sai do servidor.
 */

export type RespostaDaPrevia =
  | { ok: true; palpite: Palpite; cabecalho: string[]; previa: Previa }
  | { ok: false; erro: string };

/**
 * A primeira chamada: "o que você acha que este arquivo é?"
 *
 * Devolve o palpite **e** a consequência dele, para a tela abrir já mostrando o
 * resultado em vez de sete campos em branco.
 */
export async function palpitarFormato(
  formData: FormData,
): Promise<RespostaDaPrevia> {
  await garantirUsuario();

  const texto = await lerTexto(formData);
  if (typeof texto !== "string") return texto;

  const palpite = palpitar(texto);
  if (!palpite) {
    return {
      ok: false,
      erro: "Não consegui achar colunas neste arquivo. Ele é mesmo um CSV?",
    };
  }

  return {
    ok: true,
    palpite,
    cabecalho: cabecalhoDe(texto, palpite),
    previa: previaDoMapeamento(texto, palpite),
  };
}

/**
 * As chamadas seguintes: "e se for **assim**?"
 *
 * ⚠ **A prévia é a defesa contra o erro do sinal**, e por isso ela recalcula do
 * zero a cada ajuste em vez de estimar. A frase "R$ 4.812,00 de gasto e R$ 0,00
 * de entrada" só serve se for a mesma conta que o import faria.
 */
export async function preverMapeamento(
  formData: FormData,
): Promise<RespostaDaPrevia> {
  await garantirUsuario();

  const texto = await lerTexto(formData);
  if (typeof texto !== "string") return texto;

  /*
   * ⚠ **A prévia não valida, e isso é a diferença entre ela e o salvar.** É
   * justamente enquanto falta uma coluna que a pessoa precisa ver o que o app
   * já está lendo — travar a prévia até o mapeamento estar completo esconderia
   * o único jeito de ela saber se está no caminho.
   */
  const palpite = comoPalpite(lerJson(formData.get("mapeamento")));
  if (!palpite) return { ok: false, erro: "Mapeamento incompleto." };

  return {
    ok: true,
    palpite,
    cabecalho: cabecalhoDe(texto, palpite),
    previa: previaDoMapeamento(texto, palpite),
  };
}

export type RespostaDeSalvar =
  { ok: true; id: string } | { ok: false; erro: string };

export async function ensinarFormato(
  formData: FormData,
): Promise<RespostaDeSalvar> {
  const usuario = await garantirUsuario();

  const texto = await lerTexto(formData);
  if (typeof texto !== "string") return texto;

  const bruto = lerJson(formData.get("mapeamento"));
  const palpite = comoPalpite(bruto);
  if (!palpite) return { ok: false, erro: "Mapeamento incompleto." };

  /*
   * ⚠ **O cabeçalho é lido do arquivo aqui, e não aceito do cliente.** É ele
   * que vira o nome das colunas gravadas, e nome de coluna é o que a
   * `reconhecer` vai casar depois. Aceitá-lo pronto deixaria alguém gravar um
   * formato que promete casar com um cabeçalho que o arquivo não tem.
   */
  const cabecalho = cabecalhoDe(texto, palpite);

  const validado = validarMapeamento(bruto, cabecalho);
  if (!validado.ok) return { ok: false, erro: validado.erro };

  const salvo = await salvarFormato(usuario.id, validado.mapeamento);
  if (!salvo.ok) return salvo;

  revalidatePath("/formatos");
  revalidatePath("/upload");

  return { ok: true, id: salvo.id };
}

export async function esquecerFormato(
  id: string,
): Promise<{ ok: boolean; erro?: string }> {
  const usuario = await garantirUsuario();

  if (typeof id !== "string" || id === "") {
    return { ok: false, erro: "Formato não encontrado." };
  }

  const apagado = await apagarFormato(usuario.id, id);
  if (!apagado) return { ok: false, erro: "Formato não encontrado." };

  revalidatePath("/formatos");
  revalidatePath("/upload");

  return { ok: true };
}

/** Os bytes do arquivo virando texto, com o mesmo limite do `/upload`. */
async function lerTexto(
  formData: FormData,
): Promise<string | { ok: false; erro: string }> {
  const arquivo = formData.get("arquivo");

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, erro: "Escolha um arquivo." };
  }

  // O cliente já recusa, mas validação de cliente é conveniência, não defesa —
  // a mesma frase que a `importarExtrato` escreveu na spec 02.
  if (arquivo.size > TAMANHO_MAXIMO) {
    return {
      ok: false,
      erro: "Esse arquivo é grande demais. O limite é 2 MB.",
    };
  }

  return decodificar(new Uint8Array(await arquivo.arrayBuffer()));
}

function cabecalhoDe(texto: string, palpite: Palpite): string[] {
  return paraGrade(texto, palpite.dialeto)[palpite.linhaCabecalho] ?? [];
}

function lerJson(valor: FormDataEntryValue | null): unknown {
  if (typeof valor !== "string") return null;
  try {
    return JSON.parse(valor);
  } catch {
    return null;
  }
}

/**
 * O que chegou do cliente virando um `Palpite` utilizável pela prévia.
 *
 * ⚠ **Mais frouxo que o `validarMapeamento`, e de propósito.** Aqui basta ser
 * desenhável: a pessoa ainda está mexendo, e travar a prévia até tudo estar
 * certo esconderia justamente o que ela precisa ver para acertar.
 */
function comoPalpite(bruto: unknown): Palpite | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const m = bruto as Record<string, unknown>;

  const dialeto = m.dialeto as { separador?: unknown; aspas?: unknown } | null;
  if (!dialeto || typeof dialeto.separador !== "string") return null;

  const colunas: Record<string, number> = {};
  if (typeof m.colunas === "object" && m.colunas !== null) {
    for (const [k, v] of Object.entries(m.colunas)) {
      const n = typeof v === "string" ? Number(v) : v;
      if (typeof n === "number" && Number.isInteger(n) && n >= 0)
        colunas[k] = n;
    }
  }

  return {
    dialeto: { separador: dialeto.separador, aspas: dialeto.aspas === true },
    linhaCabecalho:
      typeof m.linhaCabecalho === "number" && m.linhaCabecalho >= 0
        ? m.linhaCabecalho
        : 0,
    colunas,
    /*
     * ⚠ **Conferidos contra a lista, e não convertidos por `as`.** Um valor de
     * fora vira índice em `CAMPOS_DA_DATA[formato]` dentro do `paraDataISO`;
     * `"qualquer"` daria `undefined` e derrubaria a leitura com um erro que a
     * tela não sabe explicar.
     */
    formatoData: FORMATOS_DE_DATA.includes(m.formatoData as FormatoDeData)
      ? (m.formatoData as FormatoDeData)
      : FORMATO_DE_DATA_PADRAO,
    formatoNumero: FORMATOS_DE_NUMERO.includes(
      m.formatoNumero as FormatoDeNumero,
    )
      ? (m.formatoNumero as FormatoDeNumero)
      : FORMATO_DE_NUMERO_PADRAO,
    origem: m.origem === "csv_cartao" ? "csv_cartao" : "csv_conta",
    sinalNegativo: m.sinalNegativo === "entrada" ? "entrada" : "saida",
  };
}
