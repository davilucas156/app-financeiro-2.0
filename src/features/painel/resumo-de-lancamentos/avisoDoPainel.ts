/**
 * O que o painel avisa, e quando ele cala a boca (tarefa D8).
 *
 * ## O cartão de hoje mistura duas verdades diferentes
 *
 * | | Verdade | Quando vale |
 * |---|---|---|
 * | A | "faltam N lançamentos para você decidir" | só quando N > 0 |
 * | B | "os potes com valores ainda não existem" | **sempre**, até a spec 04 |
 *
 * Fundir as duas foi o que criou a mentira que a D8 conserta: como B é
 * permanente, o cartão nunca sumia — e a frase de A ia junto para sempre,
 * cobrando classificação de quem já tinha classificado tudo.
 *
 * Puro e testado porque "não mentir" é regra, e regra escrita em JSX ninguém
 * consegue verificar. Mesma escolha de `contagemDaImportacao.ts` na D2.
 */

export type AvisoDoPainel = {
  /** `pedir` cobra decisão; `pronto` só registra o que ainda não existe. */
  tom: "pedir" | "pronto";
  titulo: string;
  texto: string;
  /** O caminho até o passo que falta. Nulo quando não falta passo nenhum. */
  acao: { href: "/revisao"; rotulo: string } | null;
};

export function avisoDoPainel(paraDecidir: number): AvisoDoPainel {
  if (paraDecidir === 0) {
    return {
      tom: "pronto",
      titulo: "Tudo classificado.",
      // ⚠ A limitação continua sendo dita — ela é verdadeira. O que muda é o
      // tom: é uma limitação do produto, não uma tarefa sua em aberto.
      texto:
        "Todos os lançamentos caíram num pote. Os potes com valores, as metas e a comparação com o mês passado são a próxima etapa a ser construída; até lá esta tela conta o que entrou.",
      acao: null,
    };
  }

  const quantos =
    paraDecidir === 1
      ? "1 lançamento espera"
      : `${paraDecidir} lançamentos esperam`;

  return {
    tom: "pedir",
    titulo: `${quantos} sua decisão.`,
    texto:
      "Classificar é o que faz os potes existirem: enquanto um lançamento não tem categoria, ele não entra em pote nenhum e o mês fica pela metade.",
    // O cartão antigo nomeava o passo que faltava e **não** oferecia o caminho
    // até ele. Dizer "falta classificar" sem um link é dar trabalho ao leitor
    // de descobrir onde se classifica.
    acao: { href: "/revisao", rotulo: "Revisar agora" },
  };
}
