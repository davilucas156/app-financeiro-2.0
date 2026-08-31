import { describe, expect, it } from "vitest";
import { BRANCO } from "./contraste";
import { corParaFundoClaro, corParaTexto, FUNDO_ESCURO } from "./corNoTema";
import { estiloDoPote, estiloDoTextoDoPote } from "./estiloDoPote";

/**
 * A cor do pote chega ao elemento — as duas versões dela.
 *
 * ⚠ **Este teste nasceu de um defeito de seis dias que ninguém viu.** Entre a
 * spec 08 e 30/08/2026, `estiloDoPote` devolvia
 * `backgroundColor: var(--cor-do-pote)`, e o ponteiro `--cor-do-pote` estava
 * declarado em `:root` — onde `--pote-escuro` não existe. A propriedade
 * computava inválida e o fundo virava transparente: **os nove potes ficaram sem
 * cor em oito telas**, e o único que continuava pintado era o estourado, que usa
 * classe do Tailwind e não passa por aqui.
 *
 * O que ele consegue segurar é o contrato: as duas cores existem no elemento, e
 * o fundo é resolvido **lá**, lendo as duas. O que ele não alcança é o
 * navegador — CSS não roda no Vitest, e é por isso que a conferência de tela
 * continua sendo do Davi.
 */

const VERDE = "#00e5a0";

/**
 * `CSSProperties` do React não indexa custom property — elas entram por um
 * `as` na função. Aqui a leitura precisa da mesma licença.
 */
const estilo = (cor: string) =>
  estiloDoPote(cor) as Record<string, string | undefined>;

describe("as duas versões chegam ao elemento", () => {
  it("carrega o hex do banco como a versão escura", () => {
    expect(estiloDoPote(VERDE)).toMatchObject({ "--pote-escuro": VERDE });
  });

  it("carrega a versão para fundo claro, derivada", () => {
    expect(estiloDoPote(VERDE)).toMatchObject({
      "--pote-claro": corParaFundoClaro(VERDE),
    });
  });

  /*
   * ⚠ O verde do pote Liberdade Financeira dá 1.54 contra branco: no tema
   * claro ele **desapareceria** se as duas versões fossem a mesma. É o caso que
   * torna a derivação necessária, e não um enfeite.
   */
  it("as duas são diferentes quando o hex não sobrevive ao fundo claro", () => {
    const e = estilo(VERDE);

    expect(e["--pote-claro"]).not.toBe(e["--pote-escuro"]);
  });
});

describe("o fundo é decidido no elemento, e lê as duas", () => {
  /*
   * ⚠ **O teste que o defeito teria reprovado.** Um fundo que cita uma
   * variável só — ou uma que o elemento não define — é a forma exata como a cor
   * sumiu: o `var()` de uma custom property é substituído onde ela é
   * **declarada**, e um ponteiro em `:root` nunca enxerga as cores do elemento.
   */
  it("o background cita as duas variáveis que o próprio estilo define", () => {
    const estilo = estiloDoPote(VERDE);
    const fundo = String(estilo.backgroundColor);

    expect(fundo).toContain("--pote-claro");
    expect(fundo).toContain("--pote-escuro");
  });

  it("é o `light-dark`, que segue o color-scheme do tema", () => {
    expect(String(estiloDoPote(VERDE).backgroundColor)).toMatch(
      /^light-dark\(/,
    );
  });

  /* Claro primeiro, escuro depois: a ordem dos argumentos de `light-dark()`. */
  it("põe a versão clara antes da escura", () => {
    const fundo = String(estiloDoPote(VERDE).backgroundColor);

    expect(fundo.indexOf("--pote-claro")).toBeLessThan(
      fundo.indexOf("--pote-escuro"),
    );
  });
});

/*
 * `buckets.cor` é `text` no Postgres: um valor ilegível não pode derrubar a
 * página. `corParaFundoClaro` devolve o hex intacto, e o estilo continua
 * completo — a barra sai errada, e só.
 */
it("hex ilegível não quebra o estilo", () => {
  const e = estilo("nao-e-cor");

  expect(e["--pote-escuro"]).toBe("nao-e-cor");
  expect(e["--pote-claro"]).toBe("nao-e-cor");
  expect(String(e.backgroundColor)).toMatch(/^light-dark\(/);
});

/**
 * A cor do pote como letra chega ao elemento (tarefa A3 da spec 15).
 *
 * ⚠ **O terceiro teste é o que justifica a função existir.** Se um dia alguém
 * "simplificar" fazendo o texto apontar para as variáveis de preenchimento, ele
 * cai — e é o único jeito de perceber, porque a tela continuaria colorida, só
 * que com a régua errada.
 */

const textoDoPote = (cor: string) =>
  estiloDoTextoDoPote(cor) as Record<string, string | undefined>;

describe("a cor do pote como letra chega ao elemento", () => {
  it("carrega as duas versões de texto", () => {
    expect(estiloDoTextoDoPote(VERDE)).toMatchObject({
      "--pote-texto-escuro": corParaTexto(VERDE, FUNDO_ESCURO),
      "--pote-texto-claro": corParaTexto(VERDE, BRANCO),
    });
  });

  it("⚠ o color cita as duas variáveis que o próprio estilo define", () => {
    /*
     * O contrato que o defeito de seis dias do `--cor-do-pote` quebrou: um
     * `var()` é substituído **onde a propriedade é declarada**. Citar uma
     * variável que este objeto não declara faria a cor computar inválida — e
     * uma cor inválida some sem avisar.
     */
    const { color } = textoDoPote(VERDE);

    expect(color).toContain("var(--pote-texto-claro)");
    expect(color).toContain("var(--pote-texto-escuro)");
  });

  it("⚠ não usa os nomes do preenchimento", () => {
    // Se usasse, os dois estilos no mesmo cartão colidiriam e um deles ficaria
    // com a régua do outro — 3 onde precisa de 4.5, sem erro na tela.
    const texto = textoDoPote(VERDE);

    expect(texto["--pote-claro"]).toBeUndefined();
    expect(texto["--pote-escuro"]).toBeUndefined();
    expect(texto.backgroundColor).toBeUndefined();
  });

  it("⚠ para o pote que reprova, texto e preenchimento são cores diferentes", () => {
    /*
     * `#5a5a70` passa em 3 e reprova em 4.5 sobre o cartão escuro. É o pote em
     * que as duas réguas dão respostas diferentes — e a prova de que manter as
     * duas funções não é preciosismo.
     */
    const preenchimento = estiloDoPote("#5a5a70") as Record<string, string>;
    const texto = textoDoPote("#5a5a70");

    expect(texto["--pote-texto-escuro"]).not.toBe(
      preenchimento["--pote-escuro"],
    );
  });
});
