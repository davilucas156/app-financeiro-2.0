import { describe, expect, it } from "vitest";
import { mesesEPadrao, type MesContado } from "./mesesEPadrao";

/**
 * O que a fileira de abas promete, e o que o painel promete abrir (tarefa A1).
 *
 * Os dois convivem mal — ver o docblock da função. Cada teste daqui é uma das
 * duas metades, e o primeiro é o que impede o defeito da spec 14 de voltar.
 */

const mes = (m: string, comMovimento = 10): MesContado => ({
  mes: m,
  comMovimento,
});

describe("a fileira lê da esquerda para a direita em ordem de tempo", () => {
  /*
   * ⚠ **O teste que segura a correção inteira.**
   *
   * O defeito era um consumidor documentando a ordem que esperava e um
   * produtor mandando outra. Entregar embaralhado prova que a ordem se decide
   * **aqui**, e não na cláusula `orderBy` de quem chama — que é justamente o
   * lugar onde alguém mexeria achando que resolve.
   */
  it("ordena mesmo recebendo a lista embaralhada", () => {
    const { meses } = mesesEPadrao([
      mes("2026-03"),
      mes("2025-12"),
      mes("2026-01"),
      mes("2025-11"),
    ])!;

    expect(meses).toEqual(["2025-11", "2025-12", "2026-01", "2026-03"]);
  });

  it("atravessa a virada do ano na ordem certa", () => {
    const { meses } = mesesEPadrao([mes("2026-01"), mes("2025-12")])!;

    expect(meses).toEqual(["2025-12", "2026-01"]);
  });
});

describe("qual mês abre sozinho", () => {
  /*
   * ⚠ **A metade que puxa para o outro lado.** Ordenar crescente e pegar o
   * primeiro seria a leitura ingênua da fileira — e abriria o painel no mês
   * mais antigo da conta.
   */
  it("é o mais recente, e não o mais antigo", () => {
    const { padrao } = mesesEPadrao([
      mes("2025-12"),
      mes("2026-01"),
      mes("2026-02"),
    ])!;

    expect(padrao).toBe("2026-02");
  });

  /*
   * O caso de campo da spec 04 (D6): o mês existe, aparece na fileira, e não é
   * onde o painel abre — senão a tela abriria zerada com o mês anterior cheio.
   */
  it("pula o mês mais novo quando ele não tem movimento", () => {
    const { meses, padrao } = mesesEPadrao([
      mes("2026-01", 53),
      mes("2026-02", 0),
    ])!;

    expect(padrao).toBe("2026-01");
    expect(meses).toContain("2026-02");
  });

  it("sem nenhum mês com movimento, abre no mais recente de todos", () => {
    const { padrao } = mesesEPadrao([mes("2026-01", 0), mes("2026-02", 0)])!;

    expect(padrao).toBe("2026-02");
  });

  it("com um mês só, a fileira e o padrão concordam", () => {
    const { meses, padrao } = mesesEPadrao([mes("2026-02")])!;

    expect(meses).toEqual(["2026-02"]);
    expect(padrao).toBe("2026-02");
  });
});

/*
 * Não é caso de entrada, é contrato: a `dadosDoPainel` confere o `?mes=` da URL
 * contra `meses` e cai no `padrao`. Um padrão de fora da lista abriria o painel
 * num mês que não tem aba.
 */
it("o padrão está sempre dentro da fileira", () => {
  const entradas: MesContado[][] = [
    [mes("2026-02"), mes("2025-12")],
    [mes("2026-02", 0), mes("2025-12", 0)],
    [mes("2026-01", 7), mes("2026-02", 0)],
    [mes("2026-02")],
  ];

  for (const contados of entradas) {
    const { meses, padrao } = mesesEPadrao(contados)!;

    expect(meses).toContain(padrao);
  }
});

it("conta sem mês nenhum devolve nulo, e isso não é falha", () => {
  expect(mesesEPadrao([])).toBeNull();
});
