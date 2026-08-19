/**
 * Camada 1 do leitor de extrato (tarefa A1): bytes viram uma matriz de
 * strings. **Só isso.**
 *
 * Este módulo não sabe o que é data, o que é dinheiro nem qual banco mandou o
 * arquivo. A ignorância é o ponto: é ela que permite acrescentar XLSX depois
 * mexendo só aqui. Se esta camada soubesse que a terceira coluna é um valor em
 * reais, o leitor de XLSX precisaria saber também, e a troca deixaria de ser
 * barata (`specs/02-upload-de-extrato.md`, "Sobre planilhas").
 *
 * Também não tem `import "server-only"`, de propósito: não toca banco, não lê
 * sessão e não guarda segredo. Marcá-lo como exclusivo do servidor impediria
 * de testá-lo sem ganhar segurança nenhuma. Quem é do servidor é quem chama.
 */

/** Como o arquivo separa campos. Quem escolhe é a A2, não este módulo. */
export type Dialeto = {
  separador: string;
  /**
   * `true` → `"` delimita campo (regras de CSV citado).
   * `false` → `"` é texto comum.
   *
   * Os dois modos existem porque os dois arquivos do Inter se excluem, e isso
   * foi medido, não suposto (`references/formatos-de-extrato.md`):
   *
   * - A fatura tem vírgula **dentro** do campo de valor (`"R$ 15,00"`) em
   *   todas as linhas de dados. Sem tratamento de aspas, toda linha quebra.
   * - O extrato tem aspas soltas no meio de campo **não** citado
   *   (`Pix recebido: "Cp :123-FULANO"`) em 21 de 21 linhas. Com tratamento de
   *   aspas, um parser estrito rejeita ou embaralha.
   *
   * Nenhuma configuração única lê os dois.
   */
  aspas: boolean;
};

const BOM = "﻿";

/**
 * Bytes viram texto.
 *
 * Tenta UTF-8 estrito primeiro e cai para Latin-1 se falhar. Os dois arquivos
 * medidos são UTF-8 válidos; o fallback existe porque banco brasileiro exporta
 * Latin-1 com frequência, e o sintoma — "AlimentaÃ§Ã£o" — é dos que passam
 * despercebidos até alguém olhar a tela.
 */
export function decodificar(bytes: Uint8Array): string {
  let texto: string;

  try {
    texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    texto = new TextDecoder("iso-8859-1").decode(bytes);
  }

  // O BOM é invisível e sobrevive à decodificação. Deixado no lugar, ele gruda
  // na primeira célula e o cabeçalho "Data" nunca é reconhecido pela A2.
  return texto.startsWith(BOM) ? texto.slice(BOM.length) : texto;
}

/**
 * Texto vira grade.
 *
 * ⚠ **Nada é aparado nem descartado** — nem espaço, nem linha vazia, nem linha
 * curta. A A2 precisa *achar* a linha do cabeçalho no meio das 5 linhas de
 * metadados do extrato; se as vazias sumissem aqui, "pular 5 linhas" viraria
 * um número mágico que quebra no dia em que o Inter acrescentar uma linha.
 */
export function paraGrade(texto: string, dialeto: Dialeto): string[][] {
  if (texto === "") return [];

  return dialeto.aspas
    ? gradeComAspas(texto, dialeto.separador)
    : gradeSimples(texto, dialeto.separador);
}

/** Sem tratamento de aspas: quebra em linhas, quebra cada linha no separador. */
function gradeSimples(texto: string, separador: string): string[][] {
  return texto.split(/\r?\n/).map((linha) => linha.split(separador));
}

/**
 * Com tratamento de aspas. Varredura caractere a caractere, e não uma
 * expressão regular: dentro de aspas, o separador e a quebra de linha são
 * **conteúdo**, e isso é estado que regex não carrega bem.
 */
function gradeComAspas(texto: string, separador: string): string[][] {
  const grade: string[][] = [];
  let linha: string[] = [];
  let celula = "";
  let dentroDeAspas = false;

  const fecharCelula = () => {
    linha.push(celula);
    celula = "";
  };

  const fecharLinha = () => {
    fecharCelula();
    grade.push(linha);
    linha = [];
  };

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];

    if (dentroDeAspas) {
      if (c === '"') {
        // `""` é uma aspa literal; uma aspa sozinha fecha o campo.
        if (texto[i + 1] === '"') {
          celula += '"';
          i++;
        } else {
          dentroDeAspas = false;
        }
      } else {
        celula += c;
      }
      continue;
    }

    if (c === '"') {
      // Aspa só abre campo se a célula ainda estiver vazia. No meio de um
      // campo (`ab"cd`) ela é texto — preservar é melhor do que lançar erro
      // por causa de um arquivo torto.
      if (celula === "") dentroDeAspas = true;
      else celula += c;
      continue;
    }

    if (c === separador) {
      fecharCelula();
      continue;
    }

    if (c === "\n") {
      fecharLinha();
      continue;
    }

    // `\r` só é ignorado quando faz par com `\n`. Sozinho, é conteúdo.
    if (c === "\r" && texto[i + 1] === "\n") continue;

    celula += c;
  }

  // Aspas não fechadas até o fim fecham implicitamente aqui: um arquivo torto
  // não deve travar o leitor. Quem decide o que fazer com a linha é a A3.
  fecharLinha();

  return grade;
}
