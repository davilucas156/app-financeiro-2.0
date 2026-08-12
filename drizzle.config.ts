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
    // Conexão **direta**, não a do pooler. O pgbouncer do Neon multiplexa
    // conexões e não sustenta bem DDL longo nem prepared statements — é o
    // caminho certo para a aplicação, e o errado para migration.
    // A aplicação (`src/lib/db.ts`) usa a pooled; aqui é a unpooled.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
  // Migrations em SQL legível e versionado, para dar para ler o que vai rodar
  // antes de rodar.
  verbose: true,
  strict: true,
});
