import { describe, expect, it } from "vitest";
import type { Cobertura } from "@/features/painel/somar-o-mes/cobertura";
import {
  vereditoDoMes,
  type PoteNoVeredito,
  EXCESSO_RELEVANTE_DA_RENDA,
  FATOR_DE_RENDA_DESTOANTE,
} from "./veredito";

const RENDA = 400_000;

const cobertura = (saiuPct: number | null): Cobertura => ({
  saiuPct,
  entrouPct: null,
  completa: saiuPct === 100,
});

const pote = (p: Partial<PoteNoVeredito>): PoteNoVeredito => ({
  nome: "Lazer",
  emoji: "🎉",
  totalCentavos: 0,
  lancamentos: 1,
  metaCentavos: 100_000,
  ...p,
});

const mes = (p: {
  saiuPct?: number | null;
  renda?: number | null;
  saiu?: number;
  potes?: PoteNoVeredito[];
}) => ({
  cobertura: cobertura(p.saiuPct ?? 100),
  rendaDeclaradaCentavos: p.renda === undefined ? RENDA : p.renda,
  saiuCentavos: p.saiu ?? 200_000,
  potes: p.potes ?? [],
});

describe("os dois silêncios", () => {
  it("sem renda declarada não há veredito", () => {
    // Sem meta não há dentro nem fora, e o CampoDeRenda já cobra a renda no
    // topo. Duas cobranças pela mesma coisa fazem ignorar as duas.
    expect(vereditoDoMes(mes({ renda: null }))).toBeNull();
  });

  it("mês em que nada saiu não é mês que fechou dentro", () => {
    /*
     * O caso que não estava na spec: sem esta recusa, um extrato ainda não
     * enviado atravessaria os três degraus e receberia "o mês fechou dentro do
     * plano" — elogio por ausência de dado.
     */
    expect(
      vereditoDoMes(mes({ saiu: 0, saiuPct: null, potes: [] })),
    ).toBeNull();
  });

  it("silencia mesmo com pote estourado, se nada saiu segundo a cobertura", () => {
    const r = vereditoDoMes(
      mes({
        saiu: 0,
        saiuPct: null,
        potes: [pote({ totalCentavos: 900_000 })],
      }),
    );

    expect(r).toBeNull();
  });
});

describe("degrau 1 — a cobertura manda revisar, e para aí", () => {
  it("abaixo do limiar, manda revisar", () => {
    const r = vereditoDoMes(mes({ saiuPct: 89 }));

    expect(r?.grau).toBe("revisar");
    expect(r?.frase).toContain("89%");
  });

  it("no limiar exato, não manda revisar", () => {
    expect(vereditoDoMes(mes({ saiuPct: 90 }))?.grau).not.toBe("revisar");
  });

  it("ganha do estouro de pote e da renda destoante", () => {
    /*
     * A prova de que a ordem existe: aqui os três degraus se aplicam ao mesmo
     * tempo, e só o primeiro fala. É o contrário do motor ingênuo que a
     * descoberta 2 mostrou dando "você estourou cinco potes" todo mês.
     */
    const r = vereditoDoMes(
      mes({
        saiuPct: 40,
        saiu: RENDA * 3,
        potes: [pote({ totalCentavos: 900_000 })],
      }),
    );

    expect(r?.grau).toBe("revisar");
  });
});

describe("degrau 2 — a renda, perguntada e não afirmada", () => {
  it("no fator exato não dispara", () => {
    const r = vereditoDoMes(mes({ saiu: RENDA * FATOR_DE_RENDA_DESTOANTE }));
    expect(r?.grau).not.toBe("renda");
  });

  it("um centavo acima do fator dispara", () => {
    const r = vereditoDoMes(
      mes({ saiu: RENDA * FATOR_DE_RENDA_DESTOANTE + 1 }),
    );
    expect(r?.grau).toBe("renda");
  });

  it("mostra os dois valores e termina em pergunta", () => {
    const r = vereditoDoMes(mes({ saiu: 1_240_000, renda: 400_000 }));

    expect(r?.frase).toContain("R$ 12.400,00");
    expect(r?.frase).toContain("R$ 4.000,00");
    expect(r?.frase.endsWith("A renda mudou?")).toBe(true);
  });

  it("não mostra o múltiplo", () => {
    // "3,1× a sua renda" carrega o julgamento que a pergunta evita.
    const r = vereditoDoMes(mes({ saiu: 1_240_000, renda: 400_000 }));

    expect(r?.frase).not.toContain("×");
    expect(r?.frase).not.toContain("x a sua renda");
  });

  it("ganha do estouro de pote", () => {
    const r = vereditoDoMes(
      mes({
        saiu: RENDA * 3,
        potes: [pote({ totalCentavos: 900_000 })],
      }),
    );

    expect(r?.grau).toBe("renda");
  });
});

describe("degrau 3 — o pote que destoou", () => {
  it("escolhe pelo dinheiro, não pela porcentagem", () => {
    /*
     * "Assinaturas" está em 700% da meta; "Casa" está em 150%. O de maior
     * porcentagem é o de meta pequena — e o mês não foi embora nele.
     */
    const r = vereditoDoMes(
      mes({
        potes: [
          pote({
            nome: "Assinaturas",
            emoji: "📺",
            metaCentavos: 10_000,
            totalCentavos: 70_000,
          }),
          pote({
            nome: "Casa",
            emoji: "🏠",
            metaCentavos: 200_000,
            totalCentavos: 300_000,
          }),
        ],
      }),
    );

    expect(r?.grau).toBe("pote");
    expect(r?.frase).toContain("Casa");
    expect(r?.frase).toContain("R$ 1.000,00");
  });

  it("estouro pequeno demais não vira veredito", () => {
    // Acima da meta, mas por menos de 5% da renda: verdade sem importância.
    const piso = RENDA * EXCESSO_RELEVANTE_DA_RENDA;
    const r = vereditoDoMes(
      mes({
        potes: [
          pote({ metaCentavos: 100_000, totalCentavos: 100_000 + piso - 1 }),
        ],
      }),
    );

    expect(r?.grau).toBe("dentro");
  });

  it("no piso exato, vira veredito", () => {
    const piso = RENDA * EXCESSO_RELEVANTE_DA_RENDA;
    const r = vereditoDoMes(
      mes({
        potes: [pote({ metaCentavos: 100_000, totalCentavos: 100_000 + piso })],
      }),
    );

    expect(r?.grau).toBe("pote");
  });

  it("pote sem meta nunca é candidato", () => {
    // Descoberta 3: Manutenção e Outros/Repasses nascem sem percentual. Não
    // fecharam fora; não têm fora.
    const r = vereditoDoMes(
      mes({
        potes: [
          pote({
            nome: "Outros",
            metaCentavos: null,
            totalCentavos: 5_000_000,
          }),
        ],
      }),
    );

    expect(r?.grau).toBe("dentro");
    expect(r?.frase).toContain("nenhum pote passou da meta");
  });

  it("pote negativo nunca é candidato", () => {
    const r = vereditoDoMes(
      mes({ potes: [pote({ totalCentavos: -50_000, metaCentavos: 1 })] }),
    );

    expect(r?.grau).toBe("dentro");
  });

  it("pote vazio nunca é candidato", () => {
    const r = vereditoDoMes(
      mes({
        potes: [
          pote({ lancamentos: 0, totalCentavos: 900_000, metaCentavos: 1 }),
        ],
      }),
    );

    expect(r?.grau).toBe("dentro");
  });

  it("empate no excesso fica com o primeiro", () => {
    const r = vereditoDoMes(
      mes({
        potes: [
          pote({ nome: "Primeiro", metaCentavos: 100_000, totalCentavos: 200_000 }),
          pote({ nome: "Segundo", metaCentavos: 300_000, totalCentavos: 400_000 }),
        ],
      }),
    );

    expect(r?.frase).toContain("Primeiro");
  });
});

describe("degrau 4 — fechar dentro também é veredito", () => {
  it("sem nenhum pote acima, diz que nenhum passou", () => {
    const r = vereditoDoMes(
      mes({ potes: [pote({ totalCentavos: 50_000, metaCentavos: 100_000 })] }),
    );

    expect(r?.grau).toBe("dentro");
    expect(r?.frase).toContain("nenhum pote passou da meta");
  });

  it("com pote acima por pouco, muda a frase sem mudar o grau", () => {
    /*
     * Dizer "nenhum pote passou da meta" aqui seria mentira medida — um passou,
     * só que por pouco.
     */
    const r = vereditoDoMes(
      mes({ potes: [pote({ metaCentavos: 100_000, totalCentavos: 108_000 })] }),
    );

    expect(r?.grau).toBe("dentro");
    expect(r?.frase).toContain("perto do plano");
    expect(r?.frase).not.toContain("nenhum pote passou da meta");
  });
});
