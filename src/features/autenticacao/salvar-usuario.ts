import "server-only";
import { getTableColumns, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, type Usuario } from "@/db/schema";
import { estaConvidado } from "@/features/autenticacao/allowlist";

/**
 * A **única** gravação de usuário do projeto.
 *
 * Nasceu na D4 dentro do webhook e saiu de lá na D5, quando a garantia de
 * primeira requisição precisou gravar exatamente a mesma coisa. Duas cópias
 * do portão da allowlist e do `on conflict` divergiriam — e a que divergisse
 * viraria a porta dos fundos por onde entra quem a D3 barrou.
 *
 * Quem chama:
 * - `sincronizar-usuario` (D4) — quando o webhook do Clerk chega;
 * - `garantir-usuario` (D5) — quando o webhook **não** chegou.
 *
 * Os dois caminhos convergem porque a gravação é idempotente.
 */

export type DadosUsuario = {
  id: string;
  email: string | null;
  nome: string | null;
};

export type ResultadoSalvar =
  "criado" | "atualizado" | "ignorado_nao_convidado" | "ignorado_sem_email";

export async function salvarUsuario(dados: DadosUsuario): Promise<{
  resultado: ResultadoSalvar;
  usuario: Usuario | null;
}> {
  if (!dados.email) {
    return { resultado: "ignorado_sem_email", usuario: null };
  }

  // **O portão da D3.** Sem ele, qualquer pessoa que autenticasse no Google
  // viraria registro no nosso banco, mesmo sem acesso a tela nenhuma.
  if (!estaConvidado(dados.email)) {
    return { resultado: "ignorado_nao_convidado", usuario: null };
  }

  // `on conflict (id) do update`: o Clerk reenvia webhook quando não recebe
  // 200 rápido, e a D5 pode gravar a mesma linha antes dele. Entrega
  // duplicada, ou corrida entre os dois caminhos, converge para uma linha só.
  const [linha] = await getDb()
    .insert(users)
    .values({ id: dados.id, email: dados.email, nome: dados.nome })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: dados.email,
        nome: dados.nome,
        atualizadoEm: new Date(),
      },
    })
    // `xmax = 0` é como o Postgres deixa distinguir insert de update num
    // upsert: numa linha recém-inserida o `xmax` é zero.
    //
    // A primeira versão comparava `criado_em` com `atualizado_em` e chamava
    // de "criado" o que caísse dentro de um segundo. Isso classificava errado
    // toda atualização logo após a criação — que é justamente o caso comum,
    // porque o webhook costuma chegar segundos depois da D5 já ter gravado.
    .returning({
      ...getTableColumns(users),
      inserido: sql<boolean>`(xmax = 0)`,
    });

  if (!linha) return { resultado: "atualizado", usuario: null };

  const { inserido, ...usuario } = linha;

  return { resultado: inserido ? "criado" : "atualizado", usuario };
}
