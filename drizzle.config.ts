import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// O drizzle-kit roda fora do Next, então não herda o carregamento de
// `.env.local`. `process.loadEnvFile` é nativo do Node 20 — evita trazer
// `dotenv` só para isto.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Migrations em SQL legível e versionado, para dar para ler o que vai rodar
  // antes de rodar.
  verbose: true,
  strict: true,
});
