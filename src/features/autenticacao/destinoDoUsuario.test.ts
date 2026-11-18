import { describe, expect, it } from "vitest";
import type { Usuario } from "@/db/schema";
import { destinoDoUsuario } from "./destinoDoUsuario";
import {
  ROTA_ACESSO_NEGADO,
  ROTA_BEM_VINDO,
  ROTA_ENTRAR,
  ROTA_PAINEL,
} from "./rotas-de-acesso";

/** Só `onboardingConcluidoEm` importa para a decisão. */
function usuarioCom(onboardingConcluidoEm: Date | null): Usuario {
  return { onboardingConcluidoEm } as unknown as Usuario;
}

describe("os quatro ramos", () => {
  it("usuário com onboarding concluído vai para o painel", () => {
    expect(destinoDoUsuario(usuarioCom(new Date()), true)).toBe(ROTA_PAINEL);
  });

  it("usuário sem onboarding concluído vai para o bem-vindo", () => {
    expect(destinoDoUsuario(usuarioCom(null), true)).toBe(ROTA_BEM_VINDO);
  });

  it("sem usuário e com sessão vai para o acesso negado", () => {
    expect(destinoDoUsuario(null, true)).toBe(ROTA_ACESSO_NEGADO);
  });

  it("sem usuário e sem sessão vai para entrar", () => {
    expect(destinoDoUsuario(null, false)).toBe(ROTA_ENTRAR);
  });
});

describe("bordas", () => {
  it("onboardingConcluidoEm nulo e data separam bem-vindo de painel", () => {
    expect(destinoDoUsuario(usuarioCom(null), true)).toBe(ROTA_BEM_VINDO);
    expect(destinoDoUsuario(usuarioCom(new Date(0)), true)).toBe(ROTA_PAINEL);
  });

  it.each([true, false])(
    "com usuário presente, temSessao=%s não muda o destino",
    (temSessao) => {
      expect(destinoDoUsuario(usuarioCom(null), temSessao)).toBe(
        ROTA_BEM_VINDO,
      );
      expect(destinoDoUsuario(usuarioCom(new Date()), temSessao)).toBe(
        ROTA_PAINEL,
      );
    },
  );
});
