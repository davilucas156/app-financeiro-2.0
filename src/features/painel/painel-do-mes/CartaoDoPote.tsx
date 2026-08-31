"use client";

import { useState } from "react";
import { emReais, diaEMes } from "@/lib/dinheiro";
import { estiloDoPote } from "@/features/aparencia/tema/estiloDoPote";
import type { CategoriaEscolhivel } from "@/features/classificacao/revisar-lancamento/categorias";
import {
  metaDoPote,
  type MetaDoPote,
} from "@/features/painel/somar-o-mes/meta";
import { insightDoPote } from "@/features/painel/veredito-do-mes/insightDoPote";
import { TrocarCategoria } from "@/features/painel/trocar-categoria/TrocarCategoria";
import {
  estadoDoPote,
  legendaDoPote,
  type EstadoDoPote,
  type PoteNoPainel,
} from "./poteNoPainel";

/**
 * Um pote, com barra, e o que há dentro dele (tarefas B2 e B3).
 *
 * ## Os quatro estados têm de se distinguir sem ler o número
 *
 * Vazio, zerado e negativo mostrariam "R$ 0,00" numa tela descuidada, e
 * significam coisas diferentes. Aqui cada um tem cor, barra e legenda próprias
 * — a leitura acontece antes de qualquer número ser processado.
 *
 * ## Expande no lugar, não vira rota
 *
 * Os dados do mês já estão carregados. Uma rota nova custaria proteção no
 * `proxy.ts`, segunda consulta e mais um item para o breadcrumb que não existe.
 * Se a lista crescer a ponto de incomodar, aí vira rota — e aí haverá motivo.
 */
export function CartaoDoPote({
  pote,
  rendaDeclaradaCentavos,
  categorias,
}: {
  pote: PoteNoPainel;
  rendaDeclaradaCentavos: number | null;
  /** Para a troca de categoria da D4, dentro da lista. */
  categorias: CategoriaEscolhivel[];
}) {
  const [aberto, setAberto] = useState(false);

  const meta = metaDoPote({
    percentual: pote.percentual,
    rendaDeclaradaCentavos,
    totalCentavos: pote.totalCentavos,
    lancamentos: pote.lancamentos,
  });

  const estado = estadoDoPote(pote, meta.metaCentavos);
  const cor = CORES[estado];

  return (
    <div className="overflow-hidden rounded-card border border-border bg-card">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        disabled={pote.lancamentos === 0}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors enabled:hover:bg-card2 disabled:cursor-default"
      >
        {/* A cor do pote vem do banco, não de token do Tailwind — a fase 2 vai
            deixar o usuário mudá-la, e a tela tem de continuar refletindo.
            `estiloDoPote` acrescenta a versão para fundo claro (spec 08, D2):
            no claro, `#00e5a0` dá 1.54 de contraste e a faixa some. */}
        <span
          aria-hidden="true"
          className="mt-0.5 h-9 w-1 shrink-0 rounded-full"
          style={estiloDoPote(pote.cor)}
        />

        <span className="min-w-0 flex-1">
          {/*
            ⚠ **`text-fixo` e não `text-sm`, nas duas linhas abaixo — de
            propósito, e é a única exceção do app** (spec 10, tarefa A3).

            É o pedido do Davi: *"com exceção das letras dos cards de pote que
            já são grandes"*. Estas duas **são** as que já são grandes: 14px,
            contra os 10 e 12 do resto do cartão.

            E são a linha com o orçamento mais apertado do painel. A 360px ela
            põe nome e valor lado a lado, na mesma linha de base — crescer 40%
            empurraria "Liberdade Financeira" para a segunda linha, todo mês,
            em nove cartões.

            ⚠ **A exceção é destas duas, e de mais nada aqui dentro.** A
            legenda, o "meta …", o insight, as categorias e os lançamentos
            continuam em tokens que escalam. Uniformizar isto "por
            consistência" quebra a linha em "Maior" e faz a configuração
            parecer sem efeito no painel ao mesmo tempo.
          */}
          <span className="flex items-baseline justify-between gap-3">
            <span className="text-fixo font-bold break-words">
              {pote.emoji} {pote.nome}
            </span>
            <span
              className={`shrink-0 font-mono text-fixo font-medium ${cor.valor}`}
            >
              {estado === "vazio" ? "—" : emReais(pote.totalCentavos)}
            </span>
          </span>

          <Barra estado={estado} fracao={meta.fracao} cor={pote.cor} />

          <span className="mt-1.5 flex items-baseline justify-between gap-3">
            <span className={`font-mono text-3xs ${cor.legenda}`}>
              {legendaDoPote(estado, pote, meta.fracao)}
            </span>
            <span className="shrink-0 font-mono text-3xs text-dim">
              {meta.metaCentavos !== null &&
                `meta ${emReais(meta.metaCentavos)}`}
            </span>
          </span>
        </span>
      </button>

      {aberto && (
        <DentroDoPote pote={pote} meta={meta} categorias={categorias} />
      )}
    </div>
  );
}

/**
 * A cor carrega o estado antes do número.
 *
 * Estourado em vermelho **na barra e no número** — decisão do Davi: "numero
 * tambem". É o único sinal da tela que pede ação.
 *
 * ⚠ **A barra não está aqui, e é de propósito.** Esta tabela teve um campo
 * `barra` que ninguém leu: a `Barra` sempre decidiu sozinha, porque a cor dela
 * não é só uma classe — estourado troca para `bg-red` **e** deixa de aplicar o
 * `estiloDoPote`. Uma string na tabela guardaria metade da regra, e a metade
 * que ficasse de fora divergiria da que ficasse dentro.
 *
 * ⚠ **`vazio` era `dim2` nos dois campos, e virou `dim` na spec 15.** O
 * apagado extra dizia "não caiu nada aqui" pela segunda vez — a legenda já diz
 * isso com todas as letras — e dizia a 1,69 de contraste. O estado continua
 * distinto: `vazio` é o único cujo **valor** não é `text-text`, e é o valor que
 * o olho lê primeiro.
 */
const CORES: Record<EstadoDoPote, { valor: string; legenda: string }> = {
  vazio: { valor: "text-dim", legenda: "text-dim" },
  "sem-meta": { valor: "text-text", legenda: "text-dim" },
  negativo: { valor: "text-green", legenda: "text-green" },
  estourado: { valor: "text-red", legenda: "text-red" },
  normal: { valor: "text-text", legenda: "text-dim" },
};

function Barra({
  estado,
  fracao,
  cor,
}: {
  estado: EstadoDoPote;
  fracao: number | null;
  cor: string;
}) {
  // Sem meta não há barra. `potes-padrao.ts` é explícito: nunca mostrar "0%"
  // num pote que não tem meta — uma barra vazia diria exatamente isso.
  if (fracao === null) return null;

  const largura = Math.min(100, Math.round(fracao * 100));

  return (
    <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-bg">
      <span
        className={`block h-full rounded-full ${estado === "estourado" ? "bg-red" : ""}`}
        style={{
          ...(estado === "estourado" ? {} : estiloDoPote(cor)),
          width: `${largura}%`,
        }}
      />
    </span>
  );
}

/** As categorias e os lançamentos daquele pote (tarefa B3). */
function DentroDoPote({
  pote,
  meta,
  categorias,
}: {
  pote: PoteNoPainel;
  meta: MetaDoPote;
  categorias: CategoriaEscolhivel[];
}) {
  const insight = insightDoPote(pote, meta);

  return (
    <div className="border-t border-border bg-bg/40 px-4 pb-4">
      {/*
        A linha do insight (tarefa B2), antes de tudo o que ela resume.

        ⚠ **Depois de trinta lançamentos ela seria um post-scriptum**, e o
        insight existe justamente para poupar a leitura da lista.

        ⚠ **Pote sem meta não ganha linha nenhuma** — `insightDoPote` devolve
        `null`, e nem o espaço fica. É a descoberta 3 chegando até o pixel:
        silêncio é melhor do que uma frase que divide por zero.
      */}
      {insight !== null && (
        <p className="mt-4 text-xs leading-relaxed text-text">{insight}</p>
      )}

      <p className="mt-4 font-mono text-4xs font-bold tracking-[1.5px] text-dim uppercase">
        Por categoria
      </p>

      <div className="mt-2 space-y-1.5">
        {pote.categorias.map((c) => (
          <div key={c.id} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 text-xs break-words text-text">
              {c.emoji} {c.nome}
            </span>
            <span className="shrink-0 font-mono text-xs text-dim">
              {emReais(c.totalCentavos)}
              <span className="ml-2 text-dim">({c.lancamentos})</span>
            </span>
          </div>
        ))}
      </div>

      <p className="mt-5 font-mono text-4xs font-bold tracking-[1.5px] text-dim uppercase">
        Lançamentos
      </p>

      <div className="mt-2 space-y-2">
        {pote.lista.map((l) => (
          <div
            key={l.id}
            className="rounded-pote border border-border bg-card px-3 py-2.5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 font-mono text-2xs break-words text-text">
                {l.descricao}
              </span>
              <span
                className={`shrink-0 font-mono text-xs ${
                  l.direcao === "entrada" ? "text-green" : "text-text"
                }`}
              >
                {l.direcao === "entrada" ? "+" : ""}
                {emReais(l.valorCentavos)}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 font-mono text-3xs break-words text-dim">
                {diaEMes(l.data)} · {l.categoriaEmoji} {l.categoriaNome}
                {/*
                  ⚠ **A procedência da C3, na tela** (D3).
                  "Por que isso caiu em Lazer?" ganha resposta aqui, seis meses
                  depois — que é a única razão de `classificado_por`,
                  `regra_chave` e `fonte_da_sugestao` existirem. Guardar a
                  resposta num banco que ninguém consulta não responde nada.
                */}
                <span className="block text-dim">↳ {l.procedencia}</span>
              </span>

              {/* Ligado na D4: o botão esteve apagado desde a B3 porque
                  trocar não existia, e fingir que funcionava seria pior. */}
              <TrocarCategoria lancamento={l} categorias={categorias} />
            </div>

            {l.conferir && (
              <p className="mt-2 text-3xs leading-relaxed text-gold">
                ⚠ mesmo valor de uma saída deste pote — confira se é reembolso
                ou a mesma transferência aparecendo duas vezes
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
