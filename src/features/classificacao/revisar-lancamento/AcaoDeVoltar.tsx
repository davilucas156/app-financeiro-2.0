"use client";

import { useState, useTransition } from "react";
import { FALHA_DE_CONEXAO } from "@/lib/falhaDeConexao";
import { desfazer } from "./desfazerDecisao.action";
import type { PodeVoltar } from "./desfazer";

/**
 * O "Voltar" (tarefa D6).
 *
 * ## Ele fica apagado quando não há o que desfazer
 *
 * E isso é a parte importante. O botão esteve apagado desde a D4 porque
 * desfazer não existia — fingir que funcionava seria pior. Agora ele apaga
 * **só** quando é verdade que não há passo anterior: primeira decisão da conta,
 * ou um desfazer que já aconteceu.
 *
 * ## Ele existe também na tela vazia
 *
 * Ao classificar o último pendente a tela vira "Nada pendente", e o botão mora
 * dentro do componente do lançamento. Sem duplicá-lo lá, ele sumiria
 * exatamente na decisão mais provável de se querer desfazer.
 *
 * ## Não usa `AcaoDeDecidir`
 *
 * `AcaoDeDecidir` recebe uma `EntradaDaDecisao` e chama `decidir`; o Voltar não
 * tem entrada nenhuma, só o estado apagado/aceso do botão, e chama `desfazer`.
 */
export function AcaoDeVoltar({ voltar }: { voltar: PodeVoltar | null }) {
  const [desfazendo, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const disponivel = voltar !== null;

  return (
    <>
      <button
        type="button"
        disabled={!disponivel || desfazendo}
        aria-busy={desfazendo || undefined}
        title={
          disponivel
            ? `Reabre: ${voltar.descricao.trim()}`
            : "Nada para desfazer"
        }
        onClick={() =>
          iniciar(async () => {
            setErro(null);
            try {
              const r = await desfazer();
              // Sucesso não precisa de aviso: o lançamento anterior voltando
              // ao topo da fila **é** o aviso.
              if (!r.ok) setErro(r.erro);
            } catch {
              setErro(FALHA_DE_CONEXAO);
            }
          })
        }
        className="inline-flex min-h-11 w-full items-center justify-center rounded-card border border-border2 bg-card px-3 text-xs font-bold text-text transition-colors enabled:hover:bg-card2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Voltar
      </button>

      {erro && (
        <p role="alert" className="mt-1.5 text-2xs leading-relaxed text-red">
          {erro}
        </p>
      )}
    </>
  );
}
