import { Card } from "@/components/ui/Card";
import { emReais } from "@/lib/dinheiro";
import { nomeDoMes } from "@/lib/mes";
import { estiloDoTextoDoPote } from "@/features/aparencia/tema/estiloDoPote";
import type { CartaoDoAno } from "./cartaoDoAno";

/**
 * Os cartões de topo do comparativo anual (spec 12, tarefas D1 e D2; refeitos
 * na spec 15, tarefas B1 e B2).
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
 * trás não fecha (Descoberta 5 da spec 12), e não é preciso escolher: os dois
 * saem da mesma soma. Mostrando ambos, some também a pergunta "por que este é
 * média e aquele é total?".
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
     * pote, dois números e uma linha mês a mês. Em três colunas de 120px,
     * "R$ 1.378,91" quebraria no meio.
     *
     * ⚠ **E três a partir do `md`, que era o que faltava** (tarefa B2 da spec
     * 15). Até aqui a grade era `grid-cols-2` sem variante nenhuma, dentro de um
     * contêiner de `max-w-5xl`: num monitor, cada cartão ficava com meia tela
     * para exibir um número. O original é `repeat(3,1fr)` até 580px.
     *
     * A 1024px cada cartão fica com ~320px; no degrau do `md`, ~237px. O vão
     * cresce junto porque 8px entre cartões de 320px encosta um no outro.
     */
    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
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

/**
 * Os três níveis do `.cstat` do painel original (tarefa B1 da spec 15).
 *
 * ## O que estava errado
 *
 * O cartão tinha **cinco** níveis de texto dentro de uma faixa de 5px — nome
 * 11px, valor 14px, "no ano de" 9px, média 10px, série 9px — e o número
 * principal era o terceiro mais chamativo da pilha. Lido de relance, virava uma
 * mancha.
 *
 * O `.cstat` tem três, e o salto entre eles é o que faz a leitura:
 *
 * | | Tamanho | Cor |
 * |---|---|---|
 * | `.cstat-lbl` | 9px, mono, caixa alta | dim |
 * | `.cstat-val` | **19px** | **a cor do pote** |
 * | `.cstat-sub` | 10px | dim |
 *
 * ## ⚠ A cor do pote é o número, e não uma bolinha
 *
 * No original é assim, e é o que deixa varrer seis cartões sem ler um rótulo.
 * A bolinha de 8px que existia aqui dizia a mesma coisa num lugar em que
 * ninguém olha — e mantê-la faria a cor ser dita duas vezes no mesmo cartão.
 *
 * Quem resolve a cor nos dois temas é `estiloDoTextoDoPote`, e ela mira **4,5**
 * e não 3: aqui a cor do pote é letra, e letra se lê. Ver `corNoTema.ts`.
 *
 * ## ⚠ DM Mono no peso 500, e não `font-bold`
 *
 * O `.cstat-val` do original pede `font-weight:900` **numa fonte que não tem
 * 900** — o `<link>` de lá carrega Syne em 400/600/700/800. E o nosso DM Mono
 * publica só 300, 400 e 500 (`layout.tsx`): pedir 700 a ele é negrito
 * sintético, que a 9px quase não aparece e a 18px seria borrão.
 *
 * Trocar para Syne copiaria melhor e quebraria a regra do app inteiro, onde
 * **todo dinheiro é mono**. O que faz o `.cstat` funcionar não é o peso — é o
 * salto de tamanho e a cor, e esses dois vêm inteiros.
 */
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
      <p className="font-mono text-4xs font-bold tracking-[1.5px] break-words text-dim uppercase">
        <span aria-hidden="true">{pote.emoji}</span> {pote.nome}
      </p>

      {/*
        ⚠ **`text-lg` não escala com os degraus de letra da spec 10**, e é o que
        se quer: a régua de lá é "até 14px escala; acima de 14px, não". O
        `CampoDeRenda` já usa `text-lg` para a renda pelo mesmo motivo.
      */}
      <p
        className="mt-1.5 font-mono text-lg font-medium break-words"
        style={estiloDoTextoDoPote(pote.cor)}
      >
        {emReais(cartao.totalCentavos)}
      </p>

      <Sub cartao={cartao} ano={ano} />
      <LinhaMesAMes cartao={cartao} />
    </Card>
  );
}

/**
 * O `.cstat-sub`: o que o número grande é, e sobre quantos meses ele fala.
 *
 * ⚠ **"no ano" ficou, "no ano de 2026" saiu.** O título logo acima da grade diz
 * **Comparativo 2026**; repetir o ano em oito cartões é ruído, e ele ocupava
 * uma linha inteira só para isso. As duas palavras bastam para o número grande
 * não ser lido como uma média — que é o único mal-entendido possível ali.
 *
 * ⚠ **O tamanho da amostra continua colado na média**, e agora legível. É a
 * disciplina do `mediaDoComparativo`, que nunca omite sobre quantos meses está
 * falando — e aqui ela é mais necessária ainda, porque o número acima é um
 * total de ano que parece fechado. Ele estava em `dim2`, o token do
 * **desabilitado**: a defesa existia e não dava para ler.
 */
function Sub({ cartao, ano }: { cartao: CartaoDoAno; ano: string }) {
  if (cartao.mediaMensalCentavos === null) {
    return (
      <p className="mt-1.5 font-mono text-3xs text-dim">sem mês em {ano}</p>
    );
  }

  return (
    <p className="mt-1.5 font-mono text-3xs text-dim">
      no ano · {emReais(cartao.mediaMensalCentavos)}/mês ·{" "}
      {cartao.mesesComDado === 1 ? "1 mês" : `${cartao.mesesComDado} meses`}
    </p>
  );
}

/**
 * O ano aberto mês a mês, embaixo do total.
 *
 * ⚠ **Ela existe para o total não ser um número sem procedência.** "R$ 1.378,91
 * no ano" não deixa ver que foram três meses zerados e um de R$ 541 — que é a
 * diferença entre um custo mensal e um susto.
 *
 * ⚠ **Mês pouco classificado leva ⚠, como na barra.** Ele entra no total porque
 * existe; tirá-lo faria um mês do ano sumir da tela. Mas o total que o inclui
 * mente **para baixo**, e com cara de fechado — a marca é o que autoriza quem lê
 * a desconfiar do número certo. O `gold` dá 12,29 sobre o cartão: é a cor de
 * aviso que não depende de cinza nenhum.
 *
 * ⚠ **Era `text-4xs` em `dim2` — 9px a 1,69 de contraste.** O pior par da tela,
 * carregando a maior mancha de texto do cartão. `dim2` é o token do
 * desabilitado, e usá-lo para conteúdo foi o erro; ele está cumprindo
 * exatamente o que o nome promete.
 *
 * ⚠ **O filete acima separa sem inventar um sexto nível.** Esta linha e o `Sub`
 * ficaram do mesmo tamanho e na mesma cor — sem uma divisa, viram um parágrafo
 * só. Uma borda custa uma classe; um tamanho a menos custaria a legibilidade
 * que esta fase veio consertar.
 */
function LinhaMesAMes({ cartao }: { cartao: CartaoDoAno }) {
  if (cartao.serie.length === 0) return null;

  return (
    <p className="mt-2 border-t border-border pt-2 font-mono text-3xs leading-relaxed text-dim">
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
