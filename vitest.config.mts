import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Vitest cobre as **camadas puras** do projeto — hoje o leitor de extrato
 * (tarefas A1–A4), que converte dinheiro e por isso merece teste que fica no
 * repositório em vez de rota temporária.
 *
 * O que depende de banco ou de sessão continua sendo verificado dentro do
 * runtime do Next: aqueles módulos têm `import "server-only"`, que os impede
 * de rodar fora dele — e é assim que deve ser.
 *
 * ⚠ A extensão é `.mts`, não `.ts`. O Vitest 4 é ESM puro, e o `package.json`
 * deste projeto não declara `"type": "module"` — num `vitest.config.ts` o
 * arquivo seria carregado como CommonJS e falha com `ERR_REQUIRE_ESM`. Trocar
 * o projeto inteiro para ESM por causa disso seria caro demais.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    // `import.meta.dirname` e não `__dirname`: em ESM o segundo não existe.
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
});
