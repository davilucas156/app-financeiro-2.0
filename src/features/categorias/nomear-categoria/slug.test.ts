import { describe, expect, it } from "vitest";
import { slugificar, slugUnico } from "./slug";

describe("slugificar", () => {
  it("produz o mesmo formato dos slugs do seed", () => {
    // `reserva-de-emergencia` está em `potes-padrao.ts` escrito assim. Os dois
    // convivem na mesma coluna e no mesmo único: o formato tem de ser um só.
    expect(slugificar("Reserva de emergência")).toBe("reserva-de-emergencia");
    expect(slugificar("Alimentação fora")).toBe("alimentacao-fora");
  });

  it("apara as pontas e colapsa símbolo e espaço no meio", () => {
    expect(slugificar("  Uber / 99  ")).toBe("uber-99");
    expect(slugificar("Água — luz")).toBe("agua-luz");
  });

  it("guarda os números", () => {
    expect(slugificar("Cartão 2")).toBe("cartao-2");
  });

  it("devolve vazio quando não há letra nem número — é a A2 que barra isso", () => {
    expect(slugificar("###")).toBe("");
  });
});

describe("slugUnico", () => {
  it("usa o slug direto quando ninguém o ocupou", () => {
    expect(slugUnico("Gasolina", [])).toBe("gasolina");
  });

  it("resolve nomes diferentes que caem no mesmo slug", () => {
    // O caso que justifica a função existir: "Café" e "Cafe" são nomes
    // diferentes — a pessoa está olhando para os dois — e o único de slug
    // recusaria o segundo.
    expect(slugUnico("Café", ["cafe"])).toBe("cafe-2");
  });

  it("continua contando enquanto houver ocupado", () => {
    expect(slugUnico("Cafe", ["cafe", "cafe-2", "cafe-3"])).toBe("cafe-4");
  });

  it("não confunde um slug parecido com um ocupado", () => {
    expect(slugUnico("Gasolina", ["gasolina-comum"])).toBe("gasolina");
  });

  it("cai num nome de reserva em vez de devolver vazio", () => {
    // Inalcançável pela tela (a A2 barra), e ainda assim não pode produzir
    // string vazia: vazio colidiria com todo outro nome não validado.
    expect(slugUnico("###", [])).toBe("categoria");
    expect(slugUnico("###", ["categoria"])).toBe("categoria-2");
  });
});
