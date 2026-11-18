import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { destinoInicial } from "@/features/autenticacao/destino-inicial";
import { temaAtual } from "@/features/aparencia/tema/temaAtual";
import { CadastrarUsuario } from "@/features/autenticacao/cadastrar-usuario/CadastrarUsuario";
import {
  foiRecusado,
  ROTA_ACESSO_NEGADO,
  ROTA_ENTRAR,
} from "@/features/autenticacao/rotas-de-acesso";

export const metadata: Metadata = {
  title: "Solicitar acesso",
};

/** Catch-all pelo mesmo motivo de `/entrar` — ver a nota lá. */
export default async function CadastrarPage({
  searchParams,
}: PageProps<"/cadastrar/[[...rest]]">) {
  const { acesso } = await searchParams;
  const recusado = foiRecusado(acesso);

  // **Sem esta condição há laço infinito.** Quem foi recusado tem sessão: o
  // proxy o manda para cá, e o redirecionamento abaixo o mandaria de volta
  // para `/dashboard`, que o proxy manda para cá de novo. Esta é justamente a
  // tela que essa pessoa precisa ver.
  if (!recusado) {
    const destino = await destinoInicial();

    // Só quem tem para onde ir sai daqui. **Visitante anônimo fica**: esta é
    // a tela de solicitar acesso, e mandá-lo para `/entrar` fecharia o laço
    // "entrar → solicitar acesso → entrar" que ele acabou de tentar sair.
    const ficar = destino === ROTA_ENTRAR || destino === ROTA_ACESSO_NEGADO;
    if (!ficar) redirect(destino);
  }

  return <CadastrarUsuario naoConvidado={recusado} tema={await temaAtual()} />;
}
