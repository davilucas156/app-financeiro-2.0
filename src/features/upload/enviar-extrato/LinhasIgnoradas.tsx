import type { LinhaIgnorada } from "@/features/upload/ler-arquivo/lancamentos";
import { cn } from "@/lib/cn";

/**
 * As linhas que o leitor não conseguiu ler.
 *
 * ⚠ **"3 ignoradas" sem dizer quais só gera desconfiança.** Cada uma aparece
 * com o número da linha, o **motivo** e o conteúdo original — é o que permite
 * abrir o CSV e conferir sem adivinhar.
 *
 * Um componente só, usado no resumo logo após importar **e** no histórico
 * meses depois. Duas cópias do mesmo desenho divergiriam, e o histórico — que
 * é o menos olhado — seria o que ficaria para trás.
 */
export function LinhasIgnoradas({
  linhas,
  className,
}: {
  linhas: LinhaIgnorada[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-2", className)}>
      {/* Chave pelo índice: dois arquivos podem ter a mesma linha 12 com o
          mesmo motivo, e a lista nunca reordena. */}
      {linhas.map((i, indice) => (
        <li
          key={indice}
          className="rounded-pote border border-border bg-card px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="shrink-0 font-mono text-[10px] tracking-[1px] text-dim2 uppercase">
              linha {i.linha}
            </span>
            <span className="text-xs font-bold text-gold">{i.motivo}</span>
          </div>

          {/* O conteúdo original é o que permite abrir o CSV e conferir.
              `break-all` porque a linha pode não ter espaço nenhum. */}
          <p className="mt-1.5 font-mono text-[10px] leading-relaxed break-all text-dim2">
            {i.conteudo}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** "3 linhas ficaram de fora" / "1 linha ficou de fora". */
export function rotuloDeIgnoradas(quantas: number): string {
  return quantas === 1
    ? "1 linha ficou de fora"
    : `${quantas} linhas ficaram de fora`;
}
