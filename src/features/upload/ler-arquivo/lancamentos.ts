import {
  FORMATO_DE_DATA_PADRAO,
  FORMATO_DE_NUMERO_PADRAO,
  type FormatoDeData,
  type FormatoDeNumero,
} from "@/features/upload/ler-arquivo/dialetos";
import type { Formato, Papel } from "@/features/upload/ler-arquivo/formatos";
import type { Reconhecimento } from "@/features/upload/ler-arquivo/reconhecer";

/**
 * Camada 2 do leitor (tarefa A3): a grade vira lançamentos.
 *
 * Aqui mora tudo que é específico de banco — data, dinheiro e direção. É de
 * propósito: acrescentar XLSX depois troca só a camada 1
 * (`specs/02-upload-de-extrato.md`, "Sobre planilhas").
 */

export type Direcao = "entrada" | "saida";

export type Lancamento = {
  /**
   * `"2026-06-02"`, string, **não** `Date`.
   *
   * Um `Date` é um instante, e instante precisa de fuso. `02/06/2026` não é um
   * instante, é um dia. Convertido para `Date` no servidor da Vercel (UTC) e
   * lido no Brasil, `02/06 00:00Z` vira `01/06` às 21h — o lançamento muda de
   * dia e às vezes de mês, justo num produto cujo eixo é o mês de referência.
   */
  data: string;
  descricao: string;
  /** Sempre positivo. O sentido está em `direcao`. */
  valorCentavos: number;
  direcao: Direcao;
  /** `"4/12"` quando parcelado; `null` à vista ou fora do cartão. */
  parcela: string | null;
  /** Palpite do banco, guardado como veio. **Nunca** verdade — ver A2. */
  categoriaDoBanco: string | null;
  /** Linha no arquivo (1-based), para o resumo poder apontar. */
  linha: number;
};

export type LinhaIgnorada = {
  linha: number;
  motivo: string;
  conteudo: string;
};

export type Leitura = {
  lancamentos: Lancamento[];
  ignoradas: LinhaIgnorada[];
};

/**
 * `"1.200,00"` → `120000`. Devolve `null` quando não dá para ler.
 *
 * ⚠ **Nunca passa por ponto flutuante.** `19.90 * 100` é
 * `1989.9999999999998` em JavaScript — um centavo perdido por lançamento, em
 * silêncio. A conta é feita em texto: parte inteira e centavos separados.
 *
 * ⚠ **A convenção é declarada, nunca adivinhada** (spec 11, tarefa A2). Em
 * pt-BR a vírgula é decimal e o ponto é milhar, então `1.200` é mil e duzentos;
 * em en-US é o contrário, e `1.200` seria um e dois décimos — que **não é
 * centavo**, e por isso é recusado nos dois. Adivinhar entre as duas erraria
 * por cem vezes, e erraria em silêncio.
 *
 * O padrão é pt-BR porque é o que os dois arquivos medidos usam. Quem passa
 * outro é um formato que a pessoa mapeou (spec 11).
 */
export function paraCentavos(
  texto: string,
  formato: FormatoDeNumero = FORMATO_DE_NUMERO_PADRAO,
): number | null {
  // Tira símbolo de moeda e todo tipo de espaço, inclusive o não separável
  // (U+00A0) e o fino (U+202F), que aparecem em exportação de banco.
  // O `$` sozinho sai também: `paraCentavos` deixou de ser só do Inter, e
  // banco que exporta em en-US escreve `$1,200.50`.
  let limpo = texto
    .replace(/R\$/gi, "")
    .replace(/\$/g, "")
    .replace(/[\s  ]/g, "");
  if (limpo === "") return null;

  let negativo = false;
  if (limpo.startsWith("-")) {
    negativo = true;
    limpo = limpo.slice(1);
  } else if (limpo.startsWith("+")) {
    limpo = limpo.slice(1);
  }

  // A única diferença entre as duas convenções: quem separa centavos e quem
  // agrupa milhar. O resto da função não sabe qual é qual.
  const decimal = formato === "pt-BR" ? "," : ".";
  const milhar = formato === "pt-BR" ? "." : ",";

  const partes = limpo.split(decimal);
  if (partes.length > 2) return null;

  /*
   * ⚠ **O agrupamento de milhar é conferido, e não só removido** (spec 11).
   *
   * Até aqui a função apagava os pontos e somava. Isso fazia `152.40` ser lido
   * em pt-BR como **R$ 1.524,00** — cem vezes o valor, sem erro nenhum. Nunca
   * mordeu porque os dois arquivos do Inter escrevem centavo com vírgula; com
   * banco de fora, é o modo de falhar mais caro que existe: silencioso e por
   * duas ordens de grandeza.
   *
   * Um separador de milhar é seguido de **exatamente três dígitos**. `152.40`
   * não é pt-BR — é en-US, e recusar aqui é o que deixa a leitura en-US ganhar
   * o desempate no palpite (`palpite.ts`).
   */
  const grupos = partes[0].split(milhar);
  if (grupos.length > 1) {
    if (!/^\d{1,3}$/.test(grupos[0])) return null;
    if (!grupos.slice(1).every((g) => /^\d{3}$/.test(g))) return null;
  }

  const inteiroTexto = grupos.join("");
  const centavosTexto = partes[1] ?? "";

  if (!/^\d+$/.test(inteiroTexto)) return null;
  if (centavosTexto !== "" && !/^\d{1,2}$/.test(centavosTexto)) return null;

  const inteiro = Number(inteiroTexto);
  // `,5` é cinquenta centavos, não cinco.
  const centavos = Number(centavosTexto.padEnd(2, "0") || "0");

  const total = inteiro * 100 + centavos;
  return negativo ? -total : total;
}

/**
 * ⚠ **A ordem dos campos é declarada, nunca adivinhada** (spec 11, tarefa A1).
 *
 * `01/02/2026` é 1º de fevereiro ou 2 de janeiro, e **as duas leituras são
 * plausíveis**. Só o arquivo inteiro desempata, e só quando ele tem algum dia
 * acima de 12 — por isso quem escolhe é o formato, e o palpite que o propõe
 * (`palpite.ts`) trata o caso ambíguo com nome e sobrenome.
 *
 * Este erro é pior que o do sinal de um jeito específico: sinal trocado aparece
 * num total, data trocada **move lançamentos de mês** — e o mês é o eixo do
 * painel, do comparativo e da média. Não tem sintoma.
 */
const CAMPOS_DA_DATA: Record<
  FormatoDeData,
  {
    padrao: RegExp;
    ordem: readonly ["dia" | "mes" | "ano", ...("dia" | "mes" | "ano")[]];
  }
> = {
  "dd/mm/aaaa": {
    padrao: /^(\d{2})\/(\d{2})\/(\d{4})$/,
    ordem: ["dia", "mes", "ano"],
  },
  "dd-mm-aaaa": {
    padrao: /^(\d{2})-(\d{2})-(\d{4})$/,
    ordem: ["dia", "mes", "ano"],
  },
  "mm/dd/aaaa": {
    padrao: /^(\d{2})\/(\d{2})\/(\d{4})$/,
    ordem: ["mes", "dia", "ano"],
  },
  "aaaa-mm-dd": {
    padrao: /^(\d{4})-(\d{2})-(\d{2})$/,
    ordem: ["ano", "mes", "dia"],
  },
};

/**
 * `"02/06/2026"` → `"2026-06-02"`. Devolve `null` quando não dá para ler.
 *
 * Confere se a data **existe**, e não só se os números estão na faixa:
 * `31/02/2026` passa em qualquer checagem de faixa e não é um dia. A ida e
 * volta por `Date` vale para os quatro formatos, e é ela que pega isso.
 *
 * O padrão é `dd/mm/aaaa` porque é o que os dois arquivos medidos usam.
 */
export function paraDataISO(
  texto: string,
  formato: FormatoDeData = FORMATO_DE_DATA_PADRAO,
): string | null {
  const { padrao, ordem } = CAMPOS_DA_DATA[formato];
  const casou = padrao.exec(texto.trim());
  if (!casou) return null;

  const campos: Record<string, string> = {};
  ordem.forEach((campo, i) => {
    campos[campo] = casou[i + 1];
  });

  const { dia, mes, ano } = campos;
  const iso = `${ano}-${mes}-${dia}`;

  // `Date.UTC` normaliza silenciosamente 31/02 para 03/03. A ida e volta pega
  // isso: se o que sai não é o que entrou, a data não existia.
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  if (d.toISOString().slice(0, 10) !== iso) return null;

  return iso;
}

/** `"Parcela 4/12"` → `"4/12"`. `"Compra à vista"` → `null`. */
export function paraParcela(tipo: string | null): string | null {
  if (!tipo) return null;
  const casou = /(\d+)\s*\/\s*(\d+)/.exec(tipo);
  return casou ? `${casou[1]}/${casou[2]}` : null;
}

export function paraLancamentos(
  r: Extract<Reconhecimento, { ok: true }>,
): Leitura {
  const lancamentos: Lancamento[] = [];
  const ignoradas: LinhaIgnorada[] = [];

  const pegar = (linha: string[], papel: Papel): string | null => {
    const i = r.coluna[papel];
    if (i === undefined) return null;
    return linha[i] ?? null;
  };

  r.linhasDeDados.forEach((linha, i) => {
    // `linhaCabecalho` é 0-based e a numeração para o usuário é 1-based.
    const numero = r.linhaCabecalho + i + 2;
    const conteudo = linha.join(" ").trim();

    // Linha toda vazia é o rodapé do arquivo. Some sem virar estatística —
    // contá-la faria todo import "ignorar 1 linha" e assustar à toa.
    if (conteudo === "") return;

    const ignorar = (motivo: string) =>
      ignoradas.push({ linha: numero, motivo, conteudo });

    const dataBruta = pegar(linha, "data");
    const descricaoBruta = pegar(linha, "descricao");
    const valorBruto = pegar(linha, "valor");

    if (dataBruta === null || descricaoBruta === null || valorBruto === null) {
      ignorar("linha com menos colunas do que o cabeçalho");
      return;
    }

    // ⚠ Os dialetos vêm do formato, e não do padrão da função (spec 11). Ler
    // um arquivo en-US com a régua pt-BR não dá erro: dá centavo trocado por
    // milhar, em silêncio.
    const data = paraDataISO(dataBruta, r.formato.formatoData);
    if (data === null) {
      ignorar(`data não reconhecida: "${dataBruta.trim()}"`);
      return;
    }

    // Apara só as pontas. O alinhamento por espaço do meio
    // ("LOJA          Betim   BRA") separa estabelecimento de cidade e pode
    // servir depois; normalizar para comparar é da A4, que faz uma cópia.
    const descricao = descricaoBruta.trim();
    if (descricao === "") {
      ignorar("descrição vazia");
      return;
    }

    const centavos = paraCentavos(valorBruto, r.formato.formatoNumero);
    if (centavos === null) {
      ignorar(`valor não reconhecido: "${valorBruto.trim()}"`);
      return;
    }

    lancamentos.push({
      data,
      descricao,
      valorCentavos: Math.abs(centavos),
      direcao: direcaoDe(centavos, r.formato),
      parcela: paraParcela(pegar(linha, "tipo")),
      categoriaDoBanco: pegar(linha, "categoria")?.trim() || null,
      linha: numero,
    });
  });

  return { lancamentos, ignoradas };
}

/**
 * ⚠ **A direção depende do formato, não só do sinal.**
 *
 * No extrato, `-318,19` é dinheiro que saiu. Na fatura, uma compra de
 * `R$ 15,00` é positiva e é gasto, e o negativo é o pagamento que abate a
 * fatura. Assumir "negativo é saída" para os dois faria todo gasto do cartão
 * virar receita.
 *
 * Zero conta como positivo — não é erro, e a direção sai do formato.
 */
function direcaoDe(centavos: number, formato: Formato): Direcao {
  const oposto: Direcao =
    formato.sinalNegativo === "saida" ? "entrada" : "saida";

  return centavos < 0 ? formato.sinalNegativo : oposto;
}
