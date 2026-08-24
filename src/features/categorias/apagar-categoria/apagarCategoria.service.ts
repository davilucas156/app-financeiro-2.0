import "server-only";
import { and, eq, ne, type SQL } from "drizzle-orm";
import { categories, classificationRules, transactions } from "@/db/schema";
import { getDb } from "@/lib/db";

/**
 * Apagar uma categoria, com destino para o que estava dentro (tarefa B4).
 *
 * ## A operação que a descoberta 1 mediu como impossível
 *
 * `delete from categories` com um lançamento dentro falha com
 * `transactions_classificacao_ck`: o `set null` da chave estrangeira zera a
 * categoria e deixa `classificado_por` preenchido. O check está certo — um
 * lançamento classificado tem de dizer **como**.
 *
 * O que faltava era desenhar o que acontece com o que estava dentro **antes**
 * de apagar. É isto.
 *
 * ## Sem desfazer, e por isso a confirmação carrega os números
 *
 * O "Voltar" é uma sombra por conta, desenhada para uma decisão de revisão.
 * Guardar 12 lançamentos e 2 regras nela seria outra tabela e outra promessa. A
 * defesa é o raio-X da B3 na tela antes do segundo toque — a mesma escolha que
 * a D9 fez para apagar regra.
 *
 * ⚠ `userId` vem de `garantirUsuario()`; os dois ids vêm do cliente e entram no
 * `where` **junto** com ele.
 */

export type DestinoEscolhido =
  | { tipo: "mover"; categoriaId: string }
  | { tipo: "revisao" };

export type ResultadoDeApagar =
  | { ok: true; lancamentos: number; regras: number }
  | { ok: false; erro: string };

const NAO_ENCONTRADA = "Essa categoria não existe mais. Recarregue a tela.";

const DESTINO_NAO_ENCONTRADO =
  "A categoria de destino não existe mais. Recarregue a tela.";

/**
 * ⚠ Não é o "toque repetido" tolerado pelo `moverCategoria`.
 *
 * Lá o estado pedido já era o estado atual. Aqui a operação é impossível: o
 * destino está prestes a deixar de existir. Aceitar em silêncio apagaria os 12
 * lançamentos junto com a categoria.
 */
const DESTINO_EH_ELA_MESMA =
  "Escolha outra categoria de destino — essa é justamente a que vai ser apagada.";

export async function apagarCategoria(
  userId: string,
  categoriaId: string,
  destino: DestinoEscolhido,
): Promise<ResultadoDeApagar> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [alvo] = await tx
      .select({ id: categories.id, nome: categories.nome })
      .from(categories)
      .where(
        and(eq(categories.id, categoriaId), eq(categories.userId, userId)),
      )
      .for("update")
      .limit(1);

    if (!alvo) return { ok: false, erro: NAO_ENCONTRADA };

    if (destino.tipo === "mover") {
      if (destino.categoriaId === categoriaId) {
        return { ok: false, erro: DESTINO_EH_ELA_MESMA };
      }

      const [para] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(
          and(
            eq(categories.id, destino.categoriaId),
            eq(categories.userId, userId),
          ),
        )
        .limit(1);

      if (!para) return { ok: false, erro: DESTINO_NAO_ENCONTRADO };
    }

    // O mesmo recorte nos dois caminhos: `and` nunca devolve `undefined` com
    // dois argumentos definidos, e o `!` diz isso ao TypeScript uma vez só.
    const daCategoria = and(
      eq(transactions.userId, userId),
      eq(transactions.categoriaId, categoriaId),
    )!;

    const lancamentos =
      destino.tipo === "mover"
        ? await mover(tx, daCategoria, destino.categoriaId)
        : await devolver(tx, daCategoria, alvo.nome);

    const regras = await mexerNasRegras(tx, userId, categoriaId, destino);

    await tx
      .delete(categories)
      .where(
        and(eq(categories.id, categoriaId), eq(categories.userId, userId)),
      );

    return { ok: true, lancamentos, regras };
  });
}

type Transacao = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];

/**
 * Mover é escolha sua, então a procedência passa a ser sua.
 *
 * Mesma decisão da D6 e da D4 da spec 04: quando você redireciona, a resposta
 * para "como esta classificação surgiu?" passa a ser você, e manter a regra
 * pendurada diria que ela ainda explica algo que ela não explica mais.
 *
 * ⚠ **`status` e `motivo` não se mexem.** Um valor alto em `revisao_pendente`
 * continua pedindo conferência; um excluído continua excluído. Nenhum dos dois
 * tem a ver com qual categoria o lançamento tem.
 *
 * ⚠ **As cinco colunas na mesma linha.** `transactions_regra_chave_ck` exige
 * `classificado_por = 'regra'` para a chave existir, e
 * `transactions_fonte_sugestao_ck` faz o mesmo com a sugestão: limpar em dois
 * updates derrubaria a transação **entre um e outro**.
 */
async function mover(
  tx: Transacao,
  daCategoria: SQL,
  paraId: string,
): Promise<number> {
  const movidos = await tx
    .update(transactions)
    .set({
      categoriaId: paraId,
      classificadoPor: "manual",
      regraId: null,
      regraChave: null,
      fonteDaSugestao: null,
      classificadoEm: new Date(),
    })
    .where(daCategoria)
    .returning({ id: transactions.id });

  return movidos.length;
}

/**
 * Devolver zera a classificação e manda de volta para a fila.
 *
 * ⚠ **Dois updates separados por `status`, e não por coluna.** Cada um zera as
 * cinco colunas de uma vez, então nenhum passa por estado inválido — a divisão
 * é sobre para onde o lançamento vai, não sobre o que se limpa.
 *
 * O excluído **não ressuscita**: sair do cálculo foi decisão sua e não depende
 * de categoria nenhuma. Ele perde a classificação, mantém `status` e `motivo`.
 */
async function devolver(
  tx: Transacao,
  daCategoria: SQL,
  nomeDaCategoria: string,
): Promise<number> {
  const limpo = {
    categoriaId: null,
    classificadoPor: null,
    regraId: null,
    regraChave: null,
    fonteDaSugestao: null,
    classificadoEm: null,
  } as const;

  const voltaram = await tx
    .update(transactions)
    .set({
      ...limpo,
      status: "revisao_pendente" as const,
      // Sem isto o lançamento reapareceria na fila sem explicação nenhuma.
      motivo: `a categoria "${nomeDaCategoria}" foi apagada`,
    })
    .where(and(daCategoria, ne(transactions.status, "excluido")))
    .returning({ id: transactions.id });

  const foraDoCalculo = await tx
    .update(transactions)
    .set(limpo)
    .where(and(daCategoria, eq(transactions.status, "excluido")))
    .returning({ id: transactions.id });

  return voltaram.length + foraDoCalculo.length;
}

/**
 * As regras seguem o destino.
 *
 * **Mover** as aponta para a categoria nova. Sem isso, apagar desligaria a
 * classificação em silêncio: no mês seguinte os mesmos lançamentos voltariam
 * pendentes e nada na tela explicaria por quê. A `chave` não muda, então o
 * `(user_id, chave)` único não tem como estourar — o que elas procuram continua
 * o mesmo, só o destino mudou.
 *
 * **Devolver** as apaga. O `cascade` faria isso sozinho ao remover a categoria;
 * apagar aqui é o que permite contá-las e o que deixa a intenção escrita, em
 * vez de depender de um efeito colateral três tabelas adiante.
 */
async function mexerNasRegras(
  tx: Transacao,
  userId: string,
  categoriaId: string,
  destino: DestinoEscolhido,
): Promise<number> {
  const delas = and(
    eq(classificationRules.userId, userId),
    eq(classificationRules.categoriaId, categoriaId),
  );

  if (destino.tipo === "mover") {
    const movidas = await tx
      .update(classificationRules)
      .set({ categoriaId: destino.categoriaId, atualizadoEm: new Date() })
      .where(delas)
      .returning({ id: classificationRules.id });

    return movidas.length;
  }

  const apagadas = await tx
    .delete(classificationRules)
    .where(delas)
    .returning({ id: classificationRules.id });

  return apagadas.length;
}
