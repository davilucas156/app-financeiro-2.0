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
      <p className="font-mono text-[10px] font-bold tracking-[1.5px] text-dim uppercase">
        Protótipo · estados da tela
      </p>

      {/*
        Texto claro e 44px de alvo. A primeira versão usava `text-dim` em 10px,
        e o Davi não conseguiu ler no celular — o cinza que serve para um rótulo
        secundário não serve para o que se toca.
      */}
      <div className="mt-3 flex flex-wrap gap-2">
        {NOMES_DOS_ESTADOS.map((nome) => (
          <Link
            key={nome}
            href={`/revisao?estado=${nome}`}
            aria-current={nome === atual ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-pote border px-4 text-sm font-bold transition-colors ${
              nome === atual
                ? "border-primary bg-primary/15 text-primary"
                : "border-border2 bg-card text-text hover:bg-card2"
            }`}
          >
            {ROTULO[nome]}
          </Link>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-dim">
        Dados inventados. Nada aqui grava, nada aqui lê do banco. Sai quando a
        tela passar a ler os pendentes de verdade.
      </p>
    </div>
  );
}
