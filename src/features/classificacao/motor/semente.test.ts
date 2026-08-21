import { describe, expect, it } from "vitest";
import { POTES_PADRAO } from "@/features/onboarding/potes-padrao";
import { casarRegra, regraValida, type AlvoDaRegra } from "./regras";
import { AGUARDANDO_C2, REGRAS_BASE, regrasSemente } from "./semente";

/**
 * ⚠ Nenhum nome real de pessoa. O único nome que a semente precisa é o do
 * titular, e ele entra por parâmetro justamente para não morar no repositório.
 */

/** A tradução real: todas as chaves que `POTES_PADRAO` produz hoje. */
const idPorChave = new Map<string, string>(
  POTES_PADRAO.flatMap((pote) =>
    pote.categorias.map(
      (c) => [`${pote.slug}/${c.slug}`, `id:${pote.slug}/${c.slug}`] as [string, string],
    ),
  ),
);

const semente = (nomeDoTitular?: string) =>
  regrasSemente({ idPorChave, nomeDoTitular });

const alvo = (p: Partial<AlvoDaRegra>): AlvoDaRegra => ({
  descricao: "",
  valorCentavos: 1000,
  direcao: "saida",
  ...p,
});

const chavePorId = new Map<string, string>(
  [...idPorChave].map(([chave, id]) => [id, chave] as [string, string]),
);

/** Qual chave `pote/categoria` a semente escolheu para este lançamento. */
const chaveEscolhida = (a: AlvoDaRegra, titular?: string): string | null => {
  const vencedora = casarRegra(semente(titular), a);
  return vencedora ? (chavePorId.get(vencedora.categoriaId) ?? null) : null;
};

describe("higiene da lista", () => {
  it("nenhuma regra inválida entra", () => {
    // Regra que nunca casa é pior que regra ausente: some sem avisar.
    for (const r of REGRAS_BASE) {
      expect(regraValida(r.criterio), JSON.stringify(r.criterio)).toBe(true);
    }
  });

  it("nenhuma chave de categoria repetida com critério repetido", () => {
    const ids = semente("Titular Da Conta").map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("o id não depende da posição na lista", () => {
    // A A1 desempata pelo id. Numerar por posição faria inserir uma regra no
    // meio mudar desempates que não tinham nada a ver com ela.
    const antes = semente().map((r) => r.id);
    expect(antes).toEqual(semente().map((r) => r.id));
    expect(antes.every((id) => id.startsWith("semente:"))).toBe(true);
  });
});

describe("as chaves apontam para categorias que existem", () => {
  const existentes = new Set(idPorChave.keys());

  it("AGUARDANDO_C2 é exatamente o conjunto que ainda falta", () => {
    // Quando a C2 criar o pote de renda, este teste quebra — e a lista tem de
    // esvaziar. É o lembrete que não dá para esquecer.
    const faltando = REGRAS_BASE.map((r) => r.chaveDaCategoria)
      .filter((c) => !existentes.has(c))
      .sort();

    expect([...new Set(faltando)]).toEqual([...AGUARDANDO_C2].sort());
  });

  it("regra órfã não entra na lista final", () => {
    const chaves = new Set(semente().map((r) => r.categoriaId));
    for (const pendente of AGUARDANDO_C2) {
      expect(chaves.has(`id:${pendente}`)).toBe(false);
    }
  });

  it("uma tradução vazia devolve nenhuma regra, e não regras quebradas", () => {
    expect(regrasSemente({ idPorChave: new Map() })).toEqual([]);
  });
});

describe("os termos são os do arquivo, não os da memória", () => {
  // Cada caso abaixo é uma descrição na **forma** medida, com o nome que o
  // arquivo traz. A descoberta 3 da spec nasceu de escrever `apple.com` para
  // uma descrição que é `APPLE COM BILL`.
  const casos: [string, string][] = [
    ["Petrobras Premmia      RIO DE JANEIR BRA", "transporte/gasolina"],
    ["TRANSFACIL BHBUS 4110  BELO HORIZONT BRA", "transporte/onibus"],
    ["DL UberRides           Sao Paulo     BRA", "transporte/apps"],
    ["ALLPARK SHOPP MT CARMO Betim         BRA", "transporte/estacionamento"],
    ["FerautoAlinhament      BETIM         BRA", "manutencao/manutencao-veicular"],
    ["TOTALPASS              SAO PAULO     BRA", "custos-fixos/academia"],
    ["CONTA VIVO             SAO PAULO     BRA", "custos-fixos/telefonia"],
    ["EBN          SPOTIFY   CURITIBA      BRA", "conforto-lazer/assinaturas"],
    ["AmazonPrimeBR          SAO PAULO     BRA", "conforto-lazer/assinaturas"],
    ["APPLE COM BILL         SAO PAULO     BRA", "conforto-lazer/assinaturas"],
    ["MERCADOLIVRE MERCADOL  Osasco        BRA", "conforto-lazer/compras-online"],
    ["Zed   Investidor10     Rio de Janeir BRA", "conhecimento/conteudo-ferramentas"],
    ['Aplicacao: "CDB Porq Obj BANCO EXEMPLO SA"', "liberdade-financeira/aportes"],
    ["IOF INTERNACIONAL", "outros-repasses/avulsos"],
  ];

  for (const [descricao, esperada] of casos) {
    it(`${descricao.slice(0, 22).trim()} → ${esperada}`, () => {
      expect(chaveEscolhida(alvo({ descricao }))).toBe(esperada);
    });
  }
});

describe("os termos curtos que ficaram de fora", () => {
  it("`99` não classifica um restaurante como transporte", () => {
    // O readme manda classificar `99` como Transporte/Apps. No mês medido ele
    // casa com o app de corrida, com um restaurante e com o número da conta.
    expect(
      chaveEscolhida(alvo({ descricao: "99SABORES LANCHES     BETIM         BRA" })),
    ).toBe(null);
  });

  it("`Epar` não pega uma oficina de reparo", () => {
    expect(
      chaveEscolhida(alvo({ descricao: "REPARO AUTOMOTIVO     BETIM         BRA" })),
    ).toBe(null);
  });

  it("`Prime` não pega a palavra primeira", () => {
    expect(
      chaveEscolhida(alvo({ descricao: "PRIMEIRA LOJA         BETIM         BRA" })),
    ).toBe(null);
  });

  it("`Posto` não pega posto de saúde", () => {
    expect(
      chaveEscolhida(alvo({ descricao: "POSTO DE SAUDE        BETIM         BRA" })),
    ).toBe(null);
  });
});

describe("regras de contraparte", () => {
  it("a recarga de ônibus casa pela contraparte do Pix", () => {
    expect(
      chaveEscolhida(
        alvo({
          descricao: 'Pix enviado: "Cp :00000000-PAGARME PAGAMENTOS"',
          pessoa: "PAGARME PAGAMENTOS",
        }),
      ),
    ).toBe("transporte/onibus");
  });

  it("a mesma processadora numa compra de cartão **não** casa", () => {
    // O tipo `pessoa` contém o estrago: só casa quando a A3 extraiu uma
    // contraparte, ou seja, só em transferência.
    expect(
      chaveEscolhida(
        alvo({ descricao: "PAGARME PAGAMENTOS    BETIM         BRA", pessoa: null }),
      ),
    ).toBe(null);
  });
});

describe("direção na regra de contraparte", () => {
  const empresa = "Cadillac Monte Carmo Ltda";

  it("Pix recebido dela é renda", () => {
    // Destravado pela C2: até ela existir, esta regra era derrubada por falta
    // de `renda/renda-extra` e o teste precisava emendar a chave na mão.
    expect(
      chaveEscolhida(
        alvo({
          descricao: `Pix recebido: "Cp :00000000-${empresa}"`,
          pessoa: empresa,
          direcao: "entrada",
        }),
      ),
    ).toBe("renda/renda-extra");
  });

  it("Pix **enviado** para ela não vira renda", () => {
    expect(
      chaveEscolhida(
        alvo({
          descricao: `Pix enviado: "Cp :00000000-${empresa}"`,
          pessoa: empresa,
          direcao: "saida",
        }),
      ),
    ).toBe(null);
  });

  it("compra no cartão para ela fica pendente, como o readme pede", () => {
    expect(
      chaveEscolhida(
        alvo({ descricao: "CADILLAC MONTE CARMO  BETIM         BRA", pessoa: null }),
      ),
    ).toBe(null);
  });
});

describe("transferência para si mesmo", () => {
  const titular = "Fulano Exemplo Da Silva";

  it("a saída é passagem e vai para o balde de repasses", () => {
    expect(
      chaveEscolhida(
        alvo({
          descricao: `Transferencia enviada: "000 0000 0000000 ${titular}"`,
          pessoa: titular,
          direcao: "saida",
        }),
        titular,
      ),
    ).toBe("outros-repasses/repasses");
  });

  it("a entrada **não** é semeada — pode ser salário chegando de outro banco", () => {
    // Chutar aqui mudaria a base de cálculo de todos os potes. Vai para a
    // revisão até o Davi responder; é a mesma pergunta que a C2 precisa.
    expect(
      chaveEscolhida(
        alvo({
          descricao: `Pix recebido: "Cp :00000000-${titular}"`,
          pessoa: titular,
          direcao: "entrada",
        }),
        titular,
      ),
    ).toBe(null);
  });

  it("sem o nome do titular, a regra simplesmente não existe", () => {
    expect(semente().length).toBe(semente("   ").length);
    expect(semente(titular).length).toBe(semente().length + 1);
  });

  it("nenhum nome de pessoa está gravado na lista versionada", () => {
    // A lista do arquivo tem marca, serviço e imposto — o único nome próprio
    // que a semente usa entra por parâmetro, em tempo de execução.
    const gravado = JSON.stringify(REGRAS_BASE);
    expect(gravado).not.toContain(titular);
  });
});

describe("prioridade", () => {
  it("o seed deixa a faixa abaixo de 20 livre para as correções do Davi", () => {
    // A D5 cria regra a partir de uma correção dele. Correção de quem olhou o
    // lançamento tem de ganhar do que eu semeei de longe.
    for (const r of REGRAS_BASE) {
      expect(r.prioridade, JSON.stringify(r.criterio)).toBeGreaterThanOrEqual(20);
    }
  });

  it("nenhuma regra `valor_direcao` no seed", () => {
    // O tipo existe e a spec diz que ele nasceria "só do seed do Davi". Nada
    // na seção 7 é faixa de valor. O `> R$ 200` do readme é a marca de
    // "revisar mesmo tendo batido", e quem aplica é a D1.
    expect(REGRAS_BASE.some((r) => r.criterio.tipo === "valor_direcao")).toBe(false);
  });
});
