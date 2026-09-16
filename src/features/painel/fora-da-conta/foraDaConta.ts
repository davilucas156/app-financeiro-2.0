import type { Direcao } from "@/features/upload/ler-arquivo/lancamentos";

/**
 * O dinheiro que saiu da conta do mês, e por quê.
 *
 * ## Por que esta tela existe
 *
 * O par que se anula passou a sair da conta sozinho (`marcarParesQueSeAnulam`).
 * Isso conserta o número — um repasse que entrou e saiu deixava as entradas do
 * mês infladas nos dois lados — e cria um problema novo: dinheiro que some sem
 * deixar rastro é pior do que dinheiro contado errado. Pelo menos o número
 * errado dá para conferir contra o extrato.
 *
 * Então o painel para de esconder o `excluido`, que era o comportamento até
 * aqui (`painelDoMes.service.ts` filtrava `status !== "excluido"` e nunca mais
 * mostrava aquelas linhas em lugar nenhum do app).
 *
 * ## Os dois tipos de ausência não merecem o mesmo espaço
 *
 * **O par anulado** é listado lançamento a lançamento, com os dois lados e o
 * valor. É ele que pode estar errado — salário e aluguel do mesmo valor na
 * mesma semana viram um par falso —, e é de lá que sai o "trazer de volta".
 *
 * **A passagem** (pagamento de fatura) é contada, não listada. Acontece todo
 * mês, sempre pelo mesmo motivo, e nunca esteve em dúvida. Listar linha a
 * linha enterraria o par anulado no meio do que é rotina.
 */

export type LinhaForaDaConta = {
  id: string;
  data: string;
  descricao: string;
  valorCentavos: number;
  direcao: Direcao;
  status: "importado" | "revisao_pendente" | "excluido";
  motivo: string | null;
  impressao: string;
  /** A impressão do outro lado. Só o par anulado tem. */
  parDe: string | null;
};

export type LadoDoPar = {
  id: string;
  data: string;
  descricao: string;
  direcao: Direcao;
};

export type ParAnulado = {
  /**
   * A impressão do lado mais antigo — identidade estável do par na tela.
   *
   * Estável importa: a tela usa isto como `key` do React e como alvo do
   * "trazer de volta". Um índice mudaria quando outro par fosse desfeito, e o
   * botão passaria a apontar para o par errado.
   */
  chave: string;
  valorCentavos: number;
  /**
   * Um ou dois. **Dois** é o caso normal. **Um** acontece quando o par
   * atravessa o mês: o outro lado existe, está gravado, mas cai no mês
   * anterior ou no seguinte — e aí é o `motivo` que diz onde ele está.
   */
  lados: LadoDoPar[];
  motivo: string;
};

export type ForaDaConta = {
  pares: ParAnulado[];
  /** Pagamento de fatura e afins: contados, não listados. */
  passagens: { quantas: number; totalCentavos: number };
  /**
   * Quanto os pares tiraram de cada lado do mês.
   *
   * ⚠ **`entradaAnulada` é o número que motivou tudo isto.** Era ele que
   * mentia: R$ 300 de repasse faziam as entradas de agosto parecerem R$ 1.800.
   * Mostrá-lo aqui é o que permite somar de volta e bater com o extrato do
   * banco, que não sabe o que é repasse.
   */
  entradaAnuladaCentavos: number;
  saidaAnuladaCentavos: number;
};

export function foraDaConta(linhas: LinhaForaDaConta[]): ForaDaConta {
  const excluidos = linhas.filter((l) => l.status === "excluido");

  const porImpressao = new Map(excluidos.map((l) => [l.impressao, l]));
  const jaAgrupado = new Set<string>();

  const pares: ParAnulado[] = [];
  let entradaAnuladaCentavos = 0;
  let saidaAnuladaCentavos = 0;

  for (const l of excluidos) {
    if (l.parDe === null || jaAgrupado.has(l.impressao)) continue;

    /*
     * ⚠ O outro lado pode não estar aqui, e isso é normal.
     *
     * No par que atravessa o envio só o lado novo recebe `parDe` — o antigo
     * fica intacto, porque reabri-lo seria reescrever o passado. E mesmo com
     * os dois marcados, o outro pode estar no mês anterior. Nos dois casos o
     * par aparece com um lado só, e o `motivo` nomeia a data do outro.
     */
    const outro = porImpressao.get(l.parDe);

    jaAgrupado.add(l.impressao);
    if (outro) jaAgrupado.add(outro.impressao);

    const lados = (outro ? [l, outro] : [l])
      .slice()
      .sort((a, b) => (a.data < b.data ? -1 : 1))
      .map((x): LadoDoPar => ({
        id: x.id,
        data: x.data,
        descricao: x.descricao,
        direcao: x.direcao,
      }));

    for (const lado of lados) {
      if (lado.direcao === "entrada") entradaAnuladaCentavos += l.valorCentavos;
      else saidaAnuladaCentavos += l.valorCentavos;
    }

    pares.push({
      chave: lados[0].id === l.id ? l.impressao : outro!.impressao,
      valorCentavos: l.valorCentavos,
      lados,
      motivo: l.motivo ?? "repasse anulado",
    });
  }

  const passagens = excluidos.filter((l) => l.parDe === null);

  return {
    // Mais recente primeiro: é o mês que você acabou de importar que você quer
    // conferir, não o começo dele.
    pares: pares.sort((a, b) => (a.lados[0].data > b.lados[0].data ? -1 : 1)),
    passagens: {
      quantas: passagens.length,
      totalCentavos: passagens.reduce((s, l) => s + l.valorCentavos, 0),
    },
    entradaAnuladaCentavos,
    saidaAnuladaCentavos,
  };
}
