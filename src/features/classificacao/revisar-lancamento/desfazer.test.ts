import { describe, expect, it } from "vitest";
import { avisoDoVoltar, type PodeVoltar } from "./desfazer";

const sombra = (extra: Partial<PodeVoltar> = {}): PodeVoltar => ({
  descricao: "PADARIA CEU AZUL BETIM BRA",
  regraCriada: false,
  irmaos: 0,
  ...extra,
});

describe("o aviso do Voltar (D6)", () => {
  it("não diz nada quando não há o que voltar", () => {
    expect(avisoDoVoltar(null)).toBeNull();
  });

  it("não diz nada quando a decisão anterior não criou regra", () => {
    // Decisão sem regra desfaz inteira, sem sobra. Um aviso aqui não
    // explicaria nada — só gastaria a atenção que o aviso de verdade precisa.
    expect(avisoDoVoltar(sombra())).toBeNull();
  });

  it("avisa que a regra fica, mesmo quando ela não pegou mais ninguém", () => {
    const aviso = avisoDoVoltar(sombra({ regraCriada: true }));

    expect(aviso).toContain("continua valendo");
    // Sem irmãos, não inventa número nenhum.
    expect(aviso).not.toMatch(/\d/);
  });

  it("diz quantos irmãos seguem classificados", () => {
    expect(avisoDoVoltar(sombra({ regraCriada: true, irmaos: 4 }))).toContain(
      "os outros 4 que ela pegou seguem classificados",
    );
  });

  it("fala no singular quando é um só", () => {
    const aviso = avisoDoVoltar(sombra({ regraCriada: true, irmaos: 1 }));

    expect(aviso).toContain("o outro que ela pegou segue classificado.");
    expect(aviso).not.toContain("os outros 1");
  });
});
