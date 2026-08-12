import { cn } from "@/lib/cn";

/**
 * Tela sem dados: diz o que falta e qual é o próximo passo, em vez de mostrar
 * um vazio mudo.
 *
 * Sem regra de negócio — quem decide que está vazio é quem usa.
 */
export function EstadoVazio({
  emoji,
  titulo,
  descricao,
  acao,
  className,
}: {
  emoji: string;
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-card border border-dashed border-border2 px-6 py-14 text-center",
        className,
      )}
    >
      <span aria-hidden="true" className="text-3xl">
        {emoji}
      </span>
      <h2 className="mt-4 text-base font-bold">{titulo}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-dim">
        {descricao}
      </p>
      {acao && <div className="mt-6">{acao}</div>}
    </div>
  );
}
