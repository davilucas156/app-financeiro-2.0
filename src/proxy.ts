import { NextResponse } from "next/server";
import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { estaConvidado } from "@/features/autenticacao/allowlist";

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
  "/regras(.*)",
  // A C1 da spec 05 trouxe `/categorias`. Ela fica **fora** da barra de
  // navegação (pendência 3), mas rota fora do menu continua sendo rota.
  "/categorias(.*)",
  // A spec 08 trouxe `/configuracoes`, também fora do menu. Ela não lê dado
  // nenhum do usuário — a preferência é do aparelho, num cookie — e mesmo
  // assim entra: rota interna desprotegida é buraco por hábito, não por
  // consequência. E a tela de amanhã que cair aqui vai herdar a proteção.
  "/configuracoes(.*)",
  // Onboarding: já exige usuário autenticado, mas não aparece no menu.
  "/bem-vindo(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!ehRotaProtegida(req)) return;

  // `auth.protect()` sozinho responde **404** para quem não tem sessão —
  // verificado. Esconder a rota não é o que a spec pede: quem chega sem
  // sessão deve ser convidado a entrar, não levar a impressão de que a
  // página não existe.
  //
  // `returnBackUrl` guarda a rota tentada, para a D8 poder devolver o
  // usuário a ela depois do login.
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // ── Convite (D3) ────────────────────────────────────────────────────────
  // Ter sessão não basta: o acesso é fechado enquanto o app é validado.
  //
  // A verificação mora aqui, e não numa tela ou no layout de `(app)`, porque
  // este é o único ponto que cobre tudo que a lista de rotas protegidas
  // cobre. Uma rota interna futura criada fora daquele grupo escaparia de uma
  // checagem feita no layout — aqui, não.
  //
  // O e-mail não vem nos claims padrão da sessão, então é preciso consultar o
  // Clerk. Custo assumido: irrelevante para o tamanho deste app. Se um dia
  // incomodar, a saída é publicar o e-mail como claim customizado e ler do
  // token.
  let convidado = false;

  try {
    const clerk = await clerkClient();
    const usuario = await clerk.users.getUser(userId);
    convidado = estaConvidado(usuario.primaryEmailAddress?.emailAddress);
  } catch {
    // Falha ao consultar o Clerk **nega** o acesso. Em dúvida, fecha:
    // um app financeiro que abre por causa de erro de rede é pior do que um
    // que recusa e pede para tentar de novo.
    convidado = false;
  }

  if (!convidado) {
    return NextResponse.redirect(new URL("/cadastrar?acesso=negado", req.url));
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
