import { Card } from "@/components/ui/Card";
import { emReais } from "@/lib/dinheiro";
import { nomeDoMes } from "@/lib/mes";
import { estiloDoPote } from "@/features/aparencia/tema/estiloDoPote";
import type { CartaoDoAno } from "./cartaoDoAno";

/**
 * Os cartões de topo do comparativo anual (spec 12, tarefas D1 e D2).
 *
 * ## São os 6 do painel original, menos a lista escrita à mão
 *
 * O `planejamento_anual_davi.html` tinha seis: Investido Acumulado, Metas
 * Giulia, Média Gasolina, Média Custos Fixos, Média Lazer e Total Manutenção.
 * **Cinco são potes**, e os emojis batem um a um com o `potes-padrao.ts`.
 *
 * Copiar aqueles seis para dentro do app seria escrever `"Gasolina"` e
 * `"Metas / Sonhos"` em código — e a spec 05 existe justamente porque potes e
 * categorias são renomeáveis. Uma lista fixa não dá erro no dia da renomeação:
 * dá um **cartão zerado**, que é pior, porque parece dado.
 *
 * Por isso é **um por pote de gasto, derivado**. Quem criar um pote novo ganha o
 * cartão sem ninguém lembrar de nada — a mesma lição da `/passos`, que a spec 09
 * fez derivar de `FORMATOS`.
 *
 * ## Os dois números, sempre
 *
 * O painel original escolhia caso a caso entre acumulado e média. A regra por
 * trás não fecha (Descoberta 5 da spec), e não é preciso escolher: os dois saem
 * da mesma soma. Mostrando ambos, some também a pergunta "por que este é média
 * e aquele é total?".
 */
export function CartoesDoAno({
  cartoes,
  potes,
  ano,
}: {
  cartoes: CartaoDoAno[];
  /** Nome, emoji e cor, na ordem do painel. */
  potes: { id: string; nome: string; emoji: string; cor: string }[];
  ano: string;
}) {
  const porId = new Map(potes.map((p) => [p.id, p]));

  return (
    /*
     * ⚠ **Duas colunas a 360px, e não três.** O `TopoDoMes` cabe em três porque
     * mostra um número e um rótulo de uma palavra; aqui cada cartão tem nome de
     * pote, dois números e uma linha mês a mês. Em três colunas, "R$ 1.378,91"
     * quebraria no meio.
     */
    <div className="mt-4 grid grid-cols-2 gap-2">
      {cartoes.map((cartao) => {
        const pote = porId.get(cartao.poteId);
        if (!pote) return null;

        return (
          <CartaoDoAnoNaTela
            key={cartao.poteId}
            cartao={cartao}
            pote={pote}
            ano={ano}
          />
        );
      })}
    </div>
  );
}

function CartaoDoAnoNaTela({
  cartao,
  pote,
  ano,
}: {
  cartao: CartaoDoAno;
  pote: { nome: string; emoji: string; cor: string };
  ano: string;
}) {
  return (
    <Card className="p-3">
      <p className="flex items-center gap-1.5 text-2xs font-bold break-words">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={estiloDoPote(pote.cor)}
        />
        <span aria-hidden="true">{pote.emoji}</span>
        <span className="min-w-0">{pote.nome}</span>
      </p>

      <p className="mt-2 font-mono text-sm font-medium break-words">
        {emReais(cartao.totalCentavos)}
      </p>
      <p className="font-mono text-4xs tracking-wider text-dim uppercase">
        no ano de {ano}
      </p>

      <p className="mt-2 font-mono text-3xs text-dim">
        {cartao.mediaMensalCentavos === null
          ? "sem mês neste ano"
          : `${emReais(cartao.mediaMensalCentavos)}/mês`}
        {cartao.mesesComDado > 0 && (
          /*
           * ⚠ **O tamanho da amostra anda colado na média, sempre.** É a mesma
           * disciplina da `mediaDoComparativo`, que nunca omite sobre quantos
           * meses está falando — e aqui ela é mais necessária ainda, porque o
           * número acima é um total de ano que parece fechado.
           */
          <span className="text-dim2">
            {" · "}
            {cartao.mesesComDado === 1
              ? "1 mês"
              : `${cartao.mesesComDado} meses`}
          </span>
        )}
      </p>

      <LinhaMesAMes cartao={cartao} />
    </Card>
  );
}

/**
 * O `cstat-sub` do painel original: o ano aberto mês a mês, embaixo do total.
 *
 * ⚠ **Ela existe para o total não ser um número sem procedência.** "R$ 1.378,91
 * no ano" não deixa ver que foram três meses zerados e um de R$ 541 — que é a
 * diferença entre um custo mensal e um susto.
 *
 * ⚠ **Mês pouco classificado leva ⚠, como na barra.** Ele entra no total porque
 * existe; tirá-lo faria um mês do ano sumir da tela. Mas o total que o inclui
 * mente **para baixo**, e com cara de fechado — a marca é o que autoriza quem lê
 * a desconfiar do número certo.
 */
function LinhaMesAMes({ cartao }: { cartao: CartaoDoAno }) {
  if (cartao.serie.length === 0) return null;

  return (
    <p className="mt-2 font-mono text-4xs leading-relaxed text-dim2">
      {cartao.serie.map((valor, i) => (
        <span key={valor.mes}>
          {i > 0 && " · "}
          {nomeDoMes(valor.mes).slice(0, 3)} {emReais(valor.totalCentavos)}
          {!valor.confiavel && <span className="text-gold"> ⚠</span>}
        </span>
      ))}
    </p>
  );
}
