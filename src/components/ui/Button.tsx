import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Não existe no planejamento_anual_davi.html (o painel é estático).
 * Desenhado a partir dos tokens da A2.
 *
 * Altura mínima de 44px: é o alvo de toque que a spec exige na navegação
 * (tarefa B4), adotado aqui para o app ter um único padrão de toque.
 *
 * `loading` desabilita o elemento — o duplo toque não pode disparar a ação
 * duas vezes.
 */
export type ButtonVariant = "primary" | "secondary";

// `enabled:` no hover: sem isso o botão desabilitado ainda reagiria ao
// passar o mouse, porque :hover casa com elementos desabilitados.
const variantes: Record<ButtonVariant, string> = {
  primary: "bg-primary text-bg enabled:hover:bg-orange",
  secondary: "border border-border2 bg-card text-text enabled:hover:bg-card2",
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  loading?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-card px-5 py-2.5",
        "text-sm font-bold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variantes[variant],
        className,
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0 animate-spin"
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />
      <path
        d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
