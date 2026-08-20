import type { Origem } from "@/features/upload/ler-arquivo/formatos";
import { normalizarDescricao } from "@/features/upload/ler-arquivo/preparar";

/**
 * O trecho que vira regra (tarefa A2).
 *
 * Quando você corrige uma classificação e responde "sempre classificar assim",
 * é este pedaço da descrição que a regra passa a procurar.
 *
 * ## A assimetria que decide o desenho
 *
 * Trecho **curto demais** casa com o que não devia — silenciosamente, e você
 * só descobre olhando o painel meses depois. Trecho **longo demais** deixa de
 * casar no mês seguinte — chato, mas visível: o lançamento reaparece na
 * revisão e você corrige de novo.
 *
 * Errar para o lado barulhento é melhor. Por isso aqui eu removo **só o que é
 * comprovadamente volátil** (a cidade da fatura, o número da conta) e mantenho
 * todo o resto, mesmo correndo o risco de o trecho ficar mais específico do
 * que o necessário.
 *
 * ## E por que isso não precisa ser perfeito
 *
 * Uma maquininha de cartão aparece na frente de comerciantes que não têm nada
 * a ver entre si — ali o nome útil é o **segundo**. Noutra linha, o nome vem
 * primeiro e o resto é o endereço da loja. Nenhuma heurística acerta os dois.
 *
 * Por isso a tela **mostra o trecho** antes de criar a regra, junto com
 * quantos outros pendentes ela pegaria (B3). O que sai daqui é uma proposta,
 * não um veredito.
 */

/**
 * Sufixo de local da fatura, nas duas formas medidas: um campo só com o código
 * (`BRA`, `CA`) ou a cidade e o código juntos (`SAN FRANCISCO CA`,
 * `BELO HORIZONT BRA`).
 */
const SO_O_CODIGO = /^[A-Z]{2,3}$/;
const TERMINA_EM_CODIGO = /\s[A-Z]{2,3}$/;

/**
 * **Um campo só**, nunca dois.
 *
 * Medido: com dois, `ACME  CLOUD SUB  SAN FRANCISCO CA` perdia a cidade e em
 * seguida perdia `CLOUD SUB` também — porque "SUB" tem a mesma cara que "BRA".
 * Nenhuma expressão distingue as duas; o que distingue é a **posição**, e
 * local só existe no fim.
 *
 * Com um campo só, as 23 linhas do cartão saem certas.
 */
const CAMPOS_DE_LOCAL = 1;

/** `Pix enviado: "…"` — o tipo do evento e o conteúdo entre aspas. */
const EVENTO_DA_CONTA = /^([^:]+):\s*"(.*)"\s*$/;

/**
 * O que denuncia uma transferência entre pessoas, em que o trecho útil é o
 * **nome** — e aí a regra certa é do tipo `pessoa` (A3), não de texto.
 */
const PARECE_PESSOA = [
  /^CP\s*:?\s*\d+\s*-/, // Cp :00000000-Fulana
  /^\d{3,}\s+\d{3,}\s+/, // 00019 42357470 Fulana
];

/** Curto demais para ser específico: casaria com meio extrato. */
const MINIMO = 4;

export function trechoEstavel(descricao: string, origem: Origem): string | null {
  // ⚠ O cartão recebe o texto **cru**. `normalizarDescricao` colapsa espaços
  // repetidos, e são justamente eles que separam as colunas da fatura — passar
  // o texto normalizado aqui destrói a estrutura antes de eu poder usá-la.
  // Descoberto medindo: a cidade sobrevivia em todas as 23 linhas do cartão.
  const limpo =
    origem === "csv_cartao"
      ? doCartao(descricao)
      : daConta(normalizarDescricao(descricao));

  if (!limpo || limpo.length < MINIMO) return null;

  // Só dígitos e pontuação não identifica nada — é número de documento.
  if (!/[A-Z]/.test(limpo)) return null;

  return limpo;
}

/**
 * A fatura vem em colunas alinhadas por espaço: comerciante, cidade, país.
 *
 * Corto pelo **fim**, campo a campo, enquanto o campo parecer local. A cidade
 * muda quando você compra na mesma rede em outro lugar; o comerciante, não.
 */
function doCartao(cru: string): string {
  // Corridas de 2+ espaços são a separação de colunas. Um espaço só é parte do
  // nome — `SAN FRANCISCO` é uma cidade, não duas colunas.
  const campos = cru
    .split(/\s{2,}/)
    .map((campo) => normalizarDescricao(campo))
    .filter(Boolean);

  for (let i = 0; i < CAMPOS_DE_LOCAL && campos.length > 1; i++) {
    const ultimo = campos[campos.length - 1];
    if (!SO_O_CODIGO.test(ultimo) && !TERMINA_EM_CODIGO.test(ultimo)) break;
    campos.pop();
  }

  return campos.join(" ").trim();
}

/**
 * O extrato vem como `Tipo do evento: "conteúdo"`.
 *
 * Fico com o conteúdo, que é o que identifica; o tipo do evento é
 * `Pix enviado`, que sozinho classificaria todo Pix igual.
 */
function daConta(texto: string): string | null {
  const evento = EVENTO_DA_CONTA.exec(texto);
  const conteudo = evento ? evento[2].trim() : texto;

  // Transferência entre pessoas: o trecho útil é o nome, e a regra certa é a
  // do tipo `pessoa`. Devolver `CP :00000000-FULANA` como texto criaria uma
  // regra amarrada ao número da conta.
  if (PARECE_PESSOA.some((p) => p.test(conteudo))) return null;

  return conteudo;
}
