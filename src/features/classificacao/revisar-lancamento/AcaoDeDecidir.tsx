"use client";

import { useState, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { decidir, type EntradaDaDecisao } from "./decidirLancamento.action";

/**
 * Um botão que grava uma decisão da revisão (tarefa D4).
 *
 * Existe como componente próprio porque três lugares diferentes precisam do
 * mesmo comportamento com aparências diferentes: a sugestão, a categoria da
 * lista e as saídas do topo. Duplicar o `useTransition` nos três garantiria
 * que um deles esqueceria de bloquear o toque duplo.
 *
 * ## O toque duplo não pode gravar duas vezes
 *
 * Enquanto a gravação está em voo o botão fica desabilitado. Sem isso, dois
 * toques no celular — que acontecem — gravariam duas decisões para o mesmo
 * lançamento, e a segunda sobrescreveria a primeira sem ninguém ver.
 */
export function AcaoDeDecidir({
  entrada,
  className,
  children,
}: {
  entrada: EntradaDaDecisao;
  className?: string;
  children: ReactNode;
}) {
  const [gravando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={gravando}
        aria-busy={gravando || undefined}
        onClick={() =>
          iniciar(async () => {
            setErro(null);
            const r = await decidir(entrada);
            // Sucesso não precisa de aviso: o próximo lançamento aparecendo no
            // lugar deste **é** o aviso.
            if (!r.ok) setErro(r.erro);
          })
        }
        className={cn(
          "transition-colors disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
      >
        {children}
      </button>

      {erro && (
        <p role="alert" className="mt-1.5 text-[11px] leading-relaxed text-red">
          {erro}
        </p>
      )}
    </>
  );
}
