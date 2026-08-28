import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { POTES_PADRAO } from "@/features/onboarding/potes-padrao";
import { paraLancamentos } from "@/features/upload/ler-arquivo/lancamentos";
import { prepararLancamentos } from "@/features/upload/ler-arquivo/preparar";
import { reconhecer } from "@/features/upload/ler-arquivo/reconhecer";
import { pessoaDe } from "./pessoa";
import { classificarImportacao } from "@/features/classificacao/classificar-importacao/classificarImportacao";
import { regrasSemente } from "./semente";
import { sugerir } from "./sugestoes";
import { trechoEstavel } from "./trecho";

/**
 * O motor inteiro contra os arquivos de verdade (tarefa A6).
 *
 * ## Por que isto é um teste, e não um script descartável
 *
 * A tarefa dizia "roda fora do repositório". Li como: **o dado** fica fora, não
 * a ferramenta. Medição que só existe num script jogado fora não é medição, é
 * anedota — não dá para repetir depois de mexer no motor.
 *
 * Então ele **se pula sozinho** onde os arquivos não estão. Na máquina do Davi,
 * `npm test` confere o motor contra o extrato dele toda vez que roda, e uma
 * regressão de cobertura aparece com o número exato da queda.
 *
 * ## Este arquivo conta; nunca imprime
 *
 * Nome de comerciante, nome de pessoa e valor ficam na memória do processo e
 * morrem lá. Nenhum `console.log` de descrição, nem em falha — a mensagem de
 * erro do Vitest vai para a tela e para o histórico do terminal.
 */

/**
 * Os arquivos do Davi, que o `.gitignore` mantém fora do repositório. Os nomes
 * são datas e o banco, que `formatos.ts` já nomeia.
 */
const ARQUIVOS = {
  conta: process.env.EXTRATO_CONTA ?? "Extrato-02-06-2026-a-02-07-2026-CSV.csv",
  cartao: process.env.EXTRATO_CARTAO ?? "fatura-inter-2026-07.csv",
};

/**
 * Os dois, ou nenhum: par que se anula cruza os arquivos (spec 02, A4), então
 * medir com um só daria um número diferente e igualmente verdadeiro — o que é
 * a pior espécie de número.
 */
const TEM_OS_ARQUIVOS =
  existsSync(ARQUIVOS.conta) && existsSync(ARQUIVOS.cartao);

/**
 * A regra de transferência para si mesmo (A5) só nasce com o nome do titular, e
 * ele não mora no repositório. Sem ele, um lançamento a menos é classificado —
 * e a diferença de exatamente 1 é a regra se documentando.
 */
const TITULAR = process.env.TITULAR_DA_CONTA ?? null;

/** A entrada, para o resultado querer dizer alguma coisa. */
const ENTRADA = { lancamentos: 54, ignoradas: 0 };

const ESPERADO = {
  /** 3 excluídos (pagamento de fatura) + 4 em par que se anula. */
  foraNaImportacao: 7,
  comTitular: { classificados: 30, pendentes: 17, conferir: 2 },
  semTitular: { classificados: 29, pendentes: 18, conferir: 1 },
  /** Primeiro mês: histórico vazio, e a categoria do banco quase nunca traduz. */
  pendentesComSugestao: 2,
  /** Todo pendente consegue virar regra — a pergunta da B3 sempre pode aparecer. */
  pendentesSemComoVirarRegra: 0,
  /** Três pendentes repetem contraparte ou comerciante de outro. */
  regrasQueResolvemOsPendentes: 14,
};

const idPorChave = new Map<string, string>(
  POTES_PADRAO.flatMap((pote) =>
    pote.categorias.map(
      (c) =>
        [`${pote.slug}/${c.slug}`, `id:${pote.slug}/${c.slug}`] as [
          string,
          string,
        ],
    ),
  ),
);
// `renda/renda-extra` sai de `POTES_PADRAO` desde a C2. Antes dela, esta
// tradução precisava de uma linha extra emendando a chave na mão.

function ler(caminho: string) {
  const r = reconhecer(readFileSync(caminho));
  if (!r.ok) throw new Error(`não reconheci ${caminho}: ${r.motivo}`);
  return { origem: r.formato.origem, ...paraLancamentos(r) };
}

function medir() {
  const conta = ler(ARQUIVOS.conta);
  const cartao = ler(ARQUIVOS.cartao);

  const preparados = prepararLancamentos([
    { origem: conta.origem, lancamentos: conta.lancamentos },
    { origem: cartao.origem, lancamentos: cartao.lancamentos },
  ]);

  const regras = regrasSemente({ idPorChave, nomeDoTitular: TITULAR });

  // ⚠ **O mesmo módulo que a importação usa** (D1), e não uma reimplementação.
  //
  // Até a D1, este harness repetia aqui a lógica do serviço. As duas versões
  // podiam divergir sem ninguém notar: a medição continuaria verde, medindo
  // código que ninguém executa em produção.
  const decisao = classificarImportacao(preparados, regras);

  const pendentes = preparados.filter(
    (l) =>
      l.marcacao === "normal" &&
      !decisao.porImpressao.get(l.impressao)?.categoriaId,
  );
  const classificados = decisao.classificados;

  let comSugestao = 0;
  let semComoVirarRegra = 0;
  const regrasDistintas = new Set<string>();

  for (const l of pendentes) {
    const pessoa = pessoaDe(l.descricao);

    const sugestoes = sugerir(
      {
        descricao: l.descricao,
        origem: l.origem,
        pessoa,
        categoriaDoBanco: l.categoriaDoBanco,
      },
      // Primeiro mês do Davi: nada classificado ainda.
      { historico: [], idPorChave },
    );

    if (sugestoes.length > 0) comSugestao++;

    // A regra que a D5 criaria a partir da correção: contraparte quando é
    // transferência (A3), trecho estável quando é comerciante (A2).
    const chave = pessoa
      ? `pessoa:${pessoa.toUpperCase()}`
      : trechoEstavel(l.descricao, l.origem);

    if (chave) regrasDistintas.add(chave);
    else semComoVirarRegra++;
  }

  return {
    lidos: conta.lancamentos.length + cartao.lancamentos.length,
    ignoradas: conta.ignoradas.length + cartao.ignoradas.length,
    foraNaImportacao: preparados.filter((l) => l.marcacao !== "normal").length,
    conferir: decisao.conferir,
    classificados,
    pendentes: pendentes.length,
    comSugestao,
    semComoVirarRegra,
    regrasDistintas: regrasDistintas.size,
  };
}

describe.skipIf(!TEM_OS_ARQUIVOS)(
  "o motor inteiro contra os arquivos reais (pula sem os extratos do Davi)",
  () => {
    const m = medir();

    it("a entrada é a mesma que foi medida", () => {
      // Trocados os arquivos por um mês novo, "30 classificados" viraria uma
      // afirmação sobre outro conjunto de dados. Falhar aqui diz "remeça",
      // e não um erro de cobertura que não quer dizer nada.
      expect(m.lidos, "os arquivos mudaram — remeça a cobertura").toBe(
        ENTRADA.lancamentos,
      );
      expect(m.ignoradas).toBe(ENTRADA.ignoradas);
    });

    it("a importação resolve 7 antes do motor", () => {
      // Pagamento de fatura e par que se anula, da spec 02.
      expect(m.foraNaImportacao).toBe(ESPERADO.foraNaImportacao);
    });

    it("classifica 30 dos 47 e deixa 17 (29 e 18 sem o nome do titular)", () => {
      // ⚠ A spec 03 prometia 36 e 11. Aquele número saiu de mim lendo o arquivo
      // com julgamento humano, contando a regra `99` como acerto sem enxergar
      // que ela também classifica um restaurante como Transporte. Corrigi a
      // spec, não o motor — ver `specs/plans/A6-medir-o-motor-inteiro.md`.
      const esperado = TITULAR ? ESPERADO.comTitular : ESPERADO.semTitular;

      expect(m.classificados).toBe(esperado.classificados);
      expect(m.pendentes).toBe(esperado.pendentes);
      expect(m.classificados + m.pendentes).toBe(
        ENTRADA.lancamentos - ESPERADO.foraNaImportacao,
      );
    });

    it("só 2 dos pendentes recebem sugestão no primeiro mês", () => {
      // Consequência direta da A4: histórico vazio, e a categoria do banco
      // quase nunca traduz. Os outros 15 vão direto para a lista completa.
      //
      // É o achado que muda a fase B: no primeiro mês a lista completa não é o
      // caminho de exceção da tela de revisão, é o caminho principal.
      expect(m.comSugestao).toBe(ESPERADO.pendentesComSugestao);
    });

    it("todo pendente consegue virar regra", () => {
      // Nenhum cai no caso em que a pergunta "sempre classificar assim?" não
      // pode aparecer (B3).
      expect(m.semComoVirarRegra).toBe(ESPERADO.pendentesSemComoVirarRegra);
    });

    it("só 2 dos 30 classificados pedem confirmação por valor alto", () => {
      // R$ 200, do `readme.md` seção 7. Regra errada num valor alto é o erro
      // mais caro que existe aqui, e o mais fácil de não notar: some no meio
      // de trinta lançamentos certos.
      //
      // A spec dizia "6 lançamentos passam de R$ 200 no mês medido" — verdade,
      // mas quatro deles já estão pendentes de qualquer jeito. O custo real da
      // regra é **2 toques a mais**, não 6.
      const esperado = TITULAR ? ESPERADO.comTitular : ESPERADO.semTitular;
      expect(m.conferir).toBe(esperado.conferir);
    });

    it("17 pendentes precisam de 14 regras, não 17", () => {
      // Três repetem contraparte ou comerciante de outro pendente, e a D5
      // aplica a regra nova aos outros pendentes do mesmo mês. São 14
      // decisões, e no mês seguinte essas 14 já existem.
      expect(m.regrasDistintas).toBe(ESPERADO.regrasQueResolvemOsPendentes);
    });
  },
);
