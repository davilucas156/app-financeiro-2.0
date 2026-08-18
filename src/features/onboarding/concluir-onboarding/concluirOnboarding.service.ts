import "server-only";
import { eq, isNull, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { buckets, categories, users } from "@/db/schema";
import {
  linhasDeCategorias,
  linhasDePotes,
} from "@/features/onboarding/concluir-onboarding/seed";

/**
 * A gravação do onboarding (tarefa D7).
 *
 * Separada da server action pelo mesmo motivo da D4: a action precisa do
 * ciclo de requisição do Next para existir, e esta parte só precisa de um
 * `userId` e do banco.
 *
 * ⚠ Recebe `userId` porque **não** é exportada para fora desta pasta pelo
 * caminho público — quem chama é a action, que pega o id de
 * `garantirUsuario()`. Nenhum valor vindo do cliente chega aqui.
 */
export type ResultadoOnboarding = "concluido" | "ja_estava_concluido";

export async function concluirOnboarding(
  userId: string,
): Promise<ResultadoOnboarding> {
  return getDb().transaction(async (tx) => {
    // Tudo ou nada: falhar no meio das categorias não pode deixar 8 potes
    // vazios com o onboarding marcado como concluído. O usuário cairia num
    // dashboard quebrado sem jeito de voltar, porque a D6 não o traria mais
    // para cá.

    // `on conflict do nothing` **sem alvo declarado**: `buckets` tem duas
    // restrições de unicidade (nome e slug), e declarar só uma faria a outra
    // estourar em vez de ser absorvida.
    await tx
      .insert(buckets)
      .values(linhasDePotes(userId))
      .onConflictDoNothing();

    // **O mapa vem de um `select`, não do `returning` do insert acima.**
    // `do nothing` não devolve linha que já existia, então na segunda
    // execução o `returning` viria vazio e nenhuma categoria acharia seu
    // pote. Lendo do banco, os dois caminhos veem a mesma coisa.
    const potes = await tx
      .select({ id: buckets.id, slug: buckets.slug })
      .from(buckets)
      .where(eq(buckets.userId, userId));

    const idPorSlug = new Map(potes.map((p) => [p.slug, p.id]));

    await tx
      .insert(categories)
      .values(linhasDeCategorias(userId, idPorSlug))
      .onConflictDoNothing();

    // `is null` na condição: se duas requisições passarem pela saída
    // antecipada da action, só a primeira marca — a segunda não desloca a
    // data de conclusão para frente.
    const marcadas = await tx
      .update(users)
      .set({ onboardingConcluidoEm: new Date(), atualizadoEm: new Date() })
      .where(and(eq(users.id, userId), isNull(users.onboardingConcluidoEm)))
      .returning({ id: users.id });

    return marcadas.length > 0 ? "concluido" : "ja_estava_concluido";
  });
}
