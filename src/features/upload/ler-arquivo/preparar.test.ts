import { describe, expect, it } from "vitest";
import {
  impressaoDigital,
  normalizarDescricao,
  prepararLancamentos,
  type EntradaDeArquivo,
  type LancamentoSalvo,
} from "./preparar";
import type { Lancamento } from "./lancamentos";
import { paraLancamentos } from "./lancamentos";
import { reconhecer, type Reconhecimento } from "./reconhecer";
import { EXTRATO_INTER, FATURA_INTER } from "./amostras";

const bytes = (t: string) => new TextEncoder().encode(t);

function lancamento(p: Partial<Lancamento> = {}): Lancamento {
  return {
    data: "2026-06-02",
    descricao: "ALGUMA COISA",
    valorCentavos: 1200,
    direcao: "saida",
    parcela: null,
    categoriaDoBanco: null,
    linha: 1,
    ...p,
  };
}

function deArquivo(texto: string): EntradaDeArquivo {
  const r = reconhecer(bytes(texto));
  if (!r.ok) throw new Error(r.mensagem);
  const pronto = r as Extract<Reconhecimento, { ok: true }>;
  return {
    origem: pronto.formato.origem,
    lancamentos: paraLancamentos(pronto).lancamentos,
  };
}

describe("normalizarDescricao", () => {
  it("iguala caixa, acento e espaçamento", () => {
    expect(normalizarDescricao("LOJA    Betim   BRA")).toBe("LOJA BETIM BRA");
    expect(normalizarDescricao("Alimentação")).toBe("ALIMENTACAO");
    expect(normalizarDescricao("  Uber  ")).toBe("UBER");
  });

  it("é o que impede o mesmo lançamento de parecer novo no mês seguinte", () => {
    // Basta o banco mudar o alinhamento por espaço para as duas formas
    // aparecerem — a impressão não pode mudar por causa disso.
    expect(normalizarDescricao("LOJA  X")).toBe(normalizarDescricao("Loja X"));
  });
});

describe("impressaoDigital", () => {
  it("tem sempre 64 caracteres, seja qual for a descrição", () => {
    const curta = impressaoDigital("csv_conta", lancamento(), 1);
    const longa = impressaoDigital(
      "csv_conta",
      lancamento({ descricao: "x".repeat(5000) }),
      1,
    );
    expect(curta).toHaveLength(64);
    expect(longa).toHaveLength(64);
  });

  it("é determinística — o mesmo lançamento dá a mesma impressão", () => {
    expect(impressaoDigital("csv_conta", lancamento(), 1)).toBe(
      impressaoDigital("csv_conta", lancamento(), 1),
    );
  });

  it("não depende da linha em que o lançamento estava", () => {
    // Se dependesse, acrescentar uma linha no topo do arquivo faria tudo
    // abaixo parecer novo.
    expect(impressaoDigital("csv_conta", lancamento({ linha: 7 }), 1)).toBe(
      impressaoDigital("csv_conta", lancamento({ linha: 99 }), 1),
    );
  });

  it("muda com data, valor, direção, descrição, origem e ocorrência", () => {
    const base = impressaoDigital("csv_conta", lancamento(), 1);

    expect(
      impressaoDigital("csv_conta", lancamento({ data: "2026-06-03" }), 1),
    ).not.toBe(base);
    expect(
      impressaoDigital("csv_conta", lancamento({ valorCentavos: 1201 }), 1),
    ).not.toBe(base);
    expect(
      impressaoDigital("csv_conta", lancamento({ direcao: "entrada" }), 1),
    ).not.toBe(base);
    expect(
      impressaoDigital("csv_conta", lancamento({ descricao: "OUTRA" }), 1),
    ).not.toBe(base);
    expect(impressaoDigital("csv_cartao", lancamento(), 1)).not.toBe(base);
    expect(impressaoDigital("csv_conta", lancamento(), 2)).not.toBe(base);
  });

  it("ignora diferença só de espaçamento e caixa", () => {
    expect(
      impressaoDigital("csv_conta", lancamento({ descricao: "LOJA  X" }), 1),
    ).toBe(
      impressaoDigital("csv_conta", lancamento({ descricao: "Loja X" }), 1),
    );
  });
});

describe("ocorrência — o que salva a pendência 2", () => {
  const doisCafes: EntradaDeArquivo = {
    origem: "csv_conta",
    lancamentos: [
      lancamento({ descricao: "CAFE", valorCentavos: 1200, linha: 2 }),
      lancamento({ descricao: "CAFE", valorCentavos: 1200, linha: 3 }),
    ],
  };

  it("dois lançamentos idênticos no mesmo dia recebem impressões diferentes", () => {
    const [a, b] = prepararLancamentos([doisCafes]);
    expect(a.impressao).not.toBe(b.impressao);
  });

  it("sem isso o banco engoliria o segundo café, e ele é real", () => {
    const [a, b] = prepararLancamentos([doisCafes]);
    expect(new Set([a.impressao, b.impressao]).size).toBe(2);
  });

  it("reenviar o mesmo arquivo gera exatamente as mesmas impressões", () => {
    const primeira = prepararLancamentos([doisCafes]).map((l) => l.impressao);
    const segunda = prepararLancamentos([doisCafes]).map((l) => l.impressao);
    expect(segunda).toEqual(primeira);
  });

  it("um arquivo com só um dos dois colide com a primeira ocorrência", () => {
    const [a] = prepararLancamentos([doisCafes]);
    const [so] = prepararLancamentos([
      { origem: "csv_conta", lancamentos: [doisCafes.lancamentos[0]] },
    ]);
    expect(so.impressao).toBe(a.impressao);
  });

  it("três iguais viram três impressões", () => {
    const tres = prepararLancamentos([
      {
        origem: "csv_conta",
        lancamentos: [lancamento(), lancamento(), lancamento()],
      },
    ]);
    expect(new Set(tres.map((l) => l.impressao)).size).toBe(3);
  });
});

describe("pagamento de fatura", () => {
  it("é detectado no extrato da conta", () => {
    const preparados = prepararLancamentos([deArquivo(EXTRATO_INTER)]);
    const pagamento = preparados.find((l) =>
      l.descricao.includes("Pagamento fatura"),
    );

    expect(pagamento?.marcacao).toBe("excluido");
    expect(pagamento?.motivo).toContain("pagamento da fatura");
  });

  it("é detectado na fatura do cartão", () => {
    const preparados = prepararLancamentos([deArquivo(FATURA_INTER)]);
    const pagamento = preparados.find(
      (l) => l.descricao === "PAGAMENTO ON LINE",
    );

    expect(pagamento?.marcacao).toBe("excluido");
  });

  it("os dois lados do mesmo pagamento são marcados quando os arquivos vêm juntos", () => {
    // Sem isto, os R$ 318,19 sairiam duas vezes da conta.
    const preparados = prepararLancamentos([
      deArquivo(EXTRATO_INTER),
      deArquivo(FATURA_INTER),
    ]);
    const excluidos = preparados.filter((l) => l.marcacao === "excluido");

    expect(excluidos).toHaveLength(2);
    expect(excluidos.every((l) => l.valorCentavos === 31819)).toBe(true);
    expect(new Set(excluidos.map((l) => l.origem)).size).toBe(2);
  });

  it("um lançamento comum não é marcado", () => {
    const preparados = prepararLancamentos([deArquivo(EXTRATO_INTER)]);
    const comum = preparados.find((l) => l.descricao.includes("Pix enviado"));

    expect(comum?.marcacao).toBe("normal");
    expect(comum?.motivo).toBeNull();
  });
});

describe("par que se anula", () => {
  const par = (dias: string[]) =>
    prepararLancamentos([
      {
        origem: "csv_conta",
        lancamentos: [
          lancamento({
            data: dias[0],
            direcao: "saida",
            valorCentavos: 43529,
            linha: 2,
          }),
          lancamento({
            data: dias[1],
            direcao: "entrada",
            valorCentavos: 43529,
            descricao: "VOLTOU",
            linha: 3,
          }),
        ],
      },
    ]);

  it("mesmo valor, direções opostas, mesmo dia", () => {
    const [a, b] = par(["2026-06-09", "2026-06-09"]);
    expect(a.marcacao).toBe("excluido");
    expect(b.marcacao).toBe("excluido");
  });

  it("cada lado aponta para o outro", () => {
    const [a, b] = par(["2026-06-09", "2026-06-09"]);
    expect(a.parDe).toBe(b.impressao);
    expect(b.parDe).toBe(a.impressao);
  });

  it("nada é apagado — os dois continuam na lista", () => {
    expect(par(["2026-06-09", "2026-06-09"])).toHaveLength(2);
  });

  it("dentro da janela de 7 dias", () => {
    expect(par(["2026-06-09", "2026-06-16"])[0].marcacao).toBe("excluido");
  });

  it("fora da janela não é par", () => {
    expect(par(["2026-06-09", "2026-06-17"])[0].marcacao).toBe("normal");
  });

  /*
   * A janela foi de 3 para 7 dias e o número saiu de uma medição, não de um
   * gosto — os 4 dias a mais são o que faz o Pix devolvido na semana seguinte
   * ser encontrado. Ver o comentário de `JANELA_DE_PAR_EM_DIAS`.
   */
  it("cinco dias entram, e é o caso que motivou o alargamento", () => {
    expect(par(["2026-05-28", "2026-06-02"])[0].marcacao).toBe("excluido");
  });

  it("mesma direção não é par", () => {
    const iguais = prepararLancamentos([
      {
        origem: "csv_conta",
        lancamentos: [
          lancamento({ valorCentavos: 5000, direcao: "saida", linha: 2 }),
          lancamento({
            valorCentavos: 5000,
            direcao: "saida",
            descricao: "OUTRA",
            linha: 3,
          }),
        ],
      },
    ]);
    expect(iguais.every((l) => l.marcacao === "normal")).toBe(true);
  });

  it("valor zero não vira par, senão casaria tudo com tudo", () => {
    const zeros = prepararLancamentos([
      {
        origem: "csv_conta",
        lancamentos: [
          lancamento({ valorCentavos: 0, direcao: "saida", linha: 2 }),
          lancamento({
            valorCentavos: 0,
            direcao: "entrada",
            descricao: "B",
            linha: 3,
          }),
        ],
      },
    ]);
    expect(zeros.every((l) => l.marcacao === "normal")).toBe(true);
  });

  it("cada lançamento entra em um par só", () => {
    // Três valores iguais: dois viram par, o terceiro sobra.
    const tres = prepararLancamentos([
      {
        origem: "csv_conta",
        lancamentos: [
          lancamento({
            valorCentavos: 5000,
            direcao: "saida",
            descricao: "A",
            linha: 2,
          }),
          lancamento({
            valorCentavos: 5000,
            direcao: "entrada",
            descricao: "B",
            linha: 3,
          }),
          lancamento({
            valorCentavos: 5000,
            direcao: "entrada",
            descricao: "C",
            linha: 4,
          }),
        ],
      },
    ]);
    expect(tres.filter((l) => l.marcacao === "excluido")).toHaveLength(2);
    expect(tres.filter((l) => l.marcacao === "normal")).toHaveLength(1);
  });

  it("vence o candidato de data mais próxima", () => {
    const lista = prepararLancamentos([
      {
        origem: "csv_conta",
        lancamentos: [
          lancamento({
            data: "2026-06-09",
            direcao: "saida",
            valorCentavos: 5000,
            descricao: "A",
            linha: 2,
          }),
          lancamento({
            data: "2026-06-12",
            direcao: "entrada",
            valorCentavos: 5000,
            descricao: "LONGE",
            linha: 3,
          }),
          lancamento({
            data: "2026-06-09",
            direcao: "entrada",
            valorCentavos: 5000,
            descricao: "PERTO",
            linha: 4,
          }),
        ],
      },
    ]);
    const a = lista.find((l) => l.descricao === "A");
    const perto = lista.find((l) => l.descricao === "PERTO");
    expect(a?.parDe).toBe(perto?.impressao);
    expect(lista.find((l) => l.descricao === "LONGE")?.marcacao).toBe("normal");
  });

  it("pagamento de fatura já excluído não vira também revisão", () => {
    const preparados = prepararLancamentos([
      deArquivo(EXTRATO_INTER),
      deArquivo(FATURA_INTER),
    ]);
    const excluidos = preparados.filter((l) => l.marcacao === "excluido");
    expect(excluidos.every((l) => l.parDe === null)).toBe(true);
  });
});

/**
 * Transferência entre contas suas — o caso do aporte que sumia.
 *
 * O salário entra no Inter por Pix e segue para a corretora: R$ 300 que entram
 * e R$ 300 que saem, nos dois casos com o nome do titular. Era lido como
 * "repasse que se anula", e o mês ficava como se não tivesse aportado nada.
 */
describe("transferência entre contas suas", () => {
  const TITULAR = "Fulano Beltrano da Silva";
  const ENTRADA_PROPRIA =
    'Pix recebido: "Cp :00000000-Fulano Beltrano da Silva"';
  const SAIDA_PROPRIA =
    'Transferencia enviada: "102 0001 0000000 Fulano Beltrano da Silva"';

  const preparar = (
    lancamentos: Lancamento[],
    jaNoBanco: LancamentoSalvo[] = [],
  ) =>
    prepararLancamentos(
      [{ origem: "csv_conta", lancamentos }],
      jaNoBanco,
      TITULAR,
    );

  const entrada = (p: Partial<Lancamento> = {}) =>
    lancamento({
      direcao: "entrada",
      valorCentavos: 30_000,
      descricao: ENTRADA_PROPRIA,
      linha: 2,
      ...p,
    });

  const saida = (p: Partial<Lancamento> = {}) =>
    lancamento({
      direcao: "saida",
      valorCentavos: 30_000,
      descricao: SAIDA_PROPRIA,
      linha: 3,
      ...p,
    });

  it("tira só a entrada: a saída é o aporte e continua na conta", () => {
    const [e, s] = preparar([entrada(), saida()]);

    expect(e.marcacao).toBe("excluido");
    expect(e.parDe).toBe(s.impressao);
    expect(e.motivo).toContain("transferência sua");
    expect(e.motivo).toContain(s.data);

    expect(s.marcacao).toBe("normal");
    expect(s.parDe).toBeNull();
  });

  it("vale com a saída antes da entrada no arquivo", () => {
    const [s, e] = preparar([saida({ linha: 2 }), entrada({ linha: 3 })]);

    expect(e.marcacao).toBe("excluido");
    expect(s.marcacao).toBe("normal");
  });

  it("sem o nome do titular volta a anular os dois — o comportamento de antes", () => {
    const sem = prepararLancamentos([
      { origem: "csv_conta", lancamentos: [entrada(), saida()] },
    ]);

    expect(sem.map((l) => l.marcacao)).toEqual(["excluido", "excluido"]);
  });

  it("reembolso de outra pessoa continua anulando os dois lados", () => {
    const preparados = preparar([
      entrada({ descricao: 'Pix recebido: "Cp :00000000-Ciclana de Tal"' }),
      saida({ descricao: 'Pix enviado: "Cp :00000000-Ciclana de Tal"' }),
    ]);

    expect(preparados.map((l) => l.marcacao)).toEqual(["excluido", "excluido"]);
  });

  it("saída para conta sua com entrada de outra pessoa: nada é anulado", () => {
    // Pix de terceiro e aporte do mesmo valor não são o mesmo dinheiro voltando.
    const preparados = preparar([
      entrada({ descricao: 'Pix recebido: "Cp :00000000-Ciclana de Tal"' }),
      saida(),
    ]);

    expect(preparados.map((l) => l.marcacao)).toEqual(["normal", "normal"]);
  });

  it("entrada sua sem saída correspondente não é tocada", () => {
    // Pode ser salário chegando de outro banco — a spec 03 recusou decidir.
    const [so] = preparar([entrada()]);

    expect(so.marcacao).toBe("normal");
  });

  it("a saída não é consumida por um segundo par", () => {
    const preparados = preparar([
      entrada({ linha: 2 }),
      saida({ linha: 3 }),
      entrada({ linha: 4 }),
    ]);

    // A segunda entrada não tem saída livre: fica como está.
    expect(preparados.map((l) => l.marcacao)).toEqual([
      "excluido",
      "normal",
      "normal",
    ]);
  });

  describe("com o que já está gravado", () => {
    const antigo = (p: Partial<LancamentoSalvo> = {}): LancamentoSalvo => ({
      descricao: SAIDA_PROPRIA,
      data: "2026-05-30",
      direcao: "saida",
      valorCentavos: 30_000,
      impressao: "antigo",
      ...p,
    });

    it("entrada nova sua fecha com a saída antiga: só a nova sai", () => {
      const [e] = preparar([entrada({ data: "2026-06-01" })], [antigo()]);

      expect(e.marcacao).toBe("excluido");
      expect(e.parDe).toBe("antigo");
    });

    it("saída nova fechando com entrada antiga sua: não anula o aporte", () => {
      const [s] = preparar(
        [saida({ data: "2026-06-01" })],
        [
          antigo({
            direcao: "entrada",
            descricao: ENTRADA_PROPRIA,
            data: "2026-05-30",
          }),
        ],
      );

      // O lado antigo não pode ser marcado, e anular só a saída apagaria o aporte.
      expect(s.marcacao).toBe("normal");
      expect(s.parDe).toBeNull();
    });

    it("saída nova para conta sua com entrada antiga de outra pessoa: não anula", () => {
      const [s] = preparar(
        [saida({ data: "2026-06-01" })],
        [
          antigo({
            direcao: "entrada",
            descricao: "Pix recebido: Ciclana de Tal",
            data: "2026-05-30",
          }),
        ],
      );

      expect(s.marcacao).toBe("normal");
    });
  });
});

describe("bordas", () => {
  it("lista vazia devolve vazio", () => {
    expect(prepararLancamentos([])).toEqual([]);
  });

  it("arquivo sem lançamentos devolve vazio", () => {
    expect(
      prepararLancamentos([{ origem: "csv_conta", lancamentos: [] }]),
    ).toEqual([]);
  });

  it("preserva tudo que a A3 produziu", () => {
    const [l] = prepararLancamentos([deArquivo(FATURA_INTER)]);
    expect(l).toMatchObject({
      data: "2026-06-27",
      valorCentavos: 1500,
      direcao: "saida",
      categoriaDoBanco: "TRANSPORTE",
      origem: "csv_cartao",
    });
  });
});

/**
 * O par que atravessa o envio — o caso que a janela sozinha nunca resolveu.
 *
 * Um Pix recebido no dia 28 e devolvido no dia 2 são dois arquivos diferentes:
 * o extrato de maio e o de junho. Antes disto, nem com 90 dias de janela ele
 * seria encontrado, porque o outro lado não estava na lista.
 */
describe("par com o que já está gravado", () => {
  const salvo = (p: Partial<LancamentoSalvo> = {}): LancamentoSalvo => ({
    descricao: "PIX DE ALGUEM",
    data: "2026-05-28",
    direcao: "entrada",
    valorCentavos: 6000,
    impressao: "antigo",
    ...p,
  });

  const chegando = (p: Partial<Lancamento> = {}) =>
    prepararLancamentos(
      [
        {
          origem: "csv_conta",
          lancamentos: [
            lancamento({
              data: "2026-06-02",
              direcao: "saida",
              valorCentavos: 6000,
              linha: 2,
              ...p,
            }),
          ],
        },
      ],
      [salvo()],
    );

  it("acha o par a cinco dias e atravessando o mês", () => {
    const [novo] = chegando();
    expect(novo.marcacao).toBe("excluido");
    expect(novo.parDe).toBe("antigo");
    expect(novo.motivo).toContain("2026-05-28");
  });

  it("continua respeitando a janela", () => {
    expect(chegando({ data: "2026-06-05" })[0].marcacao).toBe("normal");
  });

  it("mesma direção não é par", () => {
    expect(chegando({ direcao: "entrada" })[0].marcacao).toBe("normal");
  });

  it("valor diferente não é par", () => {
    expect(chegando({ valorCentavos: 6001 })[0].marcacao).toBe("normal");
  });

  it("sem histórico o resultado é o de sempre", () => {
    const [so] = prepararLancamentos([
      {
        origem: "csv_conta",
        lancamentos: [
          lancamento({ data: "2026-06-02", valorCentavos: 6000, linha: 2 }),
        ],
      },
    ]);
    expect(so.marcacao).toBe("normal");
  });

  /*
   * ⚠ O lado antigo não é tocado — ele já está gravado, provavelmente já
   * classificado, talvez num mês fechado. Reabrir seria reescrever o passado,
   * e não é preciso: o motivo do lado novo nomeia a data do outro.
   */
  it("só o lado novo é marcado, e ele aponta para o antigo", () => {
    const lista = chegando();
    expect(lista).toHaveLength(1);
    expect(lista[0].parDe).toBe("antigo");
  });

  it("um lançamento gravado fecha um par só", () => {
    // Sem isto, três Pix de R$ 60 no arquivo novo apontariam todos para o
    // mesmo do mês passado.
    const tres = prepararLancamentos(
      [
        {
          origem: "csv_conta",
          lancamentos: [2, 3, 4].map((linha) =>
            lancamento({
              data: "2026-06-02",
              direcao: "saida",
              valorCentavos: 6000,
              descricao: `DEVOLUCAO ${linha}`,
              linha,
            }),
          ),
        },
      ],
      [salvo()],
    );

    expect(tres.filter((l) => l.parDe === "antigo")).toHaveLength(1);
  });

  it("o par de dentro do envio vence o do histórico", () => {
    // Um par que se fecha no próprio arquivo é mais forte, e marcar os dois
    // lados é melhor do que marcar um.
    const lista = prepararLancamentos(
      [
        {
          origem: "csv_conta",
          lancamentos: [
            lancamento({
              data: "2026-06-02",
              direcao: "saida",
              valorCentavos: 6000,
              linha: 2,
            }),
            lancamento({
              data: "2026-06-02",
              direcao: "entrada",
              valorCentavos: 6000,
              descricao: "VOLTOU",
              linha: 3,
            }),
          ],
        },
      ],
      [salvo()],
    );

    expect(lista.every((l) => l.parDe !== "antigo")).toBe(true);
    expect(lista[0].parDe).toBe(lista[1].impressao);
  });

  it("o que já é passagem reconhecida não vira par", () => {
    // Pagamento de fatura já está decidido; casar ele com outra coisa pediria
    // uma decisão sobre algo decidido.
    const [pagamento] = prepararLancamentos(
      [
        {
          origem: "csv_conta",
          lancamentos: [
            lancamento({
              data: "2026-06-02",
              direcao: "saida",
              valorCentavos: 6000,
              descricao: 'Pagamento efetuado: "Pagamento fatura cartao Inter"',
              linha: 2,
            }),
          ],
        },
      ],
      [salvo()],
    );

    expect(pagamento.marcacao).toBe("excluido");
    expect(pagamento.parDe).toBeNull();
  });
});
