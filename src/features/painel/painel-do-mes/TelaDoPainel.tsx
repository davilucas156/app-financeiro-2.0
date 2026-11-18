import Link from "next/link";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ChamadaDoComparativo } from "@/features/painel/comparar-meses/ChamadaDoComparativo";
import type { MediaDoComparativo } from "@/features/painel/comparar-meses/comparativo";
import { ForaDaContaNoPainel } from "@/features/painel/fora-da-conta/ForaDaContaNoPainel";
import { CampoDeRenda } from "@/features/painel/renda-do-mes/CampoDeRenda";
import { AbasDoPainel } from "@/features/painel/navegar-entre-meses/AbasDoPainel";
import { RemoverOMes } from "@/features/painel/remover-o-mes/RemoverOMes";
import { FaixaDoVeredito } from "@/features/painel/veredito-do-mes/FaixaDoVeredito";
import { CartaoDoPote } from "./CartaoDoPote";
import type { DadosDoPainel } from "./painelDoMes.service";
import { TopoDoMes } from "./TopoDoMes";
import { vereditoDoPainel } from "./vereditoDoPainel";

/**
 * Tudo o que o painel lê, mais a frase do comparativo.
 *
 * `DadosDoPainel` vem do serviço (`server-only`) só como `import type`, que
 * some na compilação: a tela não carrega o serviço, só o formato dele.
 */
type Props = DadosDoPainel & {
  /**
   * Só a frase do comparativo (spec 09) — não o comparativo inteiro.
   *
   * O painel deixou de desenhar as barras e passou a convidar para a
   * `/comparativo`. É o que permite ele parar de fazer a consulta cara do gasto
   * por pote, mês a mês.
   */
  media: MediaDoComparativo;
};

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
  media,
  foraDaConta,
}: Props) {
  const rendaCentavos = renda?.centavos ?? null;
  const deGasto = potes.filter((p) => p.tipo === "gasto");
  const deRenda = potes.filter((p) => p.tipo === "renda");

  /*
   * O veredito (tarefa B1) sai daqui e não do servidor, e não é atalho: tudo o
   * que ele precisa já chegou nesta tela, e a meta de cada pote é a mesma conta
   * que o `CartaoDoPote` faz para desenhar a barra. Uma segunda consulta
   * produziria os mesmos números com uma segunda chance de divergir.
   */
  const veredito = vereditoDoPainel({
    cobertura,
    rendaCentavos,
    saiuCentavos,
    potes: deGasto,
  });

  return (
    <>
      <SectionTitle>Painel do mês</SectionTitle>

      {/*
        A fileira de abas (spec 12, B1). Ela era desenhada aqui mesmo, de dentro
        do `TopoDoMes`; mudou de arquivo, não de lugar na tela.
      */}
      <AbasDoPainel meses={meses} mes={mes} aqui="painel" />

      <TopoDoMes
        entrouCentavos={entrouCentavos}
        saiuCentavos={saiuCentavos}
        diferencaCentavos={diferencaCentavos}
        cobertura={cobertura}
        faltamDecidir={faltamDecidir}
      />

      <FaixaDoVeredito veredito={veredito} />

      <CampoDeRenda mes={mes} renda={renda} />

      <SectionTitle>Os potes</SectionTitle>

      <div className="space-y-2">
        {deGasto.map((pote) => (
          <CartaoDoPote
            key={pote.id}
            pote={pote}
            rendaDeclaradaCentavos={rendaCentavos}
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
                rendaDeclaradaCentavos={rendaCentavos}
                categorias={categorias}
              />
            ))}
          </div>
        </>
      )}

      {/*
        Depois dos potes, antes do comparativo: é a nota de rodapé do mês, e
        quem chega aqui já está procurando por ela — "por que as entradas deram
        menos do que o extrato diz?". Ver o docblock do componente.
      */}
      <ForaDaContaNoPainel dados={foraDaConta} />

      <ChamadaDoComparativo media={media} mes={mes} />

      {/*
        O caminho até a `/categorias`, que fica fora da barra de navegação
        (pendência 3). Aqui embaixo porque é olhando os potes que se vê um nome
        errado ou uma categoria no pote errado — a vontade de arrumar nasce
        deste lado, não de um item de menu.
      */}
      <p className="mt-8 text-2xs leading-relaxed text-dim">
        Categoria com nome errado, repetida ou no pote errado?{" "}
        <Link href="/categorias" className="underline underline-offset-4">
          Arrumar categorias
        </Link>
        .
      </p>

      {/*
        ⚠ **Depois do caminho até a `/categorias`, e não antes** (spec 14, D1).
        Arrumar categoria é rotineiro e nasce de olhar os potes; remover um mês é
        raro e destrutivo. O último item da tela é o que se encontra procurando,
        não o que se esbarra rolando — e é a mesma razão de ele não ficar junto
        das abas, onde o dedo passa todo dia.
      */}
      <RemoverOMes mes={mes} />
    </>
  );
}
