import type { Direcao } from "@/features/upload/ler-arquivo/lancamentos";
import { normalizarDescricao } from "@/features/upload/ler-arquivo/preparar";

/**
 * O casamento de regras (tarefa A1) — o coração determinístico do motor.
 *
 * Puro: sem banco, sem sessão, sem tela. Roda sem custo, sem rede e sem chute,
 * e é o que faz 36 dos 47 lançamentos medidos nascerem já classificados.
 *
 * Reuso deliberado de `normalizarDescricao` (spec 02): duas normalizações
 * diferentes no mesmo produto seriam bem piores que um import entre features —
 * regra criada com uma e casada com a outra deixaria de bater sem ninguém
 * entender por quê.
 */

export type TipoDeRegra = "descricao_contem" | "pessoa" | "valor_direcao";

export type Criterio =
  | { tipo: "descricao_contem"; termo: string }
  /** Casa contra `alvo.pessoa`, que a A3 preenche. */
  | {
      tipo: "pessoa";
      nome: string;
      /**
       * Opcional. Sem ela, casa nos dois sentidos.
       *
       * Existe porque a A5 encontrou duas regras que sem direção classificam
       * errado **em silêncio**: dinheiro que sai para a sua própria outra
       * conta é passagem, e dinheiro que entra pode ser renda; e uma empresa
       * que te paga por Pix não vira "renda" quando **você** paga ela.
       */
      direcao?: Direcao;
    }
  | {
      tipo: "valor_direcao";
      direcao: Direcao;
      /** Inclusivo. "R$ 200 ou mais" é como se fala. */
      minimoCentavos?: number;
      /** Inclusivo. */
      maximoCentavos?: number;
    };

export type Regra = {
  id: string;
  criterio: Criterio;
  categoriaId: string;
  /**
   * **Menor vence** — avaliada antes, como `nice` no Unix.
   *
   * O seed usa 10, 20, 30: buracos de sobra para encaixar regra nova entre
   * duas existentes sem renumerar nada.
   */
  prioridade: number;
};

/**
 * O que o casamento precisa de um lançamento — e nada além.
 *
 * Um `Lancamento` inteiro serviria, mas amarraria a A1 ao formato do leitor de
 * extrato. O motor só precisa destes quatro campos.
 */
export type AlvoDaRegra = {
  descricao: string;
  valorCentavos: number;
  direcao: Direcao;
  /** O outro lado de um Pix. Nulo quando não é transferência — ver A3. */
  pessoa?: string | null;
};

/**
 * Regra que nunca casa é pior do que regra ausente: some sem avisar.
 *
 * Por isso a validade é explícita e testada, em vez de virar um `if` escondido
 * dentro do casamento.
 */
export function regraValida(criterio: Criterio): boolean {
  switch (criterio.tipo) {
    case "descricao_contem":
      // `"".includes("")` é `true`: um termo vazio classificaria o extrato
      // inteiro numa categoria só, silenciosamente.
      return normalizarDescricao(criterio.termo).length > 0;

    case "pessoa":
      return normalizarDescricao(criterio.nome).length > 0;

    case "valor_direcao": {
      const { minimoCentavos: min, maximoCentavos: max } = criterio;
      // Sem nenhum limite ela é "toda saída" — não é uma regra, é um apagão.
      if (min === undefined && max === undefined) return false;
      if (min !== undefined && max !== undefined && min > max) return false;
      return true;
    }
  }
}

/**
 * O comprimento do texto da regra, para o desempate.
 *
 * `valor_direcao` vale **zero** de propósito: numa faixa de valor não há
 * texto, e ela é a mais genérica das três. Empatada em prioridade com qualquer
 * regra de texto, perde.
 */
function especificidade(criterio: Criterio): number {
  switch (criterio.tipo) {
    case "descricao_contem":
      return normalizarDescricao(criterio.termo).length;
    case "pessoa":
      return normalizarDescricao(criterio.nome).length;
    case "valor_direcao":
      return 0;
  }
}

function casa(criterio: Criterio, alvo: AlvoDaRegra): boolean {
  switch (criterio.tipo) {
    case "descricao_contem":
      return normalizarDescricao(alvo.descricao).includes(
        normalizarDescricao(criterio.termo),
      );

    case "pessoa": {
      if (!alvo.pessoa) return false;
      if (criterio.direcao && alvo.direcao !== criterio.direcao) return false;
      return normalizarDescricao(alvo.pessoa).includes(
        normalizarDescricao(criterio.nome),
      );
    }

    case "valor_direcao": {
      if (alvo.direcao !== criterio.direcao) return false;
      const { minimoCentavos: min, maximoCentavos: max } = criterio;
      if (min !== undefined && alvo.valorCentavos < min) return false;
      if (max !== undefined && alvo.valorCentavos > max) return false;
      return true;
    }
  }
}

/**
 * A regra vencedora, ou `null` quando nenhuma bate.
 *
 * `null` não é erro: é o mês normal de quem começou a usar o app ontem, e é o
 * que manda o lançamento para a tela de revisão.
 */
export function casarRegra<T extends Regra>(
  regras: T[],
  alvo: AlvoDaRegra,
): T | null {
  const candidatas = regras.filter(
    (r) => regraValida(r.criterio) && casa(r.criterio, alvo),
  );

  if (candidatas.length === 0) return null;

  const [vencedora] = candidatas.sort((a, b) => {
    if (a.prioridade !== b.prioridade) return a.prioridade - b.prioridade;

    // Empatou na prioridade: a mais específica ganha. `PAGAR ME` perde para
    // `PAGAR ME ESTACIONAMENTO`.
    const espec = especificidade(b.criterio) - especificidade(a.criterio);
    if (espec !== 0) return espec;

    // Empate total: ordeno pelo id para o resultado não depender da ordem em
    // que o banco devolveu as linhas. Duas chamadas iguais têm que dar o mesmo
    // resultado.
    return a.id < b.id ? -1 : 1;
  });

  return vencedora;
}
