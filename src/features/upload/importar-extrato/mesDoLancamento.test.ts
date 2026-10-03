import { describe, expect, it } from "vitest";
import { mesDoLancamento } from "./mesDoLancamento";

describe("mesDoLancamento", () => {
  describe("extrato da conta", () => {
    it("usa o mês da data, e não o escolhido na tela", () => {
      const mes = mesDoLancamento(
        { origem: "csv_conta", data: "2026-07-01", parcela: null },
        "2026-06",
      );

      expect(mes).toBe("2026-07");
    });

    /*
     * O arquivo do Inter vai de dia 2 a dia 2. As duas linhas da ponta são de
     * julho, e é por isso que elas criam uma aba de julho no painel com dois
     * dias de movimento — comportamento correto, e surpreendente o bastante
     * para ter teste.
     */
    it("manda as duas linhas da ponta do extrato para o mês seguinte", () => {
      const ponta = ["2026-07-01", "2026-07-02"].map((data) =>
        mesDoLancamento(
          { origem: "csv_conta", data, parcela: null },
          "2026-06",
        ),
      );

      expect(ponta).toEqual(["2026-07", "2026-07"]);
    });
  });

  describe("cartão", () => {
    /*
     * O caso que o Davi mediu: a fatura que vence em outubro traz as compras
     * de setembro, e elas iam todas para outubro.
     */
    it("manda a compra à vista para o mês da compra, não o da fatura", () => {
      const mes = mesDoLancamento(
        { origem: "csv_cartao", data: "2026-09-15", parcela: null },
        "2026-10",
      );

      expect(mes).toBe("2026-09");
    });

    it("manda a compra do fim do mês anterior para aquele mês", () => {
      const mes = mesDoLancamento(
        { origem: "csv_cartao", data: "2026-08-28", parcela: null },
        "2026-10",
      );

      expect(mes).toBe("2026-08");
    });

    /*
     * ⚠ A assimetria é o ponto, e não um esquecimento: a `data` da parcela é a
     * da compra original. Pelo mês dela, março mudaria de total doze vezes.
     */
    it("deixa a parcela no mês da fatura que a cobrou", () => {
      const mes = mesDoLancamento(
        { origem: "csv_cartao", data: "2026-03-10", parcela: "4/12" },
        "2026-10",
      );

      expect(mes).toBe("2026-10");
    });

    it("trata a primeira parcela como parcela, e não como à vista", () => {
      const mes = mesDoLancamento(
        { origem: "csv_cartao", data: "2026-09-20", parcela: "1/12" },
        "2026-10",
      );

      expect(mes).toBe("2026-10");
    });
  });
});
