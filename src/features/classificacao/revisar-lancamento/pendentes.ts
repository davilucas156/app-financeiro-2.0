import { casarRegra, type Criterio } from "@/features/classificacao/motor/regras";
import { pessoaDe } from "@/features/classificacao/motor/pessoa";
import { criterioDaCorrecao, textoDoCriterio } from "./criterioDaCorrecao";
import {
  sugerir,
  type Classificado,
  type Sugestao,
} from "@/features/classificacao/motor/sugestoes";
import type { Direcao } from "@/features/upload/ler-arquivo/lancamentos";
import type { Origem } from "@/features/upload/ler-arquivo/formatos";

/**
 * O que a tela de revisão precisa saber de cada pendente (tarefa D3).
 *
 * Puro: recebe as linhas do banco já lidas e devolve o que a tela renderiza.
 * O serviço `server-only` faz as consultas e chama isto — mesma separação da
 * D1, e pelo mesmo motivo: o Vitest não atravessa `server-only`, e esta é a
 * camada onde as quatro peças da fase A se encontram.
 */

/** Uma linha de `transactions` que espera decisão. */
export type LancamentoPendente = {
  id: string;
  descricao: string;
  valorCentavos: number;
  direcao: Direcao;
  data: string;
  origem: Origem;
  parcela: string | null;
  categoriaDoBanco: string | null;
  motivo: string | null;
  /**
   * Preenchido quando **uma regra já classificou** e o lançamento ainda pede
   * confirmação — o valor alto da D1. A tela pergunta outra coisa nesse caso:
   * não "onde vai?", e sim "está certo?".
   */
  categoriaId: string | null;
  /** O que a regra procurava, quando veio de regra (C3). */
  regraChave: string | null;
};

export type PendenteParaRevisar = LancamentoPendente & {
  /** A contraparte, quando é transferência (A3). */
  pessoa: string | null;
  /** O texto que a regra vai procurar se você responder "sempre" (A2/A3). */
  trecho: string | null;
  /** Quantos **outros** pendentes deste lote essa regra pegaria junto. */
  pegaJunto: number;
  sugestoes: Sugestao[];
};

export type ContextoDaRevisao = {
  /** O que você já classificou, para a A4 sugerir. */
  historico: Classificado[];
  /** `pote/categoria` → id da categoria no banco. */
  idPorChave: Map<string, string>;
};

export function prepararRevisao(
  pendentes: LancamentoPendente[],
  { historico, idPorChave }: ContextoDaRevisao,
): PendenteParaRevisar[] {
  const comIdentidade = pendentes.map((p) => {
    // ⚠ **O mesmo módulo que o serviço usa para gravar a regra.**
    //
    // Eu tinha escrito os dois separados. Se divergirem, a tela mostra um
    // texto e o banco guarda outro — você aprovaria uma regra e receberia
    // outra, numa pergunta cuja única função é te deixar conferir.
    const criterio = criterioDaCorrecao(p.descricao, p.origem);

    return {
      ...p,
      pessoa: pessoaDe(p.descricao),
      trecho: criterio ? textoDoCriterio(criterio) : null,
      criterio,
    };
  });

  return comIdentidade.map((p) => ({
    ...semCriterio(p),
    pegaJunto: p.criterio ? quantosMaisPega(p, comIdentidade) : 0,
    sugestoes: p.categoriaId
      ? // Já tem categoria: a pergunta é de confirmação, não de escolha.
        // Oferecer sugestões aqui seria convidar a trocar por um palpite pior
        // do que a regra que já bateu.
        []
      : sugerir(
          {
            descricao: p.descricao,
            origem: p.origem,
            pessoa: p.pessoa,
            categoriaDoBanco: p.categoriaDoBanco,
          },
          { historico, idPorChave },
        ),
  }));
}

type ComCriterio = LancamentoPendente & {
  pessoa: string | null;
  trecho: string | null;
  criterio: Criterio | null;
};

function semCriterio(p: ComCriterio) {
  const { criterio: _criterio, ...resto } = p;
  return resto;
}

/**
 * O número que a B3 mostra antes de você confirmar a regra.
 *
 * Ver "isto vai pegar mais 4" antes de tocar em "Sempre" é a diferença entre
 * uma regra boa e uma surpresa em novembro — e é a única defesa contra um
 * trecho curto demais, porque o erro de trecho curto é silencioso.
 *
 * Conta só quem **ainda não tem categoria**: um lançamento que já foi
 * classificado não seria pego pela regra nova.
 */
function quantosMaisPega(alvo: ComCriterio, todos: ComCriterio[]): number {
  const regra = {
    id: "candidata",
    criterio: alvo.criterio!,
    categoriaId: "x",
    prioridade: 0,
  };

  return todos.filter(
    (outro) =>
      outro.id !== alvo.id &&
      !outro.categoriaId &&
      casarRegra([regra], {
        descricao: outro.descricao,
        valorCentavos: outro.valorCentavos,
        direcao: outro.direcao,
        pessoa: outro.pessoa,
      }) !== null,
  ).length;
}
