import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { users, type Usuario } from "@/db/schema";
import { salvarUsuario } from "@/features/autenticacao/salvar-usuario";

/**
 * Garantia de usuário no banco (tarefa D5).
 *
 * O webhook da D4 é **assíncrono e externo**: entre o Google devolver a sessão
 * e o Clerk entregar `user.created`, existe uma janela em que o usuário está
 * autenticado e não existe aqui. Normalmente são milissegundos; vira infinita
 * se o webhook estiver mal configurado ou fora do ar. Nenhuma rota interna
 * pode ler o banco sem antes ter certeza de que a linha existe.
 *
 * ⚠ **O `userId` sempre vem de `auth()`, nunca de parâmetro.** Uma função
 * exportada que aceitasse `userId` de fora viraria, no primeiro descuido, um
 * jeito de ler a conta alheia (`references/architecture.md` — Thin Client,
 * Fat Server). É por isso que `resolverUsuario` abaixo **não** é exportada.
 */

/** O que precisamos do Clerk — carregado só quando a linha falta. */
type Perfil = { email: string | null; nome: string | null };

/**
 * A parte que fala com o banco, separada do `auth()` para caber num teste.
 *
 * `carregarPerfil` é preguiçoso de propósito: no caminho quente a linha já
 * existe, e aí **nenhuma** chamada de rede ao Clerk acontece.
 */
async function resolverUsuario(
  userId: string,
  carregarPerfil: () => Promise<Perfil>,
): Promise<Usuario | null> {
  const db = getDb();

  const [existente] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existente) {
    // `removido_em` só é escrito por `user.deleted`, e conta apagada no Clerk
    // não tem sessão viva. Linha marcada + sessão válida é contradição: a
    // linha está velha, e a sessão prova que a conta existe.
    if (existente.removidoEm) {
      console.warn(
        `[garantir-usuario] ${userId} tinha removido_em com sessao viva; limpando`,
      );

      const [reativado] = await db
        .update(users)
        .set({ removidoEm: null, atualizadoEm: new Date() })
        .where(eq(users.id, userId))
        .returning();

      return reativado ?? null;
    }

    return existente;
  }

  // Daqui para baixo, só na primeira visita da conta — ou enquanto o webhook
  // estiver quebrado.
  const perfil = await carregarPerfil();

  // Mesma gravação do webhook, com o mesmo portão da allowlist e o mesmo
  // `on conflict` — de propósito. Se o webhook chegar logo depois, os dois
  // convergem para uma linha só em vez de brigarem.
  const { resultado, usuario } = await salvarUsuario({
    id: userId,
    email: perfil.email,
    nome: perfil.nome,
  });

  if (!usuario) {
    console.warn(`[garantir-usuario] ${userId} nao gravado: ${resultado}`);
    return null;
  }

  console.log(
    `[garantir-usuario] ${resultado} para ${userId} (webhook nao chegou)`,
  );

  return usuario;
}

async function perfilDoClerk(): Promise<Perfil> {
  const perfil = await currentUser();

  return {
    email: perfil?.primaryEmailAddress?.emailAddress ?? null,
    nome:
      [perfil?.firstName, perfil?.lastName]
        .filter((p): p is string => typeof p === "string" && p.length > 0)
        .join(" ") || null,
  };
}

/**
 * Busca a linha do usuário da sessão, criando-a se faltar.
 *
 * Devolve `null` quando **não há sessão** ou quando o e-mail não está na
 * allowlist — e nesse segundo caso nada é gravado, porque `salvarUsuario`
 * carrega o portão da D3.
 *
 * Envolvida em `cache()` porque, num mesmo render, layout e página chamam
 * cada um por conta própria — sem isso seriam duas consultas idênticas. O
 * `cache()` do React vale por requisição, então não há risco de uma sessão
 * enxergar a outra.
 */
export const obterUsuarioAtual = cache(async (): Promise<Usuario | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  return resolverUsuario(userId, perfilDoClerk);
});

/**
 * Igual à anterior, mas para quem **não tem decisão a tomar**: rota interna
 * sem usuário só pode ir para `/entrar`.
 *
 * A D6 usa `obterUsuarioAtual()` porque precisa da ausência como resposta;
 * uma rota interna precisa da ausência como desvio. Fundir as duas obrigaria
 * cada rota a repetir o mesmo `if (!usuario) redirect(...)` — e é justamente
 * o tipo de repetição que uma hora alguém esquece.
 */
export async function garantirUsuario(): Promise<Usuario> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/entrar");
  return usuario;
}
