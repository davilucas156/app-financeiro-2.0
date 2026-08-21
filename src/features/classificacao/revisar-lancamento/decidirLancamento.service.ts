import "server-only";
import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { categories, classificationRules, transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { VALOR_ALTO_CENTAVOS } from "@/features/classificacao/classificar-importacao/classificarImportacao";
import { pessoaDe } from "@/features/classificacao/motor/pessoa";
import { casarRegra, type Criterio } from "@/features/classificacao/motor/regras";
import type { FonteDeSugestao } from "@/features/classificacao/motor/sugestoes";
import { chaveDoCriterio, criterioDaCorrecao } from "./criterioDaCorrecao";

/** A transação do Drizzle, para as funções auxiliares no fim do arquivo. */
type Transacao = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];

/**
 * Gravar a decisão da revisão (tarefa D4).
 *
 * ⚠ **O `userId` vem da sessão; o id do lançamento vem do cliente.** Por isso
 * ele entra no `where` **junto** com o `user_id`, nunca sozinho — mesma regra
 * do desfazer da spec 02. Sem isso, um id adivinhado mexeria no lançamento de
 * outra conta.
 */

export type Decisao =
  | {
      tipo: "categoria";
      lancamentoId: string;
      categoriaId: string;
      /** De onde veio a escolha, para a procedência da C3. */
      fonte: "sugestao" | "manual";
      fonteDaSugestao?: FonteDeSugestao;
      /**
       * "Sempre classificar assim" (D5). Cria a regra e aplica aos outros
       * pendentes do mesmo mês, **na mesma transação**.
       *
       * Ausente = "só desta vez": nem regra, nem rascunho, nem lembrete.
       */
      sempre?: boolean;
    }
  | { tipo: "fora-do-calculo"; lancamentoId: string }
  /** O valor alto que uma regra classificou: você confirmou que está certo. */
  | { tipo: "confirmar"; lancamentoId: string };

export type ResultadoDaDecisao =
  | { ok: true; regraCriada?: boolean; irmaos?: number }
  | { ok: false; erro: string };

/**
 * A mesma mensagem para "não existe" e "não é seu".
 *
 * Respostas diferentes contariam quais ids existem no banco — a mesma razão da
 * D5 da spec 02.
 */
const NAO_ENCONTRADO =
  "Esse lançamento não está mais esperando decisão. Recarregue a tela.";

const MOTIVO_EXCLUIDO = "você marcou como fora do cálculo";

/** O mesmo texto da D1: a tela mostra os dois iguais porque são a mesma coisa. */
const MOTIVO_VALOR_ALTO = "valor alto — confira se a categoria está certa";

/**
 * **10** — a faixa que a A5 reservou para as correções.
 *
 * Correção de quem olhou o lançamento ganha do que foi semeado de longe: o seed
 * usa 20 e 30.
 */
const PRIORIDADE_DE_CORRECAO = 10;

export async function decidirLancamento(
  userId: string,
  decisao: Decisao,
): Promise<ResultadoDaDecisao> {
  const db = getDb();

  if (decisao.tipo === "categoria") {
    /*
     * ⚠ A categoria **também** vem do cliente, e precisa ser conferida.
     *
     * Sem isto, um id de categoria de outra conta entraria em
     * `transactions.categoria_id` — o `user_id` no where protege o lançamento,
     * mas não o destino dele. O vazamento seria de leitura: o painel de outra
     * pessoa passaria a somar um gasto que não é dela.
     */
    const [categoria] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.id, decisao.categoriaId),
          eq(categories.userId, userId),
        ),
      )
      .limit(1);

    if (!categoria) return { ok: false, erro: NAO_ENCONTRADO };
  }

  const agora = new Date();

  const alteracao =
    decisao.tipo === "categoria"
      ? {
          categoriaId: decisao.categoriaId,
          classificadoPor: decisao.fonte,
          // A procedência da sugestão só existe quando a escolha veio de uma
          // (`transactions_fonte_sugestao_ck`).
          fonteDaSugestao:
            decisao.fonte === "sugestao" ? (decisao.fonteDaSugestao ?? null) : null,
          classificadoEm: agora,
          // Escolher resolve a pendência: o aviso de valor alto ou de par que
          // se anula deixa de valer, porque você acabou de olhar.
          status: "importado" as const,
          motivo: null,
        }
      : decisao.tipo === "fora-do-calculo"
        ? {
            status: "excluido" as const,
            motivo: MOTIVO_EXCLUIDO,
            classificadoEm: agora,
          }
        : {
            // Confirmar mantém tudo o que a regra gravou — categoria, regra e
            // chave congelada. Só o pedido de conferência sai.
            status: "importado" as const,
            motivo: null,
            classificadoEm: agora,
          };

  return db.transaction(async (tx) => {
    const [alterado] = await tx
      .update(transactions)
      .set(alteracao)
      .where(
        and(
          eq(transactions.id, decisao.lancamentoId),
          eq(transactions.userId, userId),
        ),
      )
      .returning({
        id: transactions.id,
        descricao: transactions.descricaoOriginal,
        origem: transactions.origem,
        mesReferencia: transactions.mesReferencia,
      });

    if (!alterado) return { ok: false, erro: NAO_ENCONTRADO };

    if (decisao.tipo !== "categoria" || !decisao.sempre) return { ok: true };

    const criterio = criterioDaCorrecao(alterado.descricao, alterado.origem);

    // Sem trecho estável não há o que virar regra. A tela nem oferece a
    // pergunta nesse caso; aqui é a mesma decisão, do outro lado.
    if (!criterio) return { ok: true };

    const regraId = await gravarRegra(tx, {
      userId,
      criterio,
      categoriaId: decisao.categoriaId,
    });

    const irmaos = await aplicarAosIrmaos(tx, {
      userId,
      mesReferencia: alterado.mesReferencia,
      exceto: alterado.id,
      regraId,
      criterio,
      categoriaId: decisao.categoriaId,
    });

    return { ok: true, regraCriada: true, irmaos };
  });
}

/**
 * ⚠ **Responder "sempre" de novo para o mesmo trecho atualiza a regra.**
 *
 * O único `(user_id, chave)` da C1 impede duplicata, e em cima dele havia uma
 * escolha: recusar ou atualizar. Se você acabou de dizer "sempre classifique
 * assim como X" e existia uma regra dizendo Y, você mudou de ideia — a
 * instrução mais nova vence. Recusar te obrigaria a ir apagar a regra antiga
 * antes de dizer de novo o que acabou de dizer.
 */
async function gravarRegra(
  tx: Transacao,
  dados: { userId: string; criterio: Criterio; categoriaId: string },
): Promise<string> {
  const [regra] = await tx
    .insert(classificationRules)
    .values({
      userId: dados.userId,
      tipoRegra: dados.criterio.tipo,
      criterio: dados.criterio,
      chave: chaveDoCriterio(dados.criterio),
      categoriaId: dados.categoriaId,
      prioridade: PRIORIDADE_DE_CORRECAO,
      origem: "correcao",
    })
    .onConflictDoUpdate({
      target: [classificationRules.userId, classificationRules.chave],
      set: {
        categoriaId: dados.categoriaId,
        prioridade: PRIORIDADE_DE_CORRECAO,
        atualizadoEm: new Date(),
      },
    })
    .returning({ id: classificationRules.id });

  return regra.id;
}

/**
 * Aplica a regra nova aos outros pendentes do mesmo mês.
 *
 * ⚠ **O casamento acontece em JS, não num `where`.** A A1 normaliza acento e
 * caixa e compara substring; reproduzir isso em SQL seria uma segunda
 * implementação do motor, e regra criada com uma e casada com a outra deixa de
 * bater sem ninguém entender por quê.
 *
 * Tudo dentro da transação de quem chama: falhar aqui volta atrás com a regra
 * **e** com a categoria do lançamento original.
 */
async function aplicarAosIrmaos(
  tx: Transacao,
  dados: {
    userId: string;
    mesReferencia: string;
    exceto: string;
    regraId: string;
    criterio: Criterio;
    categoriaId: string;
  },
): Promise<number> {
  const candidatos = await tx
    .select({
      id: transactions.id,
      descricao: transactions.descricaoOriginal,
      valorCentavos: transactions.valorCentavos,
      direcao: transactions.direcao,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, dados.userId),
        eq(transactions.mesReferencia, dados.mesReferencia),
        isNull(transactions.categoriaId),
        ne(transactions.status, "excluido"),
      ),
    );

  const regra = {
    id: dados.regraId,
    criterio: dados.criterio,
    categoriaId: dados.categoriaId,
    prioridade: PRIORIDADE_DE_CORRECAO,
  };

  const pegos = candidatos.filter(
    (c) =>
      c.id !== dados.exceto &&
      casarRegra([regra], {
        descricao: c.descricao,
        valorCentavos: c.valorCentavos,
        direcao: c.direcao,
        pessoa: pessoaDe(c.descricao),
      }) !== null,
  );

  if (pegos.length === 0) return 0;

  const agora = new Date();
  const chave = chaveDoCriterio(dados.criterio);

  /*
   * O irmão de valor alto volta para a fila pedindo confirmação — mesma régua
   * da D1, e aqui ela vale mais.
   *
   * Você acabou de ver "isto pega mais 4" e confirmou, mas **esse aviso é
   * justamente o alerta de que a regra pode estar larga demais**. Um irmão de
   * R$ 500 apanhado por engano é o erro mais caro que existe aqui.
   */
  for (const alto of [true, false]) {
    const ids = pegos
      .filter((p) => p.valorCentavos >= VALOR_ALTO_CENTAVOS === alto)
      .map((p) => p.id);

    if (ids.length === 0) continue;

    await tx
      .update(transactions)
      .set({
        categoriaId: dados.categoriaId,
        classificadoPor: "regra",
        regraId: dados.regraId,
        regraChave: chave,
        classificadoEm: agora,
        status: alto ? "revisao_pendente" : "importado",
        motivo: alto ? MOTIVO_VALOR_ALTO : null,
      })
      .where(
        and(eq(transactions.userId, dados.userId), inArray(transactions.id, ids)),
      );
  }

  return pegos.length;
}
