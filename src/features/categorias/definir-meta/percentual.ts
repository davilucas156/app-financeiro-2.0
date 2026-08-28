/**
 * O que o usuário digita → `buckets.percentual_meta` (tarefa A1).
 *
 * ## Três respostas, não duas
 *
 * O desenho óbvio seria devolver `number | null`. Ele perde exatamente a
 * distinção que a spec 13 existe para preservar, porque `null` teria de dizer
 * duas coisas ao mesmo tempo:
 *
 * | O usuário fez | O que significa |
 * |---|---|
 * | apagou o campo | **sem meta** — o pote sai do julgamento. É um sucesso |
 * | digitou `abc` | **recusa** — nada deve ser gravado |
 *
 * As duas chegariam iguais ao serviço, e o app gravaria "sem meta" no dia em
 * que alguém errasse de tecla. Daí `{ ok: false }` ser um estado à parte.
 *
 * ## Uma chamada, dois lados
 *
 * O editor chama para responder rápido; o serviço chama porque é ele quem
 * grava. **Sem `server-only` de propósito** — o barreira de compilação subiria
 * a cadeia de imports até o componente de cliente e quebraria o build, que é a
 * armadilha que a spec 10 já pagou uma vez.
 *
 * ## Recusar, e não corrigir
 *
 * O projeto tem os dois precedentes, e eles discordam com razão:
 * `escolhaValida` (aparência) cai no padrão **em silêncio**, e está certo —
 * é preferência de aparelho. `validarMapeamento` (spec 11) **recusa com
 * frase**, e está certo — ler a coluna errada todo mês é pior que uma
 * mensagem. A meta fica no segundo grupo: corrigir em silêncio o percentual é
 * decidir pelo dono do dinheiro.
 */

export type MetaLida =
  { ok: true; percentual: number | null } | { ok: false; mensagem: string };

/**
 * Três dígitos bastam para `100`, e o corte acontece **antes** do `Number`.
 *
 * Não é preciosismo: é para não entregar 5 000 dígitos a uma conversão
 * numérica só para descobrir depois que o resultado é grande demais.
 */
const MAXIMO_DE_DIGITOS = 3;

export function lerPercentual(texto: string): MetaLida {
  const limpo = texto.trim();

  // Campo vazio é resposta, não ausência de resposta: é assim que se tira a
  // meta de um pote.
  if (limpo.length === 0) return { ok: true, percentual: null };

  /*
   * ⚠ **`\d` em JavaScript é `[0-9]`, e é isso que se quer aqui.**
   *
   * Recusa `10,5`, `10.5`, `-5`, `+10`, `1e2` e os dígitos de largura plena
   * (`０１`), que parecem números e não são os nossos. Quem for "consertar"
   * isto um dia acrescentando `\p{Nd}` vai reprovar no teste — que existe por
   * esse motivo.
   */
  if (!/^\d+$/.test(limpo)) {
    return { ok: false, mensagem: "Use só números inteiros, de 0 a 100." };
  }

  /*
   * Comprimento e faixa dão a **mesma** mensagem, e não é preguiça: uma
   * string só de dígitos, por maior que seja, é um número fora da faixa. Quem
   * digitou `999` e quem digitou mil dígitos erraram a mesma coisa.
   */
  if (limpo.length > MAXIMO_DE_DIGITOS || Number(limpo) > 100) {
    return { ok: false, mensagem: "A meta vai de 0 a 100%." };
  }

  /*
   * ⚠ **`"0"` chega aqui e vira zero — não vira "sem meta".**
   *
   * Meta de zero faz qualquer gasto estourar, e é uma resposta legítima. É a
   * mesma decisão que a spec 04 tomou para a renda: "nunca informou" faz a
   * tela pedir o número; "informou zero" dá meta zero.
   */
  return { ok: true, percentual: Number(limpo) };
}

/** `buckets.percentual_meta` → o que o campo mostra para edição. */
export function paraOCampo(percentual: number | null): string {
  // Campo vazio **é** a representação de sem meta: o editor abre mostrando a
  // verdade, e apagar continua sendo o gesto que a mantém.
  return percentual === null ? "" : String(percentual);
}
