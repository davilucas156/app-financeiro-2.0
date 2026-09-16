import { describe, expect, it } from "vitest";
import {
  chaveDoCriterio,
  textoDoCriterio,
} from "@/features/classificacao/motor/chaveDaRegra";
import type {
  AlvoDaRegra,
  Criterio,
  Regra,
} from "@/features/classificacao/motor/regras";
import { criterioDaCorrecao, regraQueConflita } from "./criterioDaCorrecao";
import { prepararRevisao, type LancamentoPendente } from "./pendentes";

/** ⚠ Nenhum nome real: as formas medidas, com comerciantes inventados. */

const pendente = (p: Partial<LancamentoPendente>): LancamentoPendente => ({
  id: "t1",
  descricao: "",
  valorCentavos: 1500,
  direcao: "saida",
  data: "2026-06-18",
  origem: "csv_cartao",
  parcela: null,
  categoriaDoBanco: null,
  motivo: null,
  categoriaId: null,
  regraChave: null,
  ...p,
});

describe("criterioDaCorrecao", () => {
  it("no cartão vira `descricao_contem` com o trecho estável", () => {
    expect(
      criterioDaCorrecao(
        "PADARIA CEU AZUL       BETIM         BRA",
        "csv_cartao",
      ),
    ).toEqual({ tipo: "descricao_contem", termo: "PADARIA CEU AZUL BETIM" });
  });

  it("num Pix vira `pessoa`, e não texto", () => {
    // Uma regra amarrada ao número da conta falharia na segunda vez: a mesma
    // contraparte apareceu no mesmo mês com dois números diferentes (A3).
    expect(
      criterioDaCorrecao(
        'Pix enviado: "Cp :00000000-Fulana de Tal"',
        "csv_conta",
      ),
    ).toEqual({ tipo: "pessoa", nome: "Fulana de Tal" });
  });

  it("sem nada estável, nenhuma regra nasce", () => {
    expect(criterioDaCorrecao("0000 0000 000", "csv_conta")).toBeNull();
  });
});

describe("a chave é a mesma que a A5 usa no seed", () => {
  it("junta tipo e texto com dois-pontos", () => {
    // É o que impede o seed e a correção de criarem duas regras para a mesma
    // coisa — a unicidade `(user_id, chave)` da C1.
    expect(
      chaveDoCriterio({ tipo: "descricao_contem", termo: "PETROBRAS" }),
    ).toBe("descricao_contem:PETROBRAS");

    expect(chaveDoCriterio({ tipo: "pessoa", nome: "Fulana de Tal" })).toBe(
      "pessoa:Fulana de Tal",
    );
  });
});

describe("o que a tela mostra é o que o banco guarda", () => {
  // ⚠ Este teste é a razão de `criterioDaCorrecao` existir num arquivo só.
  //
  // A tela mostra "a regra vai procurar por X" antes de você confirmar, e o
  // serviço grava a regra depois. Se fossem duas implementações, você
  // aprovaria uma regra e receberia outra — o pior erro possível numa pergunta
  // cuja única função é te deixar conferir.
  const casos = [
    "PADARIA CEU AZUL       BETIM         BRA",
    "EBN          SERVICO    CURITIBA      BRA",
    "ALGO NOVO              SAO PAULO     BRA",
  ];

  for (const descricao of casos) {
    it(`${descricao.slice(0, 20).trim()}`, () => {
      const [naTela] = prepararRevisao([pendente({ descricao })], {
        historico: [],
        idPorChave: new Map(),
      });

      const criterio = criterioDaCorrecao(descricao, "csv_cartao")!;

      expect(naTela.trecho).toBe(textoDoCriterio(criterio));
      expect(chaveDoCriterio(criterio)).toContain(naTela.trecho!);
    });
  }

  it("num Pix também", () => {
    const descricao = 'Pix enviado: "Cp :00000000-Fulana de Tal"';

    const [naTela] = prepararRevisao(
      [pendente({ descricao, origem: "csv_conta" })],
      { historico: [], idPorChave: new Map() },
    );

    expect(naTela.trecho).toBe(
      textoDoCriterio(criterioDaCorrecao(descricao, "csv_conta")!),
    );
  });
});

describe("a regra que vale só para um valor", () => {
  const PIX = 'Pix enviado: "Cp :00000000-Fulana de Tal"';

  it("com o valor, a faixa nasce exata", () => {
    // `minimo === maximo` é o valor que estava na tela. Abrir numa faixa é
    // uma edição na /regras, não uma decisão a tomar no meio da revisão.
    expect(criterioDaCorrecao(PIX, "csv_conta", 30000)).toEqual({
      tipo: "pessoa",
      nome: "Fulana de Tal",
      minimoCentavos: 30000,
      maximoCentavos: 30000,
    });
  });

  it("sem o valor, o critério é exatamente o de antes", () => {
    expect(criterioDaCorrecao(PIX, "csv_conta")).toEqual({
      tipo: "pessoa",
      nome: "Fulana de Tal",
    });
  });

  it("vale também no cartão, onde o critério é de texto", () => {
    expect(
      criterioDaCorrecao("PADARIA CEU AZUL       BETIM", "csv_cartao", 1500),
    ).toEqual({
      tipo: "descricao_contem",
      termo: "PADARIA CEU AZUL BETIM",
      minimoCentavos: 1500,
      maximoCentavos: 1500,
    });
  });

  it("descrição sem nada estável continua não virando regra nenhuma", () => {
    expect(criterioDaCorrecao("0000 0000 000", "csv_conta", 30000)).toBeNull();
  });
});

describe("a chave separa a exceção da regra que ela excetua", () => {
  /*
   * ⚠ As duas metades deste describe são a mesma linha de código, e as duas
   * são obrigatórias.
   *
   * Sem sufixo, `Fulana` e `Fulana + R$ 300,00` colidiriam no único
   * `(user_id, chave)` e a exceção sobrescreveria o padrão em silêncio. Com
   * sufixo constante, a chave de **toda regra já gravada** mudaria e a
   * primeira correção de cada uma criaria uma segunda regra em vez de
   * atualizar a que existe.
   */
  it("a chave de uma regra sem faixa não mudou", () => {
    expect(
      chaveDoCriterio({ tipo: "descricao_contem", termo: "PETROBRAS" }),
    ).toBe("descricao_contem:PETROBRAS");

    expect(chaveDoCriterio({ tipo: "pessoa", nome: "Fulana de Tal" })).toBe(
      "pessoa:Fulana de Tal",
    );
  });

  it("a exceção tem chave própria", () => {
    expect(
      chaveDoCriterio({
        tipo: "pessoa",
        nome: "Fulana de Tal",
        minimoCentavos: 30000,
        maximoCentavos: 30000,
      }),
    ).toBe("pessoa:Fulana de Tal@30000");
  });

  it("dois valores diferentes para a mesma pessoa não colidem", () => {
    const trezentos = chaveDoCriterio({
      tipo: "pessoa",
      nome: "Fulana de Tal",
      minimoCentavos: 30000,
      maximoCentavos: 30000,
    });
    const quinhentos = chaveDoCriterio({
      tipo: "pessoa",
      nome: "Fulana de Tal",
      minimoCentavos: 50000,
      maximoCentavos: 50000,
    });

    expect(trezentos).not.toBe(quinhentos);
  });

  it("faixa aberta de um lado também tem chave própria", () => {
    expect(
      chaveDoCriterio({
        tipo: "pessoa",
        nome: "Fulana de Tal",
        minimoCentavos: 30000,
      }),
    ).toBe("pessoa:Fulana de Tal@30000-");

    expect(
      chaveDoCriterio({
        tipo: "pessoa",
        nome: "Fulana de Tal",
        maximoCentavos: 30000,
      }),
    ).toBe("pessoa:Fulana de Tal@-30000");
  });

  it("duas faixas de valor na mesma direção deixaram de colidir", () => {
    // Nenhuma regra `valor_direcao` existe hoje — nem o seed nem a correção
    // criam. O conserto veio junto e não mexe em linha nenhuma.
    const baixa = chaveDoCriterio({
      tipo: "valor_direcao",
      direcao: "saida",
      minimoCentavos: 100,
      maximoCentavos: 5000,
    });
    const alta = chaveDoCriterio({
      tipo: "valor_direcao",
      direcao: "saida",
      minimoCentavos: 100000,
    });

    expect(baixa).not.toBe(alta);
  });
});

describe("regraQueConflita", () => {
  const regra = (criterio: Criterio, categoriaId: string): Regra => ({
    id: `r-${categoriaId}`,
    criterio,
    categoriaId,
    prioridade: 10,
  });

  const pixParaFulana: AlvoDaRegra = {
    descricao: 'Pix enviado: "Cp :00000000-Fulana de Tal"',
    valorCentavos: 50000,
    direcao: "saida",
    pessoa: "Fulana de Tal",
  };

  it("nenhuma regra pegando o lançamento não é conflito", () => {
    expect(regraQueConflita([], pixParaFulana, "aluguel")).toBeNull();
  });

  it("regra que manda para o mesmo lugar não é conflito", () => {
    // Você confirmou o que ela já dizia; gravar de novo só atualiza a que
    // existe.
    const r = regra({ tipo: "pessoa", nome: "Fulana de Tal" }, "aluguel");
    expect(regraQueConflita([r], pixParaFulana, "aluguel")).toBeNull();
  });

  it("regra que manda para outro lugar é o conflito", () => {
    const r = regra({ tipo: "pessoa", nome: "Fulana de Tal" }, "aluguel");
    expect(regraQueConflita([r], pixParaFulana, "emprestimo")?.id).toBe(r.id);
  });

  /*
   * ⚠ O motivo de a detecção usar `casarRegra` e não uma busca pela chave.
   *
   * A regra que atrapalha não precisa ter o mesmo critério que a correção
   * produziria: uma `descricao_contem` pega o mesmo Pix que uma `pessoa`, com
   * chave completamente diferente. Procurar pela chave não acharia nada, e o
   * conflito mais difícil de perceber sozinho passaria batido.
   */
  it("acha o conflito mesmo quando a regra é de outro tipo", () => {
    const r = regra(
      { tipo: "descricao_contem", termo: "PIX ENVIADO" },
      "aluguel",
    );

    expect(regraQueConflita([r], pixParaFulana, "emprestimo")?.id).toBe(r.id);
  });

  it("a exceção que já existe é o conflito, quando você muda de ideia sobre ela", () => {
    const padrao = regra({ tipo: "pessoa", nome: "Fulana de Tal" }, "aluguel");
    const excecao = regra(
      {
        tipo: "pessoa",
        nome: "Fulana de Tal",
        minimoCentavos: 50000,
        maximoCentavos: 50000,
      },
      "emprestimo",
    );

    // A de faixa é quem pega os R$ 500,00, então é ela que conflita — e
    // regravar com o mesmo valor atualiza ela, não cria uma terceira.
    expect(
      regraQueConflita([padrao, excecao], pixParaFulana, "viagem")?.id,
    ).toBe(excecao.id);
  });
});
