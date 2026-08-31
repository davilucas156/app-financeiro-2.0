import { describe, expect, it } from "vitest";
import { BRANCO, contraste, emRgb, type Rgb } from "./contraste";
import {
  CONTRASTE_MINIMO_DE_PREENCHIMENTO,
  CONTRASTE_MINIMO_DE_TEXTO,
  corParaFundoClaro,
  corParaTexto,
  FUNDO_ESCURO,
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
    /*
     * O pote Outros, `#5a5a70`: 6.71 contra branco. Escurecer um cinza que já
     * serve seria mexer no que está certo.
     *
     * ⚠ Ele **era** o valor de `--color-dim` até a spec 15, que clareou o
     * token para `#7d7d96` — a cor do pote mora em `buckets.cor`, no
     * Postgres, e não acompanhou. Os dois são `#5a5a70` por história, não por
     * dependência.
     */
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

/**
 * A cor do pote como **texto** (tarefa A2 da spec 15).
 *
 * ⚠ **É a mesma cor e outra régua.** `corParaFundoClaro` mira 3 porque a cor do
 * pote era sempre preenchimento — barra, faixa, bolinha. A spec 15 pôs a cor no
 * número do cartão do ano, e a partir dali ela é letra: 4.5, e nos dois temas.
 */

function contrasteContra(hex: string, fundo: Rgb): number {
  const rgb = emRgb(hex);
  if (rgb === null) throw new Error(`hex inválido: ${hex}`);
  return contraste(rgb, fundo);
}

describe("a cor do pote como texto (A2)", () => {
  it("⚠ as nove passam da régua de leitura no tema escuro", () => {
    for (const [pote, hex] of Object.entries(CORES_DOS_POTES)) {
      const cor = corParaTexto(hex, FUNDO_ESCURO);

      expect(
        contrasteContra(cor, FUNDO_ESCURO),
        `${pote} (${hex} → ${cor})`,
      ).toBeGreaterThanOrEqual(CONTRASTE_MINIMO_DE_TEXTO);
    }
  });

  it("⚠ as nove passam da régua de leitura no tema claro", () => {
    // A mesma função, o outro fundo. Duas funções seriam duas chances de uma
    // delas envelhecer sozinha.
    for (const [pote, hex] of Object.entries(CORES_DOS_POTES)) {
      const cor = corParaTexto(hex, BRANCO);

      expect(
        contrasteContra(cor, BRANCO),
        `${pote} (${hex} → ${cor})`,
      ).toBeGreaterThanOrEqual(CONTRASTE_MINIMO_DE_TEXTO);
    }
  });

  it("⚠ o pote Outros clareia no escuro, e é o único que precisa", () => {
    /*
     * `#5a5a70` dá 2.81 sobre o cartão — o único dos nove que reprova como
     * letra no tema escuro. É o caso que prova que a função faz alguma coisa:
     * sem ele, um `return hex` passaria em tudo acima.
     */
    expect(corParaTexto("#5a5a70", FUNDO_ESCURO)).not.toBe("#5a5a70");

    const intactas = Object.values(CORES_DOS_POTES).filter(
      (hex) => corParaTexto(hex, FUNDO_ESCURO) === hex,
    );

    expect(intactas).toHaveLength(Object.keys(CORES_DOS_POTES).length - 1);
  });

  it("⚠ o tom fica — o pote não troca de cor", () => {
    for (const [pote, hex] of Object.entries(CORES_DOS_POTES)) {
      const antes = matizEmGraus(hex);

      expect(antes, pote).not.toBeNull();
      expect(
        matizEmGraus(corParaTexto(hex, FUNDO_ESCURO)),
        `${pote} no escuro`,
      ).toBeCloseTo(antes as number, 0);
      expect(
        matizEmGraus(corParaTexto(hex, BRANCO)),
        `${pote} no claro`,
      ).toBeCloseTo(antes as number, 0);
    }
  });

  it("⚠ dois potes de tom parecido continuam sendo dois potes", () => {
    // Transporte e Liberdade Financeira, os dois mais próximos: 23°.
    const distancia = (a: string, b: string) =>
      Math.abs((matizEmGraus(a) as number) - (matizEmGraus(b) as number));

    expect(
      distancia(
        corParaTexto("#00c8d4", FUNDO_ESCURO),
        corParaTexto("#00e5a0", FUNDO_ESCURO),
      ),
    ).toBeGreaterThan(20);
  });

  it("⚠ clareia o mínimo, e não até o branco", () => {
    /*
     * O teste que impede a solução preguiçosa. Uma função que devolvesse
     * `#ffffff` para tudo passaria em todos os anteriores e apagaria a
     * identidade dos nove potes de uma vez.
     */
    const cor = corParaTexto("#5a5a70", FUNDO_ESCURO);

    expect(contrasteContra(cor, FUNDO_ESCURO)).toBeGreaterThanOrEqual(
      CONTRASTE_MINIMO_DE_TEXTO,
    );
    expect(contrasteContra(cor, FUNDO_ESCURO)).toBeLessThan(
      CONTRASTE_MINIMO_DE_TEXTO + 0.6,
    );
  });

  it("cor que já passa volta intacta", () => {
    expect(corParaTexto("#ffc94d", FUNDO_ESCURO)).toBe("#ffc94d");
  });

  it("hex que não dá para ler volta como veio", () => {
    expect(corParaTexto("verde", FUNDO_ESCURO)).toBe("verde");
    expect(corParaTexto("", BRANCO)).toBe("");
  });

  it("é estável: a mesma entrada dá a mesma saída", () => {
    const uma = corParaTexto("#5a5a70", FUNDO_ESCURO);
    expect(corParaTexto("#5a5a70", FUNDO_ESCURO)).toBe(uma);
    expect(corParaTexto(uma, FUNDO_ESCURO)).toBe(uma);
  });
});
