import { cn } from "@/lib/cn";

/**
 * Um campo de arquivo (tarefa B1) — **protótipo visual**.
 *
 * Não lê nada. O `<input type="file">` existe para o seletor do sistema abrir
 * no celular; quem faz algo com o arquivo é a D3.
 *
 * O bloco inteiro é um `<label>` com o input dentro: assim tocar em qualquer
 * ponto abre o seletor. Num celular, um alvo do tamanho do cartão é a
 * diferença entre acertar de primeira e tentar três vezes.
 */
export type EstadoDoCampo = "vazio" | "escolhido" | "enviando" | "erro";

export function CampoDeArquivo({
  rotulo,
  descricao,
  opcional = false,
  estado = "vazio",
  arquivo,
  erro,
  className,
}: {
  rotulo: string;
  descricao: string;
  /** Diz na cara que dá para enviar sem este. Um campo que parece
   * obrigatório e não é trava o usuário. */
  opcional?: boolean;
  estado?: EstadoDoCampo;
  arquivo?: { nome: string; tamanho: string };
  erro?: string;
  className?: string;
}) {
  const travado = estado === "enviando";
  const temErro = estado === "erro";

  return (
    <div className={className}>
      <label
        className={cn(
          "flex w-full items-center gap-3 rounded-card border border-dashed px-4 py-4 transition-colors",
          temErro ? "border-red/40 bg-red/5" : "border-border2 bg-card",
          travado
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-card2",
        )}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={travado}
          className="sr-only"
        />

        <span aria-hidden="true" className="text-xl">
          {temErro ? "⚠" : estado === "escolhido" ? "📄" : "＋"}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-bold">{rotulo}</span>
            {opcional && (
              <span className="font-mono text-[9px] tracking-[1px] text-dim2 uppercase">
                opcional
              </span>
            )}
          </span>

          {arquivo && estado !== "vazio" ? (
            <span className="mt-1 flex items-baseline gap-2">
              {/* `truncate` e não quebra de linha: nome de arquivo de banco é
                  longo e empurraria o tamanho para fora da tela em 360px. */}
              <span className="truncate text-xs text-text">{arquivo.nome}</span>
              <span className="shrink-0 font-mono text-[10px] text-dim2">
                {arquivo.tamanho}
              </span>
            </span>
          ) : (
            <span className="mt-1 block text-xs leading-relaxed text-dim">
              {descricao}
            </span>
          )}
        </span>

        {estado === "enviando" && (
          <span className="font-mono text-[9px] tracking-[1px] text-dim uppercase">
            enviando
          </span>
        )}
      </label>

      {temErro && erro && (
        <p role="alert" className="mt-2 px-1 text-xs leading-relaxed text-red">
          {erro}
        </p>
      )}
    </div>
  );
}
