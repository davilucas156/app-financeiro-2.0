import { decodificar, paraGrade } from "@/features/upload/ler-arquivo/grade";
import {
  FORMATOS,
  normalizarNomeDeColuna,
  type Formato,
  type Papel,
} from "@/features/upload/ler-arquivo/formatos";

/**
 * "Que arquivo é este, e onde está o cabeçalho dele?" (tarefa A2)
 *
 * **Reconhece pelo conteúdo, nunca pelo nome nem pela extensão.** O nome
 * mente: os dois arquivos do Davi chamam-se `Extrato-02-06-2026-...csv` e
 * `fatura-inter-2026-07.csv`, e nenhum dos dois é padrão do banco — foram
 * renomeados por gente. A extensão mente igual: Excel em português salva CSV
 * com ponto e vírgula.
 *
 * O método é tentar cada formato conhecido com o dialeto dele e ver de quem o
 * cabeçalho bate. Isso também resolve o que a A1 deixou em aberto: adivinhar o
 * separador contando ocorrências erraria no extrato do Davi, que tem 2
 * vírgulas por linha (as decimais) contra 3 ponto-e-vírgulas.
 */

/** Quantas linhas procurar antes de desistir. O extrato usa 5; 30 é folga. */
const LIMITE_DE_BUSCA = 30;

export type Reconhecimento =
  | {
      ok: true;
      formato: Formato;
      grade: string[][];
      /** Índice da linha do cabeçalho dentro da grade. */
      linhaCabecalho: number;
      /** Papel → índice da coluna. A A3 pergunta por papel, não por posição. */
      coluna: Partial<Record<Papel, number>>;
      /** Tudo depois do cabeçalho. Filtrar linha inválida é da A3. */
      linhasDeDados: string[][];
    }
  | {
      ok: false;
      motivo: "vazio" | "desconhecido";
      mensagem: string;
      /** O formato que chegou mais perto, quando algum chegou. */
      candidato?: Formato;
      /** Nomes das colunas que faltaram no candidato. */
      faltando?: string[];
    };

type Tentativa = {
  formato: Formato;
  grade: string[][];
  linhaCabecalho: number;
  coluna: Partial<Record<Papel, number>>;
  faltando: Papel[];
};

/**
 * Recebe **bytes**, e não texto, de propósito: decodificar e tirar o BOM é da
 * A1, e deixar isso para quem chama seria plantar o erro de comparar `"﻿Data"`
 * com `"Data"` e nunca entender por quê.
 */
export function reconhecer(bytes: Uint8Array): Reconhecimento {
  const texto = decodificar(bytes);

  if (texto.trim() === "") {
    return {
      ok: false,
      motivo: "vazio",
      mensagem: "O arquivo está vazio.",
    };
  }

  const tentativas = FORMATOS.map((formato) => tentar(texto, formato));
  const acerto = tentativas.find((t) => t.faltando.length === 0);

  if (acerto) {
    return {
      ok: true,
      formato: acerto.formato,
      grade: acerto.grade,
      linhaCabecalho: acerto.linhaCabecalho,
      coluna: acerto.coluna,
      linhasDeDados: acerto.grade.slice(acerto.linhaCabecalho + 1),
    };
  }

  // Nenhum bateu. Em vez de "não reconheci o arquivo", aponta o candidato mais
  // próximo e nomeia o que faltou — a diferença entre uma mensagem que ajuda e
  // uma que só informa que deu errado.
  const maisProximo = [...tentativas].sort(
    (a, b) => a.faltando.length - b.faltando.length,
  )[0];

  const nenhumaColunaBateu =
    maisProximo.faltando.length === maisProximo.formato.obrigatorias.length;

  if (nenhumaColunaBateu) {
    return {
      ok: false,
      motivo: "desconhecido",
      mensagem:
        "Não reconheci este arquivo. Esperava o extrato de conta ou a fatura do cartão do Inter, em CSV.",
    };
  }

  const faltando = maisProximo.faltando.map(
    (papel) => maisProximo.formato.colunas[papel] ?? papel,
  );

  return {
    ok: false,
    motivo: "desconhecido",
    mensagem: `O arquivo parece "${maisProximo.formato.nome}", mas ${
      faltando.length === 1 ? "faltou a coluna" : "faltaram as colunas"
    } ${faltando.join(", ")}.`,
    candidato: maisProximo.formato,
    faltando,
  };
}

/** Lê o texto com o dialeto de um formato e vê o quanto o cabeçalho bate. */
function tentar(texto: string, formato: Formato): Tentativa {
  const grade = paraGrade(texto, formato.dialeto);
  const limite = Math.min(grade.length, LIMITE_DE_BUSCA);

  let melhor: Tentativa = {
    formato,
    grade,
    linhaCabecalho: -1,
    coluna: {},
    faltando: [...formato.obrigatorias],
  };

  // ⚠ Procura a linha do cabeçalho em vez de pular um número fixo. O extrato
  // tem 5 linhas antes dele hoje; "pular 5" quebraria em silêncio no dia em
  // que o Inter acrescentasse uma, tratando o cabeçalho como lançamento.
  for (let i = 0; i < limite; i++) {
    const { coluna, faltando } = mapear(grade[i], formato);

    if (faltando.length === 0) {
      return { formato, grade, linhaCabecalho: i, coluna, faltando };
    }

    if (faltando.length < melhor.faltando.length) {
      melhor = { formato, grade, linhaCabecalho: i, coluna, faltando };
    }
  }

  return melhor;
}

/** Casa os nomes de coluna de uma linha com os papéis do formato. */
function mapear(linha: string[], formato: Formato) {
  const indicePorNome = new Map<string, number>();

  linha.forEach((celula, i) => {
    const nome = normalizarNomeDeColuna(celula);
    // `set` só na primeira ocorrência: coluna repetida não desloca a primeira.
    if (nome !== "" && !indicePorNome.has(nome)) indicePorNome.set(nome, i);
  });

  const coluna: Partial<Record<Papel, number>> = {};

  for (const [papel, nomeNoArquivo] of Object.entries(formato.colunas)) {
    const i = indicePorNome.get(normalizarNomeDeColuna(nomeNoArquivo));
    // Coluna opcional ausente é normal — a fatura não tem saldo, o extrato não
    // tem categoria. Só as obrigatórias decidem se o formato bate.
    if (i !== undefined) coluna[papel as Papel] = i;
  }

  const faltando = formato.obrigatorias.filter((papel) => !(papel in coluna));

  return { coluna, faltando };
}
