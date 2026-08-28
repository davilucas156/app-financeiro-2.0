import { describe, expect, it } from "vitest";
import { POTES_PADRAO } from "@/features/onboarding/potes-padrao";
import { somaDasMetas } from "./somaDasMetas";

const gasto = (percentual: number | null) =>
  ({ tipo: "gasto", percentual }) as const;

describe("a semente fecha em 100", () => {
  /*
   * ⚠ **Contra `potes-padrao.ts`, e não contra uma lista escrita aqui.**
   *
   * Escrever 30/25/15/15/10/5 no teste provaria que a função soma — que é o
   * que ela menos precisa provar. Lendo a semente, o teste também guarda a
   * semente: mexer nos percentuais do onboarding sem querer reprova aqui.
   */
  it("os potes do onboarding somam 100% e são seis", () => {
    const { soma, potesComMeta, frase } = somaDasMetas(POTES_PADRAO);

    expect(soma).toBe(100);
    expect(potesComMeta).toBe(6);
    expect(frase).toBe("Seus potes somam 100% da renda.");
  });
});

describe("sem meta é ausência, não zero", () => {
  it("conta sem meta nenhuma tem frase própria", () => {
    const r = somaDasMetas([gasto(null), gasto(null)]);

    expect(r.soma).toBe(0);
    expect(r.potesComMeta).toBe(0);
    expect(r.frase).toBe(
      "Nenhum pote tem meta — o painel não vai julgar nada.",
    );
  });

  /*
   * ⚠ Somar `null` como zero daria a **mesma soma** e a contagem errada — e é
   * a contagem que separa "ninguém tem meta" de "todo mundo tem meta zero".
   */
  it("um pote com zero não é o mesmo que nenhum pote com meta", () => {
    const zerado = somaDasMetas([gasto(0)]);

    expect(zerado.soma).toBe(0);
    expect(zerado.potesComMeta).toBe(1);
    expect(zerado.frase).not.toBe(somaDasMetas([gasto(null)]).frase);
  });
});

describe("as frases dizem a consequência", () => {
  it("abaixo de 100, nomeia o que sobra", () => {
    expect(somaDasMetas([gasto(30), gasto(20)]).frase).toBe(
      "Seus potes somam 50% da renda — sobram 50% sem destino.",
    );
  });

  it("acima de 100, diz que pedem mais do que entra", () => {
    const r = somaDasMetas([gasto(250)]);

    expect(r.soma).toBe(250);
    expect(r.frase).toBe(
      "Seus potes somam 250% da renda — juntos, pedem mais do que entra.",
    );
  });

  /*
   * A Pendência 3 da spec, como teste: a função **não tem** como reprovar.
   * Nenhuma frase manda corrigir, e nenhuma entrada produz erro.
   */
  it("nenhuma frase manda o usuário corrigir nada", () => {
    const frases = [
      somaDasMetas([]).frase,
      somaDasMetas([gasto(50)]).frase,
      somaDasMetas([gasto(100)]).frase,
      somaDasMetas([gasto(250)]).frase,
    ];

    for (const frase of frases) {
      expect(frase).not.toMatch(/erro|inválid|corrij|precisa somar/i);
    }
  });
});

describe("o que fica de fora da soma", () => {
  it("o pote de renda não entra, mesmo com percentual gravado", () => {
    const r = somaDasMetas([
      gasto(30),
      { tipo: "renda", percentual: 70 },
      gasto(null),
    ]);

    expect(r.soma).toBe(30);
    expect(r.potesComMeta).toBe(1);
  });

  it("conta sem pote nenhum não divide por zero nem quebra", () => {
    const r = somaDasMetas([]);

    expect(r).toEqual({
      soma: 0,
      potesComMeta: 0,
      frase: "Nenhum pote tem meta — o painel não vai julgar nada.",
    });
  });
});
