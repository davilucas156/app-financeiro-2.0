import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Superfície padrão do painel: `.panel` / `.sc` do planejamento_anual_davi.html.
 *
 * `className` serve para **acrescentar** (espaçamento, largura, grid), não para
 * repintar — cor e borda vêm dos tokens.
 */
export function Card({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-card p-5",
        className,
      )}
      {...props}
    />
  );
}
