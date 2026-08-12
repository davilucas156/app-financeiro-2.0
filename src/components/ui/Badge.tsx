import { cn } from "@/lib/cn";

/**
 * `.vh-badge` + `.badge-*` do planejamento_anual_davi.html.
 *
 * Fundo a 8% da cor, borda a 20%, texto na cor cheia. As variantes coloridas
 * levam o ponto `●`; `dim` não leva — é assim no CSS original.
 */
export type BadgeVariant = "green" | "gold" | "blue" | "dim";

const variantes: Record<BadgeVariant, { classes: string; ponto: boolean }> = {
  green: { classes: "bg-green/8 border-green/20 text-green", ponto: true },
  gold: { classes: "bg-gold/8 border-gold/20 text-gold", ponto: true },
  blue: { classes: "bg-blue/8 border-blue/20 text-blue", ponto: true },
  dim: { classes: "bg-dim/8 border-dim/30 text-dim", ponto: false },
};

export function Badge({
  variant = "dim",
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  const { classes, ponto } = variantes[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[20px] border px-3.5 py-1.5",
        "font-mono text-[10px] font-bold tracking-[1px] uppercase",
        classes,
        className,
      )}
    >
      {ponto && (
        <span aria-hidden="true" className="text-[7px] leading-none">
          ●
        </span>
      )}
      {children}
    </span>
  );
}
