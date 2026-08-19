import { UserButton } from "@clerk/nextjs";
import { APARENCIA_CLERK } from "@/features/autenticacao/aparencia-clerk";
import { NavegacaoPrincipal } from "@/features/shell/NavegacaoPrincipal";

/**
 * Cabeçalho da área interna — Server Component.
 *
 * Continua servidor mesmo importando o `<UserButton />`: o widget já vem
 * marcado como cliente pelo próprio Clerk.
 *
 * Perdeu a prop `nome` na D8 — quem sabe o nome e a foto agora é o Clerk, e
 * sem foto o widget mostra iniciais sozinho. A moldura de `(app)` continua
 * chamando `garantirUsuario()`, que nunca foi por causa do nome: é a garantia
 * da linha no banco (D5) antes de qualquer filha ler por `user_id`.
 */
export function CabecalhoApp({ mesReferencia }: { mesReferencia: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/92 backdrop-blur-md">
      <div className="mx-auto flex h-[62px] w-full max-w-5xl items-center gap-4 px-5">
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold tracking-[2px] text-primary uppercase">
            6 Potes
          </p>
          <p className="truncate text-sm font-bold">{mesReferencia}</p>
        </div>

        {/* No desktop a navegação vive aqui; no mobile, na barra inferior. */}
        <NavegacaoPrincipal variante="topo" className="ml-auto hidden md:flex" />

        <div className="ml-auto flex items-center md:ml-0">
          <UserButton appearance={APARENCIA_CLERK} />
        </div>
      </div>
    </header>
  );
}
