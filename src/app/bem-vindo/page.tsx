import type { Metadata } from "next";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import {
  ConcluirOnboarding,
  type EstadoOnboarding,
} from "@/features/onboarding/concluir-onboarding/ConcluirOnboarding";

export const metadata: Metadata = {
  title: "Bem-vindo · Painel Financeiro 6 Potes",
};

const ESTADOS: EstadoOnboarding[] = ["pronto", "enviando", "erro"];

/**
 * A rota só compõe.
 *
 * Esta é a primeira tela que um usuário novo vê, então é onde a garantia da
 * D5 mais importa: aqui a linha em `users` quase sempre **acabou** de ser
 * criada, e é bem provável que o webhook ainda nem tenha chegado.
 *
 * `?estado=` continua sendo andaime de revisão visual — na D7 o estado vem da
 * server action. O `?nome=` saiu: o nome agora é o de verdade, e o fallback
 * cobre a variação "perfil sem nome" que a spec pede.
 */
export default async function BemVindoPage({
  searchParams,
}: PageProps<"/bem-vindo">) {
  const usuario = await garantirUsuario();

  const { estado } = await searchParams;
  const escolhido = ESTADOS.find((e) => e === estado) ?? "pronto";

  return (
    <ConcluirOnboarding nome={usuario.nome ?? "por aqui"} estado={escolhido} />
  );
}
