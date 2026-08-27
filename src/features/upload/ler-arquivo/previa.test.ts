import { describe, expect, it } from "vitest";
import { EXTRATO_INTER, FATURA_INTER } from "./amostras";
import { decodificar } from "./grade";
import { palpitar, type Palpite } from "./palpite";
import { previaDoMapeamento } from "./previa";

/**
 * A prévia da consequência (spec 11, tarefa A5).
 *
 * ⚠ **A prévia tem de ser o que o import gravaria.** O teste que garante isso é
 * "bate com o import de verdade": ele lê as mesmas amostras pelo caminho oficial
 * (`reconhecer` → `paraLancamentos`) e exige os mesmos números.
 */

function texto(amostra: string): string {
  return decodificar(new TextEncoder().encode(amostra));
}

function palpiteDe(amostra: string): Palpite {
  const p = palpitar(texto(amostra));
  if (!p) throw new Error("o palpite falhou na amostra");
  return p;
}

describe("a frase da consequência", () => {
  it("no extrato: uma entrada e duas saídas", () => {
    const previa = previaDoMapeamento(
      texto(EXTRATO_INTER),
      palpiteDe(EXTRATO_INTER),
    );

    expect(previa.lancamentos).toBe(3);
    expect(previa.entrouCentavos).toBe(120000);
    expect(previa.saiuCentavos).toBe(31819 + 1000);
    expect(previa.ignoradas).toBe(0);
  });

  it("na fatura: tudo gasto, menos o pagamento", () => {
    const previa = previaDoMapeamento(
      texto(FATURA_INTER),
      palpiteDe(FATURA_INTER),
    );

    expect(previa.lancamentos).toBe(3);
    expect(previa.saiuCentavos).toBe(1500 + 16650);
    expect(previa.entrouCentavos).toBe(31819);
  });

  /*
   * ⚠ **É este o teste que a spec chama de "o erro fica visível antes de
   * gravar".** Com o sinal trocado, a mesma fatura passa a dizer que R$ 181,50
   * *entraram* — e a pessoa que não sabe o que é convenção de sinal sabe que
   * não recebeu isso.
   */
  it("trocar o sinal inverte a frase, e é isso que a torna conferível", () => {
    const certo = palpiteDe(FATURA_INTER);
    const trocado: Palpite = { ...certo, sinalNegativo: "saida" };

    const a = previaDoMapeamento(texto(FATURA_INTER), certo);
    const b = previaDoMapeamento(texto(FATURA_INTER), trocado);

    expect(a.saiuCentavos).toBe(b.entrouCentavos);
    expect(a.entrouCentavos).toBe(b.saiuCentavos);
  });

  it("mostra as primeiras linhas já lidas, com data em ISO", () => {
    const previa = previaDoMapeamento(
      texto(EXTRATO_INTER),
      palpiteDe(EXTRATO_INTER),
    );

    expect(previa.amostra[0].data).toBe("2026-06-02");
    expect(previa.amostra[0].descricao).toContain("Pix recebido");
    expect(previa.amostra.length).toBeLessThanOrEqual(5);
  });

  /*
   * A defesa contra a armadilha da data: com a régua errada, o mês muda e nada
   * dá erro. A amostra é o que permite desmentir.
   */
  it("a data lida muda quando a régua muda, e a amostra mostra", () => {
    const certo = palpiteDe(EXTRATO_INTER);
    const trocado: Palpite = { ...certo, formatoData: "mm/dd/aaaa" };

    expect(
      previaDoMapeamento(texto(EXTRATO_INTER), certo).amostra[0].data,
    ).toBe("2026-06-02");
    expect(
      previaDoMapeamento(texto(EXTRATO_INTER), trocado).amostra[0].data,
    ).toBe("2026-02-06");
  });
});

describe("a conferência do saldo", () => {
  it("todas as transições batem no extrato do Inter", () => {
    const previa = previaDoMapeamento(
      texto(EXTRATO_INTER),
      palpiteDe(EXTRATO_INTER),
    );

    expect(previa.saldo).not.toBeNull();
    expect(previa.saldo!.batem).toBe(previa.saldo!.transicoes);
    expect(previa.saldo!.primeiraFalha).toBeNull();
  });

  /*
   * ⚠ **Sem coluna de saldo, ela diz que não deu**, em vez de fingir que
   * conferiu. Fatura de cartão nunca traz saldo, e é a metade dos arquivos.
   */
  it("é null na fatura, que não tem saldo", () => {
    const previa = previaDoMapeamento(
      texto(FATURA_INTER),
      palpiteDe(FATURA_INTER),
    );

    expect(previa.saldo).toBeNull();
  });

  it("reprova um mapeamento que aponta a coluna errada como valor", () => {
    const certo = palpiteDe(EXTRATO_INTER);
    // Trocar valor e saldo de lugar: a aritmética deixa de fechar.
    const trocado: Palpite = {
      ...certo,
      colunas: {
        ...certo.colunas,
        valor: certo.colunas.saldo,
        saldo: certo.colunas.valor,
      },
    };

    const previa = previaDoMapeamento(texto(EXTRATO_INTER), trocado);

    expect(previa.saldo!.batem).toBeLessThan(previa.saldo!.transicoes);
    expect(previa.saldo!.primeiraFalha).not.toBeNull();
  });
});

describe("a prévia bate com o import de verdade", () => {
  /*
   * ⚠ **O teste que justifica a função existir do jeito que existe.** Se a
   * prévia fosse uma segunda conta, ela poderia acertar hoje e divergir amanhã —
   * e a pessoa só descobriria no painel, depois de ter dito "sim".
   */
  it("o palpite sozinho lê as amostras como os formatos de código leriam", async () => {
    const { reconhecer } = await import("./reconhecer");
    const { paraLancamentos } = await import("./lancamentos");

    for (const amostra of [EXTRATO_INTER, FATURA_INTER]) {
      const oficial = reconhecer(new TextEncoder().encode(amostra));
      if (!oficial.ok) throw new Error("a amostra deixou de ser reconhecida");

      const doImport = paraLancamentos(oficial);
      const daPrevia = previaDoMapeamento(texto(amostra), palpiteDe(amostra));

      expect(daPrevia.lancamentos).toBe(doImport.lancamentos.length);
      expect(daPrevia.entrouCentavos).toBe(
        doImport.lancamentos
          .filter((l) => l.direcao === "entrada")
          .reduce((s, l) => s + l.valorCentavos, 0),
      );
      expect(daPrevia.saiuCentavos).toBe(
        doImport.lancamentos
          .filter((l) => l.direcao === "saida")
          .reduce((s, l) => s + l.valorCentavos, 0),
      );
    }
  });
});
