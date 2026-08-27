import type { Formato } from "@/features/upload/ler-arquivo/formatos";
import { paraGrade } from "@/features/upload/ler-arquivo/grade";
import {
  paraCentavos,
  paraLancamentos,
  type Direcao,
} from "@/features/upload/ler-arquivo/lancamentos";
import type { Palpite } from "@/features/upload/ler-arquivo/palpite";

/**
 * A consequência de um mapeamento, antes de gravar (spec 11, tarefa A5).
 *
 * ## Esta é a resposta ao erro do sinal, e ela não é uma pergunta melhor
 *
 * _"O valor negativo significa entrada ou saída?"_ é uma pergunta de convenção
 * contábil feita a quem só queria subir um extrato. Ninguém erra de propósito, e
 * — o que é pior — **ninguém sabe conferir a própria resposta**.
 *
 * O que a pessoa sabe conferir é o resultado:
 *
 * > 34 lançamentos: R$ 4.812,00 de gasto e R$ 0,00 de entrada.
 *
 * Com o sinal trocado, a mesma frase diz _"R$ 4.812,00 de entrada"_ num arquivo
 * de fatura — e o erro fica visível **antes de gravar**, para alguém que não
 * precisa saber o que é convenção de sinal para saber que não recebeu isso.
 *
 * ## Sai de `paraLancamentos`, e não de uma segunda conta
 *
 * ⚠ A prévia tem de ser **o que o import gravaria**. Calculá-la à parte faria a
 * tela prometer um número e o banco guardar outro, e a pessoa só descobriria no
 * painel — depois de ter dito "sim". É a mesma lição que a spec 12 aplicou ao
 * cartão e à barra do comparativo.
 */

export type LinhaDaPrevia = {
  data: string;
  descricao: string;
  valorCentavos: number;
  direcao: Direcao;
};

export type ConferenciaDeSaldo = {
  transicoes: number;
  batem: number;
  /** A primeira linha que desencontrou, para a tela poder apontar. */
  primeiraFalha: number | null;
};

export type Previa = {
  lancamentos: number;
  entrouCentavos: number;
  saiuCentavos: number;
  ignoradas: number;
  /** As primeiras linhas lidas, para a pessoa ver data e valor de verdade. */
  amostra: LinhaDaPrevia[];
  /** `null` quando o mapeamento não aponta coluna de saldo. */
  saldo: ConferenciaDeSaldo | null;
};

/** Quantas linhas mostrar. Suficiente para ver o padrão, curto para caber. */
const LINHAS_NA_AMOSTRA = 5;

/**
 * ⚠ **O mapeamento é um `Palpite`, e o tipo é o mesmo de propósito.**
 *
 * Um mapeamento é literalmente um palpite depois de a pessoa conferir — os
 * mesmos sete campos, com os mesmos significados. Criar um segundo tipo idêntico
 * garantiria que um dia eles divergissem, e o dia em que divergissem a tela
 * mostraria a prévia de um mapeamento diferente do que seria salvo.
 */
export function previaDoMapeamento(texto: string, mapeamento: Palpite): Previa {
  const grade = paraGrade(texto, mapeamento.dialeto);
  const linhasDeDados = grade.slice(mapeamento.linhaCabecalho + 1);

  const { lancamentos, ignoradas } = paraLancamentos({
    ok: true,
    formato: comoFormato(mapeamento),
    grade,
    linhaCabecalho: mapeamento.linhaCabecalho,
    coluna: mapeamento.colunas,
    linhasDeDados,
  });

  let entrou = 0;
  let saiu = 0;

  for (const l of lancamentos) {
    if (l.direcao === "entrada") entrou += l.valorCentavos;
    else saiu += l.valorCentavos;
  }

  return {
    lancamentos: lancamentos.length,
    entrouCentavos: entrou,
    saiuCentavos: saiu,
    ignoradas: ignoradas.length,
    amostra: lancamentos.slice(0, LINHAS_NA_AMOSTRA).map((l) => ({
      data: l.data,
      descricao: l.descricao,
      valorCentavos: l.valorCentavos,
      direcao: l.direcao,
    })),
    saldo: conferirSaldo(linhasDeDados, mapeamento),
  };
}

/**
 * A testemunha independente, quando o arquivo traz uma (spec 02, e a régua do
 * `references/formatos-de-extrato.md`).
 *
 * > Quando um formato novo entrar, procure uma conferência equivalente antes de
 * > confiar no parser. **Somar o que o próprio parser leu não prova nada.**
 *
 * Aplicando cada valor ao saldo da linha anterior, o resultado tem de dar o
 * saldo da linha seguinte. Se bater em todas, o mapeamento está certo por uma
 * razão que **não** vem do próprio mapeamento — e é a única prova forte que um
 * CSV genérico pode oferecer.
 *
 * ⚠ **Fatura de cartão nunca traz saldo**, e é por isso que a função devolve
 * `null` em vez de inventar. Para esses arquivos a única defesa é a frase da
 * consequência, que é mais fraca — e a tela diz isso em vez de fingir que
 * conferiu.
 *
 * ⚠ **O valor entra com o sinal cru da célula**, e não com a direção que o
 * mapeamento decidiu. Saldo é aritmética do banco: ele não sabe nada sobre a
 * convenção que a pessoa escolheu na tela ao lado.
 */
function conferirSaldo(
  linhasDeDados: string[][],
  mapeamento: Palpite,
): ConferenciaDeSaldo | null {
  const iSaldo = mapeamento.colunas.saldo;
  const iValor = mapeamento.colunas.valor;
  if (iSaldo === undefined || iValor === undefined) return null;

  const linhas: { saldo: number; valor: number }[] = [];

  for (const linha of linhasDeDados) {
    const saldo = paraCentavos(linha[iSaldo] ?? "", mapeamento.formatoNumero);
    const valor = paraCentavos(linha[iValor] ?? "", mapeamento.formatoNumero);
    if (saldo === null || valor === null) continue;
    linhas.push({ saldo, valor });
  }

  if (linhas.length < 2) return null;

  let batem = 0;
  let primeiraFalha: number | null = null;

  for (let i = 1; i < linhas.length; i++) {
    if (linhas[i - 1].saldo + linhas[i].valor === linhas[i].saldo) batem++;
    else if (primeiraFalha === null) primeiraFalha = i;
  }

  return { transicoes: linhas.length - 1, batem, primeiraFalha };
}

/**
 * O mapeamento vestido de `Formato`, só para atravessar `paraLancamentos`.
 *
 * ⚠ **`colunas` sai vazio, e não é esquecimento.** Ali dentro, `Formato.colunas`
 * mapeia papel → **nome** de coluna, e serve à `reconhecer` para casar
 * cabeçalho. A prévia já sabe os **índices** — a pessoa os escolheu na tela — e
 * é o campo `coluna` do reconhecimento que os carrega. Preencher os nomes aqui
 * seria dado inventado que ninguém lê.
 */
function comoFormato(mapeamento: Palpite): Formato {
  return {
    id: "previa",
    nome: "mapeamento em conferência",
    banco: "—",
    origem: mapeamento.origem,
    dialeto: mapeamento.dialeto,
    colunas: {},
    sinalNegativo: mapeamento.sinalNegativo,
    formatoData: mapeamento.formatoData,
    formatoNumero: mapeamento.formatoNumero,
    /*
     * ⚠ **Vazio de propósito.** Marcar pagamento de fatura muda a marcação, não
     * o número — e a prévia responde "quanto entra e quanto sai", não "o que é
     * pass-through". Um padrão inventado aqui faria a prévia divergir do import.
     */
    padroesDePassagem: [],
    obrigatorias: ["data", "descricao", "valor"],
  };
}
