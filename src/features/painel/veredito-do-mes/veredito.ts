import {
  coberturaConfiavel,
  type Cobertura,
} from "@/features/painel/somar-o-mes/cobertura";
import { emReais } from "@/lib/dinheiro";

/**
 * O veredito do mês, em uma frase (tarefa A1).
 *
 * ## A ordem é a funcionalidade
 *
 * A medição da spec 06 achou o modo de falha antes de existir código: com os
 * números de hoje, cinco dos sete potes com meta estão acima dela, dois deles
 * em várias vezes. Um motor que começasse pelos potes diria "você estourou
 * cinco potes" todo mês, e em uma semana a frase viraria paisagem.
 *
 * Gastar sete vezes a meta de um pote quase nunca é indisciplina — é sinal de
 * que **a renda declarada não descreve aquele mês**. Por isso a pergunta sobre
 * a renda vem antes da acusação sobre o pote, e a dúvida sobre a classificação
 * vem antes das duas.
 *
 * ## Uma frase, e só a primeira que se aplicar
 *
 * Decisão registrada na spec: uma frase é uma decisão de leitura — você lê.
 * Quatro viram relatório, e relatório se ignora. O que sobra aparece no cartão
 * do pote a que pertence, pelo `insightDoPote`.
 *
 * ## Puro, num `.ts`, e devolvendo texto pronto
 *
 * Mesma régua do `avisoDeApagar` da spec 05: **nenhum texto de consequência
 * nasce dentro de um componente**. Um número errado se conserta
 * reclassificando; uma frase errada fica na memória de quem leu e contamina os
 * números certos ao lado dela.
 */

/**
 * ⚠ Os três limiares abaixo são **chutes honestos**, e estão exportados e
 * nomeados por isso. Nenhum saiu de dados — há um mês fechado no banco. O
 * segundo extrato do Davi é que vai dizer se algum está errado.
 */

/**
 * Quanto o que saiu precisa passar da renda declarada para o app perguntar.
 *
 * 1,3 e não 1,0: passar um pouco da renda num mês é normal e não merece
 * pergunta nenhuma. O que merece pergunta é o formato da descoberta 2 — o mês
 * que não cabe na renda que está lá.
 */
export const FATOR_DE_RENDA_DESTOANTE = 1.3;

/**
 * O mínimo, **em fração da renda declarada**, para um estouro virar veredito.
 *
 * Fração e não valor fixo: um piso em reais seria certo para uma renda e
 * ridículo para outra, e este app é multiusuário desde o primeiro commit.
 */
export const EXCESSO_RELEVANTE_DA_RENDA = 0.05;

/**
 * O que o veredito precisa saber de um pote.
 *
 * Estrutural de propósito — `PoteNoPainel` mais o `metaCentavos` de
 * `MetaDoPote` satisfazem isto sem `import` nenhum, do mesmo jeito que
 * `CategoriaComPote` em `somarOMes.ts`.
 */
export type PoteNoVeredito = {
  nome: string;
  emoji: string;
  /** Já orientado pelo tipo do pote. Negativo quando o reembolso passou o gasto. */
  totalCentavos: number;
  lancamentos: number;
  /** `null` no pote sem percentual de meta — descoberta 3. */
  metaCentavos: number | null;
};

export type GrauDoVeredito = "revisar" | "renda" | "pote" | "dentro";

export type Veredito = {
  /** Para a tela escolher a cor sem ler a frase. */
  grau: GrauDoVeredito;
  frase: string;
};

export function vereditoDoMes(mes: {
  cobertura: Cobertura;
  /** `null` enquanto o Davi não informar. */
  rendaDeclaradaCentavos: number | null;
  saiuCentavos: number;
  potes: PoteNoVeredito[];
}): Veredito | null {
  const renda = mes.rendaDeclaradaCentavos;

  /*
   * ## Silêncio 1 — sem renda declarada não há dentro nem fora
   *
   * Está na spec, e o `CampoDeRenda` já cobra a renda no topo do painel. Duas
   * cobranças pela mesma coisa fazem a pessoa ignorar as duas.
   */
  if (renda === null) return null;

  /*
   * ## Silêncio 2 — mês em que nada saiu
   *
   * Não estava na spec; apareceu montando a ordem. Sem esta linha, um mês vazio
   * atravessaria os três degraus sem disparar nenhum e cairia no quarto: o app
   * diria "o mês fechou dentro do plano" sobre um extrato que ainda não foi
   * enviado. Elogio por ausência de dado é a pior frase que este arquivo
   * poderia produzir.
   */
  if (mes.saiuCentavos <= 0 || mes.cobertura.saiuPct === null) return null;

  // Degrau 1 — o resto seria opinião sobre dado incompleto.
  if (!coberturaConfiavel(mes.cobertura)) {
    return {
      grau: "revisar",
      frase: `Só ${mes.cobertura.saiuPct}% do que saiu está classificado. Revise antes de olhar os potes — até lá, o resto da tela é palpite.`,
    };
  }

  // Degrau 2 — a pergunta que vem antes de qualquer acusação.
  if (mes.saiuCentavos > renda * FATOR_DE_RENDA_DESTOANTE) {
    /*
     * ⚠ **Os dois números, nunca o múltiplo.** "3,1× a sua renda" é frase de
     * manchete: ela já carrega o julgamento que a pergunta estava tentando
     * evitar. Decisão registrada na spec — o app pergunta, não afirma, porque a
     * descoberta 4 mostrou o formato de um evento grande e legítimo.
     */
    return {
      grau: "renda",
      frase: `Saiu ${emReais(mes.saiuCentavos)} este mês, bem acima da renda declarada de ${emReais(renda)}. A renda mudou?`,
    };
  }

  // Degrau 3 — o pote que destoa.
  const acimaDaMeta = potesAcimaDaMeta(mes.potes);
  const pior = maiorExcesso(acimaDaMeta);
  const piso = Math.round(renda * EXCESSO_RELEVANTE_DA_RENDA);

  if (pior !== null && pior.excessoCentavos >= piso) {
    return {
      grau: "pote",
      frase: `${pior.pote.emoji} ${pior.pote.nome} passou da meta em ${emReais(pior.excessoCentavos)} — foi o pote que mais destoou.`,
    };
  }

  /*
   * Degrau 4 — duas frases, um grau só.
   *
   * Chegar aqui com três potes 8% acima da meta e dizer "nenhum pote passou da
   * meta" seria mentira medida. O grau continua um porque a tela pinta os dois
   * casos igual; o texto distingue porque quem lê merece a distinção.
   */
  return {
    grau: "dentro",
    frase:
      acimaDaMeta.length > 0
        ? "O mês fechou perto do plano: nenhum pote fugiu o bastante para virar assunto."
        : "O mês fechou dentro do plano — nenhum pote passou da meta.",
  };
}

type Excesso = { pote: PoteNoVeredito; excessoCentavos: number };

/**
 * ⚠ **Pote sem meta nunca é candidato** — descoberta 3. Ele não fechou fora;
 * ele não tem fora. Pote negativo também não: reembolso maior que o gasto não
 * estourou coisa nenhuma.
 */
function potesAcimaDaMeta(potes: PoteNoVeredito[]): Excesso[] {
  const acima: Excesso[] = [];

  for (const pote of potes) {
    if (pote.metaCentavos === null) continue;
    if (pote.lancamentos === 0) continue;
    if (pote.totalCentavos <= 0) continue;

    const excessoCentavos = pote.totalCentavos - pote.metaCentavos;
    if (excessoCentavos > 0) acima.push({ pote, excessoCentavos });
  }

  return acima;
}

/**
 * O pior é o que gastou **mais reais** acima da meta — não o de maior
 * porcentagem.
 *
 * Escolhido por razão, o vencedor seria sempre o pote de meta menor: sete vezes
 * uma meta pequena pode ser menos dinheiro do que uma vez e pouco da maior. O
 * veredito responde "onde foi o mês", e o mês vai embora em reais.
 *
 * Empate fica com o primeiro (`>`, não `>=`): a ordem dos potes é estável e a
 * frase não pode oscilar entre dois renders da mesma tela.
 */
function maiorExcesso(acima: Excesso[]): Excesso | null {
  let pior: Excesso | null = null;

  for (const candidato of acima) {
    if (pior === null || candidato.excessoCentavos > pior.excessoCentavos) {
      pior = candidato;
    }
  }

  return pior;
}
