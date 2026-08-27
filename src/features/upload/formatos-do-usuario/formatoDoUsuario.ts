import {
  FORMATOS_DE_DATA,
  FORMATOS_DE_NUMERO,
  FORMATO_DE_DATA_PADRAO,
  FORMATO_DE_NUMERO_PADRAO,
  type FormatoDeData,
  type FormatoDeNumero,
} from "@/features/upload/ler-arquivo/dialetos";
import type {
  Formato,
  Origem,
  Papel,
} from "@/features/upload/ler-arquivo/formatos";
import type { Dialeto } from "@/features/upload/ler-arquivo/grade";

/**
 * O formato do usuário como **valor**, longe do banco (spec 11, tarefa C2).
 *
 * ## A decisão que mudou o desenho: guarda-se o **nome** da coluna, não o índice
 *
 * A tela de mapeamento trabalha com índices — a pessoa aponta a terceira coluna.
 * O primeiro rascunho gravava isso. Mas a `reconhecer` casa coluna **por nome de
 * cabeçalho**, e gravar índice obrigaria a escrever um segundo caminho de
 * reconhecimento só para os formatos de usuário.
 *
 * Guardar o nome — lido da célula do cabeçalho no momento de salvar — dá duas
 * coisas de graça:
 *
 * 1. **Um caminho só.** Formato de usuário e formato de código são reconhecidos
 *    pela mesma função, pelo mesmo critério. Nada no leitor sabe quem é quem.
 * 2. **Sobrevive ao banco mexer no arquivo.** Índice quebra **em silêncio** no
 *    dia em que o banco acrescenta uma coluna à esquerda: o formato continua
 *    casando e passa a ler a coluna errada. Nome não casa mais, e a pessoa
 *    recebe "não reconheci" — que é falhar em voz alta.
 *
 * ## Por que não vive junto do serviço
 *
 * Porque a tela precisa dele. O componente de mapeamento monta o mapeamento e o
 * manda para a action; se o tipo e as validações morassem no arquivo com
 * `import "server-only"`, importá-los do cliente quebraria a compilação — a
 * armadilha que a spec 10 já pagou uma vez, quando `gravarPreferencia` teve de
 * sair de `tema.ts`.
 *
 * ## Tudo aqui revalida o que já é tipado, e é de propósito
 *
 * ⚠ **Uma server action é um endpoint HTTP.** O tipo é garantia de compilação,
 * não de execução: quem chamar a action por fora manda o que quiser. Sem esta
 * camada, `origem: "<script>"` iria para uma coluna com CHECK — que derrubaria a
 * transação com erro de banco em vez de mensagem — e o separador viraria o que
 * mandassem.
 */

export const PAPEIS: Papel[] = [
  "data",
  "descricao",
  "valor",
  "saldo",
  "categoria",
  "tipo",
];

export const PAPEIS_OBRIGATORIOS: Papel[] = ["data", "descricao", "valor"];

export const ROTULOS_DO_PAPEL: Record<Papel, string> = {
  data: "data",
  descricao: "descrição",
  valor: "valor",
  saldo: "saldo",
  categoria: "categoria do banco",
  tipo: "tipo ou parcelamento",
};

/**
 * Os separadores que um formato pode declarar.
 *
 * ⚠ **Lista fechada, e não "qualquer caractere".** O separador vai para um
 * `String.split` e não para um `RegExp`, então não há injeção possível — mas um
 * separador vazio, ou de dois caracteres, produziria uma grade sem sentido cujo
 * único sintoma seria "0 lançamentos", muito depois.
 */
export const SEPARADORES_VALIDOS = [";", ",", "\t", "|"];

/** O que uma linha de `user_formats` guarda, sem os campos do banco. */
export type MapeamentoSalvo = {
  nome: string;
  banco: string;
  origem: Origem;
  dialeto: Dialeto;
  /** Papel → **nome** da coluna no arquivo. Ver o topo deste módulo. */
  colunas: Partial<Record<Papel, string>>;
  sinalNegativo: "entrada" | "saida";
  formatoData: FormatoDeData;
  formatoNumero: FormatoDeNumero;
};

export type Validacao =
  { ok: true; mapeamento: MapeamentoSalvo } | { ok: false; erro: string };

/**
 * A fronteira: o que chegou do cliente vira algo gravável, ou diz por quê não.
 *
 * ⚠ **Devolve erro em vez de corrigir em silêncio**, ao contrário do
 * `escolhaValida` das preferências. A diferença é a consequência: tema inválido
 * vira "escuro" e ninguém perde nada; coluna de valor inválida viraria um
 * formato que lê o arquivo errado **toda vez**, e a pessoa não teria como saber
 * que o app trocou a escolha dela.
 */
export function validarMapeamento(
  bruto: unknown,
  /** A linha de cabeçalho do arquivo, para traduzir índice em nome. */
  cabecalho: string[],
): Validacao {
  if (typeof bruto !== "object" || bruto === null) {
    return { ok: false, erro: "Mapeamento vazio." };
  }

  const m = bruto as Record<string, unknown>;

  const nome = texto(m.nome);
  if (nome === null) return { ok: false, erro: "Dê um nome a este formato." };

  const banco = texto(m.banco);
  if (banco === null) {
    return { ok: false, erro: "Diga de qual banco é este arquivo." };
  }

  const dialeto = m.dialeto as { separador?: unknown; aspas?: unknown } | null;
  if (
    !dialeto ||
    typeof dialeto.separador !== "string" ||
    !SEPARADORES_VALIDOS.includes(dialeto.separador)
  ) {
    return { ok: false, erro: "Separador desconhecido." };
  }

  const colunas = nomearColunas(m.colunas, cabecalho);
  const faltando = PAPEIS_OBRIGATORIOS.filter((p) => colunas[p] === undefined);

  if (faltando.length > 0) {
    return {
      ok: false,
      /*
       * ⚠ **Nomeia a coluna que falta, e nunca "preencha os campos".** É a
       * diferença entre uma mensagem que resolve e uma que só informa que deu
       * errado — a mesma régua que a `reconhecer` já segue ao apontar o formato
       * mais próximo.
       */
      erro: `Falta apontar a coluna de ${faltando
        .map((p) => ROTULOS_DO_PAPEL[p])
        .join(", ")}.`,
    };
  }

  return {
    ok: true,
    mapeamento: {
      nome,
      banco,
      dialeto: { separador: dialeto.separador, aspas: dialeto.aspas === true },
      colunas,
      formatoData: umDe(
        FORMATOS_DE_DATA,
        m.formatoData,
        FORMATO_DE_DATA_PADRAO,
      ),
      formatoNumero: umDe(
        FORMATOS_DE_NUMERO,
        m.formatoNumero,
        FORMATO_DE_NUMERO_PADRAO,
      ),
      origem: m.origem === "csv_cartao" ? "csv_cartao" : "csv_conta",
      sinalNegativo: m.sinalNegativo === "entrada" ? "entrada" : "saida",
    },
  };
}

/**
 * Índices apontados na tela viram nomes de coluna.
 *
 * ⚠ **Coluna sem nome no cabeçalho não entra**, e isso é o certo: um formato
 * cujo papel obrigatório aponta para uma célula vazia não seria reconhecível
 * depois. Quando é obrigatória, quem reclama é a mensagem de "falta apontar" —
 * e reclamar na hora de salvar é melhor que salvar um formato que nunca casa.
 *
 * ⚠ **Papel desconhecido é descartado, não recusado.** Uma chave estranha não
 * muda o que o formato lê: as três obrigatórias são conferidas logo depois, e o
 * que sobra é opcional. Travar a pessoa por um detalhe invisível para ela seria
 * pior que ignorá-lo.
 */
function nomearColunas(
  bruto: unknown,
  cabecalho: string[],
): Partial<Record<Papel, string>> {
  const colunas: Partial<Record<Papel, string>> = {};
  if (typeof bruto !== "object" || bruto === null) return colunas;

  for (const [chave, valor] of Object.entries(bruto)) {
    if (!PAPEIS.includes(chave as Papel)) continue;

    const i = inteiro(valor);
    if (i === null || i < 0 || i >= cabecalho.length) continue;

    const nome = (cabecalho[i] ?? "").trim();
    if (nome === "") continue;

    colunas[chave as Papel] = nome;
  }

  return colunas;
}

/**
 * O formato salvo virando o `Formato` que o leitor entende.
 *
 * ⚠ **Sai um `Formato` comum, sem marca de origem.** É o ponto da decisão do
 * topo deste módulo: depois daqui nada no leitor sabe se este formato veio do
 * código ou de alguém.
 */
export function comoFormato(id: string, m: MapeamentoSalvo): Formato {
  return {
    id,
    nome: m.nome,
    banco: m.banco,
    origem: m.origem,
    dialeto: m.dialeto,
    colunas: m.colunas,
    sinalNegativo: m.sinalNegativo,
    formatoData: m.formatoData,
    formatoNumero: m.formatoNumero,
    /*
     * ⚠ **Vazio, e a tela não pergunta** (pendência 8 da spec 11). É a pergunta
     * que ninguém sabe responder, e a falta dela não produz o desastre do
     * dinheiro saindo duas vezes: `prepararLancamentos` casa pares que se
     * anulam **por valor e data**, sem olhar texto, e os dois lados caem em
     * revisão. Sem configuração o app pergunta; ele não inventa.
     */
    padroesDePassagem: [],
    obrigatorias: PAPEIS_OBRIGATORIOS,
  };
}

function texto(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const limpo = v.trim();
  // 60 é folga para "Extrato de conta corrente do Banco Tal" e curto o
  // bastante para caber num cartão de 360px sem virar parágrafo.
  return limpo === "" || limpo.length > 60 ? null : limpo;
}

function inteiro(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isInteger(n) ? n : null;
}

function umDe<T extends string>(
  valores: readonly T[],
  valor: unknown,
  padrao: T,
): T {
  return typeof valor === "string" &&
    (valores as readonly string[]).includes(valor)
    ? (valor as T)
    : padrao;
}
