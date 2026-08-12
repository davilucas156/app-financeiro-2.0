import type { Metadata } from "next";
import {
  FazerLogin,
  type EstadoFazerLogin,
} from "@/features/autenticacao/fazer-login/FazerLogin";

export const metadata: Metadata = {
  title: "Entrar · Painel Financeiro 6 Potes",
};

const ESTADOS: EstadoFazerLogin[] = [
  "pronto",
  "carregando",
  "erro",
  "bloqueado",
];

/**
 * A rota só compõe — o comportamento mora em `src/features/`.
 *
 * O `?estado=` é **andaime de revisão visual**: deixa o Davi ver as quatro
 * variações no navegador sem ter como disparar um erro de rede numa tela que
 * ainda não faz nada. Sai na D2, quando o estado passa a vir do Clerk.
 */
export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const { estado } = await searchParams;
  const escolhido = ESTADOS.find((e) => e === estado) ?? "pronto";

  return <FazerLogin estado={escolhido} />;
}
