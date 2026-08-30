/**
 * Quais meses a fileira mostra, e qual deles abre sozinho (tarefa A1).
 *
 * ## Duas perguntas que puxam para lados opostos
 *
 * **A fileira** é lida da esquerda para a direita, então ela quer os meses do
 * mais antigo ao mais novo — é assim que o tempo corre para quem lê.
 *
 * **O padrão** é o mês mais **recente** com movimento. A razão é de campo
 * (spec 04, D6): uma conta real tinha um mês com um único lançamento, e ele era
 * um pagamento de fatura — `excluido` desde a spec 02. O painel abria ali e
 * mostrava uma tela zerada, enquanto o mês anterior tinha dezenas de
 * lançamentos. "Abre no mês atual lançado" quer dizer o mês que tem o que
 * mostrar, e não o mês onde sobrou uma linha que a própria importação já tirou
 * do cálculo.
 *
 * ⚠ **É por isso que esta função existe.** Enquanto as duas respostas saíam da
 * mesma lista ordenada pela consulta, atender uma era desatender a outra: a
 * fileira lia o tempo de trás para frente, e trocar o `desc` por `asc` teria
 * feito o painel abrir no mês mais antigo — sem erro, sem teste vermelho.
 *
 * ## Ela não confia na ordem que recebe, e isso é o ponto
 *
 * O defeito que ela conserta era um consumidor documentando a ordem que
 * esperava e um produtor mandando outra, sem nada no meio conferindo. Um
 * parâmetro chamado `doMaisNovoAoMaisVelho` seria a mesma promessa não
 * verificada, mudada de arquivo. Aqui a ordem é imposta por dentro, e `YYYY-MM`
 * ordena alfabeticamente na mesma ordem em que ordena no tempo — que é o que a
 * spec 02 comprou ao guardar mês como string.
 */

export type MesContado = {
  /** `YYYY-MM`. */
  mes: string;
  /** Lançamentos que entram na conta: os `excluido` não são contados aqui. */
  comMovimento: number;
};

export type MesesDoPainel = {
  /** Do mais antigo ao mais novo — a ordem em que a fileira de abas é lida. */
  meses: string[];
  /**
   * O mês que abre sozinho.
   *
   * ⚠ Está sempre **dentro** de `meses`: a `dadosDoPainel` confere o `?mes=` da
   * URL contra a lista e cai neste valor, e um padrão de fora dela abriria o
   * painel num mês sem aba.
   */
  padrao: string;
};

/**
 * `null` é a conta que ainda não importou nada — não é falha. A rota já sabe
 * mostrar essa tela.
 */
export function mesesEPadrao(contados: MesContado[]): MesesDoPainel | null {
  if (contados.length === 0) return null;

  const emOrdem = [...contados].sort((a, b) => a.mes.localeCompare(b.mes));

  /*
   * O seletor mostra **todos** os meses: um mês só de pagamento de fatura
   * existe, e esconder da navegação seria negar que ele existe. O que muda é
   * qual deles abre sozinho.
   */
  const meses = emOrdem.map((m) => m.mes);

  const ultimoComMovimento = emOrdem.findLast((m) => m.comMovimento > 0);

  return {
    meses,
    padrao: (ultimoComMovimento ?? emOrdem[emOrdem.length - 1]).mes,
  };
}
