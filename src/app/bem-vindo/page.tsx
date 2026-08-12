import type { Metadata } from "next";
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
 * `?nome=` e `?estado=` são andaime de revisão visual — na D7 o nome vem do
 * perfil do Clerk e o estado vem da server action. `?nome=` vazio demonstra a
 * variação "perfil sem nome" que a spec pede.
 */
export default async function BemVindoPage({
  searchParams,
}: PageProps<"/bem-vindo">) {
  const { nome, estado } = await searchParams;
  const escolhido = ESTADOS.find((e) => e === estado) ?? "pronto";
  const nomeExibido = typeof nome === "string" ? nome : "Davi Lucas";

  return <ConcluirOnboarding nome={nomeExibido} estado={escolhido} />;
}
