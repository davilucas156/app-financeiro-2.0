import "server-only";
import { createHash } from "node:crypto";
import { and, eq, gte, inArray, isNull, lte, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  classificationRules,
  imports,
  transactions,
  type NovaTransacao,
} from "@/db/schema";
import { classificarImportacao } from "@/features/classificacao/classificar-importacao/classificarImportacao";
import { formatosDoUsuario } from "@/features/upload/formatos-do-usuario/formatosDoUsuario.service";
import type { Origem } from "@/features/upload/ler-arquivo/formatos";
import { paraLancamentos } from "@/features/upload/ler-arquivo/lancamentos";
import {
  prepararLancamentos,
  JANELA_DE_PAR_EM_DIAS,
  type LancamentoSalvo,
} from "@/features/upload/ler-arquivo/preparar";
import {
  reconhecer,
  type Reconhecimento,
} from "@/features/upload/ler-arquivo/reconhecer";
import { TAMANHO_MAXIMO } from "@/features/upload/limites";

/**
 * A gravação da importação (tarefa D2).
 *
 * Separada da server action pelo mesmo motivo da D4 da spec 01: a action
 * precisa do ciclo de requisição do Next para existir, e isto aqui só precisa
 * de bytes e de um `userId`.
 *
 * ⚠ O `userId` vem de quem chama, que o pega de `garantirUsuario()`. Nenhum
 * valor do cliente chega aqui além dos **bytes do arquivo** — um cliente que
 * pudesse mandar a lista de lançamentos poderia inventar qualquer valor
 * (`references/architecture.md`, Thin Client / Fat Server).
 */

export type CampoDeEnvio = "conta" | "cartao";

export type ArquivoRecebido = {
  campo: CampoDeEnvio;
  nome: string;
  bytes: Uint8Array;
};

export type ResumoDeArquivoImportado = {
  campo: CampoDeEnvio;
  nome: string;
  origem: Origem;
  entraram: number;
  ignoradas: { linha: number; motivo: string; conteudo: string }[];
  /** `true` quando o hash já existia: nada foi gravado deste arquivo. */
  jaImportado: boolean;
};

export type ResultadoImportacao =
  | {
      ok: true;
      arquivos: ResumoDeArquivoImportado[];
      /** Pagamento de fatura e afins: passagem reconhecida, sem par. */
      excluidos: number;
      /** Repasses que se anularam entre si e saíram da conta do mês. */
      anulados: number;
      /** O motor bateu regra (D1). */
      classificados: number;
      /** Nenhuma regra bateu: vão para `/revisao`. */
      pendentes: number;
      /** Classificados que ainda assim pedem confirmação — valor alto. */
      conferir: number;
    }
  | { ok: false; erro: string };

const ORIGEM_DO_CAMPO: Record<CampoDeEnvio, Origem> = {
  conta: "csv_conta",
  cartao: "csv_cartao",
};

const ROTULO_DO_CAMPO: Record<CampoDeEnvio, string> = {
  conta: "extrato da conta",
  cartao: "fatura do cartão",
};

export async function importarExtrato(
  userId: string,
  mesEscolhido: string,
  arquivos: ArquivoRecebido[],
): Promise<ResultadoImportacao> {
  if (arquivos.length === 0) {
    return { ok: false, erro: "Escolha ao menos um arquivo." };
  }

  if (!/^\d{4}-\d{2}$/.test(mesEscolhido)) {
    return { ok: false, erro: "Mês de referência inválido." };
  }

  // ── Leitura e validação, tudo antes de tocar no banco ────────────────────
  type Lido = {
    arquivo: ArquivoRecebido;
    hash: string;
    origem: Origem;
    reconhecido: Extract<Reconhecimento, { ok: true }>;
  };

  /*
   * ⚠ **Os formatos que este usuário ensinou entram na leitura** (spec 11).
   *
   * Buscados uma vez, fora do laço: são dois arquivos por envio, e a lista é
   * a mesma para os dois. E buscados **aqui**, no serviço, porque a
   * `reconhecer` continua pura — ela recebe, não vai ao banco.
   */
  const doUsuario = await formatosDoUsuario(userId);

  const lidos: Lido[] = [];

  for (const arquivo of arquivos) {
    if (arquivo.bytes.byteLength > TAMANHO_MAXIMO) {
      // O cliente já recusa (D3), mas validação de cliente é conveniência,
      // não defesa.
      return {
        ok: false,
        erro: `"${arquivo.nome}" é grande demais. O limite é 2 MB.`,
      };
    }

    const reconhecido = reconhecer(arquivo.bytes, doUsuario);
    if (!reconhecido.ok) {
      // Recusa os **dois** arquivos: a transação é conjunta, e gravar metade
      // faria o usuário reenviar tudo com o `on conflict` escondendo o resto.
      return { ok: false, erro: `${arquivo.nome}: ${reconhecido.mensagem}` };
    }

    const origem = reconhecido.formato.origem;

    if (origem !== ORIGEM_DO_CAMPO[arquivo.campo]) {
      // Importar errado e deixar o usuário descobrir depois é pior do que
      // recusar agora.
      const oQueE =
        origem === "csv_conta" ? "o extrato da conta" : "a fatura do cartão";
      return {
        ok: false,
        erro: `O arquivo enviado no campo "${ROTULO_DO_CAMPO[arquivo.campo]}" é ${oQueE}. Confira os campos.`,
      };
    }

    lidos.push({
      arquivo,
      hash: createHash("sha256").update(arquivo.bytes).digest("hex"),
      origem,
      reconhecido,
    });
  }

  if (new Set(lidos.map((l) => l.origem)).size !== lidos.length) {
    return {
      ok: false,
      erro: "Os dois arquivos são do mesmo tipo. Envie um extrato e uma fatura.",
    };
  }

  // ── Quais já foram enviados antes ────────────────────────────────────────
  const db = getDb();

  const jaExistem = await db
    .select({ hash: imports.hash })
    .from(imports)
    .where(
      and(
        eq(imports.userId, userId),
        inArray(
          imports.hash,
          lidos.map((l) => l.hash),
        ),
      ),
    );

  const hashesConhecidos = new Set(jaExistem.map((i) => i.hash));
  const novos = lidos.filter((l) => !hashesConhecidos.has(l.hash));

  if (novos.length === 0) {
    return {
      ok: true,
      arquivos: lidos.map((l) => ({
        campo: l.arquivo.campo,
        nome: l.arquivo.nome,
        origem: l.origem,
        entraram: 0,
        ignoradas: [],
        jaImportado: true,
      })),
      excluidos: 0,
      anulados: 0,
      classificados: 0,
      pendentes: 0,
      conferir: 0,
    };
  }

  // ── Fase A: ler e preparar ───────────────────────────────────────────────
  const leituras = novos.map((l) => ({
    ...l,
    leitura: paraLancamentos(l.reconhecido),
  }));

  const doArquivo = leituras.map((l) => ({
    origem: l.origem,
    lancamentos: l.leitura.lancamentos,
  }));

  // Os dois arquivos numa chamada só: o pagamento de fatura e o par que se
  // anula só aparecem olhando os dois juntos (medido — os R$ 318,19 estão num
  // e noutro). E, desde a janela de 7 dias, também o que já está gravado: o
  // Pix do dia 28 devolvido no dia 2 são dois arquivos diferentes.
  const preparados = prepararLancamentos(
    doArquivo,
    await vizinhosJaGravados(db, userId, doArquivo),
  );

  /*
   * Os dois tipos de `excluido`, separados pelo `parDe`.
   *
   * Contá-los juntos diria "12 lançamentos ficaram de fora" sem distinguir o
   * pagamento de fatura — que é rotina e sempre acontece — do repasse anulado,
   * que tira dinheiro do mês e merece uma olhada. São frases diferentes na
   * tela porque são fatos diferentes.
   */
  const excluidos = preparados.filter(
    (p) => p.marcacao === "excluido" && p.parDe === null,
  ).length;
  const anulados = preparados.filter((p) => p.parDe !== null).length;

  // ── Gravação: tudo ou nada ───────────────────────────────────────────────
  //
  // O motor (D1) roda **aqui dentro**, entre a leitura das regras e o insert.
  //
  // Se ele lançar, a transação inteira volta atrás. A alternativa — importar
  // mesmo assim, tudo pendente — parece gentil e é pior: motor quebrado fica
  // idêntico a motor sem regras, e o usuário conclui que não tem regra
  // cadastrada quando na verdade tem um bug.
  const gravacao = await db.transaction(async (tx) => {
    const contagem = new Map<Origem, number>();

    const regras = await tx
      .select({
        id: classificationRules.id,
        criterio: classificationRules.criterio,
        categoriaId: classificationRules.categoriaId,
        prioridade: classificationRules.prioridade,
        chave: classificationRules.chave,
      })
      .from(classificationRules)
      .where(eq(classificationRules.userId, userId));

    const decisao = classificarImportacao(preparados, regras);
    const agora = new Date();

    for (const l of leituras) {
      const [registro] = await tx
        .insert(imports)
        .values({
          userId,
          mesReferencia: mesEscolhido,
          origem: l.origem,
          nomeArquivo: l.arquivo.nome,
          hash: l.hash,
          ignoradas: l.leitura.ignoradas,
        })
        .returning({ id: imports.id });

      const linhas: NovaTransacao[] = preparados
        .filter((p) => p.origem === l.origem)
        .map((p) => {
          const d = decisao.porImpressao.get(p.impressao)!;

          return {
            userId,
            importId: registro.id,
            data: p.data,
            descricaoOriginal: p.descricao,
            valorCentavos: p.valorCentavos,
            direcao: p.direcao,
            status: d.status,
            motivo: d.motivo,
            parDe: p.parDe,
            mesReferencia: mesDoLancamento(l.origem, p.data, mesEscolhido),
            origem: p.origem,
            impressao: p.impressao,
            parcela: p.parcela,
            categoriaDoBanco: p.categoriaDoBanco,

            // Procedência (C3). A chave da regra vai **congelada**: é o que
            // faz "por que isso caiu em Lazer?" continuar tendo resposta
            // depois que a regra for apagada.
            categoriaId: d.categoriaId,
            classificadoPor: d.classificadoPor,
            regraId: d.regraId,
            regraChave: d.regraChave,
            classificadoEm: d.categoriaId ? agora : null,
          };
        });

      // `entraram` conta o que o `returning` devolveu, e não o que foi
      // tentado: com `do nothing`, a linha que colide não volta. O número na
      // tela é o que de fato entrou, não uma promessa.
      const inseridas =
        linhas.length === 0
          ? []
          : await tx
              .insert(transactions)
              .values(linhas)
              .onConflictDoNothing()
              .returning({ id: transactions.id });

      contagem.set(l.origem, inseridas.length);

      await tx
        .update(imports)
        .set({ lancamentosImportados: inseridas.length })
        .where(eq(imports.id, registro.id));
    }

    return { contagem, decisao };
  });

  const inseridosPorOrigem = gravacao.contagem;

  return {
    ok: true,
    classificados: gravacao.decisao.classificados,
    pendentes: gravacao.decisao.pendentes,
    conferir: gravacao.decisao.conferir,
    arquivos: lidos.map((l) => {
      const leitura = leituras.find((x) => x.hash === l.hash);
      return {
        campo: l.arquivo.campo,
        nome: l.arquivo.nome,
        origem: l.origem,
        entraram: inseridosPorOrigem.get(l.origem) ?? 0,
        ignoradas: leitura?.leitura.ignoradas ?? [],
        jaImportado: !leitura,
      };
    }),
    excluidos,
    anulados,
  };
}

/**
 * Os lançamentos já gravados que podem fechar par com os que estão chegando.
 *
 * ## Por que uma consulta a mais
 *
 * O par que se anula sempre existiu, mas só enxergava o próprio envio. O
 * formato mais comum de repasse — sai no fim de um mês, volta no começo do
 * seguinte — cai em dois arquivos diferentes, e por isso nunca era achado.
 * Alargar a janela não resolvia nada sozinho: os dois lados precisavam estar
 * na mesma lista.
 *
 * ## O recorte
 *
 * **A janela, e não o mês.** O intervalo sai das datas que chegaram, esticado
 * dos dois lados pela mesma constante que o pareamento usa — se ela mudar, a
 * consulta acompanha sozinha. Ler o mês inteiro traria linhas que o
 * pareamento descartaria de qualquer jeito.
 *
 * **Sem os excluídos**, que é o mesmo `elegivel` do outro lado: pagamento de
 * fatura já é passagem reconhecida, e casar ele com outra coisa seria pedir
 * uma decisão sobre algo já decidido.
 *
 * **Sem quem já tem par**, senão um lançamento antigo fecharia um segundo par
 * com o arquivo novo e a mesma quantia apareceria em dois lugares.
 */
async function vizinhosJaGravados(
  db: ReturnType<typeof getDb>,
  userId: string,
  entradas: { lancamentos: { data: string }[] }[],
): Promise<LancamentoSalvo[]> {
  const datas = entradas.flatMap((e) => e.lancamentos.map((l) => l.data));
  if (datas.length === 0) return [];

  const de = comDeslocamento(
    datas.reduce((a, b) => (a < b ? a : b)),
    -JANELA_DE_PAR_EM_DIAS,
  );
  const ate = comDeslocamento(
    datas.reduce((a, b) => (a > b ? a : b)),
    JANELA_DE_PAR_EM_DIAS,
  );

  return db
    .select({
      data: transactions.data,
      direcao: transactions.direcao,
      valorCentavos: transactions.valorCentavos,
      impressao: transactions.impressao,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.data, de),
        lte(transactions.data, ate),
        ne(transactions.status, "excluido"),
        isNull(transactions.parDe),
      ),
    );
}

/** `"2026-06-02"` mais ou menos N dias, ainda como `YYYY-MM-DD`. */
function comDeslocamento(data: string, dias: number): string {
  const ms = Date.parse(`${data}T00:00:00Z`) + dias * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Resolve a pendência 3 da spec, com os números que a fase A mediu.
 *
 * **Conta:** o mês sai da data do lançamento. O extrato de 02/06 a 02/07 traz
 * lançamentos de julho; empurrá-los para junho seria mentir sobre quando o
 * dinheiro se moveu.
 *
 * **Cartão:** o mês é o da fatura, escolhido na tela. A fatura de julho traz
 * uma parcela de **março** — pelo mês da compra, ela cairia num mês já
 * fechado.
 *
 * Nos dois casos a coluna `data` guarda a data real, então a outra leitura
 * continua possível depois sem migration.
 */
function mesDoLancamento(origem: Origem, data: string, mesEscolhido: string) {
  return origem === "csv_conta" ? data.slice(0, 7) : mesEscolhido;
}
