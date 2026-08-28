import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { POTES_PADRAO } from "@/features/onboarding/potes-padrao";
import { paraLancamentos } from "@/features/upload/ler-arquivo/lancamentos";
import { prepararLancamentos } from "@/features/upload/ler-arquivo/preparar";
import { reconhecer } from "@/features/upload/ler-arquivo/reconhecer";
import { classificarImportacao } from "@/features/classificacao/classificar-importacao/classificarImportacao";
import { regrasSemente } from "@/features/classificacao/motor/semente";
import { coberturaDoMes } from "./cobertura";
import { metaDoPote } from "./meta";
import { paresDeValorIdentico } from "./paresDeValorIdentico";
import {
  somarOMes,
  type CategoriaComPote,
  type LancamentoDoMes,
} from "./somarOMes";

/**
 * A conta inteira contra os arquivos de verdade (tarefa A5).
 *
 * Mesma forma da A6 da spec 03, e pelas mesmas duas razões:
 *
 * - **O dado fica fora do repositório, a ferramenta não.** Medição que só
 *   existe num script jogado fora não é medição, é anedota — não dá para
 *   repetir depois de mexer na conta.
 * - **Este arquivo conta; nunca imprime.** Nenhum `console.log` de descrição,
 *   nome ou valor, nem em falha: a mensagem do Vitest vai para a tela e para o
 *   histórico do terminal.
 *
 * Se der diferente, é a A1–A4 que estão erradas — **ou o recorte da medição**,
 * que foi o que aconteceu desta vez. Ver `ESPERADO` logo abaixo.
 */

const ARQUIVOS = {
  conta: process.env.EXTRATO_CONTA ?? "Extrato-02-06-2026-a-02-07-2026-CSV.csv",
  cartao: process.env.EXTRATO_CARTAO ?? "fatura-inter-2026-07.csv",
};

/** Os dois, ou nenhum: par que se anula cruza os arquivos (spec 02, A4). */
const TEM_OS_ARQUIVOS =
  existsSync(ARQUIVOS.conta) && existsSync(ARQUIVOS.cartao);

const TITULAR = process.env.TITULAR_DA_CONTA ?? null;

/**
 * As porcentagens são de **dinheiro**, não de contagem — a descoberta 2 da spec
 * virando asserção.
 *
 * ## ⚠ A spec dizia 47 lançamentos, 63% e 10%. Estava no recorte errado
 *
 * A medição que escrevi na spec copiou o recorte da A6 da spec 03, que joga
 * fora **tudo** que não é `marcacao: "normal"` — os 3 pagamentos de fatura e os
 * 4 "par que se anula", 7 no total.
 *
 * Para a classificação aquele recorte está certo: nenhum dos 7 pede decisão de
 * categoria. Para o **painel**, não: o par que se anula nasce
 * `revisao_pendente`, e não `excluido`. É movimento de banco de verdade
 * esperando o Davi decidir, e some da conta só quando ele decidir.
 *
 * Então o painel conta 51 e a cobertura cai para 55%/8% — e a queda é
 * informação, não defeito: são 4 lançamentos de dinheiro real que ainda não
 * estão em pote nenhum, e o painel tem de dizer isso.
 *
 * Mesmo erro da A6, do mesmo jeito: a medição era minha e era otimista.
 */
const ESPERADO = {
  lancamentosNaConta: 51,
  saiuPct: 55,
  entrouPct: 8,
  /** `metas-sonhos`, porque a regra que o alimentaria não foi semeada (A5). */
  potesDeGastoVazios: 1,
  /** O estorno da decisão 2 não aconteceu neste mês. */
  entradasEmPoteDeGasto: 0,
};

/** `id:pote/categoria`, a mesma convenção da A6 da spec 03. */
const idDe = (poteSlug: string, catSlug: string) => `id:${poteSlug}/${catSlug}`;

const CATEGORIAS: CategoriaComPote[] = POTES_PADRAO.flatMap((pote) =>
  pote.categorias.map((c) => ({
    id: idDe(pote.slug, c.slug),
    pote: { id: pote.slug, tipo: pote.tipo },
  })),
);

const idPorChave = new Map<string, string>(
  POTES_PADRAO.flatMap((pote) =>
    pote.categorias.map(
      (c) =>
        [`${pote.slug}/${c.slug}`, idDe(pote.slug, c.slug)] as [string, string],
    ),
  ),
);

function ler(caminho: string) {
  const r = reconhecer(readFileSync(caminho));
  if (!r.ok) throw new Error(`não reconheci ${caminho}: ${r.motivo}`);
  return { origem: r.formato.origem, ...paraLancamentos(r) };
}

/** Os lançamentos do mês como o banco os teria depois da D1. */
function comoNoBanco(): LancamentoDoMes[] {
  const conta = ler(ARQUIVOS.conta);
  const cartao = ler(ARQUIVOS.cartao);

  const preparados = prepararLancamentos([
    { origem: conta.origem, lancamentos: conta.lancamentos },
    { origem: cartao.origem, lancamentos: cartao.lancamentos },
  ]);

  // ⚠ O mesmo módulo que a importação usa (D1), e não uma reimplementação.
  const { porImpressao } = classificarImportacao(
    preparados,
    regrasSemente({ idPorChave, nomeDoTitular: TITULAR }),
  );

  return preparados.map((p) => {
    const decisao = porImpressao.get(p.impressao);

    return {
      id: p.impressao,
      valorCentavos: p.valorCentavos,
      direcao: p.direcao,
      status: decisao?.status ?? "importado",
      categoriaId: decisao?.categoriaId ?? null,
    };
  });
}

describe.skipIf(!TEM_OS_ARQUIVOS)(
  "a conta do painel contra o extrato real",
  () => {
    const lancamentos = TEM_OS_ARQUIVOS ? comoNoBanco() : [];
    const soma = somarOMes(lancamentos, CATEGORIAS);

    it("o recorte NÃO é o mesmo da A6, e é de propósito", () => {
      // 54 no arquivo, 3 pagamentos de fatura fora, 51 na conta do painel.
      // Os 4 do par que se anula ficam: sao `revisao_pendente`, nao `excluido`.
      expect(soma.lancamentos).toBe(ESPERADO.lancamentosNaConta);
    });

    it("a cobertura em dinheiro bate com a medição da spec", () => {
      const c = coberturaDoMes(soma);

      expect(c.saiuPct).toBe(ESPERADO.saiuPct);
      expect(c.entrouPct).toBe(ESPERADO.entrouPct);
      expect(c.completa).toBe(false);
    });

    it("⚠ o motor cobre o gasto e quase não cobre a renda", () => {
      /*
       * A descoberta 1 da spec, virando teste: é ela que justifica a renda
       * **declarada**. Uma meta calculada sobre a renda medida seria 30% de 10%
       * da verdade. Se um dia isto inverter, a decisão merece ser revista.
       */
      const c = coberturaDoMes(soma);

      expect(c.saiuPct!).toBeGreaterThan(c.entrouPct! * 3);
    });

    it("um pote de gasto fica vazio, e não é culpa do Davi", () => {
      /*
       * `metas-sonhos`: a regra que o alimentaria está em `FORA_DE_PROPOSITO` na
       * A5 — o readme pede duas camadas decididas pela conta destino, e nenhum
       * critério do MVP lê conta destino.
       *
       * A tela precisa distinguir isto de "não guardei nada", e é para isso que
       * a cobertura acima existe.
       */
      const comMovimento = new Set(soma.potes.map((p) => p.poteId));

      const vazios = POTES_PADRAO.filter(
        (p) => p.tipo === "gasto" && !comMovimento.has(p.slug),
      );

      expect(vazios.length).toBe(ESPERADO.potesDeGastoVazios);
    });

    it("nenhuma entrada caiu em pote de gasto neste mês", () => {
      // O estorno da decisão 2 ainda não aconteceu. A conta já sabe abater
      // (`somarOMes.test.ts`); aqui o número diz que o caso é raro, não morto.
      const entradas = soma.potes
        .filter((p) => p.tipo === "gasto")
        .reduce((s, p) => s + p.entradaCentavos, 0);

      expect(entradas).toBe(ESPERADO.entradasEmPoteDeGasto);
    });

    it("nenhum par de valor idêntico dentro de um pote", () => {
      // Consequência do anterior: sem entrada em pote de gasto, não há o que
      // parear. O teste existe para o mês em que houver.
      for (const p of soma.potes.filter((p) => p.tipo === "gasto")) {
        const doPote = lancamentos.filter(
          (l) =>
            l.status !== "excluido" &&
            l.categoriaId !== null &&
            CATEGORIAS.find((c) => c.id === l.categoriaId)?.pote.id ===
              p.poteId,
        );

        expect(paresDeValorIdentico(doPote).size).toBe(0);
      }
    });

    it("com a renda de referência, as metas saem inteiras", () => {
      // R$ 1.200 — a base do painel HTML do Davi. Nenhum pote com percentual
      // produz meta quebrada nem meta nula.
      for (const pote of POTES_PADRAO.filter((p) => p.percentual !== null)) {
        const soma100 = soma.potes.find((p) => p.poteId === pote.slug);

        const meta = metaDoPote({
          percentual: pote.percentual,
          rendaDeclaradaCentavos: 120_000,
          totalCentavos: soma100?.totalCentavos ?? 0,
          lancamentos: soma100?.lancamentos ?? 0,
        });

        expect(meta.metaCentavos).toBe(pote.metaReferenciaCentavos);
      }
    });
  },
);
