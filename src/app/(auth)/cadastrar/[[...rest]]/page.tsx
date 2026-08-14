import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { CadastrarUsuario } from "@/features/autenticacao/cadastrar-usuario/CadastrarUsuario";

export const metadata: Metadata = {
  title: "Solicitar acesso · Painel Financeiro 6 Potes",
};

/** Catch-all pelo mesmo motivo de `/entrar` — ver a nota lá. */
export default async function CadastrarPage({
  searchParams,
}: PageProps<"/cadastrar/[[...rest]]">) {
  const { acesso } = await searchParams;
  const recusado = acesso === "negado";

  // **Sem esta condição há laço infinito.** Quem foi recusado tem sessão: o
  // proxy o manda para cá, e o redirecionamento abaixo o mandaria de volta
  // para `/dashboard`, que o proxy manda para cá de novo. Esta é justamente a
  // tela que essa pessoa precisa ver.
  if (!recusado) {
    const { userId } = await auth();
    if (userId) redirect("/dashboard");
  }

  return <CadastrarUsuario naoConvidado={recusado} />;
}
