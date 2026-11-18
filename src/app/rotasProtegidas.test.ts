import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Toda rota interna precisa estar na lista de `src/proxy.ts`.
 *
 * A lista de `createRouteMatcher([...])` é escrita à mão de propósito (ver o
 * comentário no próprio proxy), e o preço é que uma pasta nova em
 * `src/app/(app)/` fica **sem checagem de convite** se alguém esquecer de
 * acrescentá-la — em silêncio: a página abre normalmente.
 *
 * `proxy.ts` importa o Clerk e não roda no Vitest, então o arquivo é lido como
 * texto. Os padrões são strings simples, no formato `"/rota(.*)"`.
 */

const RAIZ_APP = import.meta.dirname;
const PASTA_APP = path.join(RAIZ_APP, "(app)");

/** Os padrões do `createRouteMatcher([...])`, sem os comentários. */
function padroesDoProxy(): string[] {
  const fonte = readFileSync(path.join(RAIZ_APP, "../proxy.ts"), "utf8");

  const bloco = /createRouteMatcher\(\s*\[([\s\S]*?)\]\s*\)/.exec(fonte);
  if (!bloco) return [];

  const semComentarios = bloco[1]
    .split("\n")
    .map((linha) => linha.replace(/\/\/.*$/, ""))
    .join("\n");

  return [...semComentarios.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/** Aproxima o casamento do `createRouteMatcher`: `(.*)` vira "qualquer coisa". */
function cobre(padrao: string, rota: string): boolean {
  const regex = padrao
    .split("(.*)")
    .map((parte) => parte.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");

  return new RegExp(`^${regex}$`).test(rota);
}

function rotasDoGrupoApp(): string[] {
  return readdirSync(PASTA_APP, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .filter((d) => existsSync(path.join(PASTA_APP, d.name, "page.tsx")))
    .map((d) => `/${d.name}`);
}

describe("rotas protegidas no proxy", () => {
  const padroes = padroesDoProxy();

  it("a leitura do proxy achou a lista e as rotas (a guarda não lê o vazio)", () => {
    expect(padroes.length).toBeGreaterThan(5);
    expect(rotasDoGrupoApp().length).toBeGreaterThan(5);
  });

  it.each(rotasDoGrupoApp())(
    "a rota %s do grupo (app) está coberta pelo proxy",
    (rota) => {
      expect(
        padroes.some((padrao) => cobre(padrao, rota)),
        `${rota} tem page.tsx em src/app/(app)/ mas não está em createRouteMatcher([...]) de src/proxy.ts — acrescente "${rota}(.*)".`,
      ).toBe(true);
    },
  );

  it("/bem-vindo está coberto pelo proxy", () => {
    expect(existsSync(path.join(RAIZ_APP, "bem-vindo/page.tsx"))).toBe(true);
    expect(padroes.some((padrao) => cobre(padrao, "/bem-vindo"))).toBe(true);
  });

  it("o casamento aceita sub-rotas e recusa pasta vizinha de nome parecido", () => {
    expect(cobre("/formatos(.*)", "/formatos")).toBe(true);
    expect(cobre("/formatos(.*)", "/formatos/novo")).toBe(true);
    expect(cobre("/formatos(.*)", "/formato")).toBe(false);
    expect(cobre("/regras(.*)", "/dashboard")).toBe(false);
  });
});
