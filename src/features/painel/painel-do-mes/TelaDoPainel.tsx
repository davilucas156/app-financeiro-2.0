import { SectionTitle } from "@/components/ui/SectionTitle";
import type { CategoriaEscolhivel } from "@/features/classificacao/revisar-lancamento/categorias";
import type { Cobertura } from "@/features/painel/somar-o-mes/cobertura";
import { CampoDeRenda } from "@/features/painel/renda-do-mes/CampoDeRenda";
import type { RendaDeclarada } from "@/features/painel/renda-do-mes/rendaDeclarada";
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
  renda,
  potes,
  categorias,
}: {
  mes: string;
  meses: string[];
  entrouCentavos: number;
  saiuCentavos: number;
  diferencaCentavos: number;
  cobertura: Cobertura;
  faltamDecidir: number;
  renda: RendaDeclarada | null;
  potes: PoteNoPainel[];
  categorias: CategoriaEscolhivel[];
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

      <CampoDeRenda mes={mes} renda={renda} />

      <SectionTitle>Os potes</SectionTitle>

      <div className="space-y-2">
        {deGasto.map((pote) => (
          <CartaoDoPote
            key={pote.id}
            pote={pote}
            rendaDeclaradaCentavos={renda?.centavos ?? null}
            categorias={categorias}
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
                rendaDeclaradaCentavos={renda?.centavos ?? null}
                categorias={categorias}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
