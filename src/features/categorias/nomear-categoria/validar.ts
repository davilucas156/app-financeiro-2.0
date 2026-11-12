/**
 * O que é um nome e um emoji válidos (tarefa A2).
 *
 * ## Uma chamada, dois lados
 *
 * O formulário mostra a mensagem; o serviço da B1 recusa antes de tocar no
 * banco. A mesma função nos dois, para não existir o dia em que a tela aceita
 * o que o servidor recusa — ou pior, o contrário.
 *
 * ## Devolver limpo importa tanto quanto recusar
 *
 * `"Gasolina  "` gravado com o espaço **não colide** com `"Gasolina"` no
 * `categories_bucket_id_nome_unq`, e o Davi ficaria com duas categorias que a
 * tela mostra idênticas. O único não protege contra o que ele não consegue
 * ver como igual.
 */

export type CampoInvalido = "nome" | "emoji";

export type CategoriaValidada =
  | { ok: true; nome: string; emoji: string }
  | { ok: false; campo: CampoInvalido; mensagem: string };

/**
 * 40 caracteres.
 *
 * O maior do seed tem 21 ("Reserva de emergência"), e a linha do painel mostra
 * nome e valor lado a lado em 360px. Não é limite de banco — `text` não tem —
 * é limite de tela, e por isso mora aqui e não no `schema.ts`.
 */
const NOME_MAXIMO = 40;

export function validarCategoria(entrada: {
  nome: string;
  emoji: string;
}): CategoriaValidada {
  // A Server Action recebe dado não confiável: campo que não é texto vira vazio
  // e cai na mesma recusa de campo vazio, em vez de estourar TypeError. Ficar
  // vazio, e não devolver ok:false logo no topo, mantém a ordem "nome antes de
  // emoji" mesmo quando os dois estão errados.
  const nomeBruto = typeof entrada?.nome === "string" ? entrada.nome : "";
  const emojiBruto = typeof entrada?.emoji === "string" ? entrada.emoji : "";

  // Espaço interno também colapsa: "Gasolina  comum" e "Gasolina comum" são o
  // mesmo nome para quem lê, e o único precisa enxergar isso.
  const nome = nomeBruto.trim().replace(/\s+/g, " ");
  const emoji = emojiBruto.trim();

  if (nome.length === 0) {
    return { ok: false, campo: "nome", mensagem: "Dê um nome à categoria." };
  }

  if (nome.length > NOME_MAXIMO) {
    return {
      ok: false,
      campo: "nome",
      mensagem: `No máximo ${NOME_MAXIMO} caracteres — nomes longos não cabem na linha do painel.`,
    };
  }

  /*
   * ⚠ **Esta regra não garante o slug por si só.** Ela aceita qualquer letra ou
   * número de qualquer alfabeto (`\p{L}\p{N}`), mas `slugificar` só mantém
   * `a-z0-9` depois de tirar os acentos. "日本" passa aqui e sai com slug vazio.
   *
   * Quem cobre esse caso é `slugUnico` (slug.ts): troca o vazio por
   * "categoria" e acrescenta o sufixo numérico ("categoria-2"), então dois
   * nomes assim não colidem. Esta checagem só recusa o nome sem nenhuma letra
   * nem número — "###" — que daria o mesmo fallback sem sentido.
   */
  if (!/[\p{L}\p{N}]/u.test(nome)) {
    return {
      ok: false,
      campo: "nome",
      mensagem: "O nome precisa ter pelo menos uma letra ou número.",
    };
  }

  const problemaNoEmoji = validarEmoji(emoji);
  if (problemaNoEmoji) {
    return { ok: false, campo: "emoji", mensagem: problemaNoEmoji };
  }

  return { ok: true, nome, emoji };
}

/**
 * Um símbolo só — contado por grafema, não por unidade de código.
 *
 * ⚠ `.length` conta errado: 👨‍👩‍👧 tem **8** unidades de código e é um
 * símbolo só. Um teste de comprimento recusaria emojis legítimos e aceitaria
 * `"ab"` disfarçado — erraria nos dois sentidos.
 *
 * `Intl.Segmenter` existe no Node 20 e em todo navegador que roda este app, e
 * é a única forma de contar o que o olho conta.
 */
function validarEmoji(emoji: string): string | null {
  if (emoji.length === 0) return "Escolha um emoji para a categoria.";

  const grafemas = [
    ...new Intl.Segmenter("pt-BR", { granularity: "grapheme" }).segment(emoji),
  ];

  if (grafemas.length !== 1) return "Um emoji só, por favor.";

  // Letra ou número passariam no teste de grafema e virariam um rótulo
  // estranho: "A Gasolina" no lugar de "⛽ Gasolina".
  if (/^[\p{L}\p{N}]$/u.test(emoji)) {
    return "Isso é uma letra, não um emoji.";
  }

  return null;
}
