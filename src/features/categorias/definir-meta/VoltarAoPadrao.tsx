"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { restaurarMetas } from "./definirMeta.action";

/**
 * O caminho de volta (tarefa D1).
 *
 * ## Por que ele existe
 *
 * Mexer no rateio é fácil e reversível **só se houver para onde voltar**. Sem
 * isto, quem experimentou até se perder teria como saída lembrar de cabeça os
 * seis números — ou apagar a conta.
 *
 * ## A confirmação diz o que a restauração faz **e o que não faz**
 *
 * ⚠ Ela mexe só nos percentuais. Não toca em categoria, em lançamento, em
 * regra, nem no nome dos potes — e é exatamente isso que alguém teme ao ver
 * "voltar ao padrão" numa tela chamada Categorias.
 */
export function VoltarAoPadrao() {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [restaurando, transicao] = useTransition();

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="mt-2 inline-flex min-h-11 items-center font-mono text-3xs font-bold tracking-wider text-dim uppercase transition-colors hover:text-text"
      >
        Voltar ao rateio padrão
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-pote border border-border2 bg-card p-3">
      <p className="text-xs leading-relaxed text-text">
        Devolver as metas ao padrão do método?
      </p>
      <p className="mt-1.5 text-3xs leading-relaxed text-dim">
        Os seis potes do rateio voltam a{" "}
        <strong className="font-bold">30/25/15/15/10/5</strong>, e Manutenção e
        Outros voltam a <strong>não ter meta</strong>. Suas categorias, seus
        lançamentos e os nomes dos potes{" "}
        <strong className="font-bold">não mudam</strong> — só os percentuais.
      </p>

      {erro && (
        <p role="alert" className="mt-2 text-3xs text-red">
          {erro}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          loading={restaurando}
          onClick={() =>
            transicao(() => {
              void restaurarMetas().then((r) => {
                if (r.ok) setConfirmando(false);
                else setErro(r.erro);
              });
            })
          }
        >
          Voltar ao padrão
        </Button>
        <Button variant="secondary" onClick={() => setConfirmando(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
