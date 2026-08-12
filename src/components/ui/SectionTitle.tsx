import { cn } from "@/lib/cn";

/**
 * `.section-t` do planejamento_anual_davi.html: rótulo em DM Mono seguido de
 * uma régua que ocupa o resto da linha.
 */
export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-7 mb-4 flex items-center gap-3", className)}>
      <h2 className="font-mono text-[9px] font-bold tracking-[2.5px] whitespace-nowrap text-dim uppercase">
        {children}
      </h2>
      <span className="bg-border2 h-px flex-1" />
    </div>
  );
}
