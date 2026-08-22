import type { Metadata } from "next";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { TelaDoPainel } from "@/features/painel/painel-do-mes/TelaDoPainel";
import {
  COBERTURA_FALSA,
  MES_FALSO,
  RENDA_FALSA,
  TOTAIS_FALSOS,
  potesFalsos,
} from "@/features/painel/painel-do-mes/dadosFalsos";

export const metadata: Metadata = {
  title: "Painel (andaime) · Painel Financeiro 6 Potes",
};

/**
 * ⚠ **ROTA TEMPORÁRIA — o protótipo visual da fase B.**
 *
 * Ela existe separada do `/dashboard` por um motivo específico: o dashboard
 * mostra números **reais** do Davi desde a D6 da spec 02. Pôr dados falsos lá
 * faria o que o comentário da rota de revisão avisa — "deixar os dois
 * convivendo garantiria que um dia alguém veria o falso achando que era o
 * real". Com dinheiro na tela, esse dia custa caro.
 *
 * A D5 move a tela para o `/dashboard` e apaga `dadosFalsos.ts` junto.
 *
 * Variantes: `?cobertura=completa` e `?renda=nao` — as duas únicas que não
 * coexistem na mesma tela. Os quatro estados de pote aparecem todos de uma vez,
 * de propósito: a pergunta do portão é se eles se distinguem **lado a lado**.
 */
export default async function PainelAndaimePage({
  searchParams,
}: {
  searchParams: Promise<{ cobertura?: string; renda?: string }>;
}) {
  await garantirUsuario();
  const { cobertura, renda } = await searchParams;

  const completa = cobertura === "completa";

  return (
    <>
      <div className="rounded-card border border-gold/30 bg-gold/8 px-4 py-3">
        <p className="text-xs font-bold text-gold">
          ⚠ Andaime — todos os números desta tela são inventados
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-dim">
          É o protótipo visual da fase B. Nenhum dado seu aparece aqui. Variantes:{" "}
          <code className="text-text">?cobertura=completa</code> ·{" "}
          <code className="text-text">?renda=nao</code>
        </p>
      </div>

      <TelaDoPainel
        mes={MES_FALSO}
        meses={["2026-06", MES_FALSO]}
        entrouCentavos={TOTAIS_FALSOS.entrouCentavos}
        saiuCentavos={TOTAIS_FALSOS.saiuCentavos}
        diferencaCentavos={TOTAIS_FALSOS.diferencaCentavos}
        cobertura={completa ? COBERTURA_FALSA.completa : COBERTURA_FALSA.incompleta}
        faltamDecidir={completa ? 0 : 20}
        rendaDeclaradaCentavos={renda === "nao" ? null : RENDA_FALSA}
        potes={potesFalsos()}
      />
    </>
  );
}
