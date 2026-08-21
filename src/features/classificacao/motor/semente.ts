import type { Criterio, Regra } from "./regras";

/**
 * As regras-base do Davi, como dados (tarefa A5).
 *
 * Saem da seção 7 do `readme.md`, mais as três que a medição da spec 03 mostrou
 * faltar. A D7 grava isto na conta dele no onboarding; outras contas nascem com
 * a tabela vazia e crescem por uso.
 *
 * ## Cada termo aqui foi conferido contra os arquivos reais
 *
 * A descoberta 3 da spec: regra escrita de memória erra. Escrevi `apple.com`
 * para uma descrição que é `APPLE COM BILL`. Então rodei **cada** termo da
 * seção 7 contra as 58 descrições de junho/julho antes de gravar.
 *
 * Quatro coisas apareceram, e nenhuma delas dava para ver lendo o readme:
 *
 * 1. **O nome do readme não é o nome do arquivo.** `Total Pass` é `TOTALPASS`;
 *    `Pagar Me` é `PAGARME PAGAMENTOS`; o `iCloud` aparece como
 *    `APPLE COM BILL`.
 *
 * 2. **Termo curto é armadilha silenciosa.** Ver `FORA_DE_PROPOSITO` abaixo.
 *
 * 3. **Palavra genérica que é o nome da categoria é segura.** `BARBEARIA`,
 *    `PADARIA` e `SORVETERIA` ficam mesmo sem nenhuma ocorrência no mês
 *    medido: qualquer barbearia é Barbearia.
 *
 * 4. **Uma regra do readme não cabe em critério nenhum do MVP** — ver
 *    `FORA_DE_PROPOSITO`.
 *
 * ## Nenhum dado pessoal neste arquivo
 *
 * `regrasSemente` é uma **função** e não uma constante justamente por isso: a
 * regra de transferência para si mesmo precisa do nome do titular, que é dado
 * pessoal, e este arquivo é versionado. O nome entra em tempo de execução, vindo
 * da conta. De quebra, a regra passa a valer para qualquer usuário.
 */

/**
 * Uma regra antes de existir no banco.
 *
 * Aponta para `pote/categoria` e não para um id porque **id só existe depois
 * que a D7 grava**. A chave é composta pelo mesmo motivo da A4: `assinaturas`
 * existe duas vezes no seed e a unicidade no banco é `(bucket_id, slug)`.
 */
export type RegraSemente = {
  criterio: Criterio;
  /** `custos-fixos/telefonia` */
  chaveDaCategoria: string;
  prioridade: number;
};

/**
 * **20** — o tipo do movimento: passagem, aplicação, imposto. Ganha de um termo
 * de comerciante que coincida.
 */
const MOVIMENTO = 20;

/** **30** — comerciante e contraparte, o grosso da lista. */
const COMUM = 30;

// A faixa **abaixo de 20 fica livre de propósito**: é onde a D5 põe as regras
// que nascem das correções do Davi. Correção dele sempre ganha do que eu
// semeei — foi ele que olhou o lançamento.

/**
 * Chaves que **ainda não existem** em `POTES_PADRAO`.
 *
 * Nasceu com `renda/renda-extra` dentro, esperando a C2 criar o pote de renda.
 * O teste exigia que a lista fosse **exatamente** o conjunto que falta, então
 * quando a C2 chegou o teste quebrou e obrigou a esvaziar — que era o serviço
 * dele. Ficou vazia, e não removida, porque a próxima categoria que uma regra
 * precisar antes de existir vai querer o mesmo lembrete.
 */
export const AGUARDANDO_C2: readonly string[] = [];

/*
 * ─── O que o readme manda e eu NÃO semeei, com o motivo ──────────────────────
 *
 * Está escrito para ninguém "consertar" isto depois sem saber por quê.
 *
 * `99`     Casa com o app de corrida (certo), com um restaurante cujo nome
 *          começa com 99 (errado, e vira Transporte) e com o próprio número da
 *          conta, que aparece no extrato. Classificaria errado em silêncio
 *          todo mês, e você só veria no painel meses depois.
 *
 * `Epar`   Substring de `reparo`, `separado`, `prepara`.
 *
 * `Vindi`  É gateway de pagamento — cobra por muita gente. Troquei por
 *          `INVESTIDOR10`, que é o serviço de verdade.
 *
 * `Posto`  Substring de `posto de saúde`, e zero ocorrências no mês medido.
 *
 * `Prime`  Substring de `primeira`. Troquei por `AMAZONPRIME`, medido.
 *
 * Giulia   O readme pede duas camadas decididas pela **conta destino**, e
 *          nenhum dos três critérios do MVP lê conta destino. Os dois casos
 *          são Pix enviado, então nem a direção separa. Semear metade
 *          classificaria a outra metade errado, em silêncio. Vai para a
 *          revisão — é o primeiro pedido concreto de um quarto tipo de
 *          critério.
 *
 * Resgate  A aplicação em CDB eu medi. Resgate não apareceu no mês, e eu não
 * de CDB   invento o texto de uma descrição que não vi (descoberta 3).
 */

/** `descricao_contem`, o caso de longe mais comum. */
const texto = (
  termo: string,
  chaveDaCategoria: string,
  prioridade = COMUM,
): RegraSemente => ({
  criterio: { tipo: "descricao_contem", termo },
  chaveDaCategoria,
  prioridade,
});

/**
 * As regras que não dependem de quem é o titular.
 *
 * ⚠ Todo termo aqui está **como o arquivo escreve**, não como o readme lembra.
 */
export const REGRAS_BASE: RegraSemente[] = [
  // ── Transporte ──────────────────────────────────────────────────────────
  texto("PETROBRAS", "transporte/gasolina"),
  texto("PREMMIA", "transporte/gasolina"),
  texto("TRANSFACIL", "transporte/onibus"),
  texto("BHBUS", "transporte/onibus"),
  texto("UBER", "transporte/apps"),
  texto("ALLPARK", "transporte/estacionamento"),

  // ── Manutenção ──────────────────────────────────────────────────────────
  texto("FERAUTO", "manutencao/manutencao-veicular"),
  // As "oficinas" do readme, como palavra da própria categoria — mesma lógica
  // de `BARBEARIA`.
  texto("OFICINA", "manutencao/manutencao-veicular"),
  texto("PECAS", "manutencao/pecas"),

  // ── Custos fixos ────────────────────────────────────────────────────────
  texto("TOTALPASS", "custos-fixos/academia"),
  texto("VIVO", "custos-fixos/telefonia"),
  // Palavra da própria categoria: qualquer barbearia é Barbearia.
  texto("BARBEARIA", "custos-fixos/barbearia"),

  // ── Conforto & Lazer ────────────────────────────────────────────────────
  texto("SPOTIFY", "conforto-lazer/assinaturas"),
  texto("AMAZONPRIME", "conforto-lazer/assinaturas"),
  // O `iCloud` do readme. A cobrança chega com este nome, e o `BILL` no fim é
  // o que separa a assinatura de uma compra na Apple.
  texto("APPLE COM BILL", "conforto-lazer/assinaturas"),
  texto("SHOPEE", "conforto-lazer/compras-online"),
  texto("MERCADOLIVRE", "conforto-lazer/compras-online"),
  texto("PADARIA", "conforto-lazer/alimentacao-fora"),
  texto("SORVETERIA", "conforto-lazer/alimentacao-fora"),

  // ── Conhecimento ────────────────────────────────────────────────────────
  texto("INVESTIDOR10", "conhecimento/conteudo-ferramentas"),
  texto("UDEMY", "conhecimento/cursos"),

  // ── As que a medição mostrou faltar ─────────────────────────────────────
  //
  // Aplicação em CDB é dinheiro indo para investimento, não gasto.
  texto("APLICACAO", "liberdade-financeira/aportes", MOVIMENTO),
  // Imposto de compra internacional. Sem meta, sem percentual: é custo avulso.
  texto("IOF INTERNACIONAL", "outros-repasses/avulsos", MOVIMENTO),

  // ── Contraparte ─────────────────────────────────────────────────────────
  //
  // Recarga de ônibus, que chega como Pix para a processadora de pagamento.
  //
  // ⚠ É a regra em que tenho menos confiança: essa processadora cobra por
  // muita gente. O tipo `pessoa` contém o estrago — ele só casa quando a A3
  // extraiu uma contraparte, ou seja, só em transferência. Compra no cartão
  // pela mesma processadora não tem contraparte e não bate aqui.
  {
    criterio: { tipo: "pessoa", nome: "PAGARME PAGAMENTOS" },
    chaveDaCategoria: "transporte/onibus",
    prioridade: COMUM,
  },
  // O mecânico do readme. `pessoa` de novo: nome solto dentro de descrição de
  // comerciante casaria com o que não devia.
  {
    criterio: { tipo: "pessoa", nome: "EDSON" },
    chaveDaCategoria: "manutencao/manutencao-veicular",
    prioridade: COMUM,
  },
  // O readme: Pix **recebido** vira Renda Extra; compra no cartão para eles
  // fica pendente de revisão.
  //
  // As duas metades saem de graça: `direcao: "entrada"` impede que um Pix que
  // você **envia** para eles vire renda, e compra no cartão não tem
  // contraparte, então cai na revisão sozinha — que é o que o readme pede.
  {
    criterio: {
      tipo: "pessoa",
      nome: "CADILLAC MONTE CARMO",
      direcao: "entrada",
    },
    chaveDaCategoria: "renda/renda-extra",
    prioridade: COMUM,
  },
];

export type OpcoesDaSemente = {
  /** `pote/categoria` → id. Chave que não estiver aqui derruba a regra. */
  idPorChave: Map<string, string>;
  /**
   * O nome do titular da conta, para a regra de transferência para si mesmo.
   * Sem ele, essa regra não entra.
   */
  nomeDoTitular?: string | null;
};

export function regrasSemente({
  idPorChave,
  nomeDoTitular,
}: OpcoesDaSemente): (Regra & { chave: string })[] {
  const todas = [...REGRAS_BASE, ...paraSiMesmo(nomeDoTitular)];

  return todas.flatMap((r) => {
    const categoriaId = idPorChave.get(r.chaveDaCategoria);

    // Regra órfã apontando para categoria que não existe é pior que regra
    // ausente: ela some do painel sem ninguém entender por quê. Some aqui,
    // barulhenta, porque o teste conta quantas entraram.
    if (!categoriaId) return [];

    const chave = idDe(r);

    return [
      {
        // Antes do banco, a chave **é** a identidade: não existe uuid ainda.
        // Depois da D7 o `id` vira o uuid da linha e a `chave` continua sendo
        // este texto, que é o que a C1 usa para não duplicar no reseed.
        id: chave,
        chave,
        criterio: r.criterio,
        categoriaId,
        prioridade: r.prioridade,
      },
    ];
  });
}

/**
 * Transferência para si mesmo — a terceira que a medição pediu.
 *
 * **Só a saída.** Dinheiro indo para outra conta sua é passagem, e vai para o
 * balde de repasses, que não tem percentual nem meta: não distorce o rateio dos
 * potes.
 *
 * A **entrada** eu não semeio, e isso é deliberado. Pode ser o mesmo dinheiro
 * voltando (passagem) ou o seu salário chegando de outro banco (renda) — e as
 * duas leituras mudam a base de cálculo de **todos** os potes. Chutar aqui
 * seria o pior tipo de erro deste projeto. Vai para a revisão até o Davi
 * responder, e a resposta dele é a mesma que a C2 precisa.
 */
function paraSiMesmo(nome?: string | null): RegraSemente[] {
  if (!nome?.trim()) return [];

  return [
    {
      criterio: { tipo: "pessoa", nome: nome.trim(), direcao: "saida" },
      chaveDaCategoria: "outros-repasses/repasses",
      prioridade: MOVIMENTO,
    },
  ];
}

/**
 * Id derivado do conteúdo, e não do índice na lista.
 *
 * A A1 usa o id só para desempatar, mas usa — então ele tem de ser estável.
 * Numerar por posição faria inserir uma regra no meio renumerar todas as de
 * baixo e mudar desempates que não tinham nada a ver.
 */
function idDe(r: RegraSemente): string {
  const alvo =
    r.criterio.tipo === "descricao_contem"
      ? r.criterio.termo
      : r.criterio.tipo === "pessoa"
        ? r.criterio.nome
        : r.criterio.direcao;

  return `semente:${r.criterio.tipo}:${alvo}:${r.chaveDaCategoria}`;
}
