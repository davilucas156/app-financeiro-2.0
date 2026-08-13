import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
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
  // deve ver tela de login. A D6 substitui este destino fixo pela decisão
  // completa (onboarding pendente vai para `/bem-vindo`) — não antecipo aqui
  // para não espalhar a mesma regra em dois lugares.
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return <FazerLogin />;
}
