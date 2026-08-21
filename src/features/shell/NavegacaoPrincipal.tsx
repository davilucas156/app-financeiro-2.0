"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ROTAS_INTERNAS, type RotaInterna } from "@/features/shell/rotas";

/**
 * Navegação principal da área interna.
 *
 * **Único componente `"use client"` do projeto até aqui**, e por um motivo
 * específico: destacar o item ativo exige `usePathname()`, que é hook. O
 * cabeçalho, os layouts e as páginas continuam no servidor.
 *
 * Uma definição (`rotas.ts`), duas apresentações: barra inferior no mobile,
 * linha no cabeçalho no desktop. A variante escondida por `display:none` sai
 * da árvore de acessibilidade, então o leitor de tela não anuncia a navegação
 * duas vezes.
 */
export function NavegacaoPrincipal({
  variante,
  className,
}: {
  variante: "inferior" | "topo";
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        variante === "inferior"
          ? "border-t border-border bg-surface"
          : "gap-1",
        "flex items-center",
        className,
      )}
    >
      {ROTAS_INTERNAS.map((rota) => {
        const ativo = pathname === rota.href;

        return (
          <Link
            key={rota.href}
            href={rota.href}
            aria-current={ativo ? "page" : undefined}
            aria-label={rota.descricao}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 transition-colors",
              variante === "inferior"
                ? "flex-1 flex-col py-2 text-[10px]"
                : "rounded-card px-3 text-xs",
              "font-mono font-bold tracking-wider uppercase",
              ativo ? "text-primary" : "text-dim hover:text-text",
            )}
          >
            <Icone href={rota.href} />
            {rota.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

function Icone({ href }: { href: RotaInterna["href"] }) {
  const comum = {
    "aria-hidden": true,
    viewBox: "0 0 20 20",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "size-4 shrink-0",
  };

  if (href === "/dashboard") {
    // Barras — o painel.
    return (
      <svg {...comum}>
        <path d="M4 16V9M10 16V4M16 16v-5" />
      </svg>
    );
  }

  if (href === "/upload") {
    // Seta para cima saindo de uma base — enviar arquivo.
    return (
      <svg {...comum}>
        <path d="M10 13V4M6.5 7.5 10 4l3.5 3.5M4 15h12" />
      </svg>
    );
  }

  if (href === "/revisao") {
    // Check dentro de círculo — revisar/confirmar.
    return (
      <svg {...comum}>
        <path d="M6.5 10.5 9 13l5-5.5" />
        <circle cx="10" cy="10" r="7" />
      </svg>
    );
  }

  // Faders — as regras que se ajustam.
  return (
    <svg {...comum}>
      <path d="M4 5h12M4 10h12M4 15h12" />
      <circle cx="8" cy="5" r="1.6" />
      <circle cx="13" cy="10" r="1.6" />
      <circle cx="7" cy="15" r="1.6" />
    </svg>
  );
}
