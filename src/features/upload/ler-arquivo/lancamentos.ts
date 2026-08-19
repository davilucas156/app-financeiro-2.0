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
 * ⚠ **Leitura estritamente pt-BR:** vírgula é decimal, ponto é milhar.
 * `1.200` é mil e duzentos. Aceitar as duas convenções obrigaria a adivinhar,
 * e adivinhar errado aqui erra por cem vezes.
 */
export function paraCentavos(texto: string): number | null {
  // Tira símbolo de moeda e todo tipo de espaço, inclusive o não separável
  // (U+00A0) e o fino (U+202F), que aparecem em exportação de banco.
  let limpo = texto.replace(/R\$/gi, "").replace(/[\s  ]/g, "");
  if (limpo === "") return null;

  let negativo = false;
  if (limpo.startsWith("-")) {
    negativo = true;
    limpo = limpo.slice(1);
  } else if (limpo.startsWith("+")) {
    limpo = limpo.slice(1);
  }

  const partes = limpo.split(",");
  if (partes.length > 2) return null;

  const inteiroTexto = partes[0].replace(/\./g, "");
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
 * `"02/06/2026"` → `"2026-06-02"`. Devolve `null` quando não dá para ler.
 *
 * Confere se a data **existe**, e não só se os números estão na faixa:
 * `31/02/2026` passa em qualquer checagem de faixa e não é um dia.
 */
export function paraDataISO(texto: string): string | null {
  const casou = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!casou) return null;

  const [, dia, mes, ano] = casou;
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

    const data = paraDataISO(dataBruta);
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

    const centavos = paraCentavos(valorBruto);
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
