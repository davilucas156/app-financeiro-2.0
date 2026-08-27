import {
  FORMATOS_DE_DATA,
  FORMATOS_DE_NUMERO,
  type FormatoDeData,
  type FormatoDeNumero,
} from "@/features/upload/ler-arquivo/dialetos";
import type { Origem, Papel } from "@/features/upload/ler-arquivo/formatos";
import { paraGrade, type Dialeto } from "@/features/upload/ler-arquivo/grade";
import {
  paraCentavos,
  paraDataISO,
} from "@/features/upload/ler-arquivo/lancamentos";

/**
 * O palpite que pré-preenche a tela de mapeamento (spec 11, tarefa A4).
 *
 * ## Esta é a tarefa que decide se a funcionalidade é usável
 *
 * A tela de mapeamento faz sete perguntas técnicas seguidas — separador, aspas,
 * cabeçalho, três colunas, formato de data, convenção de número, sentido do
 * sinal. **Sete campos em branco fazem qualquer pessoa fechar a aba.** Sete
 * respostas prontas para conferir, não.
 *
 * Se o palpite for fraco, nenhuma fase de front-end salva a spec.
 *
 * ## Ele decide pelo conteúdo das células, nunca pelo nome da coluna
 *
 * ⚠ **De propósito, e é a diferença entre esta função e a `reconhecer`.** Casar
 * por nome de cabeçalho é o que a `reconhecer` já faz — e é exatamente o que
 * falhou: se o nome batesse, o arquivo não teria chegado aqui. Um cabeçalho
 * `Fecha_Mov`, `Histórico`, `Vlr` não diz nada; três células com `27/06/2026`
 * dizem tudo.
 */

export type Palpite = {
  dialeto: Dialeto;
  /** Índice na grade lida com `dialeto`. */
  linhaCabecalho: number;
  colunas: Partial<Record<Papel, number>>;
  formatoData: FormatoDeData;
  formatoNumero: FormatoDeNumero;
  origem: Origem;
  sinalNegativo: "entrada" | "saida";
};

/**
 * Os separadores que valem tentar.
 *
 * `;` e `,` são os dois medidos. `\t` e `|` entram porque são o que sobra
 * quando um banco quer evitar os dois primeiros — e tentá-los custa uma
 * releitura de um arquivo que o limite já prende em 2 MB.
 */
const SEPARADORES = [";", ",", "\t", "|"];

export function palpitar(texto: string): Palpite | null {
  const dialeto = melhorDialeto(texto);
  if (!dialeto) return null;

  const grade = paraGrade(texto, dialeto.dialeto);
  const linhaCabecalho = acharCabecalho(grade, dialeto.colunas);
  if (linhaCabecalho === -1) return null;

  const dados = grade
    .slice(linhaCabecalho + 1)
    .filter((l) => l.length === dialeto.colunas);

  if (dados.length === 0) return null;

  const colunas = acharColunas(dados, dialeto.colunas);
  if (colunas.data === undefined || colunas.valor === undefined) return null;

  const formatoData = melhorFormatoDeData(dados, colunas.data);
  const formatoNumero = melhorFormatoDeNumero(dados, colunas.valor);

  return {
    dialeto: dialeto.dialeto,
    linhaCabecalho,
    colunas,
    formatoData,
    formatoNumero,
    origem: colunas.saldo !== undefined ? "csv_conta" : origemPeloTipo(colunas),
    sinalNegativo: melhorSinal(dados, colunas.valor, formatoNumero),
  };
}

/**
 * Qual separador e qual tratamento de aspas leem este arquivo.
 *
 * ⚠ **A medida é "quantas linhas têm o mesmo número de colunas"**, e não
 * "quantas ocorrências do separador" — que é o que a `reconhecer` já descartou
 * por escrito: o extrato do Davi tem 2 vírgulas por linha (as decimais) contra
 * 3 ponto-e-vírgulas, e contar ocorrências elegeria a vírgula.
 *
 * Separador errado produz uma coluna só, ou uma contagem que pula de linha em
 * linha. Separador certo produz uma tabela.
 */
function melhorDialeto(
  texto: string,
): { dialeto: Dialeto; colunas: number } | null {
  let melhor: { dialeto: Dialeto; colunas: number; linhas: number } | null =
    null;

  for (const separador of SEPARADORES) {
    for (const aspas of [false, true]) {
      const dialeto = { separador, aspas };
      const grade = paraGrade(texto, dialeto);
      const { colunas, linhas } = formaDaGrade(grade);

      // Uma coluna só não é tabela: é o arquivo inteiro sem separar.
      if (colunas < 2) continue;

      if (
        !melhor ||
        linhas > melhor.linhas ||
        (linhas === melhor.linhas && colunas > melhor.colunas)
      ) {
        melhor = { dialeto, colunas, linhas };
      }
    }
  }

  return melhor ? { dialeto: melhor.dialeto, colunas: melhor.colunas } : null;
}

/** A largura mais repetida da grade, e quantas linhas a têm. */
function formaDaGrade(grade: string[][]): { colunas: number; linhas: number } {
  const contagem = new Map<number, number>();

  for (const linha of grade) {
    if (linha.every((c) => c.trim() === "")) continue;
    contagem.set(linha.length, (contagem.get(linha.length) ?? 0) + 1);
  }

  let colunas = 0;
  let linhas = 0;

  for (const [largura, quantas] of contagem) {
    if (largura < 2) continue;
    if (quantas > linhas || (quantas === linhas && largura > colunas)) {
      colunas = largura;
      linhas = quantas;
    }
  }

  return { colunas, linhas };
}

/**
 * A primeira linha que tem a largura da tabela e **nenhum dado dentro**.
 *
 * ⚠ **A largura é parte da regra, e não enfeite.** Sem ela, o `Período
 * ;02/06/2026 a 02/07/2026` do extrato do Inter viraria cabeçalho: são duas
 * células, nenhuma é data ("02/06/2026 a 02/07/2026" não é uma data) e nenhuma
 * é número. Ele tem 2 colunas numa tabela de 4, e é isso que o descarta.
 */
function acharCabecalho(grade: string[][], colunas: number): number {
  for (let i = 0; i < grade.length; i++) {
    const linha = grade[i];
    if (linha.length !== colunas) continue;

    const preenchidas = linha.filter((c) => c.trim() !== "");
    if (preenchidas.length < 2) continue;

    const temDado = preenchidas.some(
      (c) => algumaData(c) !== null || algumNumero(c) !== null,
    );
    if (!temDado) return i;
  }

  return -1;
}

function acharColunas(
  dados: string[][],
  largura: number,
): Partial<Record<Papel, number>> {
  const datas: number[] = [];
  const numeros: number[] = [];

  for (let c = 0; c < largura; c++) {
    const celulas = dados.map((l) => l[c] ?? "").filter((v) => v.trim() !== "");
    if (celulas.length === 0) {
      datas.push(0);
      numeros.push(0);
      continue;
    }

    datas.push(celulas.filter((v) => algumaData(v) !== null).length);
    numeros.push(celulas.filter((v) => algumNumero(v) !== null).length);
  }

  const colunas: Partial<Record<Papel, number>> = {};

  const data = maiorIndice(datas);
  if (data !== -1 && datas[data] > 0) colunas.data = data;

  /*
   * ⚠ **Entre duas colunas numéricas, vence a que tem negativo.** No extrato do
   * Inter as duas candidatas são `Valor` e `Saldo`, e as duas leem como número
   * em toda linha. O que as separa é o sinal: valor tem saída, saldo raramente
   * fica negativo. Desempatar pela posição funcionaria neste arquivo e falharia
   * no primeiro banco que puser o saldo antes.
   */
  const numericas = numeros
    .map((quantas, i) => ({ i, quantas }))
    .filter((n) => n.quantas > 0 && n.i !== colunas.data)
    .sort((a, b) => b.quantas - a.quantas);

  if (numericas.length > 0) {
    const comNegativo = numericas.filter((n) =>
      dados.some((l) => (algumNumero(l[n.i] ?? "") ?? 0) < 0),
    );

    const valor = (comNegativo[0] ?? numericas[0]).i;
    colunas.valor = valor;

    // A outra numérica é candidata a saldo — e é ela que liga a conferência
    // independente da A5.
    const saldo = numericas.find((n) => n.i !== valor);
    if (saldo && saldo.quantas === dados.length) colunas.saldo = saldo.i;
  }

  const usadas = new Set(Object.values(colunas));

  // A descrição é a coluna de texto mais longa entre as que sobraram: é o que
  // um histórico bancário é, e o que um código de agência não é.
  let descricao = -1;
  let maior = 0;

  for (let c = 0; c < largura; c++) {
    if (usadas.has(c)) continue;
    const media = comprimentoMedio(dados, c);
    if (media > maior) {
      maior = media;
      descricao = c;
    }
  }

  if (descricao !== -1) colunas.descricao = descricao;

  // `tipo` é onde mora o parcelamento (`Parcela 4/12`), e é o que distingue
  // fatura de extrato quando não há saldo.
  const tipo = acharTipo(dados, largura, new Set(Object.values(colunas)));
  if (tipo !== -1) colunas.tipo = tipo;

  return colunas;
}

function acharTipo(
  dados: string[][],
  largura: number,
  usadas: Set<number>,
): number {
  for (let c = 0; c < largura; c++) {
    if (usadas.has(c)) continue;
    if (dados.some((l) => /\d+\s*\/\s*\d+/.test(l[c] ?? ""))) return c;
  }
  return -1;
}

/**
 * ⚠ **A ordem de `FORMATOS_DE_DATA` é a regra, e ela começa em `dd/mm/aaaa`.**
 *
 * Vence o primeiro formato que lê a coluna **inteira**. Como `mm/dd/aaaa` é o
 * último, ela só é proposta quando é a única que serve — isto é, quando existe
 * algum dia acima de 12 na primeira posição, que é o único desempate que um
 * arquivo pode dar.
 *
 * Havendo ambiguidade (todo dia ≤ 12), propõe-se a convenção do país e a prévia
 * mostra as datas lidas, para a pessoa desmentir. Não há palpite melhor: as duas
 * leituras são igualmente plausíveis, e é por isso que a decisão fica na tela.
 */
function melhorFormatoDeData(dados: string[][], coluna: number): FormatoDeData {
  const celulas = dados
    .map((l) => l[coluna] ?? "")
    .filter((v) => v.trim() !== "");

  for (const formato of FORMATOS_DE_DATA) {
    if (celulas.every((v) => paraDataISO(v, formato) !== null)) return formato;
  }

  return FORMATOS_DE_DATA[0];
}

/** Mesma regra, e pt-BR é o primeiro da lista pelo mesmo motivo. */
function melhorFormatoDeNumero(
  dados: string[][],
  coluna: number,
): FormatoDeNumero {
  const celulas = dados
    .map((l) => l[coluna] ?? "")
    .filter((v) => v.trim() !== "");

  for (const formato of FORMATOS_DE_NUMERO) {
    if (celulas.every((v) => paraCentavos(v, formato) !== null)) return formato;
  }

  return FORMATOS_DE_NUMERO[0];
}

/**
 * O palpite do sinal: **vence a leitura que deixa menos linhas como entrada.**
 *
 * Numa fatura quase tudo é gasto e o único negativo é o pagamento que a abate;
 * num extrato, saída costuma ser mais frequente que entrada. Medido nas duas
 * amostras do Inter, a regra acerta as duas — e elas usam o sinal com
 * significados **opostos**, que é o caso difícil.
 *
 * ⚠ **Continua sendo palpite, e por isso a tela mostra a consequência.** A
 * defesa contra o erro caro não é esta função: é a frase "R$ 4.812,00 de gasto
 * e R$ 0,00 de entrada" mudando ao vivo quando a pessoa troca a marcação.
 */
function melhorSinal(
  dados: string[][],
  coluna: number,
  formatoNumero: FormatoDeNumero,
): "entrada" | "saida" {
  let negativos = 0;
  let positivos = 0;

  for (const linha of dados) {
    const v = paraCentavos(linha[coluna] ?? "", formatoNumero);
    if (v === null) continue;
    if (v < 0) negativos++;
    else positivos++;
  }

  // Com `sinalNegativo: "saida"`, quem é entrada são os positivos; com
  // `"entrada"`, são os negativos.
  return positivos <= negativos ? "saida" : "entrada";
}

/**
 * Sem coluna de saldo, o que separa fatura de extrato é o parcelamento.
 *
 * ⚠ **Na dúvida, `csv_conta`.** Errar para conta faz o mês do lançamento vir da
 * data dele, que é o comportamento mais previsível; errar para cartão faria
 * todos os lançamentos caírem no mês escolhido no formulário
 * (`importarExtrato.service.ts:324`), o que move o arquivo inteiro de mês.
 */
function origemPeloTipo(colunas: Partial<Record<Papel, number>>): Origem {
  return colunas.tipo !== undefined ? "csv_cartao" : "csv_conta";
}

/**
 * ⚠ **Aqui a convenção ainda não foi escolhida**, então vale a que ler.
 *
 * Medir as colunas com a régua pt-BR faria a coluna de valor de um banco
 * en-US pontuar zero — e o palpite devolveria `null` para um arquivo
 * perfeitamente legível. O mesmo motivo pelo qual a data usa `algumaData`.
 */
function algumNumero(texto: string): number | null {
  for (const formato of FORMATOS_DE_NUMERO) {
    const v = paraCentavos(texto, formato);
    if (v !== null) return v;
  }
  return null;
}

function algumaData(texto: string): string | null {
  for (const formato of FORMATOS_DE_DATA) {
    const iso = paraDataISO(texto, formato);
    if (iso !== null) return iso;
  }
  return null;
}

function comprimentoMedio(dados: string[][], coluna: number): number {
  const total = dados.reduce((s, l) => s + (l[coluna] ?? "").trim().length, 0);
  return dados.length === 0 ? 0 : total / dados.length;
}

function maiorIndice(valores: number[]): number {
  let melhor = -1;
  let maior = 0;

  valores.forEach((v, i) => {
    if (v > maior) {
      maior = v;
      melhor = i;
    }
  });

  return melhor;
}
