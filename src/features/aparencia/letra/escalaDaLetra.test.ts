import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A régua da spec 10, defendida (tarefa A4).
 *
 * ## O que este teste impede
 *
 * `text-[10px]` compila para `font-size:10px` — um número absoluto, sem
 * variável de CSS, por onde nenhuma preferência entra. Enquanto existir um
 * deles, aquela tela **não obedece à configuração de tamanho de letra**, e não
 * obedece em silêncio: nem o `tsc` nem o `next build` olham para classe de CSS.
 *
 * A spec 10 nasceu de exatamente esse buraco — 97 usos espalhados por 39
 * arquivos, e todos eles o texto miúdo que a configuração existe para resolver.
 * Sem este teste, o 98º aparece na próxima spec e ninguém percebe até alguém
 * reclamar que "aumentar a letra não funciona nessa tela".
 *
 * ## Por que a régua é 14px
 *
 * É a régua do desenho: **letra de até 14px escala, acima de 14px não**. Ela
 * separa o corpo do app (9–14) do primeiro tamanho de destaque (16), e é a
 * mesma linha que define quais tokens os blocos `[data-letra]` redefinem.
 *
 * Acima dela, px cravado continua permitido — `text-[22px]` e `text-[28px]` são
 * títulos, e a spec decidiu que eles não escalam.
 *
 * ## Por que ele mora aqui
 *
 * É a regra da spec 10 sendo defendida, não um teste de componente. Fica ao
 * lado do módulo da preferência que ela serve.
 */

const RAIZ = path.resolve(import.meta.dirname, "../../..");

/** Acima disto, px cravado é permitido — ver a nota do topo. */
const MAIOR_QUE_ESCALA = 14;

const TOKEN_PARA: Record<number, string> = {
  9: "text-4xs",
  10: "text-3xs",
  11: "text-2xs",
  12: "text-xs",
  14: "text-sm",
};

describe("nenhuma tela escapa da configuração de tamanho (spec 10, A4)", () => {
  it("nenhum .tsx usa px cravado em letra de até 14px", () => {
    const achados = varrer();

    /*
     * ⚠ **A mensagem ensina a saída, não só aponta o erro.**
     *
     * Um teste que reprova sem dizer o que fazer manda a pessoa procurar uma
     * regra num documento que ela não sabe que existe — e a saída mais rápida
     * dali é apagar o teste.
     */
    expect(achados.map(descrever).join("\n")).toBe("");
  });

  it("a varredura realmente está lendo os arquivos", () => {
    /*
     * ⚠ **Sem isto, o teste acima passaria lendo zero arquivos.** Um erro de
     * caminho depois de mover a pasta transformaria a guarda numa função que
     * sempre aprova — o pior estado possível para um teste de regra, porque ele
     * continua verde enquanto a regra morre.
     */
    expect(arquivosTsx().length).toBeGreaterThan(40);
  });
});

type Achado = { arquivo: string; linha: number; px: number; trecho: string };

function varrer(): Achado[] {
  const achados: Achado[] = [];

  for (const arquivo of arquivosTsx()) {
    const linhas = readFileSync(arquivo, "utf8").split("\n");

    linhas.forEach((texto, i) => {
      for (const achado of texto.matchAll(/text-\[(\d+)px\]/g)) {
        const px = Number(achado[1]);
        if (px > MAIOR_QUE_ESCALA) continue;

        achados.push({
          arquivo: path.relative(RAIZ, arquivo).replaceAll("\\", "/"),
          linha: i + 1,
          px,
          trecho: achado[0],
        });
      }
    });
  }

  return achados;
}

function descrever({ arquivo, linha, px, trecho }: Achado): string {
  const token = TOKEN_PARA[px];

  const saida = token
    ? `use \`${token}\``
    : `não há token para ${px}px — acrescente um em globals.css, ou use o degrau mais próximo`;

  return `src/${arquivo}:${linha} — \`${trecho}\`: ${saida}. px cravado não obedece à configuração de tamanho de letra (spec 10).`;
}

function arquivosTsx(): string[] {
  const encontrados: string[] = [];

  const descer = (pasta: string) => {
    for (const item of readdirSync(pasta, { withFileTypes: true })) {
      const caminho = path.join(pasta, item.name);

      if (item.isDirectory()) descer(caminho);
      else if (item.name.endsWith(".tsx")) encontrados.push(caminho);
    }
  };

  descer(RAIZ);

  return encontrados;
}
