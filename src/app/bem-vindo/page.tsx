import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { destinoDoUsuario } from "@/features/autenticacao/destinoDoUsuario";
import { ROTA_BEM_VINDO } from "@/features/autenticacao/rotas-de-acesso";
import { ConcluirOnboarding } from "@/features/onboarding/concluir-onboarding/ConcluirOnboarding";

export const metadata: Metadata = {
  title: "Bem-vindo",
};

/**
 * A rota só compõe.
 *
 * Esta é a primeira tela que um usuário novo vê, então é onde a garantia da
 * D5 mais importa: aqui a linha em `users` quase sempre **acabou** de ser
 * criada, e é bem provável que o webhook ainda nem tenha chegado.
 *
 * Os andaimes de revisão visual da B3 (`?nome=` e `?estado=`) saíram: o nome
 * é o de verdade, com fallback para a variação "perfil sem nome", e os
 * estados de envio e erro vêm da server action.
 */
export default async function BemVindoPage() {
  const usuario = await garantirUsuario();

  // Spec de `/bem-vindo`: "abre já tendo concluído o onboarding → redireciona
  // para `/dashboard`". Sem isso, dá para reabrir a tela de primeiro acesso
  // meses depois — e tocar em "Começar" de novo.
  //
  // Com usuário presente `destinoDoUsuario` só devolve `/bem-vindo` (ficar) ou
  // `/dashboard`, então não há laço.
  const destino = destinoDoUsuario(usuario, true);
  if (destino !== ROTA_BEM_VINDO) redirect(destino);

  return <ConcluirOnboarding nome={usuario.nome ?? undefined} />;
}
