import { pessoaDe } from "@/features/classificacao/motor/pessoa";
import {
  casarRegra,
  type AlvoDaRegra,
  type Criterio,
  type Regra,
} from "@/features/classificacao/motor/regras";
import { trechoEstavel } from "@/features/classificacao/motor/trecho";
import type { Origem } from "@/features/upload/ler-arquivo/formatos";

/**
 * O critério que uma correção sua vira (tarefa D5).
 *
 * ## Por que isto existe num arquivo só
 *
 * Dois lugares precisam da mesma resposta:
 *
 * - a **tela**, que mostra "a regra vai procurar por X" antes de você confirmar;
 * - o **serviço**, que grava a regra quando você confirma.
 *
 * Eu tinha escrito os dois separados, e é exatamente o tipo de duplicação que
 * este projeto evita em toda parte: se divergirem, a tela mostra um texto e o
 * banco guarda outro. Você aprovaria uma regra e receberia outra — o pior erro
 * possível numa pergunta cuja única função é te deixar conferir.
 *
 * ⚠ **`textoDoCriterio` e `chaveDoCriterio` mudaram de casa na D7.** Foram para
 * `motor/chaveDaRegra.ts`, porque o seed também produz regra e precisava da
 * mesma chave — e estava produzindo outra. Ver o arquivo de lá.
 */

/**
 * Numa transferência o que identifica é **quem** (A3); no cartão é o trecho
 * estável (A2).
 *
 * `null` quando não há nada estável — e aí não nasce regra nenhuma, que é
 * melhor do que nascer uma que pegue o que não deve.
 */
export function criterioDaCorrecao(
  descricao: string,
  origem: Origem,
  /**
   * Presente = a regra vale **só para este valor**. Ausente = para qualquer
   * um, que é o que ela sempre fez.
   *
   * Quem decide é você, na tela, e só no caso em que a escolha existe — ver
   * `regraQueConflita`. Aqui o parâmetro é só o "sim" já tomado.
   */
  valorCentavos?: number,
): Criterio | null {
  const base = criterioBase(descricao, origem);
  if (!base || valorCentavos === undefined) return base;

  // Exata: `minimo === maximo` é o valor que você acabou de ver na tela. Abrir
  // isso numa faixa é uma edição na `/regras`, não uma decisão a tomar agora.
  return {
    ...base,
    minimoCentavos: valorCentavos,
    maximoCentavos: valorCentavos,
  };
}

function criterioBase(descricao: string, origem: Origem): Criterio | null {
  const pessoa = pessoaDe(descricao);
  if (pessoa) return { tipo: "pessoa", nome: pessoa };

  const trecho = trechoEstavel(descricao, origem);
  return trecho ? { tipo: "descricao_contem", termo: trecho } : null;
}

/**
 * A regra existente que já pega este lançamento e manda ele para **outro**
 * lugar — ou `null`, que é o caso normal.
 *
 * ## O único momento em que o valor vale a pena
 *
 * Amarrar toda regra de contraparte ao valor seria mais preciso e muito pior:
 * um Pix de R$ 300,00 e outro de R$ 300,50 para a mesma pessoa virariam dois
 * cadastros, e a `/revisao` perguntaria de novo por alguém que você já
 * ensinou. A regra por nome acerta a maioria esmagadora das vezes.
 *
 * O valor só ganha o seu lugar quando o nome **sozinho classificaria errado**:
 * existe regra pegando este lançamento e o destino que ela dá não é o que você
 * acabou de escolher. Aí as duas não convivem sem um desempate, e o desempate
 * que está na sua mão é o valor na tela.
 *
 * ⚠ **Isto decide se a tela oferece a escolha, e não qual é a resposta.**
 * Criar a exceção sozinho seria pior do que não ter a funcionalidade: você
 * responderia "sempre classifique assim" e receberia "só quando for R$ 300,00",
 * com os outros valores continuando a ir para o lugar errado — regra criada em
 * silêncio, que é o erro mais caro deste projeto. Havendo conflito, a pergunta
 * ganha uma opção; não havendo, ela continua com duas.
 *
 * ## Por que `casarRegra` e não uma busca pela chave
 *
 * A regra que conflita não precisa ter o **mesmo** critério. Uma
 * `descricao_contem: TRANSFERENCIA ENVIADA DAVI` pega o mesmo lançamento que
 * uma `pessoa: Davi Lucas`, com chave completamente diferente. A pergunta que
 * importa não é "existe regra com esta chave?", é "alguma regra existente
 * classificaria este lançamento noutro lugar?" — e quem responde isso é o
 * mesmo motor que vai classificar de verdade no mês que vem.
 */
export function regraQueConflita<T extends Regra>(
  regras: T[],
  alvo: AlvoDaRegra,
  /** Para onde **você** está mandando o lançamento agora. */
  categoriaId: string,
): T | null {
  const jaPega = casarRegra(regras, alvo);
  if (!jaPega) return null;

  // Mesmo destino não é conflito: você confirmou o que a regra já dizia, e
  // gravar de novo só atualiza a que existe.
  return jaPega.categoriaId === categoriaId ? null : jaPega;
}
