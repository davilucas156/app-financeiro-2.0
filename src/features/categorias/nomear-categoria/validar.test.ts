import { describe, expect, it } from "vitest";
import { validarCategoria } from "./validar";

const valido = { nome: "Gasolina", emoji: "⛽" };

describe("validarCategoria", () => {
  it("aceita o caso comum", () => {
    expect(validarCategoria(valido)).toEqual({
      ok: true,
      nome: "Gasolina",
      emoji: "⛽",
    });
  });

  it("devolve o nome limpo, e não só aprovado", () => {
    // ⚠ `"Gasolina  "` gravado com o espaço **não colide** com `"Gasolina"` no
    // único de nome. O Davi ficaria com duas categorias que a tela mostra
    // idênticas — o único não protege contra o que ele não vê como igual.
    const r = validarCategoria({ nome: "  Gasolina   comum ", emoji: " ⛽ " });

    expect(r).toEqual({ ok: true, nome: "Gasolina comum", emoji: "⛽" });
  });

  it("recusa nome vazio", () => {
    const r = validarCategoria({ ...valido, nome: "   " });

    expect(r.ok).toBe(false);
    expect(r.ok === false && r.campo).toBe("nome");
  });

  it("recusa nome longo demais para a linha do painel", () => {
    const r = validarCategoria({ ...valido, nome: "a".repeat(41) });

    expect(r.ok).toBe(false);
    expect(r.ok === false && r.campo).toBe("nome");
  });

  it("aceita exatamente no limite", () => {
    expect(validarCategoria({ ...valido, nome: "a".repeat(40) }).ok).toBe(true);
  });

  it("recusa nome sem letra nem número — é a regra que garante o slug", () => {
    // A A1 e esta são a mesma regra vista de dois lados: sem alfanumérico o
    // slug nasceria vazio, e vazio colide com todo outro vazio.
    const r = validarCategoria({ ...valido, nome: "###" });

    expect(r.ok).toBe(false);
    expect(r.ok === false && r.campo).toBe("nome");
  });

  it("aceita nome só de número", () => {
    expect(validarCategoria({ ...valido, nome: "99" }).ok).toBe(true);
  });

  it("aceita emoji composto por vários pontos de código", () => {
    // 👨‍👩‍👧 tem 8 unidades de código e é um símbolo só. Um teste de
    // `.length` recusaria este e aceitaria "ab" disfarçado.
    expect(validarCategoria({ ...valido, emoji: "👨‍👩‍👧" }).ok).toBe(true);
  });

  it("recusa dois emojis", () => {
    const r = validarCategoria({ ...valido, emoji: "⛽🚗" });

    expect(r.ok).toBe(false);
    expect(r.ok === false && r.campo).toBe("emoji");
  });

  it("recusa emoji vazio", () => {
    expect(validarCategoria({ ...valido, emoji: "  " }).ok).toBe(false);
  });

  it("recusa letra no lugar do emoji", () => {
    // Passaria no teste de grafema e viraria "A Gasolina" no painel.
    const r = validarCategoria({ ...valido, emoji: "A" });

    expect(r.ok).toBe(false);
    expect(r.ok === false && r.campo).toBe("emoji");
  });

  it("recusa o nome antes do emoji quando os dois estão errados", () => {
    // A tela mostra um problema por vez, e o primeiro campo é o nome.
    const r = validarCategoria({ nome: "", emoji: "" });

    expect(r.ok === false && r.campo).toBe("nome");
  });
});
