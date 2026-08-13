import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { CadastrarUsuario } from "@/features/autenticacao/cadastrar-usuario/CadastrarUsuario";

export const metadata: Metadata = {
  title: "Solicitar acesso · Painel Financeiro 6 Potes",
};

/** Catch-all pelo mesmo motivo de `/entrar` — ver a nota lá. */
export default async function CadastrarPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return <CadastrarUsuario />;
}
