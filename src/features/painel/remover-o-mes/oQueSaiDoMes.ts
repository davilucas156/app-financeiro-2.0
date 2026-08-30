import { rotuloDeOrigem } from "@/features/upload/enviar-extrato/exibirEnvio";
import { anoDoMes, nomeDoMes } from "@/lib/mes";

/**
 * O que a confirmação precisa dizer antes de apagar um mês (tarefa B1).
 *
 * ## Por que o transbordo existe
 *
 * O mês de um lançamento não é o mês do envio. `mesDoLancamento`, na
 * importação, arquiva lançamento de **conta** pelo mês da data e de **cartão**
 * pelo mês da fatura escolhido na tela — então o extrato de conta que vai de
 * 02/06 a 02/07 põe lançamentos em julho.
 *
 * ⚠ **Disso sai o fato que esta função existe para contar:** remover um mês é
 * remover os envios que o formaram (Descoberta 4 da spec 14), e um desses
 * envios pode alimentar o mês vizinho. Quem confirma tem de saber disso antes,
 * com o mês e o número — é a única consequência que ele não consegue prever
 * sozinho.
 *
 * ## Ela não sabe apagar, e não fala com o banco
 *
 * Recebe as linhas cruas e devolve números e nomes. Quem consulta é a
 * `enviosDoMes.service.ts`; quem apaga é a fase C.
 */

/**
 * Uma linha da consulta: um envio aparece **uma vez por mês** em que tem
 * lançamento, e é essa repetição que carrega o transbordo.
 */
export type LinhaDoEnvioPorMes = {
  importId: string;
  nomeArquivo: string;
  origem: "csv_conta" | "csv_cartao";
  mes: string;
  lancamentos: number;
};

export type EnvioQueSai = {
  importId: string;
  nomeArquivo: string;
  /** "conta" ou "cartão" — o mesmo rótulo do histórico de `/upload`. */
  rotuloDeOrigem: string;
  /** Tudo que este envio leva, de todos os meses dele. */
  lancamentos: number;
};

export type MesAtingido = { mes: string; lancamentos: number };

export type OQueSaiDoMes = {
  /** Vazio quando o mês já não existe — a tela recusa em vez de confirmar. */
  envios: EnvioQueSai[];
  /** Quantos lançamentos saem **deste** mês. */
  noMes: number;
  /**
   * Os outros meses que perdem lançamentos junto.
   *
   * ⚠ Vazio é o caso comum, e é por isso que ele é uma lista e não um
   * `temTransbordo: boolean` ao lado — dois fatos sobre a mesma coisa são duas
   * chances de eles divergirem.
   */
  transbordo: MesAtingido[];
  /** Tudo que desaparece: este mês mais o transbordo. */
  total: number;
};

/** `csv_conta` antes de `csv_cartao` — a ordem dos campos do formulário. */
const ORDEM_DA_ORIGEM = { csv_conta: 0, csv_cartao: 1 } as const;

/**
 * O acumulador guarda a origem **crua** para poder ordenar por ela; o tipo
 * público só carrega o rótulo. Duas formas do mesmo fato numa saída de tela
 * seriam duas chances de divergirem.
 */
type EnvioAcumulado = EnvioQueSai & { origem: LinhaDoEnvioPorMes["origem"] };

export function oQueSaiDoMes(
  mes: string,
  linhas: LinhaDoEnvioPorMes[],
): OQueSaiDoMes {
  const porEnvio = new Map<string, EnvioAcumulado>();
  const porMesAtingido = new Map<string, number>();
  let noMes = 0;
  let total = 0;

  for (const linha of linhas) {
    const envio = porEnvio.get(linha.importId);

    if (envio) {
      envio.lancamentos += linha.lancamentos;
    } else {
      porEnvio.set(linha.importId, {
        importId: linha.importId,
        nomeArquivo: linha.nomeArquivo,
        rotuloDeOrigem: rotuloDeOrigem(linha.origem),
        lancamentos: linha.lancamentos,
        origem: linha.origem,
      });
    }

    total += linha.lancamentos;

    if (linha.mes === mes) {
      noMes += linha.lancamentos;
    } else {
      porMesAtingido.set(
        linha.mes,
        (porMesAtingido.get(linha.mes) ?? 0) + linha.lancamentos,
      );
    }
  }

  /*
   * Ordem fixada nos dois, porque a tela lista os dois. Sem isso a confirmação
   * trocaria de ordem entre dois carregamentos, e uma tela que se move sozinha
   * é uma tela em que se confia menos na hora de apertar.
   */
  const envios = [...porEnvio.values()]
    .sort(
      (a, b) =>
        ORDEM_DA_ORIGEM[a.origem] - ORDEM_DA_ORIGEM[b.origem] ||
        a.nomeArquivo.localeCompare(b.nomeArquivo),
    )
    .map(({ origem: _origem, ...envio }) => envio);

  const transbordo = [...porMesAtingido.entries()]
    .map(([mesAtingido, lancamentos]) => ({ mes: mesAtingido, lancamentos }))
    .sort((a, b) => a.mes.localeCompare(b.mes));

  return { envios, noMes, transbordo, total };
}

/**
 * A frase de **um** mês de transbordo.
 *
 * ⚠ Uma por mês, e não uma da lista inteira: concatenar N meses numa string é
 * onde a gramática quebra sem ninguém notar — "1 lançamentos", vírgula sobrando
 * com um item só. Assim o plural fica sob teste e a junção fica no JSX, que é
 * onde ela é barata.
 *
 * ⚠ **`nomeDoMes` e não `rotuloDeMes`.** O segundo é o rótulo da aba ("Julho /
 * 2026") e fica ilegível no meio de uma frase. O primeiro é feito para isto, e
 * traz o ano só quando ele difere do mês que está sendo removido — dizer
 * "julho de 2026" para quem acabou de tocar em junho de 2026 é ruído, e
 * escondê-lo quando o ano **é** outro seria a frase apontando para o mês
 * errado.
 */
export function fraseDoTransbordo(
  atingido: MesAtingido,
  mesRemovido: string,
): string {
  const unidade = atingido.lancamentos === 1 ? "lançamento" : "lançamentos";
  const nome = nomeDoMes(atingido.mes, anoDoMes(mesRemovido));

  return `${nome} perde ${atingido.lancamentos} ${unidade}`;
}
