import { describe, expect, it } from "vitest";
import { avisoDeApagar, type DestinoDoApagar } from "./aviso";

const mover: DestinoDoApagar = {
  tipo: "mover",
  categoria: "Ônibus",
  outroPote: false,
};
const moverParaOutroPote: DestinoDoApagar = { ...mover, outroPote: true };
const revisao: DestinoDoApagar = { tipo: "revisao" };

describe("avisoDeApagar — nada dentro", () => {
  it("não mostra números zerados", () => {
    // "0 lançamentos e 0 regras" numa frase de susto gasta exatamente a
    // atenção que o aviso de verdade vai precisar no dia em que houver 12 e 2.
    const a = avisoDeApagar({ lancamentos: 0, regras: 0 }, mover);

    expect(a.frase).not.toMatch(/\d/);
    expect(a.alerta).toBeNull();
  });

  it("diz o mesmo independente do destino escolhido", () => {
    const comMover = avisoDeApagar({ lancamentos: 0, regras: 0 }, mover);
    const comRevisao = avisoDeApagar({ lancamentos: 0, regras: 0 }, revisao);

    expect(comMover).toEqual(comRevisao);
  });
});

describe("avisoDeApagar — mover", () => {
  it("conta o que sai e diz para onde vai", () => {
    const a = avisoDeApagar({ lancamentos: 12, regras: 2 }, mover);

    expect(a.frase).toContain("12 lançamentos");
    expect(a.frase).toContain("2 regras");
    expect(a.frase).toContain("Ônibus");
  });

  it("diz que as regras vão junto — sem isso a classificação morreria calada", () => {
    const a = avisoDeApagar({ lancamentos: 12, regras: 2 }, mover);

    expect(a.frase).toContain("regras");
    expect(a.frase).toMatch(/mandar para/);
  });

  it("não promete mover regra quando não há regra", () => {
    const a = avisoDeApagar({ lancamentos: 3, regras: 0 }, mover);

    expect(a.frase).not.toContain("regra");
  });

  it("fala só das regras quando não há lançamento", () => {
    const a = avisoDeApagar({ lancamentos: 0, regras: 2 }, mover);

    expect(a.frase).toContain("2 regras");
    expect(a.frase).not.toContain("lançamento");
  });
});

describe("avisoDeApagar — devolver à revisão", () => {
  it("diz que os lançamentos voltam sem categoria", () => {
    const a = avisoDeApagar({ lancamentos: 12, regras: 0 }, revisao);

    expect(a.frase).toContain("12 lançamentos");
    expect(a.frase).toMatch(/volta/);
  });

  it("diz que as regras são apagadas, e por quê", () => {
    const a = avisoDeApagar({ lancamentos: 12, regras: 2 }, revisao);

    expect(a.frase).toContain("apagadas");
    expect(a.frase).toMatch(/não teriam para onde mandar/);
  });

  it("nunca alerta sobre pote — devolver não manda dinheiro para lugar nenhum", () => {
    expect(
      avisoDeApagar({ lancamentos: 12, regras: 2 }, revisao).alerta,
    ).toBeNull();
  });
});

describe("avisoDeApagar — o alerta de outro pote", () => {
  it("avisa que o passado inteiro muda de pote", () => {
    // Descoberta 4 por outra porta: mandar os lançamentos para uma categoria
    // de outro pote reescreve o rateio de todos os meses, não só do atual.
    const a = avisoDeApagar({ lancamentos: 12, regras: 0 }, moverParaOutroPote);

    expect(a.alerta).not.toBeNull();
    expect(a.alerta).toContain("todos os meses");
  });

  it("cala quando o destino é do mesmo pote", () => {
    expect(
      avisoDeApagar({ lancamentos: 12, regras: 0 }, mover).alerta,
    ).toBeNull();
  });

  it("cala quando não há lançamento para mover", () => {
    // Avisar sobre um estrago que não vai acontecer ensina a ignorar o aviso:
    // zero lançamentos para outro pote não move dinheiro nenhum.
    const a = avisoDeApagar({ lancamentos: 0, regras: 2 }, moverParaOutroPote);

    expect(a.alerta).toBeNull();
  });
});

describe("avisoDeApagar — singular e plural", () => {
  it("um lançamento", () => {
    const a = avisoDeApagar({ lancamentos: 1, regras: 0 }, mover);

    expect(a.frase).toContain("1 lançamento ");
    expect(a.frase).not.toContain("1 lançamentos");
    expect(a.frase).toContain("está");
  });

  it("uma regra", () => {
    const a = avisoDeApagar({ lancamentos: 0, regras: 1 }, revisao);

    expect(a.frase).toContain("1 regra ");
    expect(a.frase).not.toContain("1 regras");
    expect(a.frase).toContain("A regra é apagada");
  });

  it("um de cada continua no plural do verbo", () => {
    const a = avisoDeApagar({ lancamentos: 1, regras: 1 }, mover);

    expect(a.frase).toContain("1 lançamento e 1 regra estão");
  });

  it("um lançamento sozinho para outro pote", () => {
    const a = avisoDeApagar({ lancamentos: 1, regras: 0 }, moverParaOutroPote);

    expect(a.alerta).toContain("este lançamento");
  });
});

describe("avisoDeApagar — os que estão fora do cálculo", () => {
  it("não conta como quem volta para a fila", () => {
    // "12 voltam" seria falso: sair do cálculo foi decisão do Davi e não
    // depende de categoria nenhuma. Falso na confirmação de uma operação
    // destrutiva é o pior lugar possível.
    const a = avisoDeApagar(
      { lancamentos: 12, foraDoCalculo: 1, regras: 0 },
      revisao,
    );

    expect(a.frase).toContain("12 lançamentos estão nesta categoria");
    expect(a.frase).toContain("11 voltam");
    expect(a.frase).toContain("O outro está fora do cálculo");
  });

  it("fala no plural quando há mais de um fora", () => {
    const a = avisoDeApagar(
      { lancamentos: 12, foraDoCalculo: 3, regras: 0 },
      revisao,
    );

    expect(a.frase).toContain("9 voltam");
    expect(a.frase).toContain("Os outros 3 estão fora do cálculo");
  });

  it("não menciona exclusão quando não há nenhuma", () => {
    const a = avisoDeApagar(
      { lancamentos: 12, foraDoCalculo: 0, regras: 0 },
      revisao,
    );

    expect(a.frase).not.toContain("fora do cálculo");
  });

  it("diz a verdade quando todos estão fora", () => {
    const a = avisoDeApagar(
      { lancamentos: 2, foraDoCalculo: 2, regras: 0 },
      revisao,
    );

    expect(a.frase).not.toContain("voltam para a revisão");
    expect(a.frase).toContain("continuam fora");
  });

  it("não muda nada no mover — o excluído vai junto e continua excluído", () => {
    const com = avisoDeApagar(
      { lancamentos: 12, foraDoCalculo: 3, regras: 0 },
      mover,
    );
    const sem = avisoDeApagar({ lancamentos: 12, regras: 0 }, mover);

    expect(com).toEqual(sem);
  });
});
