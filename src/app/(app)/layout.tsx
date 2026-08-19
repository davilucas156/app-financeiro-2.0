import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { CabecalhoApp } from "@/features/shell/CabecalhoApp";
import { NavegacaoPrincipal } from "@/features/shell/NavegacaoPrincipal";

/**
 * Moldura da área interna (`/dashboard`, `/upload`, `/revisao`).
 *
 * **Esta moldura não protege nada.** Quem bloqueia requisição sem sessão é o
 * middleware, no servidor, na tarefa D1. Renderizar o shell não é evidência
 * de que o usuário está autenticado.
 *
 * O que ela faz é **garantir a linha do usuário no banco** (D5) antes de
 * qualquer filha ler dados por `user_id` — a moldura é o único ponto por onde
 * `/dashboard`, `/upload` e `/revisao` passam sem exceção.
 *
 * `force-dynamic` por causa do mês no cabeçalho: pré-renderizado no build, o
 * mês congelaria na data do deploy — um deploy em agosto continuaria dizendo
 * "agosto" em setembro. Quando o mês virar um estado escolhido pelo usuário
 * (spec do dashboard), essa decisão será revisitada.
 */
export const dynamic = "force-dynamic";

function mesAtualPtBr() {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // O retorno não é usado aqui: a chamada existe pela **garantia** (D5), não
  // pelo dado. Quem exibe nome e foto é o `<UserButton />` (D8).
  await garantirUsuario();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <CabecalhoApp mesReferencia={mesAtualPtBr()} />

      {/* Espaço inferior no mobile para a barra fixa não cobrir o conteúdo. */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 pb-28 md:pb-8">
        {children}
      </main>

      <NavegacaoPrincipal
        variante="inferior"
        className="fixed inset-x-0 bottom-0 z-10 md:hidden"
      />
    </div>
  );
}
