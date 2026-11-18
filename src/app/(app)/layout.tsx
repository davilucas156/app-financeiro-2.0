import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { temaAtual } from "@/features/aparencia/tema/temaAtual";
import { CabecalhoApp } from "@/features/shell/CabecalhoApp";
import { COLUNA_DO_APP } from "@/features/shell/colunaDoApp";
import { NavegacaoPrincipal } from "@/features/shell/NavegacaoPrincipal";
import { cn } from "@/lib/cn";

/**
 * Moldura da área interna (todas as rotas de `(app)`).
 *
 * **Quem decide o acesso é o proxy** (`src/proxy.ts`), no servidor, antes de
 * qualquer página renderizar. Renderizar esta moldura não é evidência de nada.
 *
 * O que ela faz é **garantir a linha do usuário no banco** (D5) na carga
 * inicial. Um layout **não re-executa** na navegação entre páginas filhas, então
 * essa garantia não se repete a cada clique. Por isso a obrigação é de **cada
 * página e cada action** que lê por `user_id`: chamar `garantirUsuario()` por
 * conta própria. Não confie no layout para isso.
 *
 * `force-dynamic` declara a intenção de não pré-renderizar: pré-renderizado no
 * build, o mês do cabeçalho congelaria na data do deploy. É redundante, porque
 * `auth()` e `cookies()` já tornam a rota dinâmica, mas fica explícito. Quando o
 * mês virar um estado escolhido pelo usuário (spec do dashboard), essa decisão
 * será revisitada.
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
      <CabecalhoApp mesReferencia={mesAtualPtBr()} tema={await temaAtual()} />

      {/* Espaço inferior no mobile para a barra fixa não cobrir o conteúdo. */}
      <main className={cn(COLUNA_DO_APP, "flex-1 py-8 pb-28 md:pb-8")}>
        {children}
      </main>

      {/*
        ⚠ **A barra de navegação sobe acima da barra de gestos (spec 07).**

        Instalado no iPhone, os 34px da barra de gestos ficam por cima do
        conteúdo: sem isto, o item "Revisar" fica embaixo dela e o toque
        acerta o sistema em vez do app.
      */}
      <NavegacaoPrincipal
        variante="inferior"
        className="fixed inset-x-0 bottom-0 z-10 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      />
    </div>
  );
}
