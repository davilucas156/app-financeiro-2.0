"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  prepararConta,
  type EstadoOnboarding,
} from "@/features/onboarding/concluir-onboarding/concluirOnboarding.action";

/**
 * O botão "Começar" e os estados dele (tarefa D7).
 *
 * É o **único** pedaço de cliente desta tela. A lista dos potes continua sendo
 * renderizada no servidor: assim `POTES_PADRAO` inteiro não vai para o bundle.
 *
 * `<form action={...}>` de propósito, e não um `onClick`: sem JavaScript
 * carregado o envio ainda acontece.
 */
export function AcaoComecar() {
  const [estado, agir, enviando] = useActionState<EstadoOnboarding, FormData>(
    prepararConta,
    null,
  );

  return (
    <form action={agir}>
      {estado === "erro" && (
        <Card role="alert" className="mt-6 border-red/20 bg-red/8 p-4">
          <p className="text-xs font-bold text-red">
            Não conseguimos preparar sua conta.
          </p>
          <p className="mt-1.5 text-xs text-dim">
            Nada foi gravado pela metade. Tente de novo.
          </p>
        </Card>
      )}

      {/* `loading` desabilita o botão — é a primeira das três camadas contra
          o duplo toque. As outras duas estão no servidor, porque cliente
          desabilitado não é garantia de nada. */}
      <Button type="submit" loading={enviando} className="mt-6 w-full">
        {enviando
          ? "Preparando sua conta…"
          : estado === "erro"
            ? "Tentar de novo"
            : "Começar"}
      </Button>
    </form>
  );
}
