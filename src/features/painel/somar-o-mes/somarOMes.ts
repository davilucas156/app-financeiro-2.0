import type { Direcao } from "@/features/upload/ler-arquivo/lancamentos";

/**
 * A conta do mês: lançamentos → potes e categorias (tarefa A1).
 *
 * Pura, e num `.ts` que o Vitest alcança, porque **é aqui que o erro caro
 * mora**. Um pote somado errado não parece errado: não há exceção, não há tela
 * quebrada, não há linha vermelha no terminal — há um número plausível que
 * decide se o Davi acha que gastou demais.
 *
 * ## Todo valor no banco é positivo; somar é sempre uma escolha
 *
 * O sentido está em `direcao` — decisão da spec 02, porque os dois arquivos do
 * Inter usam o sinal com significados opostos. E a escolha muda com o tipo do
 * pote:
 *
 * | | Entrada | Saída |
 * |---|---|---|
 * | Pote de **gasto** | abate | soma |
 * | Pote de **renda** | soma | abate |
 *
 * Duas tabelas mentais numa função é convite para inverter uma delas seis meses
 * depois. Então a saída expõe `saidaCentavos` e `entradaCentavos` crus, mais um
 * `totalCentavos` **já orientado pelo tipo do pote**. A tela lê o total e
 * compara com a meta, sem saber de sinal.
 */

/** Uma linha de `transactions`, do jeito que a conta precisa vê-la. */
export type LancamentoDoMes = {
  id: string;
  /** Sempre positivo. O sentido está em `direcao`. */
  valorCentavos: number;
  direcao: Direcao;
  status: "importado" | "revisao_pendente" | "excluido";
  categoriaId: string | null;
};

/**
 * O mínimo que a conta precisa saber de uma categoria.
 *
 * ⚠ **Estrutural de propósito.** `CategoriaEscolhivel`, que já sai do banco em
 * dois serviços, satisfaz isto sem `import` nenhum. Uma terceira forma de
 * "categoria" no projeto seria uma terceira chance de elas divergirem, e
 * importar de `revisar-lancamento/` inventaria uma dependência entre telas que
 * não existe.
 */
export type CategoriaComPote = {
  id: string;
  pote: { id: string; tipo: "gasto" | "renda" };
};

export type SomaDaCategoria = {
  categoriaId: string;
  saidaCentavos: number;
  entradaCentavos: number;
  /** Orientado pelo tipo do pote — ver `SomaDoPote.totalCentavos`. */
  totalCentavos: number;
  lancamentos: number;
};

export type SomaDoPote = {
  poteId: string;
  tipo: "gasto" | "renda";
  saidaCentavos: number;
  entradaCentavos: number;
  /**
   * **Num pote de gasto:** quanto saiu líquido (saída − entrada). Fica
   * **negativo** quando um reembolso superou o gasto, e o negativo é mostrado —
   * esconder daria um zero que não é verdade.
   *
   * **Num pote de renda:** quanto entrou líquido (entrada − saída).
   */
  totalCentavos: number;
  lancamentos: number;
  categorias: SomaDaCategoria[];
};

export type SomaDoMes = {
  /** Só os potes que receberam alguma coisa. Pote vazio é assunto da tela. */
  potes: SomaDoPote[];
  /**
   * Todo o dinheiro do mês, por direção.
   *
   * ⚠ **Não depende de classificação nenhuma** — só de `direcao`. É o número
   * mais confiável da tela, e por isso a B1 o mostra antes dos potes.
   */
  entrouCentavos: number;
  saiuCentavos: number;
  /** `entrou − saiu`. Negativo é mês no vermelho. */
  diferencaCentavos: number;
  /** Lançamentos que entraram na conta (excluídos não contam). */
  lancamentos: number;

  /**
   * Quanto do dinheiro do mês **caiu num pote** (tarefa A2).
   *
   * Não é a contagem de pendentes: uma assinatura de R$ 20 e um aporte contam
   * igual numa contagem, e não contam igual aqui. Medido contra o extrato real
   * do Davi, 32 pendentes de 33 lançamentos eram **37% do dinheiro que saiu** —
   * os dois números descrevem o mesmo mês e contam histórias diferentes.
   *
   * Ver `cobertura.ts` para o que a tela faz com isto.
   */
  saiuClassificadoCentavos: number;
  entrouClassificadoCentavos: number;
};

export function somarOMes(
  lancamentos: LancamentoDoMes[],
  categorias: CategoriaComPote[],
): SomaDoMes {
  const poteDaCategoria = new Map(
    categorias.map((c) => [c.id, c.pote] as [string, CategoriaComPote["pote"]]),
  );

  const potes = new Map<string, SomaDoPote>();
  const categoriasPorPote = new Map<string, Map<string, SomaDaCategoria>>();

  let entrouCentavos = 0;
  let saiuCentavos = 0;
  let entrouClassificadoCentavos = 0;
  let saiuClassificadoCentavos = 0;
  let contados = 0;

  for (const l of lancamentos) {
    /*
     * Excluído fica de fora **inteiro**, inclusive do "o que entrou / o que
     * saiu" do topo. Pagamento de fatura é `excluido`, e contá-lo faria o gasto
     * do cartão sair duas vezes — que é o que a spec 02 resolveu.
     */
    if (l.status === "excluido") continue;

    contados += 1;

    if (l.direcao === "entrada") entrouCentavos += l.valorCentavos;
    else saiuCentavos += l.valorCentavos;

    /*
     * Categoria desconhecida vira **não classificado**, e não exceção.
     *
     * `transactions.categoria_id` é `set null` ao apagar a categoria, então isto
     * só acontece por bug de quem chama. Estourar derrubaria o painel inteiro
     * por causa de uma linha; ignorar em silêncio seria pior. Assim o defeito
     * aparece na cobertura em dinheiro (A2), que é o número do topo da tela.
     */
    const pote = l.categoriaId ? poteDaCategoria.get(l.categoriaId) : undefined;
    if (!pote || !l.categoriaId) continue;

    if (l.direcao === "entrada") entrouClassificadoCentavos += l.valorCentavos;
    else saiuClassificadoCentavos += l.valorCentavos;

    const noPote = potes.get(pote.id) ?? {
      poteId: pote.id,
      tipo: pote.tipo,
      saidaCentavos: 0,
      entradaCentavos: 0,
      totalCentavos: 0,
      lancamentos: 0,
      categorias: [],
    };

    const porCategoria =
      categoriasPorPote.get(pote.id) ?? new Map<string, SomaDaCategoria>();

    const naCategoria = porCategoria.get(l.categoriaId) ?? {
      categoriaId: l.categoriaId,
      saidaCentavos: 0,
      entradaCentavos: 0,
      totalCentavos: 0,
      lancamentos: 0,
    };

    for (const alvo of [noPote, naCategoria]) {
      if (l.direcao === "entrada") alvo.entradaCentavos += l.valorCentavos;
      else alvo.saidaCentavos += l.valorCentavos;

      alvo.lancamentos += 1;
      alvo.totalCentavos = orientar(pote.tipo, alvo);
    }

    porCategoria.set(l.categoriaId, naCategoria);
    categoriasPorPote.set(pote.id, porCategoria);
    potes.set(pote.id, noPote);
  }

  for (const [poteId, porCategoria] of categoriasPorPote) {
    potes.get(poteId)!.categorias = [...porCategoria.values()];
  }

  return {
    potes: [...potes.values()],
    entrouCentavos,
    saiuCentavos,
    diferencaCentavos: entrouCentavos - saiuCentavos,
    lancamentos: contados,
    saiuClassificadoCentavos,
    entrouClassificadoCentavos,
  };
}

/**
 * O sinal, resolvido num lugar só.
 *
 * ⚠ **Saída em pote de renda abate, e não é ignorada.** "Salário" não tem
 * saída: é erro de classificação. A conta podia deixar de fora, e deixar de
 * fora seria o começo de um painel que esconde o que não entende. Assim o
 * número fica estranho de propósito — número estranho manda olhar, número
 * escondido não manda nada.
 */
function orientar(
  tipo: "gasto" | "renda",
  valores: { saidaCentavos: number; entradaCentavos: number },
): number {
  return tipo === "renda"
    ? valores.entradaCentavos - valores.saidaCentavos
    : valores.saidaCentavos - valores.entradaCentavos;
}
