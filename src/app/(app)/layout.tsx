import { CabecalhoApp } from "@/features/shell/CabecalhoApp";
import { NavegacaoPrincipal } from "@/features/shell/NavegacaoPrincipal";

/**
 * Moldura da área interna (`/dashboard`, `/upload`, `/revisao`).
 *
 * **Esta moldura não protege nada.** Quem bloqueia requisição sem sessão é o
 * middleware, no servidor, na tarefa D1. Renderizar o shell não é evidência
 * de que o usuário está autenticado.
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

export default function AppLayout({ children }: LayoutProps<"/">) {
  // Falso — vem do Clerk na D8.
  const nome = "Davi Lucas";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <CabecalhoApp nome={nome} mesReferencia={mesAtualPtBr()} />

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
