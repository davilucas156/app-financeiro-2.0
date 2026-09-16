import { describe, expect, it } from "vitest";
import { foraDaConta, type LinhaForaDaConta } from "./foraDaConta";

let n = 0;

const linha = (p: Partial<LinhaForaDaConta> = {}): LinhaForaDaConta => {
  const i = ++n;
  return {
    id: `t${i}`,
    data: "2026-08-28",
    descricao: "ALGUMA COISA",
    valorCentavos: 30000,
    direcao: "entrada",
    status: "excluido",
    motivo: null,
    impressao: `imp${i}`,
    parDe: null,
    ...p,
  };
};

/** Os dois lados de um par, apontando um para o outro. */
function par(p: Partial<LinhaForaDaConta> = {}): LinhaForaDaConta[] {
  const a = linha({
    impressao: "A",
    parDe: "B",
    direcao: "entrada",
    data: "2026-08-28",
    descricao: "Pix recebido",
    motivo: "repasse anulado — o mesmo valor saiu em 2026-08-30",
    ...p,
  });
  const b = linha({
    impressao: "B",
    parDe: "A",
    direcao: "saida",
    data: "2026-08-30",
    descricao: "Pix enviado",
    motivo: "repasse anulado — o mesmo valor entrou em 2026-08-28",
    valorCentavos: a.valorCentavos,
  });
  return [a, b];
}

describe("foraDaConta", () => {
  it("junta os dois lados num par só", () => {
    const r = foraDaConta(par());

    expect(r.pares).toHaveLength(1);
    expect(r.pares[0].lados).toHaveLength(2);
    expect(r.pares[0].valorCentavos).toBe(30000);
  });

  it("os lados saem em ordem de data", () => {
    // A frase que a tela monta é "entrou no dia 28, saiu no dia 30". Fora de
    // ordem ela contaria a história ao contrário.
    const r = foraDaConta(par().reverse());

    expect(r.pares[0].lados.map((l) => l.data)).toEqual([
      "2026-08-28",
      "2026-08-30",
    ]);
  });

  /*
   * ⚠ O número que motivou a tela inteira.
   *
   * Em agosto, R$ 300 de repasse fizeram as entradas do mês parecerem
   * R$ 1.800. Somar este valor de volta tem de dar o que o extrato do banco
   * mostra — o banco não sabe o que é repasse.
   */
  it("diz quanto foi anulado de cada lado", () => {
    const r = foraDaConta(par());

    expect(r.entradaAnuladaCentavos).toBe(30000);
    expect(r.saidaAnuladaCentavos).toBe(30000);
  });

  it("o par que atravessa o mês aparece com um lado só", () => {
    // Só o lado novo recebe `parDe`; o antigo fica intacto no mês anterior.
    const [a] = par();

    const r = foraDaConta([a]);

    expect(r.pares).toHaveLength(1);
    expect(r.pares[0].lados).toHaveLength(1);
    expect(r.pares[0].motivo).toContain("2026-08-30");
    expect(r.entradaAnuladaCentavos).toBe(30000);
    expect(r.saidaAnuladaCentavos).toBe(0);
  });

  it("cada par aparece uma vez, não uma por lado", () => {
    const r = foraDaConta([...par(), ...par()]);
    expect(r.pares).toHaveLength(1);
  });

  it("pagamento de fatura é contado, não listado", () => {
    const r = foraDaConta([
      linha({
        direcao: "saida",
        valorCentavos: 31819,
        motivo: "pagamento da fatura",
      }),
      linha({
        direcao: "saida",
        valorCentavos: 31819,
        motivo: "pagamento da fatura",
      }),
    ]);

    expect(r.pares).toHaveLength(0);
    expect(r.passagens).toEqual({ quantas: 2, totalCentavos: 63638 });
    // Passagem não é anulação: ela nunca foi dinheiro do mês.
    expect(r.saidaAnuladaCentavos).toBe(0);
  });

  it("o que está na conta do mês não aparece aqui", () => {
    const r = foraDaConta([
      linha({ status: "importado" }),
      linha({ status: "revisao_pendente" }),
    ]);

    expect(r.pares).toHaveLength(0);
    expect(r.passagens.quantas).toBe(0);
  });

  it("mês sem nada fora da conta devolve tudo zerado", () => {
    expect(foraDaConta([])).toEqual({
      pares: [],
      passagens: { quantas: 0, totalCentavos: 0 },
      entradaAnuladaCentavos: 0,
      saidaAnuladaCentavos: 0,
    });
  });

  it("a chave do par é estável, e é a do lado mais antigo", () => {
    // A tela usa ela como `key` e como alvo do "trazer de volta". Um índice
    // mudaria quando outro par fosse desfeito, e o botão apontaria para o par
    // errado.
    const r = foraDaConta(par());
    const invertido = foraDaConta(par().reverse());

    expect(r.pares[0].chave).toBe("A");
    expect(invertido.pares[0].chave).toBe("A");
  });

  it("dois pares de valores diferentes não se misturam", () => {
    const grande = par({ valorCentavos: 90000 });
    grande[0].impressao = "C";
    grande[0].parDe = "D";
    grande[1].impressao = "D";
    grande[1].parDe = "C";

    const r = foraDaConta([...par(), ...grande]);

    expect(r.pares).toHaveLength(2);
    expect(r.pares.map((p) => p.valorCentavos).sort()).toEqual([30000, 90000]);
  });
});
