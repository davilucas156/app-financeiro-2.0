import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { emReais } from "@/lib/dinheiro";
import { rotuloDeMes } from "@/lib/mes";
import type { Cobertura } from "@/features/painel/somar-o-mes/cobertura";

/**
 * O topo do painel (tarefa B1).
 *
 * ## A ordem é a da confiança
 *
 * **Entrou / saiu / diferença** vem antes de tudo porque não depende de
 * classificação nenhuma — só de `direcao`. É o número mais sólido da tela, e
 * responde a pergunta mais simples: fechei o mês no azul?
 *
 * **A cobertura vem antes dos potes**, e não depois. É ela que diz se dá para
 * acreditar neles. Um rodapé cinza aqui seria a defesa não funcionando: todo
 * número desta tela é uma soma correta de dados incompletos, e quem não lê isso
 * é enganado por uma tela que não mentiu.
 */
export function TopoDoMes({
  mes,
  meses,
  entrouCentavos,
  saiuCentavos,
  diferencaCentavos,
  cobertura,
  faltamDecidir,
}: {
  mes: string;
  meses: string[];
  entrouCentavos: number;
  saiuCentavos: number;
  diferencaCentavos: number;
  cobertura: Cobertura;
  faltamDecidir: number;
}) {
  return (
    <>
      <SeletorDeMeses mes={mes} meses={meses} />

      <Card className="mt-4 p-0">
        <div className="grid grid-cols-3 divide-x divide-border">
          <Numero rotulo="Entrou" centavos={entrouCentavos} cor="text-green" />
          <Numero rotulo="Saiu" centavos={saiuCentavos} cor="text-text" />
          <Numero
            rotulo="Diferença"
            centavos={diferencaCentavos}
            cor={diferencaCentavos < 0 ? "text-red" : "text-green"}
          />
        </div>
      </Card>

      <AvisoDeCobertura cobertura={cobertura} faltamDecidir={faltamDecidir} />
    </>
  );
}

/**
 * Os meses da conta, e o caminho entre eles.
 *
 * ⚠ **Estes eram `<span>`, e o seletor não levava a lugar nenhum.**
 *
 * Ele nasceu no protótipo visual da spec 04 (`1b3d195`), quando nada da tela
 * era ligado. O servidor foi ligado depois e ficou **completo**: a
 * `dashboard/page.tsx` lê `?mes=` e a `dadosDoPainel` confere o valor contra os
 * meses da própria conta. Só o elemento nunca virou link.
 *
 * O defeito era mudo do pior jeito: com alvo de toque de 44px, borda, hover e o
 * mês atual em destaque, ele **parecia** funcionar. Quem tinha um mês só não
 * notava; quem subiu o segundo tocou e não aconteceu nada.
 *
 * ⚠ **O mês atual continua sendo link para ele mesmo.** Desabilitá-lo pouparia
 * uma navegação e tiraria o único jeito de recarregar a tela sem perder o mês
 * escolhido.
 */
function SeletorDeMeses({ mes, meses }: { mes: string; meses: string[] }) {
  return (
    <nav
      aria-label="Mês do painel"
      className="flex flex-wrap items-center gap-2"
    >
      {meses.map((m) => (
        <Link
          key={m}
          href={`/dashboard?mes=${m}`}
          aria-current={m === mes ? "page" : undefined}
          className={`inline-flex min-h-11 items-center rounded-card border px-4 text-xs font-bold transition-colors ${
            m === mes
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border2 bg-card text-dim hover:bg-card2 hover:text-text"
          }`}
        >
          {rotuloDeMes(m)}
        </Link>
      ))}
    </nav>
  );
}

/**
 * ⚠ **A cobertura é em dinheiro, não em contagem.**
 *
 * "20 para decidir" trata uma assinatura de R$ 20 e um aporte como iguais.
 * Medido no extrato real do Davi: 32 pendentes de 33 lançamentos eram 45% do
 * dinheiro que saiu. Os dois números descrevem o mesmo mês e contam histórias
 * diferentes — e é a versão em dinheiro que diz se dá para confiar na tela.
 *
 * A contagem continua ali, em segundo plano: é ela que diz **quanto trabalho**
 * falta, enquanto a porcentagem diz **quanto risco** existe.
 */
function AvisoDeCobertura({
  cobertura,
  faltamDecidir,
}: {
  cobertura: Cobertura;
  faltamDecidir: number;
}) {
  if (cobertura.completa) {
    return (
      <Card className="mt-3 border-green/20 bg-green/8">
        <p className="text-xs font-bold text-green">
          Todo o dinheiro do mês está num pote.
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-dim">
          Os números abaixo cobrem o mês inteiro.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mt-3 border-gold/20 bg-gold/8">
      <p className="text-xs font-bold text-gold">
        Estes números cobrem {cobertura.saiuPct ?? 0}% do que saiu
        {cobertura.entrouPct !== null &&
          ` e ${cobertura.entrouPct}% do que entrou`}
        .
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-dim">
        {faltamDecidir === 1
          ? "1 lançamento ainda não caiu em pote nenhum"
          : `${faltamDecidir} lançamentos ainda não caíram em pote nenhum`}
        , então os potes abaixo estão incompletos.
      </p>

      <Link
        href="/revisao"
        className="mt-4 inline-flex min-h-11 items-center rounded-card bg-primary px-5 text-sm font-bold text-bg transition-colors hover:bg-orange"
      >
        Classificar o resto
      </Link>
    </Card>
  );
}

function Numero({
  rotulo,
  centavos,
  cor,
}: {
  rotulo: string;
  centavos: number;
  cor: string;
}) {
  return (
    <div className="px-3 py-4 text-center">
      <p className="font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
        {rotulo}
      </p>
      <p className={`mt-1 font-mono text-sm font-medium break-words ${cor}`}>
        {emReais(centavos)}
      </p>
    </div>
  );
}
