import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("a última classe de padding vence", () => {
    expect(cn("p-5", "p-0")).toBe("p-0");
  });

  it("não confunde tamanho próprio com cor", () => {
    expect(cn("text-2xs", "text-dim")).toBe("text-2xs text-dim");
    expect(cn("text-sm", "text-3xs")).toBe("text-3xs");
  });

  it("não confunde raio próprio com outro grupo", () => {
    expect(cn("rounded-card", "rounded-pote")).toBe("rounded-pote");
    expect(cn("rounded-card", "border")).toBe("rounded-card border");
  });

  it("ignora valores falsos", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
