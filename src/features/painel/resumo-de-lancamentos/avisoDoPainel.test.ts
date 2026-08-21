import { describe, expect, it } from "vitest";
import { avisoDoPainel } from "./avisoDoPainel";

describe("o painel para de pedir classificação (D8)", () => {
  it("sem nada pendente, não cobra e não oferece caminho", () => {
    // A tarefa inteira é esta linha: o cartão dourado era fixo e continuava
    // dizendo "falta classificar" depois de você classificar tudo.
    const aviso = avisoDoPainel(0);

    expect(aviso.tom).toBe("pronto");
    expect(aviso.acao).toBeNull();
    expect(aviso.titulo).not.toMatch(/falta/i);
    expect(aviso.texto).not.toMatch(/falta/i);
  });

  it("sem nada pendente, continua dizendo o que ainda não existe", () => {
    // A limitação é verdadeira e continua dita. O que muda é o tom: limitação
    // do produto, não tarefa sua em aberto.
    expect(avisoDoPainel(0).texto).toMatch(/próxima etapa a ser construída/);
  });

  it("com pendências, diz quantas e leva até lá", () => {
    const aviso = avisoDoPainel(17);

    expect(aviso.tom).toBe("pedir");
    expect(aviso.titulo).toContain("17 lançamentos esperam");
    expect(aviso.acao).toEqual({ href: "/revisao", rotulo: "Revisar agora" });
  });

  it("uma pendência fala no singular", () => {
    expect(avisoDoPainel(1).titulo).toBe("1 lançamento espera sua decisão.");
  });

  it("nunca afirma que nenhum lançamento tem categoria", () => {
    // A frase antiga: "nenhum caiu num pote ainda". A D1 classifica na
    // importação desde a spec 03 — era falso nos dois estados.
    for (const n of [0, 1, 17]) {
      expect(avisoDoPainel(n).texto).not.toMatch(/nenhum caiu/i);
    }
  });
});
