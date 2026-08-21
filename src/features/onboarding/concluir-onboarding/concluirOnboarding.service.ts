import "server-only";
import { eq, isNull, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { buckets, categories, classificationRules, users } from "@/db/schema";
import { linhasDeRegras } from "@/features/classificacao/semear-regras/linhasDeRegras";
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

    await semearRegras(tx, userId);

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

/** A transação do Drizzle, como em `decidirLancamento.service.ts`. */
type Transacao = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];

/**
 * As regras-base da A5 na conta de quem tem direito a elas (tarefa D7).
 *
 * Depois das categorias porque cada regra aponta para um `categoria_id`, que só
 * existe depois delas. Dentro da mesma transação porque metade das regras
 * gravadas seria pior do que nenhuma: o motor classificaria parte do mês e
 * deixaria o resto pendente, sem ninguém entender o critério.
 *
 * ## `do nothing`, e **não** `do update`
 *
 * É o oposto da escolha da D5, e os dois estão certos pelo mesmo critério: a
 * instrução mais recente do Davi vence.
 *
 * Se ele corrigiu uma regra semeada — pela D5, ou editando na D9 — rodar o
 * onboarding de novo não pode devolvê-la ao que eu escrevi. Seed é ponto de
 * partida, não autoridade: quem olhou o lançamento foi ele.
 */
async function semearRegras(tx: Transacao, userId: string): Promise<void> {
  const [dono] = await tx
    .select({ email: users.email, nome: users.nome })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!dono) return;

  // A semente fala em `pote/categoria`; o banco fala em uuid. A tradução vem de
  // um `select`, e não do `returning` do insert acima, pela mesma razão do
  // mapa de potes: no reseed o `do nothing` não devolve linha que já existia, e
  // nenhuma regra acharia sua categoria.
  const categoriasDoUsuario = await tx
    .select({
      id: categories.id,
      slug: categories.slug,
      poteSlug: buckets.slug,
    })
    .from(categories)
    .innerJoin(buckets, eq(buckets.id, categories.bucketId))
    .where(eq(categories.userId, userId));

  const idPorChave = new Map(
    categoriasDoUsuario.map(
      (c) => [`${c.poteSlug}/${c.slug}`, c.id] as [string, string],
    ),
  );

  const linhas = linhasDeRegras(userId, dono, idPorChave);
  if (linhas.length === 0) return;

  await tx.insert(classificationRules).values(linhas).onConflictDoNothing();
}
