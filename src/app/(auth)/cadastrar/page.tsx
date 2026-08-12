import type { Metadata } from "next";
import {
  CadastrarUsuario,
  type EstadoCadastro,
} from "@/features/autenticacao/cadastrar-usuario/CadastrarUsuario";

export const metadata: Metadata = {
  title: "Solicitar acesso · Painel Financeiro 6 Potes",
};

const ESTADOS: EstadoCadastro[] = ["pronto", "carregando", "erro", "recusado"];

/**
 * A rota só compõe. O `?estado=` é andaime de revisão visual, igual ao de
 * `/entrar`; sai na D2/D3.
 */
export default async function CadastrarPage({
  searchParams,
}: PageProps<"/cadastrar">) {
  const { estado } = await searchParams;
  const escolhido = ESTADOS.find((e) => e === estado) ?? "pronto";

  return <CadastrarUsuario estado={escolhido} />;
}
