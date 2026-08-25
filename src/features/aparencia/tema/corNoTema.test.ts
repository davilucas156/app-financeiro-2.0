import { describe, expect, it } from "vitest";
import { BRANCO, contraste, emRgb } from "./contraste";
import {
  CONTRASTE_MINIMO_DE_PREENCHIMENTO,
  corParaFundoClaro,
  matizEmGraus,
} from "./corNoTema";

/**
 * As nove cores que o seed grava em `buckets.cor`. Copiadas de
 * `potes-padrao.ts` de propósito: se alguém trocar a cor de um pote lá, este
 * teste continua afirmando sobre as cores antigas até ser atualizado junto — e
 * a diferença aparece na revisão, em vez de escapar.
 */
const CORES_DOS_POTES = {
  "🏠 Custos Fixos": "#FF5000",
  "📈 Liberdade Financeira": "#00e5a0",
  "🎮 Conforto & Lazer": "#3d8eff",
  "★ Metas / Sonhos": "#ffc94d",
  "🚗 Transporte": "#00c8d4",
  "📚 Conhecimento": "#e040a0",
  "🔧 Manutenção": "#26c9a0",
  "· Outros / Repasses": "#5a5a70",
  "💰 Renda": "#a78bfa",
};

function contrasteContraBranco(hex: string): number {
  const rgb = emRgb(hex);
  if (rgb === null) throw new Error(`hex inválido: ${hex}`);
  return contraste(rgb, BRANCO);
}

describe("a cor do pote num fundo claro (A3)", () => {
  it("⚠ os nove potes aparecem — todos passam da régua de preenchimento", () => {
    /*
     * É a tarefa inteira. Hoje `#00e5a0` dá 1.54 contra branco e a barra do
     * pote Liberdade Financeira simplesmente some da tela.
     */
    for (const [pote, hex] of Object.entries(CORES_DOS_POTES)) {
      const clara = corParaFundoClaro(hex);
      const razao = contrasteContraBranco(clara);

      expect(razao, `${pote} (${hex} → ${clara})`).toBeGreaterThanOrEqual(
        CONTRASTE_MINIMO_DE_PREENCHIMENTO,
      );
    }
  });

  it("⚠ o tom fica — o pote não troca de cor", () => {
    /*
     * A cor **é** a identidade do pote em três telas. Escurecer até passar
     * seria trivial se a resposta pudesse ser cinza; a promessa é que não pode.
     *
     * Um grau de folga cobre o arredondamento de ida e volta por RGB de 8 bits.
     */
    for (const [pote, hex] of Object.entries(CORES_DOS_POTES)) {
      const antes = matizEmGraus(hex);
      const depois = matizEmGraus(corParaFundoClaro(hex));

      expect(antes, pote).not.toBeNull();
      expect(depois, pote).toBeCloseTo(antes as number, 0);
    }
  });

  it("⚠ dois potes de tom parecido continuam sendo dois potes", () => {
    /*
     * Transporte (ciano) e Liberdade Financeira (verde) são os dois mais
     * próximos: 23° de distância. Se escurecer aproximasse os matizes, os dois
     * chegariam no claro como a mesma cor — e a barra pararia de dizer de qual
     * pote ela é.
     */
    const distancia = (a: string, b: string) =>
      Math.abs((matizEmGraus(a) as number) - (matizEmGraus(b) as number));

    const antes = distancia("#00c8d4", "#00e5a0");
    const depois = distancia(
      corParaFundoClaro("#00c8d4"),
      corParaFundoClaro("#00e5a0"),
    );

    expect(antes).toBeGreaterThan(20);
    expect(depois).toBeGreaterThan(20);
  });

  it("cor que já passa volta intacta", () => {
    // O pote Outros é `--color-dim`: 6.71 contra branco. Escurecer um cinza que
    // já serve seria mexer no que está certo.
    expect(corParaFundoClaro("#5a5a70")).toBe("#5a5a70");
    expect(corParaFundoClaro("#000000")).toBe("#000000");
  });

  it("escurece o mínimo necessário, e não até o preto", () => {
    /*
     * O resultado é o **primeiro** brilho que passa. Uma função que respondesse
     * `#000000` para tudo passaria no primeiro teste deste arquivo e destruiria
     * a tela — este é o teste que a impede.
     */
    const clara = corParaFundoClaro("#ffc94d");

    expect(contrasteContraBranco(clara)).toBeGreaterThanOrEqual(
      CONTRASTE_MINIMO_DE_PREENCHIMENTO,
    );
    expect(contrasteContraBranco(clara)).toBeLessThan(
      CONTRASTE_MINIMO_DE_PREENCHIMENTO + 0.6,
    );
  });

  it("hex que não dá para ler volta como veio", () => {
    // `buckets.cor` é `text` no Postgres. Lançar aqui deixaria a página inteira
    // em branco por causa de uma barra colorida.
    expect(corParaFundoClaro("verde")).toBe("verde");
    expect(corParaFundoClaro("")).toBe("");
  });

  it("é estável: a mesma entrada dá a mesma saída", () => {
    // A cor do pote não pode mudar de tom entre dois deploys sem ninguém ter
    // mexido em nada.
    const uma = corParaFundoClaro("#00e5a0");
    expect(corParaFundoClaro("#00e5a0")).toBe(uma);
    expect(corParaFundoClaro(uma)).toBe(uma);
  });
});
