import "server-only";
import type { getDb } from "@/lib/db";

/**
 * A transação do Drizzle, para funções que gravam dentro da transação de quem
 * as chama.
 *
 * ## Por que virou arquivo na D2 da spec 05
 *
 * Esta linha estava escrita três vezes — no `apagarCategoria`, no
 * `decidirLancamento` e no `concluirOnboarding` —, e até aqui isso era
 * inofensivo: cada transação começava e terminava dentro do próprio arquivo,
 * então o tipo era assunto local.
 *
 * A D2 abre a primeira transação que **atravessa arquivos**: criar a categoria
 * e classificar o lançamento acontecem juntas ou não acontecem, e as duas
 * metades moram em módulos diferentes. Um tipo compartilhado deixa de ser
 * repetição e passa a ser o contrato entre eles.
 *
 * ⚠ **`TransacaoDoBanco`, e não `Transacao`.** `db/schema.ts` já exporta
 * `Transacao` para uma **linha de `transactions`** — um lançamento. Dois
 * significados com o mesmo nome num projeto que fala de dinheiro e de banco na
 * mesma frase seria confusão garantida.
 */
export type TransacaoDoBanco = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];
