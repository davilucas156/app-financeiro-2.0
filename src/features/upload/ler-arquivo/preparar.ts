import { createHash } from "node:crypto";
import {
  FORMATOS,
  type Formato,
  type Origem,
} from "@/features/upload/ler-arquivo/formatos";
import type { Lancamento } from "@/features/upload/ler-arquivo/lancamentos";

/**
 * Impressão digital, pagamento de fatura e par que se anula (tarefa A4).
 *
 * É a última camada antes do banco. Depois daqui, a D2 só grava.
 */

/** Quantos dias separam um par que se anula. */
const JANELA_DE_PAR_EM_DIAS = 3;

export type Marcacao = "normal" | "excluido" | "revisao";

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
 * Deixa a descrição comparável: caixa alta, sem acento, espaços juntados.
 *
 * É uma **cópia** — a `descricao` original fica intacta, com o alinhamento por
 * espaço que a A3 preservou. Normalizar aqui evita que uma mudança de
 * espaçamento na exportação do banco faça o mesmo lançamento parecer novo no
 * mês seguinte.
 */
export function normalizarDescricao(descricao: string): string {
  return descricao
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
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

  marcarParesQueSeAnulam(preparados);

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
 * **Nada é apagado** — os dois lados viram "revisão" e quem decide é o
 * usuário. É por isso que a marca não é "excluído": receber e devolver R$ 60 é
 * anulação, mas receber salário e pagar aluguel do mesmo valor não é.
 */
function marcarParesQueSeAnulam(lista: LancamentoPreparado[]): void {
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

    marcarPar(lista[i], lista[melhor]);
    marcarPar(lista[melhor], lista[i]);
  }
}

function elegivel(l: LancamentoPreparado): boolean {
  // Já excluído não vira também "revisão": a marca mais específica vence.
  if (l.marcacao === "excluido") return false;
  // Zero casaria com qualquer outro zero, e isso não é informação.
  return l.valorCentavos > 0;
}

function marcarPar(l: LancamentoPreparado, outro: LancamentoPreparado): void {
  l.marcacao = "revisao";
  l.motivo = `possível par que se anula com o lançamento de ${outro.data}`;
  l.parDe = outro.impressao;
}

/** Dias inteiros entre duas datas `YYYY-MM-DD`. */
function distanciaEmDias(a: string, b: string): number {
  const ms = Math.abs(
    Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`),
  );
  return Math.round(ms / 86_400_000);
}
