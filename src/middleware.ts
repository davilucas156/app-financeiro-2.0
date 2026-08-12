import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Proteção das rotas internas (tarefa D1).
 *
 * A decisão de acesso acontece **antes de renderizar**, no servidor. Nenhuma
 * tela decide se pode ou não ser vista — a moldura de `src/app/(app)/` não
 * protege nada por si só (`references/architecture.md`).
 *
 * **A lista abaixo é escrita à mão de propósito.** Seria elegante derivá-la de
 * `src/features/shell/rotas.ts`, mas aquele arquivo existe para desenhar a
 * barra de navegação: remover um item de lá por motivo visual tiraria a rota
 * da proteção junto, silenciosamente — uma decisão de UI viraria um buraco de
 * segurança.
 *
 * ⚠ **Rota interna nova não é protegida automaticamente.** Ao criar uma,
 * acrescente aqui.
 */
const ehRotaProtegida = createRouteMatcher([
  "/dashboard(.*)",
  "/upload(.*)",
  "/revisao(.*)",
  // Onboarding: já exige usuário autenticado, mas não aparece no menu.
  "/bem-vindo(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (ehRotaProtegida(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Pula arquivos internos do Next e assets, para o middleware não rodar à toa.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Sempre nas rotas de API.
    "/(api|trpc)(.*)",
  ],
};
