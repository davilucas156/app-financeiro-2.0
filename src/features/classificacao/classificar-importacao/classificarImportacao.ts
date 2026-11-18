import { pessoaDe } from "@/features/classificacao/motor/pessoa";
import { casarRegra, type Regra } from "@/features/classificacao/motor/regras";
import {
  statusDoValor,
  VALOR_ALTO_CENTAVOS,
} from "@/features/classificacao/motor/valorAlto";
import type { StatusDoLancamento } from "@/db/schema";
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

/**
 * O que a importação grava em cada lançamento: categoria, procedência e estado.
 *
 * ⚠ **Não é a `Decisao` de `revisar-lancamento`.** Aquela é o que *você*
 * escolhe na tela de revisão; esta é o que o *motor* resolve na importação. Os
 * dois já tiveram o mesmo nome e se confundiam.
 *
 * Os campos anuláveis não impedem combinações sem sentido — por isso
 * `problemaDaClassificacao` confere as invariantes antes de qualquer coisa ir
 * ao banco, em vez de deixar o `CHECK` estourar no meio da gravação.
 */
export type ClassificacaoNaImportacao = {
  categoriaId: string | null;
  classificadoPor: "regra" | null;
  regraId: string | null;
  /** O que a regra procurava, **congelado**. Sobrevive ao apagar dela (C3). */
  regraChave: string | null;
  status: StatusDoLancamento;
  motivo: string | null;
};

export type ResultadoDaClassificacao = {
  /** Uma classificação por lançamento, indexada pela impressão digital. */
  porImpressao: Map<string, ClassificacaoNaImportacao>;
  classificados: number;
  pendentes: number;
  /** Classificados que ainda assim vão passar pela sua vista. */
  conferir: number;
};

export { VALOR_ALTO_CENTAVOS };

/**
 * Erro do **app**, e não do arquivo: o motor produziu uma classificação que o
 * banco recusaria. Tem tipo próprio para a tela dizer isso com todas as letras
 * — "não é o seu arquivo" — em vez de um genérico "não deu certo".
 */
export class ClassificacaoIncoerente extends Error {
  constructor(descricao: string) {
    super(descricao);
    this.name = "ClassificacaoIncoerente";
  }
}

/**
 * Por que esta classificação não poderia ser gravada, ou `null` se pode.
 *
 * Espelha os `CHECK` de `transactions` (`transactions_classificacao_ck` e
 * `transactions_regra_chave_ck`) e acrescenta o que o motor promete além deles:
 * o lançamento classificado por regra carrega a regra **e** a chave congelada, e
 * o excluído não tem categoria.
 */
export function problemaDaClassificacao(
  c: ClassificacaoNaImportacao,
): string | null {
  if ((c.categoriaId === null) !== (c.classificadoPor === null)) {
    return "categoria e procedência têm de vir juntas ou ausentes juntas";
  }

  if (c.regraChave !== null && c.classificadoPor !== "regra") {
    return "só um lançamento classificado por regra pode ter a chave da regra";
  }

  if (c.classificadoPor === "regra" && (c.regraId === null || c.regraChave === null)) {
    return "lançamento classificado por regra precisa da regra e da chave congelada";
  }

  if (c.status === "excluido" && c.categoriaId !== null) {
    return "lançamento excluído do cálculo não pode ter categoria";
  }

  return null;
}

export function classificarImportacao(
  preparados: LancamentoPreparado[],
  regras: RegraAplicavel[],
): ResultadoDaClassificacao {
  const porImpressao = new Map<string, ClassificacaoNaImportacao>();
  let classificados = 0;
  let pendentes = 0;
  let conferir = 0;

  for (const p of preparados) {
    // Excluído (pagamento de fatura) e par que se anula já foram resolvidos
    // na spec 02, e não são decisão de categoria. É o mesmo recorte da
    // medição da A6 — o que permite comparar os dois números.
    //
    // ⚠ O par que se anula era `revisao_pendente` aqui. Virou `excluido`
    // junto com a `Marcacao`, porque `revisao_pendente` continuava somando no
    // painel — ver `marcarParesQueSeAnulam`. O `motivo` é o que explica a
    // ausência na tela de anulados.
    if (p.marcacao === "excluido") {
      porImpressao.set(p.impressao, {
        categoriaId: null,
        classificadoPor: null,
        regraId: null,
        regraChave: null,
        status: "excluido",
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
    const { status, motivo } = statusDoValor(p.valorCentavos);
    if (status === "revisao_pendente") conferir++;

    porImpressao.set(p.impressao, {
      categoriaId: vencedora.categoriaId,
      classificadoPor: "regra",
      regraId: vencedora.id,
      regraChave: vencedora.chave,
      status,
      motivo,
    });
  }

  // Antes de devolver, e portanto antes de qualquer gravação: uma combinação
  // impossível aparece aqui, com o motivo, e não como erro de banco no meio da
  // transação.
  for (const [impressao, classificacao] of porImpressao) {
    const problema = problemaDaClassificacao(classificacao);

    if (problema) {
      throw new ClassificacaoIncoerente(`${problema} (impressão ${impressao})`);
    }
  }

  return { porImpressao, classificados, pendentes, conferir };
}
