import { semAcento } from "@/lib/semAcento";

/**
 * Esta descrição é uma transferência **entre contas suas**?
 *
 * ## Por que existe
 *
 * Dinheiro que você move entre as suas próprias contas não é gasto, renda nem
 * reembolso. O caso que motivou: o salário cai numa conta, vai por Pix para o
 * Inter e de lá para a corretora.
 *
 * ```
 * Pix recebido: "Cp :00000000-<você>"        +R$ 300   ← o dinheiro chegando
 * Transferência enviada: "… <você>"          −R$ 300   ← o aporte de verdade
 * ```
 *
 * Duas leituras erradas eram possíveis, e o app fazia as duas:
 *
 * - **Tratar como reembolso** — o par se anula na importação e o aporte some do
 *   pote, ou, classificado, a entrada abate a saída e o pote zera.
 * - **Tratar como renda** — a entrada infla o "entrou" do mês.
 *
 * O aporte é a **saída**. A entrada é só o dinheiro passando.
 *
 * ## Como reconhece
 *
 * Pelo nome do titular dentro da descrição — o extrato traz o próprio nome do
 * titular nos dois lados da transferência. O nome vem de `users.nome`, que o
 * Clerk preenche.
 *
 * ⚠ **Todas** as palavras do nome precisam aparecer, inteiras. Duas palavras
 * soltas não bastam: "Davi Nogueira" casaria com um primo, e um falso positivo
 * aqui **tira dinheiro real da conta**.
 *
 * ⚠ **Falha para o lado antigo.** Se o Clerk guarda um nome mais curto, mais
 * longo ou diferente do que o banco imprime, nada casa e o comportamento volta a
 * ser o de antes — um par que se anula ou um reembolso. Errar para esse lado é
 * ruim, mas é o erro que já existia e que o painel mostra ("fora da conta").
 * Nunca erra para o lado de esconder dinheiro.
 *
 * Nome com menos de duas palavras significativas **não casa**: "Davi" sozinho
 * está em qualquer descrição de Pix para qualquer Davi.
 */

/** Partículas que o banco corta ou mantém conforme o tamanho do campo. */
const PARTICULAS = new Set(["DE", "DA", "DO", "DAS", "DOS", "E"]);

function palavras(texto: string): string[] {
  return semAcento(texto)
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((p) => p.length > 0);
}

export function ehTransferenciaPropria(
  descricao: string,
  titular: string | null | undefined,
): boolean {
  if (!titular) return false;

  const doNome = palavras(titular).filter((p) => !PARTICULAS.has(p));
  if (doNome.length < 2) return false;

  const naDescricao = new Set(palavras(descricao));

  return doNome.every((p) => naDescricao.has(p));
}
