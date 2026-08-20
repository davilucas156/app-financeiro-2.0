import Link from "next/link";
import { NOMES_DOS_ESTADOS, type NomeDoEstado } from "./dadosFalsos";

/**
 * ⚠ **Andaime.** Sai na D3, junto com `dadosFalsos.ts`.
 *
 * Existe para o Davi percorrer os estados da tela com o polegar, no celular,
 * sem digitar URL — que é o que o portão de aprovação exige dele.
 *
 * Fica atrás de `?estado=`: o `/revisao` sem parâmetro continua sendo a tela
 * verdadeira que a D6 da spec 02 acabou de fazer parar de mentir.
 */

const ROTULO: Record<NomeDoEstado, string> = {
  padrao: "sem sugestão",
  sugestoes: "com sugestão",
  pix: "pix",
  regra: "virar regra?",
  "sem-trecho": "sem trecho",
  fim: "acabou",
};

export function Andaime({ atual }: { atual: NomeDoEstado }) {
  return (
    <div className="mt-10 border-t border-dashed border-border2 pt-4">
      <p className="font-mono text-[9px] tracking-[1.5px] text-dim2 uppercase">
        Protótipo · estados da tela
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {NOMES_DOS_ESTADOS.map((nome) => (
          <Link
            key={nome}
            href={`/revisao?estado=${nome}`}
            aria-current={nome === atual ? "page" : undefined}
            className={`inline-flex min-h-9 items-center rounded-pote border px-3 font-mono text-[10px] transition-colors ${
              nome === atual
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-card text-dim hover:bg-card2"
            }`}
          >
            {ROTULO[nome]}
          </Link>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-dim2">
        Dados inventados. Nada aqui grava, nada aqui lê do banco. Sai quando a
        tela passar a ler os pendentes de verdade.
      </p>
    </div>
  );
}
