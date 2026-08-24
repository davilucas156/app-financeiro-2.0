import "server-only";
import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import {
  categories,
  classificationRules,
  decisionUndo,
  transactions,
} from "@/db/schema";
import { getDb } from "@/lib/db";
import type { TransacaoDoBanco } from "@/lib/transacaoDoBanco";
import { VALOR_ALTO_CENTAVOS } from "@/features/classificacao/classificar-importacao/classificarImportacao";
import { pessoaDe } from "@/features/classificacao/motor/pessoa";
import { casarRegra, type Criterio } from "@/features/classificacao/motor/regras";
import type { FonteDeSugestao } from "@/features/classificacao/motor/sugestoes";
import { chaveDoCriterio } from "@/features/classificacao/motor/chaveDaRegra";
import { criterioDaCorrecao } from "./criterioDaCorrecao";

/**
 * Gravar a decisão da revisão (tarefa D4).
 *
 * ⚠ **O `userId` vem da sessão; o id do lançamento vem do cliente.** Por isso
 * ele entra no `where` **junto** com o `user_id`, nunca sozinho — mesma regra
 * do desfazer da spec 02. Sem isso, um id adivinhado mexeria no lançamento de
 * outra conta.
 *
 * Desde a D6 toda decisão deixa também a **sombra do estado anterior** em
 * `decision_undo`, na mesma transação — é o que o "Voltar" restaura.
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

/**
 * O invólucro que abre a transação.
 *
 * A D2 da spec 05 partiu esta função em duas: criar categoria e classificar o
 * lançamento que motivou a criação precisam acontecer juntas ou não acontecer,
 * e as duas metades moram em módulos diferentes. Quem já tem uma transação
 * aberta chama `decidirNaTransacao` direto.
 */
export async function decidirLancamento(
  userId: string,
  decisao: Decisao,
): Promise<ResultadoDaDecisao> {
  return getDb().transaction((tx) => decidirNaTransacao(tx, userId, decisao));
}

/**
 * A decisão inteira, dentro da transação de quem chama.
 *
 * ⚠ **A conferência de dono da categoria mora aqui dentro**, e não antes de
 * abrir a transação como até a D1. Ela sempre pertenceu ao mesmo instante da
 * gravação, e de dentro ela também enxerga uma categoria criada agora mesmo no
 * mesmo `tx` — que é exatamente o que a D2 precisa.
 */
export async function decidirNaTransacao(
  tx: TransacaoDoBanco,
  userId: string,
  decisao: Decisao,
): Promise<ResultadoDaDecisao> {
  if (decisao.tipo === "categoria") {
    /*
     * ⚠ A categoria **também** vem do cliente, e precisa ser conferida.
     *
     * Sem isto, um id de categoria de outra conta entraria em
     * `transactions.categoria_id` — o `user_id` no where protege o lançamento,
     * mas não o destino dele. O vazamento seria de leitura: o painel de outra
     * pessoa passaria a somar um gasto que não é dela.
     */
    const [categoria] = await tx
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
          /*
           * ⚠ **A procedência da regra sai.** Encontrado pela verificação da
           * D6, no caminho "Ou troque a categoria" da tela: um valor alto que
           * uma regra classificou tem `regra_chave` preenchida, e trocar a
           * categoria deixava `classificado_por = 'manual'` com a chave da
           * regra pendurada — o que bate no `transactions_regra_chave_ck` e
           * derrubava a gravação com erro de banco.
           *
           * Limpar é o certo mesmo sem o check: a C3 responde "como esta
           * classificação surgiu?", e a resposta passou a ser você. Manter a
           * regra ali diria que ela ainda explica algo que ela não explica
           * mais.
           */
          regraId: null,
          regraChave: null,
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

  /*
   * ⚠ **O estado anterior é lido antes, e não depois.**
   *
   * `UPDATE ... RETURNING` devolve o valor **novo**. Sem este `select`, o
   * "antes" deixa de existir no instante da gravação — e o "Voltar" da D6
   * não teria como desfazer, só como chutar.
   *
   * `for update` porque dois toques quase simultâneos no celular acontecem:
   * sem o lock, os dois leriam o mesmo "antes" e a sombra do desfazer
   * apontaria para um estado intermediário que ninguém escolheu.
   */
  const [antes] = await tx
    .select({
      id: transactions.id,
      descricao: transactions.descricaoOriginal,
      origem: transactions.origem,
      mesReferencia: transactions.mesReferencia,
      categoriaId: transactions.categoriaId,
      classificadoPor: transactions.classificadoPor,
      regraId: transactions.regraId,
      regraChave: transactions.regraChave,
      fonteDaSugestao: transactions.fonteDaSugestao,
      classificadoEm: transactions.classificadoEm,
      status: transactions.status,
      motivo: transactions.motivo,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.id, decisao.lancamentoId),
        eq(transactions.userId, userId),
      ),
    )
    .for("update")
    .limit(1);

  if (!antes) return { ok: false, erro: NAO_ENCONTRADO };

  await tx
    .update(transactions)
    .set(alteracao)
    .where(
      and(
        eq(transactions.id, decisao.lancamentoId),
        eq(transactions.userId, userId),
      ),
    );

  let regraCriada = false;
  let irmaos = 0;

  if (decisao.tipo === "categoria" && decisao.sempre) {
    const criterio = criterioDaCorrecao(antes.descricao, antes.origem);

    // Sem trecho estável não há o que virar regra. A tela nem oferece a
    // pergunta nesse caso; aqui é a mesma decisão, do outro lado.
    if (criterio) {
      const regraId = await gravarRegra(tx, {
        userId,
        criterio,
        categoriaId: decisao.categoriaId,
      });

      irmaos = await aplicarAosIrmaos(tx, {
        userId,
        mesReferencia: antes.mesReferencia,
        exceto: antes.id,
        regraId,
        criterio,
        categoriaId: decisao.categoriaId,
      });

      regraCriada = true;
    }
  }

  await guardarODesfazer(tx, userId, antes, { regraCriada, irmaos });

  return regraCriada ? { ok: true, regraCriada: true, irmaos } : { ok: true };
}

/**
 * A sombra que o "Voltar" da D6 vai restaurar.
 *
 * Uma linha por usuário — a chave primária é o `user_id`, e isso **é** a
 * promessa do botão: "reabre o anterior", singular. Responder de novo
 * sobrescreve; não há pilha, não há refazer, não há limpeza agendada.
 *
 * Dentro da transação de quem chama, de propósito: a sombra e a decisão nascem
 * juntas ou não nascem. Uma decisão gravada sem sombra deixaria o botão
 * apagado sem explicação; uma sombra sem decisão desfaria algo que não
 * aconteceu.
 */
async function guardarODesfazer(
  tx: TransacaoDoBanco,
  userId: string,
  antes: {
    id: string;
    categoriaId: string | null;
    classificadoPor: "regra" | "sugestao" | "manual" | null;
    regraId: string | null;
    regraChave: string | null;
    fonteDaSugestao: FonteDeSugestao | null;
    classificadoEm: Date | null;
    status: "importado" | "revisao_pendente" | "excluido";
    motivo: string | null;
  },
  extra: { regraCriada: boolean; irmaos: number },
): Promise<void> {
  const sombra = {
    transactionId: antes.id,
    categoriaId: antes.categoriaId,
    classificadoPor: antes.classificadoPor,
    regraId: antes.regraId,
    regraChave: antes.regraChave,
    fonteDaSugestao: antes.fonteDaSugestao,
    classificadoEm: antes.classificadoEm,
    status: antes.status,
    motivo: antes.motivo,
    regraCriada: extra.regraCriada,
    irmaos: extra.irmaos,
    criadoEm: new Date(),
  };

  await tx
    .insert(decisionUndo)
    .values({ userId, ...sombra })
    .onConflictDoUpdate({ target: decisionUndo.userId, set: sombra });
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
  tx: TransacaoDoBanco,
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
        /*
         * Corrigir uma regra **semeada** a torna sua (D7).
         *
         * A coluna responde "de onde saiu essa regra?", e depois que você
         * mexeu nela a resposta deixou de ser "veio pronta". Sem isto a D9
         * mostraria como seed algo que você mesmo escreveu.
         */
        origem: "correcao" as const,
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
  tx: TransacaoDoBanco,
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
