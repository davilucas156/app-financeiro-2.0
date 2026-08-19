import type { Dialeto } from "@/features/upload/ler-arquivo/grade";

/**
 * Os formatos de extrato que o app sabe ler (tarefa A2).
 *
 * Cada entrada aqui foi **medida em arquivo real**, nunca suposta — o registro
 * está em `references/formatos-de-extrato.md`. Ao acrescentar um banco novo:
 * meça primeiro, acrescente a amostra em `amostras.ts`, e só então escreva a
 * entrada aqui.
 */

/**
 * O que uma coluna **significa**, independente de como o banco a chamou.
 *
 * Existe porque o mesmo papel tem nomes diferentes nos dois arquivos do Inter:
 * `data` é "Data Lançamento" no extrato e "Data" na fatura; `descricao` é
 * "Descrição" num e "Lançamento" no outro. Sem essa camada, a A3 precisaria
 * conhecer os dois vocabulários.
 */
export type Papel =
  | "data"
  | "descricao"
  | "valor"
  | "saldo"
  | "categoria"
  | "tipo";

/** De onde o lançamento veio. Casa com `transactions.origem` (C1). */
export type Origem = "csv_conta" | "csv_cartao";

export type Formato = {
  id: "inter-extrato" | "inter-fatura";
  /** Como aparece para o usuário numa mensagem de erro. */
  nome: string;
  origem: Origem;
  dialeto: Dialeto;
  /** Papel → nome da coluna no arquivo. */
  colunas: Partial<Record<Papel, string>>;
  /** Sem alguma destas, não é este formato. */
  obrigatorias: Papel[];
};

/**
 * A ordem importa só no empate, que hoje não existe: lido com o dialeto
 * errado, cada arquivo vira uma coluna só e não se parece com o outro.
 */
export const FORMATOS: Formato[] = [
  {
    id: "inter-extrato",
    nome: "Extrato de conta do Inter",
    origem: "csv_conta",
    dialeto: { separador: ";", aspas: false },
    colunas: {
      data: "Data Lançamento",
      descricao: "Descrição",
      valor: "Valor",
      saldo: "Saldo",
    },
    obrigatorias: ["data", "descricao", "valor"],
  },
  {
    id: "inter-fatura",
    nome: "Fatura do cartão do Inter",
    origem: "csv_cartao",
    dialeto: { separador: ",", aspas: true },
    colunas: {
      data: "Data",
      descricao: "Lançamento",
      valor: "Valor",
      categoria: "Categoria",
      tipo: "Tipo",
    },
    obrigatorias: ["data", "descricao", "valor"],
  },
];

/**
 * Deixa dois nomes de coluna comparáveis: apara, minúsculas, tira acento,
 * junta espaços repetidos.
 *
 * Tirar acento parece exagero até lembrar que o mesmo banco entrega um arquivo
 * em UTF-8 com BOM e outro sem. Quem trata acento com essa inconsistência uma
 * hora manda `Descricao`.
 */
export function normalizarNomeDeColuna(nome: string): string {
  return nome
    .normalize("NFD")
    // Escrito como escapes, e não com os caracteres combinantes literais:
    // acento solto num arquivo-fonte é invisível e some em copiar e colar.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
