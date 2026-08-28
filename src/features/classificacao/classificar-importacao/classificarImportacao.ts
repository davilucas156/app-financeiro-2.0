import { pessoaDe } from "@/features/classificacao/motor/pessoa";
import { casarRegra, type Regra } from "@/features/classificacao/motor/regras";
import type { LancamentoPreparado } from "@/features/upload/ler-arquivo/preparar";

/**
 * O motor decidindo, no momento da importação (tarefa D1).
 *
 * ## Por que isto é puro e mora fora do serviço
 *
 * `importarExtrato.service.ts` é `server-only` — o Vitest não chega nele. Se a
 * decisão morasse lá dentro, ela seria a única peça do motor sem teste, e
 * justamente a que junta todas as outras.
 *
 * Mesmo movimento de `exibirEnvio.ts` na spec 02. E o harness da A6 usa **este**
 * módulo: antes ele reimplementava o que a importação faz, e as duas versões
 * podiam divergir sem ninguém notar — a medição continuaria verde, medindo
 * código que ninguém executa.
 */

/** Uma regra do banco, com a chave que vai ser congelada na procedência. */
export type RegraAplicavel = Regra & { chave: string };

export type StatusDoLancamento = "importado" | "revisao_pendente" | "excluido";

export type Decisao = {
  categoriaId: string | null;
  classificadoPor: "regra" | null;
  regraId: string | null;
  /** O que a regra procurava, **congelado**. Sobrevive ao apagar dela (C3). */
  regraChave: string | null;
  status: StatusDoLancamento;
  motivo: string | null;
};

export type ResultadoDaClassificacao = {
  /** Uma decisão por lançamento, indexada pela impressão digital. */
  porImpressao: Map<string, Decisao>;
  classificados: number;
  pendentes: number;
  /** Classificados que ainda assim vão passar pela sua vista. */
  conferir: number;
};

/**
 * R$ 200 — do `readme.md`, seção 7, e é o número que o painel usa hoje.
 *
 * Uma regra errada num valor alto é o erro mais caro que existe aqui, e é o
 * mais fácil de não notar: some no meio de trinta lançamentos certos.
 */
export const VALOR_ALTO_CENTAVOS = 20_000;

const MOTIVO_VALOR_ALTO = "valor alto — confira se a categoria está certa";

export function classificarImportacao(
  preparados: LancamentoPreparado[],
  regras: RegraAplicavel[],
): ResultadoDaClassificacao {
  const porImpressao = new Map<string, Decisao>();
  let classificados = 0;
  let pendentes = 0;
  let conferir = 0;

  for (const p of preparados) {
    // Excluído (pagamento de fatura) e par que se anula já foram resolvidos
    // na spec 02, e não são decisão de categoria. É o mesmo recorte da
    // medição da A6 — o que permite comparar os dois números.
    if (p.marcacao !== "normal") {
      porImpressao.set(p.impressao, {
        categoriaId: null,
        classificadoPor: null,
        regraId: null,
        regraChave: null,
        status: p.marcacao === "excluido" ? "excluido" : "revisao_pendente",
        motivo: p.motivo,
      });
      continue;
    }

    const vencedora = casarRegra(regras, {
      descricao: p.descricao,
      valorCentavos: p.valorCentavos,
      direcao: p.direcao,
      pessoa: pessoaDe(p.descricao),
    });

    if (!vencedora) {
      pendentes++;
      porImpressao.set(p.impressao, {
        categoriaId: null,
        classificadoPor: null,
        regraId: null,
        regraChave: null,
        status: "importado",
        motivo: null,
      });
      continue;
    }

    classificados++;

    // Valor alto passa pela sua vista **mesmo tendo batido**. A categoria fica
    // gravada — a regra bateu de verdade —, mas o status pede confirmação.
    //
    // `/revisao` já lida com `revisao_pendente` por causa dos pares que se
    // anulam. São dois tipos de pendência e a diferença é visível: um não tem
    // categoria e pede escolha, o outro tem e pede confirmação.
    const alto = p.valorCentavos >= VALOR_ALTO_CENTAVOS;
    if (alto) conferir++;

    porImpressao.set(p.impressao, {
      categoriaId: vencedora.categoriaId,
      classificadoPor: "regra",
      regraId: vencedora.id,
      regraChave: vencedora.chave,
      status: alto ? "revisao_pendente" : "importado",
      motivo: alto ? MOTIVO_VALOR_ALTO : null,
    });
  }

  return { porImpressao, classificados, pendentes, conferir };
}
