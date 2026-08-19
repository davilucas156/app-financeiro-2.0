import { cn } from "@/lib/cn";

/**
 * Mês de referência da importação (tarefa B1) — **protótipo visual**.
 *
 * Um `<select>` nativo de propósito: no celular ele abre o seletor do próprio
 * sistema, que é maior, rolável e acessível de graça. Um dropdown nosso seria
 * mais bonito e pior de usar com o polegar.
 */

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Rótulo "Junho / 2026" a partir de "2026-06". */
export function rotuloDeMes(mes: string): string {
  const [ano, m] = mes.split("-");
  const nome = MESES[Number(m) - 1] ?? m;
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} / ${ano}`;
}

/**
 * Os últimos meses até o atual. **Futuro fica de fora**: extrato de mês que
 * ainda não aconteceu não existe, e oferecer a opção só convida ao engano.
 */
export function mesesDisponiveis(hoje = new Date(), quantos = 18): string[] {
  const lista: string[] = [];

  for (let i = 0; i < quantos; i++) {
    const d = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - i, 1));
    lista.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  return lista;
}

export function SeletorDeMes({
  valor,
  opcoes,
  desabilitado = false,
  className,
}: {
  valor: string;
  opcoes: string[];
  desabilitado?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor="mes-referencia"
        className="font-mono text-[9px] font-bold tracking-[2px] text-dim uppercase"
      >
        Mês de referência
      </label>

      <select
        id="mes-referencia"
        name="mes"
        defaultValue={valor}
        disabled={desabilitado}
        className={cn(
          "mt-2 min-h-11 w-full rounded-card border border-border2 bg-card px-4",
          "text-sm font-bold text-text",
          "disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        {opcoes.map((mes) => (
          <option key={mes} value={mes}>
            {rotuloDeMes(mes)}
          </option>
        ))}
      </select>
    </div>
  );
}
