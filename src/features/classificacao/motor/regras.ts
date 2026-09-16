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

/**
 * Os dois limites de valor, inclusivos, que os três critérios compartilham.
 *
 * Nos critérios de texto ela é **opcional e estreita**: o texto continua sendo
 * o que identifica, e a faixa só recorta. Em `valor_direcao` ela é a regra
 * inteira, e por isso lá pelo menos um dos dois limites é obrigatório
 * (`regraValida`).
 *
 * ## Por que uma faixa, e não um valor exato
 *
 * A tela de revisão só cria faixa **exata** — `minimo === maximo`, o valor que
 * você acabou de ver. Mas "R$ 300 todo mês" vira "R$ 305" no dia em que a
 * mensalidade sobe, e aí você quer abrir a regra em vez de cadastrar outra.
 * Guardar exato como um caso particular de faixa deixa esse ajuste ser uma
 * edição na `/regras`, e não uma migração de coluna.
 */
export type FaixaDeValor = {
  /** Inclusivo. "R$ 200 ou mais" é como se fala. */
  minimoCentavos?: number;
  /** Inclusivo. */
  maximoCentavos?: number;
};

export type Criterio =
  | ({ tipo: "descricao_contem"; termo: string } & FaixaDeValor)
  /** Casa contra `alvo.pessoa`, que a A3 preenche. */
  | ({
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
    } & FaixaDeValor)
  | ({
      tipo: "valor_direcao";
      direcao: Direcao;
    } & FaixaDeValor);

/**
 * A faixa existe quando **algum** dos dois limites existe.
 *
 * Exportada porque três lugares perguntam a mesma coisa — a validade aqui, a
 * chave em `chaveDaRegra.ts` e a frase que a tela mostra — e a pergunta
 * "`min !== undefined || max !== undefined`" escrita três vezes é o tipo de
 * duplicação que este projeto já pagou caro em outros lugares.
 */
export function temFaixaDeValor(criterio: Criterio): boolean {
  return (
    criterio.minimoCentavos !== undefined ||
    criterio.maximoCentavos !== undefined
  );
}

/**
 * A faixa que **estreita** uma regra — que não é toda faixa.
 *
 * ⚠ **`valor_direcao` não conta, e o teste de desempate é quem cobra isso.**
 * Nele a faixa não é informação a mais, é a regra inteira: sem ela não sobra
 * nada (`regraValida`). Tratar as duas como a mesma coisa fez "toda saída
 * acima de R$ 200" ganhar de `LTDA` — exatamente o contrário do que
 * `especificidade` documenta, e uma regra de faixa larga passaria a
 * atropelar em silêncio todo o resto na mesma prioridade.
 *
 * Numa regra de texto a faixa é um recorte **sobre** o que já identificava:
 * `Davi Lucas` continua sendo o que a regra procura, e o valor é a exceção que
 * você acrescentou olhando o lançamento.
 */
function faixaQueEstreita(criterio: Criterio): boolean {
  return criterio.tipo !== "valor_direcao" && temFaixaDeValor(criterio);
}

function dentroDaFaixa(faixa: FaixaDeValor, valorCentavos: number): boolean {
  const { minimoCentavos: min, maximoCentavos: max } = faixa;
  if (min !== undefined && valorCentavos < min) return false;
  if (max !== undefined && valorCentavos > max) return false;
  return true;
}

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
  // Faixa invertida não casa com valor nenhum — é o mesmo desaparecimento
  // silencioso do termo vazio, pelo outro lado. Vale para os três tipos desde
  // que os critérios de texto também podem ter faixa.
  const { minimoCentavos: min, maximoCentavos: max } = criterio;
  if (min !== undefined && max !== undefined && min > max) return false;

  switch (criterio.tipo) {
    case "descricao_contem":
      // `"".includes("")` é `true`: um termo vazio classificaria o extrato
      // inteiro numa categoria só, silenciosamente.
      return normalizarDescricao(criterio.termo).length > 0;

    case "pessoa":
      return normalizarDescricao(criterio.nome).length > 0;

    case "valor_direcao":
      // Sem nenhum limite ela é "toda saída" — não é uma regra, é um apagão.
      // Nos critérios de texto a mesma ausência é o caso normal: lá quem
      // identifica é o texto.
      return temFaixaDeValor(criterio);
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
  // A faixa vale para os três tipos, e recusa antes de olhar texto: é a
  // comparação mais barata das duas.
  if (!dentroDaFaixa(criterio, alvo.valorCentavos)) return false;

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

    case "valor_direcao":
      return alvo.direcao === criterio.direcao;
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

    /*
     * Empatou na prioridade: **quem tem faixa de valor ganha**.
     *
     * É o que faz a exceção funcionar. `Davi Lucas → Empréstimo` é o padrão;
     * `Davi Lucas + R$ 300,00 → Aluguel` é a exceção, e ela só chegou até aqui
     * porque o valor bateu — informação a mais que a outra não tem.
     *
     * E a rede de segurança sai de graça: quando o valor **não** bate, a regra
     * de faixa nem entra em `candidatas`, e a de nome assume sozinha. Um
     * lançamento nunca fica sem classificação por causa da exceção.
     *
     * Antes do comprimento do texto, de propósito. Faixa é uma restrição que
     * você digitou olhando o lançamento; comprimento é uma heurística sobre
     * qual trecho é mais específico. A escolha deliberada ganha do palpite.
     *
     * `faixaQueEstreita` e não `temFaixaDeValor`: uma `valor_direcao` é toda
     * faixa e continua sendo a mais genérica das três — ver lá.
     */
    const comFaixa =
      Number(faixaQueEstreita(b.criterio)) -
      Number(faixaQueEstreita(a.criterio));
    if (comFaixa !== 0) return comFaixa;

    // Ainda empatado: a mais específica ganha. `PAGAR ME` perde para
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
