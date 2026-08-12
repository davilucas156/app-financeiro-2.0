import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "@/db/schema";

/**
 * Client único do banco.
 *
 * O `import "server-only"` no topo faz o **build falhar** se algum componente
 * de cliente importar este arquivo. É a regra Thin Client / Fat Server
 * (`references/architecture.md`) virando erro de compilação em vez de
 * recomendação escrita.
 *
 * **Driver:** `neon-serverless` (Pool sobre WebSocket), e não `neon-http`.
 * O driver HTTP não suporta transação interativa, e a tarefa D7 exige gravar
 * os 8 potes e as categorias numa única transação — uma falha não pode deixar
 * a conta do usuário pela metade.
 *
 * **Inicialização preguiçosa:** o client só é criado na primeira consulta.
 * Assim a ausência de `DATABASE_URL` não quebra o build, e quem esquecer a
 * credencial recebe uma mensagem que diz o que fazer.
 */
type Db = NeonDatabase<typeof schema>;

// O hot reload reavalia módulos; sem isto, cada salvamento abriria um pool
// novo e as conexões vazariam até o banco recusar.
const cacheGlobal = globalThis as unknown as { __db?: Db };

export function getDb(): Db {
  if (cacheGlobal.__db) return cacheGlobal.__db;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL ausente. Crie o Postgres na Vercel, conecte ao projeto " +
        "e rode `npx vercel env pull .env.local` na raiz do projeto.",
    );
  }

  const db = drizzle(new Pool({ connectionString }), { schema });
  cacheGlobal.__db = db;

  return db;
}
