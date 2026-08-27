import type {
  FormatoDeData,
  FormatoDeNumero,
} from "@/features/upload/ler-arquivo/dialetos";
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
  "data" | "descricao" | "valor" | "saldo" | "categoria" | "tipo";

/** De onde o lançamento veio. Casa com `transactions.origem` (C1). */
export type Origem = "csv_conta" | "csv_cartao";

export type Formato = {
  /**
   * ⚠ **Deixou de ser uma união fechada na spec 11.** Enquanto os formatos
   * eram só os de código, o tipo podia listá-los; com formato que o usuário
   * mapeia, a lista passa a ter linhas no banco.
   *
   * Perde-se pouco: a Descoberta 1 da spec 11 mediu que `formato.id` **só
   * aparece em teste** — nenhum arquivo de produção pergunta de que banco veio
   * um lançamento. O que atravessa o app é `Origem`, e essa continua fechada.
   */
  id: string;
  /** Como aparece para o usuário numa mensagem de erro. */
  nome: string;
  /**
   * O banco, escrito como a pessoa o chama (spec 09).
   *
   * ⚠ **Existe para a tela de ajuda não poder mentir.** O passo a passo de
   * "como pegar o extrato" precisa dizer de quais bancos ele fala, e a única
   * resposta honesta é a lista que **esta** constante conhece. Escrita à mão lá,
   * ela prometeria um banco no dia em que alguém tirasse o formato daqui.
   *
   * Dois formatos podem ter o mesmo banco — conta e cartão do Inter são dois
   * arquivos da mesma instituição.
   */
  banco: string;
  origem: Origem;
  dialeto: Dialeto;
  /** Papel → nome da coluna no arquivo. */
  colunas: Partial<Record<Papel, string>>;
  /**
   * O que o **sinal negativo** significa neste arquivo.
   *
   * ⚠ Os dois arquivos do Inter usam o sinal com significados opostos, e isso
   * foi medido. No extrato, `-318,19` é dinheiro que saiu. Na fatura, uma
   * compra de `R$ 15,00` é positiva e **é gasto**; o único negativo do arquivo
   * é o `PAGAMENTO ON LINE` de `-R$ 318,19`, que abate a fatura.
   *
   * Assumir "negativo é saída" para os dois faria todo gasto do cartão virar
   * receita, e o mês fecharia com uma renda inventada de milhares de reais.
   */
  sinalNegativo: "entrada" | "saida";

  /**
   * Como este banco escreve data e dinheiro (spec 11, A1 e A2).
   *
   * ⚠ **Os dois formatos do Inter declaram o que o leitor já supunha.** É isso
   * que faz a fase A da spec 11 provar que não mudou nada: o padrão das duas
   * funções é exatamente este valor.
   */
  formatoData: FormatoDeData;
  formatoNumero: FormatoDeNumero;

  /**
   * Descrições que **não são gasto nem receita** — pagamento de fatura, e o
   * que mais for pass-through neste formato.
   *
   * O texto difere entre os arquivos, por isso mora junto do formato: na
   * conta é `Pagamento efetuado: "Pagamento fatura cartao Inter"`, na fatura
   * é `PAGAMENTO ON LINE`. Importado dos dois sem marca, o mesmo dinheiro sai
   * duas vezes e o mês fecha errado para menos.
   *
   * Casam contra a descrição **normalizada** (caixa alta, sem acento).
   */
  padroesDePassagem: { padrao: RegExp; motivo: string }[];

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
    banco: "Banco Inter",
    origem: "csv_conta",
    dialeto: { separador: ";", aspas: false },
    colunas: {
      data: "Data Lançamento",
      descricao: "Descrição",
      valor: "Valor",
      saldo: "Saldo",
    },
    formatoData: "dd/mm/aaaa",
    formatoNumero: "pt-BR",
    sinalNegativo: "saida",
    padroesDePassagem: [
      {
        padrao: /PAGAMENTO FATURA CARTAO/,
        motivo: "pagamento da fatura do cartão",
      },
    ],
    obrigatorias: ["data", "descricao", "valor"],
  },
  {
    id: "inter-fatura",
    nome: "Fatura do cartão do Inter",
    banco: "Banco Inter",
    origem: "csv_cartao",
    dialeto: { separador: ",", aspas: true },
    colunas: {
      data: "Data",
      descricao: "Lançamento",
      valor: "Valor",
      categoria: "Categoria",
      tipo: "Tipo",
    },
    formatoData: "dd/mm/aaaa",
    formatoNumero: "pt-BR",
    sinalNegativo: "entrada",
    padroesDePassagem: [
      { padrao: /^PAGAMENTO ON LINE/, motivo: "pagamento da fatura do cartão" },
    ],
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
  return (
    nome
      .normalize("NFD")
      // Escrito como escapes, e não com os caracteres combinantes literais:
      // acento solto num arquivo-fonte é invisível e some em copiar e colar.
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
  );
}
