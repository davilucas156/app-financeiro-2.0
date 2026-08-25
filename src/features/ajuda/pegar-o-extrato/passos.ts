import { FORMATOS } from "@/features/upload/ler-arquivo/formatos";

/**
 * O passo a passo de como pegar o extrato (spec 09, tarefa C1).
 *
 * ## A parte que o app sabe e a parte que só uma pessoa sabe
 *
 * São duas coisas diferentes, e é por isso que este arquivo existe em vez de o
 * texto morar solto no componente:
 *
 * - **quais bancos o app entende** é fato, e sai de `FORMATOS`;
 * - **onde tocar no app do banco** é conhecimento humano, e é escrito aqui.
 *
 * ⚠ **A lista de bancos é derivada, e é a única forma de a ajuda não mentir.**
 * Hoje `FORMATOS` tem duas entradas, as duas do Inter. Escrever "aceitamos
 * Inter" à mão funcionaria hoje e viraria mentira nos dois sentidos: no dia em
 * que alguém acrescentasse um banco, a ajuda continuaria calada; no dia em que
 * alguém tirasse um, ela continuaria prometendo.
 *
 * ## O que acontece quando entrar o segundo banco
 *
 * O Davi já disse que a proposta é receber CSV de vários bancos. Quando o
 * primeiro formato novo entrar em `FORMATOS`, esta tela passa a listar aquele
 * banco **sozinha** — e o que faltará é só escrever os passos dele em
 * `PASSOS_POR_BANCO`. Um banco sem passos escritos não desaparece da tela: ele
 * aparece dizendo que o app lê o arquivo e que o caminho até ele ainda não foi
 * descrito. Silêncio ali seria pior que uma frase incompleta.
 */

export type PassoDoBanco = {
  titulo: string;
  detalhe: string;
};

export type AjudaDeBanco = {
  banco: string;
  /** Vazio quando o formato existe mas ninguém escreveu o caminho ainda. */
  passos: PassoDoBanco[];
};

/**
 * ⚠ **Sem captura de tela, de propósito.** O app do banco muda de layout
 * sozinho, e uma imagem desatualizada é pior que texto: ela parece atual, e
 * quem não achar o botão vai achar que o errado é ele.
 */
const PASSOS_POR_BANCO: Record<string, PassoDoBanco[]> = {
  "Banco Inter": [
    {
      titulo: "Abra o app do Inter e vá em Extrato",
      detalhe:
        "É a conta corrente, não o cartão — o cartão é o passo 3. Escolha o período do mês inteiro que você quer subir.",
    },
    {
      titulo: "Exporte em CSV",
      detalhe:
        "No mesmo lugar onde dá para compartilhar o extrato, escolha CSV. Em PDF o app não lê: PDF é fase 2, e está registrado como tal.",
    },
    {
      titulo: "Agora a fatura do cartão, também em CSV",
      detalhe:
        "Vá na fatura do mês e exporte do mesmo jeito. São dois arquivos, e os dois importam — o porquê está logo abaixo.",
    },
    {
      titulo: "Volte aqui e envie os dois em Enviar extrato",
      detalhe:
        "Dá para mandar os dois de uma vez. O app reconhece qual é qual pelo cabeçalho do arquivo, então não tem como trocar a ordem e errar.",
    },
    {
      titulo: "Classifique o que sobrou, em Revisar",
      detalhe:
        "O que ele reconheceu já caiu num pote. O resto ele pergunta uma vez — e no mês seguinte não pergunta de novo, porque cada resposta sua vira regra.",
    },
  ],
};

/**
 * Os bancos que o app realmente entende, com os passos que existirem.
 *
 * Ordem alfabética: com um banco não faz diferença, com seis a lista precisa de
 * uma ordem que não seja a de quem foi implementado primeiro.
 */
export function ajudaPorBanco(): AjudaDeBanco[] {
  const bancos = [...new Set(FORMATOS.map((f) => f.banco))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );

  return bancos.map((banco) => ({
    banco,
    passos: PASSOS_POR_BANCO[banco] ?? [],
  }));
}

/**
 * Quantos arquivos diferentes o app lê daquele banco.
 *
 * Serve à frase "do Inter, o app lê dois arquivos: o extrato da conta e a
 * fatura do cartão" — que é a informação que evita a pessoa subir metade do mês
 * e achar que acabou.
 */
export function arquivosDoBanco(banco: string): string[] {
  return FORMATOS.filter((f) => f.banco === banco).map((f) => f.nome);
}
