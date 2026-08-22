import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { emReais } from "@/lib/dinheiro";
import type { Cobertura } from "@/features/painel/somar-o-mes/cobertura";
import { CartaoDoPote } from "./CartaoDoPote";
import { TopoDoMes } from "./TopoDoMes";
import type { PoteNoPainel } from "./poteNoPainel";

/**
 * O painel do mês (tarefas B1, B2 e B3).
 *
 * ## A ordem da tela é a ordem da confiança
 *
 * Mês → entrou/saiu/diferença → cobertura → renda declarada → potes.
 *
 * A renda vem **antes** dos potes de propósito: ela é a régua de todas as metas
 * que aparecem embaixo. Escondida numa tela de configuração, as metas
 * pareceriam lei da natureza; visível, ficam sendo o que são — uma fatia de um
 * número que o Davi escolheu.
 *
 * ## Gasto e renda em blocos separados
 *
 * Os oito potes de gasto repartem o que sai; o de renda registra o que entra.
 * Misturá-los na mesma lista faria a barra de um querer dizer o mesmo que a do
 * outro, e não quer: no de gasto, cheia é ruim.
 */
export function TelaDoPainel({
  mes,
  meses,
  entrouCentavos,
  saiuCentavos,
  diferencaCentavos,
  cobertura,
  faltamDecidir,
  rendaDeclaradaCentavos,
  potes,
}: {
  mes: string;
  meses: string[];
  entrouCentavos: number;
  saiuCentavos: number;
  diferencaCentavos: number;
  cobertura: Cobertura;
  faltamDecidir: number;
  rendaDeclaradaCentavos: number | null;
  potes: PoteNoPainel[];
}) {
  const deGasto = potes.filter((p) => p.tipo === "gasto");
  const deRenda = potes.filter((p) => p.tipo === "renda");

  return (
    <>
      <SectionTitle>Painel do mês</SectionTitle>

      <TopoDoMes
        mes={mes}
        meses={meses}
        entrouCentavos={entrouCentavos}
        saiuCentavos={saiuCentavos}
        diferencaCentavos={diferencaCentavos}
        cobertura={cobertura}
        faltamDecidir={faltamDecidir}
      />

      <RendaDeclarada centavos={rendaDeclaradaCentavos} />

      <SectionTitle>Os potes</SectionTitle>

      <div className="space-y-2">
        {deGasto.map((pote) => (
          <CartaoDoPote
            key={pote.id}
            pote={pote}
            rendaDeclaradaCentavos={rendaDeclaradaCentavos}
          />
        ))}
      </div>

      {deRenda.length > 0 && (
        <>
          <SectionTitle>O que entrou</SectionTitle>
          <div className="space-y-2">
            {deRenda.map((pote) => (
              <CartaoDoPote
                key={pote.id}
                pote={pote}
                rendaDeclaradaCentavos={rendaDeclaradaCentavos}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

/**
 * A régua das metas, na tela.
 *
 * ⚠ **É um número declarado, não medido.** O motor classifica 55% do dinheiro
 * que sai e só 8% do que entra — uma meta calculada sobre a renda *medida*
 * seria uma fração de uma fração da verdade, e sairia errada com aparência de
 * certa. Foi essa medição que fez a base virar um valor que o Davi informa.
 *
 * E é por isso que ela fica visível: herdar do mês anterior é conveniente e tem
 * um custo — seis meses depois de um aumento, as metas continuariam calculadas
 * sobre o salário antigo. Mostrar o número é a defesa mais barata que existe.
 */
function RendaDeclarada({ centavos }: { centavos: number | null }) {
  return (
    <Card className="mt-3 border-border2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
            Renda do mês
          </p>
          <p className="mt-1 font-mono text-lg font-medium text-text">
            {centavos === null ? "não informada" : emReais(centavos)}
          </p>
        </div>

        {/* A D2 liga este botão. */}
        <button
          type="button"
          disabled
          className="inline-flex min-h-11 items-center rounded-card border border-border2 bg-card px-4 text-xs font-bold text-text disabled:opacity-40"
        >
          {centavos === null ? "Informar" : "Editar"}
        </button>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-dim">
        {centavos === null
          ? "Sem ela não dá para calcular meta nenhuma — e inventar uma base seria inventar a sua renda. Os potes abaixo mostram o gasto sem barra."
          : "As metas dos potes são fatias deste valor. Você informa; o app não adivinha."}
      </p>
    </Card>
  );
}
