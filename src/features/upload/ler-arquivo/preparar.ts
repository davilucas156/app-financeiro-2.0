import { createHash } from "node:crypto";
import {
  FORMATOS,
  type Formato,
  type Origem,
} from "@/features/upload/ler-arquivo/formatos";
import type { Lancamento } from "@/features/upload/ler-arquivo/lancamentos";
import { ehTransferenciaPropria } from "@/features/upload/ler-arquivo/transferenciaPropria";
import { semAcento } from "@/lib/semAcento";

/**
 * Impressão digital, pagamento de fatura e par que se anula (tarefa A4).
 *
 * É a última camada antes do banco. Depois daqui, a D2 só grava.
 */

/**
 * Quantos dias separam um par que se anula.
 *
 * ## Sete, medido — não escolhido
 *
 * Era 3. Rodando as três janelas contra 385 lançamentos de nove meses:
 *
 * | janela  | pares |
 * | ------- | ----- |
 * | 3 dias  | 20    |
 * | 7 dias  | 26    |
 * | 15 dias | 29    |
 * | 90 dias | 40    |
 *
 * Os 6 que entram entre 3 e 7 dias são quase todos legítimos — um Pix
 * devolvido 5 dias depois, uma passagem de ônibus paga com pontos resgatados 4
 * dias antes. Os 3 que entram até 15 já são coincidência, e a partir daí é
 * ruído **estrutural**: dois eventos mensais recorrentes de R$ 100 casam
 * cruzados entre meses, e a mesma dupla aparece cinco vezes ao longo do ano.
 *
 * Em 90 dias o valor redondo domina: um abastecimento de R$ 20 casa com um Pix
 * recebido de R$ 20 oitenta e um dias depois, e não há nada em comum entre os
 * dois além de serem R$ 20.
 *
 * ⚠ **Sete dias atravessa o mês, que era o caso que faltava.** O Pix do dia 28
 * devolvido no dia 2 é o formato mais comum de repasse aqui — e ele nunca foi
 * achado, não por causa da janela, mas porque a busca só olhava o envio atual.
 * Ver `jaNoBanco`.
 */
export const JANELA_DE_PAR_EM_DIAS = 7;

/**
 * ⚠ **`"revisao"` saiu.** Ela existia só para o par que se anula, e o par
 * passou a sair da conta — ver `marcarParesQueSeAnulam`. Um terceiro valor que
 * nada produz seria pior do que ausente: pareceria uma opção viva.
 *
 * O que distingue os dois tipos de `excluido` é o `parDe`: pagamento de fatura
 * não tem par, repasse anulado tem.
 */
export type Marcacao = "normal" | "excluido";

export type LancamentoPreparado = Lancamento & {
  origem: Origem;
  /** SHA-256 em hexadecimal. Ver `impressaoDigital`. */
  impressao: string;
  marcacao: Marcacao;
  motivo: string | null;
  /** Impressão do outro lado do par, quando houver. */
  parDe: string | null;
};

export type EntradaDeArquivo = {
  origem: Origem;
  lancamentos: Lancamento[];
};

/**
 * Um lançamento que **já está gravado**, para o par que atravessa o envio.
 *
 * Só os quatro campos que o pareamento olha. A descrição não entra de
 * propósito: o par se reconhece por valor e data, nunca por texto — é o que
 * torna ele capaz de achar a devolução de um Pix que o banco descreveu de
 * outro jeito.
 */
export type LancamentoSalvo = {
  /**
   * A descrição entra **só** para saber se este lado é uma transferência sua
   * (`ehTransferenciaPropria`). O par continua se reconhecendo por valor e
   * data — a descrição nunca decide *com quem* ele casa.
   */
  descricao: string;
  data: string;
  direcao: Lancamento["direcao"];
  valorCentavos: number;
  /** Vai para o `parDe` do lado novo, apontando de volta para este. */
  impressao: string;
};

/**
 * Deixa a descrição comparável: caixa alta, sem acento, espaços juntados.
 *
 * É uma **cópia** — a `descricao` original fica intacta, com o alinhamento por
 * espaço que a A3 preservou. Normalizar aqui evita que uma mudança de
 * espaçamento na exportação do banco faça o mesmo lançamento parecer novo no
 * mês seguinte.
 */
export function normalizarDescricao(descricao: string): string {
  return semAcento(descricao).toUpperCase().replace(/\s+/g, " ").trim();
}

/**
 * A chave que identifica um lançamento repetido.
 *
 * ⚠ **`ocorrencia` existe por um motivo específico.** A C1 põe um único em
 * `(user_id, impressao)`, e é isso que torna reimportar um arquivo inofensivo.
 * Sem a ordem da ocorrência, dois cafés de R$ 12 no mesmo dia gerariam a mesma
 * impressão e o banco engoliria o segundo — o usuário perderia um lançamento
 * real sem ter como saber (pendência 2 da spec).
 *
 * Com ela, os dois casos se resolvem sozinhos, porque a numeração depende só
 * do conteúdo do arquivo e não da hora do envio: linhas idênticas viram
 * `…|1` e `…|2` e as duas entram; o mesmo arquivo reenviado gera exatamente as
 * mesmas impressões e colide.
 *
 * **Hash e não texto legível:** a coluna é indexada e única, e descrição de
 * banco não tem tamanho garantido — o índice btree do Postgres tem limite por
 * entrada. SHA-256 em hexadecimal é sempre 64 caracteres.
 */
export function impressaoDigital(
  origem: Origem,
  l: Lancamento,
  ocorrencia: number,
): string {
  const chave = [
    origem,
    l.data,
    l.direcao,
    String(l.valorCentavos),
    normalizarDescricao(l.descricao),
    String(ocorrencia),
  ].join("|");

  return createHash("sha256").update(chave, "utf8").digest("hex");
}

/**
 * Recebe **uma lista de arquivos**, não um só: o pagamento de fatura e o par
 * que se anula só aparecem quando os dois arquivos são olhados juntos. Chamar
 * com um arquivo só continua funcionando — só encontra menos.
 */
export function prepararLancamentos(
  entradas: EntradaDeArquivo[],
  /**
   * Os lançamentos já gravados que caem na janela, para o par que atravessa o
   * envio. Ausente = só o que veio nos arquivos, que é o que ela sempre fez.
   */
  jaNoBanco: LancamentoSalvo[] = [],
  /**
   * O nome do titular da conta, para reconhecer transferência entre contas
   * suas (`ehTransferenciaPropria`). Ausente = nada é reconhecido como tal, que
   * é o comportamento de antes.
   */
  titular: string | null = null,
): LancamentoPreparado[] {
  const preparados: LancamentoPreparado[] = [];

  for (const { origem, lancamentos } of entradas) {
    const formato = FORMATOS.find((f) => f.origem === origem);
    // Conta quantas vezes cada linha idêntica já apareceu neste arquivo.
    const vistos = new Map<string, number>();

    for (const l of lancamentos) {
      const semOcorrencia = [
        l.data,
        l.direcao,
        l.valorCentavos,
        normalizarDescricao(l.descricao),
      ].join("|");

      const ocorrencia = (vistos.get(semOcorrencia) ?? 0) + 1;
      vistos.set(semOcorrencia, ocorrencia);

      const passagem = acharPassagem(l, formato);

      preparados.push({
        ...l,
        origem,
        impressao: impressaoDigital(origem, l, ocorrencia),
        marcacao: passagem ? "excluido" : "normal",
        motivo: passagem,
        parDe: null,
      });
    }
  }

  marcarParesQueSeAnulam(preparados, titular);
  marcarParesComOBanco(preparados, jaNoBanco, titular);

  return preparados;
}

function acharPassagem(l: Lancamento, formato?: Formato): string | null {
  if (!formato) return null;

  const descricao = normalizarDescricao(l.descricao);
  const achado = formato.padroesDePassagem.find((p) =>
    p.padrao.test(descricao),
  );

  return achado ? achado.motivo : null;
}

/**
 * Mesmo valor, direções opostas, datas próximas.
 *
 * ## ⚠ Exceção: dinheiro seu entre contas suas
 *
 * Quando a **entrada** é uma transferência sua (`ehTransferenciaPropria`), só
 * ela sai — a saída é o aporte ou o gasto, e continua. Quando só a **saída** é
 * sua, não há par. Ver `relacaoDoPar`; o resto deste texto vale para o caso
 * geral.
 *
 * ## ⚠ A marca virou `excluido`, e antes era `revisao`
 *
 * O texto aqui dizia: *"nada é apagado — os dois lados viram revisão e quem
 * decide é o usuário"*. Estava correto na descrição e errado no efeito, porque
 * `revisao` **não tira nada da conta**: `somarOMes` só pula `excluido`. Um par
 * encontrado continuava somando dos dois lados até alguém abrir a `/revisao` e
 * marcar os dois à mão, um de cada vez.
 *
 * O resultado medido pelo Davi: um repasse de R$ 300 que entrou e saiu em
 * agosto deixou as entradas do mês parecendo R$ 1.800. A diferença do mês
 * ficava certa — os dois lados somavam —, e por isso ninguém percebia. Era o
 * número de **entradas** que mentia.
 *
 * Decisão dele, sabendo do risco abaixo: sai da conta sozinho.
 *
 * ## O risco, que não sumiu — só mudou de lugar
 *
 * Receber e devolver R$ 60 é anulação; receber salário e pagar aluguel do
 * mesmo valor na mesma semana não é, e o app não tem como distinguir os dois.
 * Um par falso agora **remove dinheiro real** do mês em vez de perguntar.
 *
 * Por isso a marca vem com duas contrapartidas, e nenhuma delas é opcional:
 *
 * - o `motivo` diz o que aconteceu e aponta a data do outro lado;
 * - o painel lista os anulados do mês em vez de escondê-los, e de lá dá para
 *   trazer o par de volta (`painel/trazer-de-volta`).
 *
 * Sem essas duas, isto seria dinheiro sumindo em silêncio — que é pior do que
 * o problema que veio consertar.
 */
function marcarParesQueSeAnulam(
  lista: LancamentoPreparado[],
  titular: string | null,
): void {
  const usados = new Set<number>();

  for (let i = 0; i < lista.length; i++) {
    if (usados.has(i) || !elegivel(lista[i])) continue;

    let melhor = -1;
    let menorDistancia = Infinity;

    for (let j = i + 1; j < lista.length; j++) {
      if (usados.has(j) || !elegivel(lista[j])) continue;
      if (lista[j].valorCentavos !== lista[i].valorCentavos) continue;
      if (lista[j].direcao === lista[i].direcao) continue;

      const distancia = distanciaEmDias(lista[i].data, lista[j].data);
      if (distancia > JANELA_DE_PAR_EM_DIAS) continue;

      // Entre contas suas, sem lado a marcar: não é par, e nenhum dos dois
      // pode ser consumido por ele.
      if (relacaoDoPar(lista[i], lista[j], titular) === null) continue;

      // Empate na distância fica com o primeiro, que é o de linha menor.
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        melhor = j;
      }
    }

    if (melhor === -1) continue;

    // Cada lançamento entra em um par só: sem isto, três valores iguais
    // virariam três pares cruzados e a revisão viraria ruído.
    usados.add(i);
    usados.add(melhor);

    const relacao = relacaoDoPar(lista[i], lista[melhor], titular);

    if (relacao === "repasse-proprio") {
      // Só a entrada sai. A saída é o aporte, o gasto, o que de fato aconteceu.
      const [entrada, saida] =
        lista[i].direcao === "entrada"
          ? [lista[i], lista[melhor]]
          : [lista[melhor], lista[i]];

      marcarEntradaPropria(entrada, saida);
      continue;
    }

    marcarPar(lista[i], lista[melhor]);
    marcarPar(lista[melhor], lista[i]);
  }
}

/**
 * O que um par de mesmo valor e sentidos opostos **é**.
 *
 * - `"anular"` — reembolso, devolução, o mesmo repasse aparecendo duas vezes:
 *   os dois lados saem da conta.
 * - `"repasse-proprio"` — a **entrada** é uma transferência sua. É o dinheiro
 *   passando pela conta a caminho do destino; só ela sai, a saída continua.
 * - `null` — a **saída** é para uma conta sua e a entrada veio de outra pessoa.
 *   Não são o mesmo dinheiro voltando, e anular os dois apagaria o aporte.
 *   Nenhum dos dois é marcado.
 *
 * ⚠ **Antes disto, o aporte sumia.** R$ 300 do salário que entravam no Inter e
 * seguiam para a corretora eram lidos como "repasse que se anula", e o mês
 * ficava como se não tivesse aportado nada — o comparativo anual mostrava um
 * ano de aportes com buracos.
 *
 * ⚠ **O risco que fica:** aportar R$ 300 e resgatar os mesmos R$ 300 na mesma
 * semana é, de fato, uma anulação, e aqui conta o aporte. É raro, e o erro é o
 * de manter o dinheiro à vista em vez de escondê-lo.
 */
type Relacao = "anular" | "repasse-proprio" | null;

function relacaoDoPar(
  a: { direcao: Lancamento["direcao"]; descricao: string },
  b: { direcao: Lancamento["direcao"]; descricao: string },
  titular: string | null,
): Relacao {
  const [entrada, saida] = a.direcao === "entrada" ? [a, b] : [b, a];

  if (ehTransferenciaPropria(entrada.descricao, titular)) {
    return "repasse-proprio";
  }
  if (ehTransferenciaPropria(saida.descricao, titular)) return null;

  return "anular";
}

/**
 * O par que atravessa o envio — o buraco que a janela sozinha não fechava.
 *
 * Um Pix recebido no dia 28 e devolvido no dia 2 são **dois arquivos
 * diferentes**: o extrato de maio e o de junho. `marcarParesQueSeAnulam` olha
 * só o que chegou junto, então esse par nunca foi encontrado — nem com 3 dias,
 * nem com 90. Aqui a busca continua no que já está gravado.
 *
 * ## ⚠ Só o lado novo é marcado
 *
 * O lado antigo já está no banco, provavelmente já classificado, e talvez num
 * mês que você já fechou. Reabri-lo seria reescrever o passado — a regra que
 * esta base já seguiu três vezes. E não é preciso: o `motivo` do lado novo
 * nomeia a data do outro, e a `/revisao` te leva até ele.
 *
 * Roda **depois** do pareamento interno, e só sobre quem sobrou: um par que se
 * fecha dentro do próprio envio é mais forte do que um que precisa do
 * histórico, e marcar os dois lados é melhor do que marcar um.
 */
function marcarParesComOBanco(
  lista: LancamentoPreparado[],
  jaNoBanco: LancamentoSalvo[],
  titular: string | null,
): void {
  if (jaNoBanco.length === 0) return;

  // Cada lançamento gravado fecha um par só. Sem isto, três Pix de R$ 100 no
  // arquivo novo apontariam todos para o mesmo do mês passado.
  const usados = new Set<string>();

  for (const novo of lista) {
    if (!elegivel(novo) || novo.parDe) continue;

    let melhor: LancamentoSalvo | null = null;
    let menorDistancia = Infinity;

    for (const antigo of jaNoBanco) {
      if (usados.has(antigo.impressao)) continue;
      if (antigo.valorCentavos !== novo.valorCentavos) continue;
      if (antigo.direcao === novo.direcao) continue;

      const distancia = distanciaEmDias(novo.data, antigo.data);
      if (distancia > JANELA_DE_PAR_EM_DIAS) continue;

      const relacao = relacaoDoPar(novo, antigo, titular);
      if (relacao === null) continue;

      /*
       * ⚠ **Só o lado novo pode ser marcado** — o antigo já está gravado. Se a
       * entrada própria é a antiga, ela não tem como sair daqui; e anular a
       * saída nova sozinha apagaria justamente o aporte. Fica tudo como está.
       */
      if (relacao === "repasse-proprio" && novo.direcao === "saida") continue;

      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        melhor = antigo;
      }
    }

    if (!melhor) continue;

    usados.add(melhor.impressao);

    if (relacaoDoPar(novo, melhor, titular) === "repasse-proprio") {
      marcarEntradaPropria(novo, melhor);
      continue;
    }

    marcarPar(novo, melhor);
  }
}

function elegivel(l: LancamentoPreparado): boolean {
  // Já excluído não vira também "revisão": a marca mais específica vence.
  if (l.marcacao === "excluido") return false;
  // Zero casaria com qualquer outro zero, e isso não é informação.
  return l.valorCentavos > 0;
}

/**
 * O motivo é escrito para ser lido no painel meses depois, por alguém que não
 * lembra deste código: o que aconteceu, por quê, e onde está o outro lado.
 *
 * A direção do **outro** entra porque é ela que fecha o raciocínio — "entrou o
 * mesmo valor em 28/08" ao lado de uma saída diz sozinho que os dois se
 * cancelam.
 */
function marcarPar(
  l: LancamentoPreparado,
  outro: { data: string; direcao: Lancamento["direcao"]; impressao: string },
): void {
  const verbo = outro.direcao === "entrada" ? "entrou" : "saiu";

  l.marcacao = "excluido";
  l.motivo = `repasse anulado — o mesmo valor ${verbo} em ${outro.data}`;
  l.parDe = outro.impressao;
}

/**
 * A entrada que é você movendo o próprio dinheiro: sai da conta, e a saída
 * correspondente **fica**.
 *
 * O `parDe` aponta para a saída mesmo ela não estando excluída. Serve a duas
 * coisas: a tela de "fora da conta" lista esta entrada como par de um lado só
 * (já é o que ela faz quando o outro lado cai noutro mês), e o "trazer de
 * volta" desfaz — sem tocar na saída, que nunca saiu.
 */
function marcarEntradaPropria(
  entrada: LancamentoPreparado,
  saida: { data: string; impressao: string },
): void {
  entrada.marcacao = "excluido";
  entrada.motivo = `transferência sua entre contas — o dinheiro só passou por aqui; a saída do mesmo valor em ${saida.data} continua na conta`;
  entrada.parDe = saida.impressao;
}

/** Dias inteiros entre duas datas `YYYY-MM-DD`. */
function distanciaEmDias(a: string, b: string): number {
  const ms = Math.abs(
    Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`),
  );
  return Math.round(ms / 86_400_000);
}
