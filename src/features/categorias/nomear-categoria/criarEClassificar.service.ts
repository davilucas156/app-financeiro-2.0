import "server-only";
import { getDb } from "@/lib/db";
import { criarCategoriaNaTransacao } from "@/features/categorias/gerir-categorias/mexerNaCategoria.service";
import type { CategoriaEscolhivel } from "@/features/classificacao/revisar-lancamento/categorias";
import { decidirNaTransacao } from "@/features/classificacao/revisar-lancamento/decidirLancamento.service";

/**
 * Criar a categoria e classificar o lançamento que a motivou (tarefa D2).
 *
 * ## Numa transação só, e o motivo não é elegância
 *
 * São duas gravações. Se a segunda falhar sozinha, sobra uma categoria vazia
 * que ninguém pediu — no meio de uma lista que só funciona enquanto cabe na
 * cabeça — e o lançamento continua pendente, então a pessoa tenta de novo e
 * cria a segunda.
 *
 * A transação não é para ser correta no papel. É para o segundo toque não
 * produzir "Farmácia" e "Farmácia 2".
 *
 * ## Nenhuma das duas metades é escrita aqui
 *
 * A B1 sabe criar; a D4 da spec 03 sabe classificar, com a sombra do desfazer,
 * o `for update` e a limpeza de `regra_chave`. Repetir a segunda seria copiar a
 * parte mais sutil do projeto para um lugar que envelheceria sozinho.
 *
 * ## "Sempre classificar assim" não passa por aqui
 *
 * Criar categoria, classificar e criar regra em um toque são três decisões, e a
 * terceira tem consequência no mês inteiro. A regra continua nascendo de onde
 * nasce hoje: uma correção sobre descrição real, na `PerguntaDeRegra`.
 *
 * ⚠ `userId` vem de `garantirUsuario()`; pote e lançamento vêm do cliente e
 * são conferidos contra ele lá dentro.
 */

export type ResultadoDeCriarEClassificar =
  | { ok: true; categoria: CategoriaEscolhivel }
  | { ok: false; erro: string; campo?: "nome" | "emoji" };

/**
 * Recusa vira exceção para a transação voltar atrás.
 *
 * As duas metades devolvem `{ ok: false }` em vez de estourar — é o que faz
 * elas darem frase em vez de 500. Devolver isso de dentro da transação, porém,
 * a **encerraria com sucesso**: o Drizzle só desfaz o que foi feito quando algo
 * é lançado. Sem isto, um lançamento que sumiu no meio do caminho deixaria a
 * categoria criada para trás.
 */
class Desistencia extends Error {
  constructor(readonly resultado: ResultadoDeCriarEClassificar) {
    super("desistencia");
  }
}

export async function criarEClassificar(
  userId: string,
  entrada: {
    nome: string;
    emoji: string;
    poteId: string;
    lancamentoId: string;
  },
): Promise<ResultadoDeCriarEClassificar> {
  try {
    return await getDb().transaction(async (tx) => {
      const criada = await criarCategoriaNaTransacao(tx, userId, {
        nome: entrada.nome,
        emoji: entrada.emoji,
        poteId: entrada.poteId,
      });

      if (!criada.ok) throw new Desistencia(criada);

      const classificado = await decidirNaTransacao(tx, userId, {
        tipo: "categoria",
        lancamentoId: entrada.lancamentoId,
        categoriaId: criada.categoria.id,
        // Escolher a categoria que você acabou de inventar é a escolha mais
        // manual que existe — não há sugestão nenhuma por trás.
        fonte: "manual",
        sempre: false,
      });

      if (!classificado.ok) throw new Desistencia(classificado);

      return { ok: true as const, categoria: criada.categoria };
    });
  } catch (erro) {
    if (erro instanceof Desistencia) return erro.resultado;
    throw erro;
  }
}
