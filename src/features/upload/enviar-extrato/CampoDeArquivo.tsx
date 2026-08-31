import { cn } from "@/lib/cn";
import { EXTENSOES_ACEITAS } from "@/features/upload/limites";

/**
 * Um campo de arquivo (tarefas B1 e D3).
 *
 * O bloco inteiro é um `<label>` com o input dentro: assim tocar em qualquer
 * ponto abre o seletor. Num celular, um alvo do tamanho do cartão é a
 * diferença entre acertar de primeira e tentar três vezes.
 *
 * O componente continua **burro** — não valida, não lê o arquivo, não guarda
 * estado. Quem faz isso é o `FormularioDeEnvio`.
 */
export type EstadoDoCampo = "vazio" | "escolhido" | "enviando" | "erro";

export function CampoDeArquivo({
  nome,
  rotulo,
  descricao,
  opcional = false,
  estado = "vazio",
  arquivo,
  erro,
  onArquivo,
  className,
}: {
  /** `name` do input — é por ele que a server action lê o arquivo. */
  nome: string;
  rotulo: string;
  descricao: string;
  /** Diz na cara que dá para enviar sem este. Um campo que parece
   * obrigatório e não é trava o usuário. */
  opcional?: boolean;
  estado?: EstadoDoCampo;
  arquivo?: { nome: string; tamanho: string };
  erro?: string;
  onArquivo?: (arquivo: File | undefined) => void;
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
          name={nome}
          accept={`${EXTENSOES_ACEITAS.join(",")},text/csv`}
          disabled={travado}
          onChange={(e) => onArquivo?.(e.target.files?.[0])}
          className="sr-only"
        />

        <span aria-hidden="true" className="text-xl">
          {temErro ? "⚠" : estado === "escolhido" ? "📄" : "＋"}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-bold">{rotulo}</span>
            {opcional && (
              <span className="font-mono text-4xs tracking-[1px] text-dim uppercase">
                opcional
              </span>
            )}
          </span>

          {arquivo ? (
            <span className="mt-1 flex items-baseline gap-2">
              {/* `truncate` e não quebra de linha: nome de arquivo de banco é
                  longo e empurraria o tamanho para fora da tela em 360px. */}
              <span className="truncate text-xs text-text">{arquivo.nome}</span>
              <span className="shrink-0 font-mono text-3xs text-dim">
                {arquivo.tamanho}
              </span>
            </span>
          ) : (
            <span className="mt-1 block text-xs leading-relaxed text-dim">
              {descricao}
            </span>
          )}
        </span>

        {travado && (
          <span className="font-mono text-4xs tracking-[1px] text-dim uppercase">
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
