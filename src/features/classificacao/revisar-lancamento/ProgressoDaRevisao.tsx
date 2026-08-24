import { rotuloDeMes } from "@/lib/mes";

/**
 * "3 de 17" e a barra (tarefa B1).
 *
 * Existe porque decidir dezessete coisas sem saber quantas faltam é o tipo de
 * tarefa que se abandona no meio. O número e a barra dizem que isso acaba.
 */
export function ProgressoDaRevisao({
  posicao,
  total,
  mes,
}: {
  posicao: number;
  total: number;
  mes: string;
}) {
  const feitos = posicao - 1;
  const porcento = total === 0 ? 0 : Math.round((feitos / total) * 100);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] font-bold tracking-[1.5px] text-dim uppercase">
          {rotuloDeMes(mes)}
        </span>
        <span className="font-mono text-xs font-bold text-text">
          {posicao} <span className="text-dim">de</span> {total}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={feitos}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${feitos} de ${total} decididos`}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${porcento}%` }}
        />
      </div>
    </div>
  );
}
