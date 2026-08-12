import { NavegacaoPrincipal } from "@/features/shell/NavegacaoPrincipal";

/**
 * Cabeçalho da área interna — Server Component.
 *
 * O avatar é **falso** (tarefa B4, protótipo visual). O `<UserButton />` real
 * do Clerk, com o "Sair", entra na D8.
 */
export function CabecalhoApp({
  nome,
  mesReferencia,
}: {
  nome?: string;
  mesReferencia: string;
}) {
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

        <Avatar nome={nome} className="ml-auto md:ml-0" />
      </div>
    </header>
  );
}

/** Placeholder do `<UserButton />`. Sem foto, mostra iniciais. */
function Avatar({ nome, className }: { nome?: string; className?: string }) {
  const iniciais = (nome ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return (
    <span
      title={nome ?? "Conta"}
      className={`flex size-8 shrink-0 items-center justify-center rounded-full border border-border2 bg-card font-mono text-[10px] font-bold text-dim ${className ?? ""}`}
    >
      {iniciais || "—"}
    </span>
  );
}
