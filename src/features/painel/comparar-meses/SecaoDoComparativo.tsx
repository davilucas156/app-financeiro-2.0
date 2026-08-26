import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { emReais } from "@/lib/dinheiro";
import { nomeDoMes, rotuloDeMes } from "@/lib/mes";
import { estiloDoPote } from "@/features/aparencia/tema/estiloDoPote";
import type {
  Comparativo,
  LinhaDoComparativo,
  ValorNoMes,
} from "./comparativo";

/**
 * O comparativo entre meses (tarefa B3).
 *
 * ## Por que voltou a ter barras
 *
 * O `planejamento_anual_davi.html` desenha, dentro de cada pote, **uma barra
 * por período** — e foi essa tela que o Davi montou à mão todo mês. A primeira
 * versão desta spec tinha reduzido tudo a "este mês contra a média", que
 * responde outra pergunta, menor.
 *
 * As barras são `div` com `width` em porcentagem, como as do `CartaoDoPote` e
 * como as do arquivo original. Nenhuma biblioteca de gráfico: o que não cabe em
 * 360px é o Recharts, não a barra.
 *
 * ## A largura é comparável entre potes, de propósito
 *
 * Todas as barras da seção se medem contra o **maior valor da tela inteira**, e
 * não contra o maior valor de cada pote. É o que o `renderCompBars` do arquivo
 * estático faz, e é o que permite ver que um pote é várias vezes o outro. Barra
 * normalizada por pote deixaria todos os potes cheios e a tela não diria nada.
 */
export function SecaoDoComparativo({
  comparativo,
  potes,
  mesDeReferencia,
}: {
  comparativo: Comparativo;
  /** Nome, emoji e cor de cada pote, na ordem do painel. */
  potes: { id: string; nome: string; emoji: string; cor: string }[];
  /**
   * O mês que a frase compara com os outros (spec 09).
   *
   * ⚠ **Ele passou a ser escrito quando a seção virou tela própria.** Embaixo
   * do painel, o sujeito era óbvio: o mês estava no topo da mesma tela. Numa
   * tela sem seletor de mês, "comparado com maio" fica sem sujeito.
   */
  mesDeReferencia: string;
}) {
  const porId = new Map(potes.map((p) => [p.id, p]));
  const teto = maiorValor(comparativo.linhas);
  /*
   * "jan" de 2025 e "jan" de 2026 seriam a mesma etiqueta numa tela de treze
   * meses. O ano só aparece quando a série atravessa a virada — dentro de um
   * ano só, repeti-lo em toda linha seria ruído.
   */
  const comAno = anos(comparativo.linhas) > 1;

  return (
    <>
      <SectionTitle>Comparativo</SectionTitle>

      <Frase media={comparativo.media} mes={mesDeReferencia} />

      <div className="mt-4 space-y-5">
        {comparativo.linhas.map((linha) => {
          const pote = porId.get(linha.poteId);
          if (!pote) return null;

          return (
            <Card key={linha.poteId} className="p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-bold break-words">
                  {pote.emoji} {pote.nome}
                </span>
                <Diferenca linha={linha} />
              </div>

              <div className="mt-3 space-y-1.5">
                {linha.serie.map((valor) => (
                  <BarraDoMes
                    key={valor.mes}
                    valor={valor}
                    teto={teto}
                    cor={pote.cor}
                    atual={valor.mes === ultimoMes(linha)}
                    comAno={comAno}
                  />
                ))}

                {linha.mediaCentavos !== null && (
                  <LinhaDaMedia centavos={linha.mediaCentavos} teto={teto} />
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

/**
 * ⚠ **A tela sempre diz sobre quantos meses está falando.**
 *
 * É o risco nomeado na spec: com um mês anterior, "a média" é aquele mês, e
 * chamar isso de média seria dar peso estatístico a uma amostra de um. A frase
 * vem pronta da `compararMeses` justamente para não poder ser esquecida aqui.
 */
function Frase({ media, mes }: { media: Comparativo["media"]; mes: string }) {
  if (media.pode) {
    return (
      <p className="font-mono text-3xs leading-relaxed text-dim">
        Cada pote, mês a mês.{" "}
        <span className="text-text">{rotuloDeMes(mes)}</span>{" "}
        <span className="text-text">{media.frase}</span> — a média é a dos meses
        classificados.
      </p>
    );
  }

  /*
   * ⚠ **Dois motivos, dois caminhos.** Dizer "volte quando tiver dois meses"
   * para quem tem três no banco mal classificados seria falso, e mandaria a
   * pessoa para a tela errada. Aqui um manda enviar extrato e o outro manda
   * revisar.
   */
  if (media.motivo === "primeiro-mes") {
    return (
      <p className="text-xs leading-relaxed text-dim">
        Este é o primeiro mês da conta, então ainda não há com o que comparar.
        As barras já estão aqui, e cada extrato novo acrescenta uma.{" "}
        <Link href="/upload" className="underline underline-offset-4">
          Enviar outro extrato
        </Link>
        .
      </p>
    );
  }

  return (
    <p className="text-xs leading-relaxed text-gold">
      {media.descartados === 1
        ? "Há um mês anterior aqui, mas ele não está classificado o bastante para servir de comparação"
        : `Há ${media.descartados} meses anteriores aqui, e nenhum está classificado o bastante para servir de comparação`}{" "}
      — a média mentiria para baixo.{" "}
      <Link href="/revisao" className="underline underline-offset-4">
        Revisar os pendentes
      </Link>
      .
    </p>
  );
}

function Diferenca({ linha }: { linha: LinhaDoComparativo }) {
  if (linha.diferencaCentavos === null) return null;

  if (linha.diferencaCentavos === 0) {
    return (
      <span className="shrink-0 font-mono text-3xs text-dim">
        igual à média
      </span>
    );
  }

  const acima = linha.diferencaCentavos > 0;

  return (
    <span
      className={`shrink-0 font-mono text-3xs ${acima ? "text-red" : "text-green"}`}
    >
      {acima ? "+" : "−"}
      {emReais(Math.abs(linha.diferencaCentavos))}
    </span>
  );
}

/**
 * ⚠ **Mês mal classificado não some: fica apagado.**
 *
 * Ele sai da média porque não pode servir de régua. Tirá-lo também da barra
 * faria um mês inteiro do ano do Davi desaparecer da tela — e desaparecer é
 * exatamente o que um comparativo existe para impedir.
 */
function BarraDoMes({
  valor,
  teto,
  cor,
  atual,
  comAno,
}: {
  valor: ValorNoMes;
  teto: number;
  cor: string;
  atual: boolean;
  comAno: boolean;
}) {
  const largura =
    teto === 0 ? 0 : Math.round((valor.totalCentavos / teto) * 100);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-14 shrink-0 font-mono text-3xs ${atual ? "text-text" : "text-dim"}`}
      >
        {nomeDoMes(valor.mes).slice(0, 3)}
        {comAno && `/${valor.mes.slice(2, 4)}`}
        {!valor.confiavel && <span className="text-gold"> ⚠</span>}
      </span>

      <span className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
        <span
          className="block h-full rounded-full"
          style={{
            ...estiloDoPote(cor),
            width: `${Math.max(0, Math.min(100, largura))}%`,
            opacity: valor.confiavel ? 1 : 0.3,
          }}
        />
      </span>

      <span
        className={`w-20 shrink-0 text-right font-mono text-3xs ${atual ? "text-text" : "text-dim"}`}
      >
        {emReais(valor.totalCentavos)}
      </span>
    </div>
  );
}

function LinhaDaMedia({ centavos, teto }: { centavos: number; teto: number }) {
  const largura = teto === 0 ? 0 : Math.round((centavos / teto) * 100);

  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="w-14 shrink-0 font-mono text-3xs text-dim2">
        média
      </span>
      <span className="h-2 flex-1 overflow-hidden rounded-full">
        <span
          className="block h-full rounded-full border border-dashed border-dim"
          style={{ width: `${Math.max(0, Math.min(100, largura))}%` }}
        />
      </span>
      <span className="w-20 shrink-0 text-right font-mono text-3xs text-dim2">
        {emReais(centavos)}
      </span>
    </div>
  );
}

/**
 * O teto é o maior valor da seção inteira — ver a nota do topo do arquivo.
 *
 * A média entra na conta: com um mês muito acima dela, a barra tracejada teria
 * de caber embaixo das outras de qualquer jeito.
 */
function maiorValor(linhas: LinhaDoComparativo[]): number {
  let maior = 0;

  for (const linha of linhas) {
    for (const valor of linha.serie) {
      if (valor.totalCentavos > maior) maior = valor.totalCentavos;
    }
    if (linha.mediaCentavos !== null && linha.mediaCentavos > maior) {
      maior = linha.mediaCentavos;
    }
  }

  return maior;
}

function anos(linhas: LinhaDoComparativo[]): number {
  const vistos = new Set(
    linhas.flatMap((l) => l.serie.map((v) => v.mes.slice(0, 4))),
  );
  return vistos.size;
}

function ultimoMes(linha: LinhaDoComparativo): string | undefined {
  return linha.serie.at(-1)?.mes;
}
