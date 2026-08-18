import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { destinoInicial } from "@/features/autenticacao/destino-inicial";
import { FazerLogin } from "@/features/autenticacao/fazer-login/FazerLogin";

export const metadata: Metadata = {
  title: "Entrar · Painel Financeiro 6 Potes",
};

/**
 * Rota catch-all porque os fluxos do Clerk navegam para sub-rotas próprias
 * (`/entrar/sso-callback`, …). Numa rota simples isso daria 404 no meio do
 * login — o usuário sairia do Google e cairia numa página inexistente.
 * A URL que ele vê continua `/entrar`.
 */
export default async function EntrarPage() {
  // Verificação **no servidor**, antes de renderizar: quem já tem sessão não
  // deve ver tela de login. O destino sai de `destinoInicial()` (D6), que é
  // quem sabe de allowlist e de onboarding — antes daqui saía um
  // `/dashboard` fixo, e o primeiro acesso caía no lugar errado.
  const destino = await destinoInicial();
  if (destino !== "/entrar") redirect(destino);

  return <FazerLogin />;
}
