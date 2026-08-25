import type { Metadata } from "next";
import { TelaDeConfiguracoes } from "@/features/aparencia/escolher-tema/TelaDeConfiguracoes";
import { temaAtual } from "@/features/aparencia/tema/temaAtual";

export const metadata: Metadata = {
  title: "Configurações · Painel Financeiro 6 Potes",
};

/**
 * `/configuracoes` — as preferências do aparelho (spec 08).
 *
 * **Fora da barra de navegação**, como a `/categorias`: são 4 itens desde a D9
 * da spec 03, e a 360px um quinto derrubaria o alvo de toque abaixo dos 44px.
 * O caminho até aqui é a engrenagem do cabeçalho (tarefa B3).
 *
 * ⚠ **Não chama `garantirUsuario()`, e não é esquecimento.** Esta é a única
 * tela de `(app)` que não lê nada por `user_id` — a preferência é do aparelho,
 * não da conta. A garantia da linha no banco continua acontecendo na moldura de
 * `(app)`, por onde esta rota passa como todas as outras.
 */
export default async function ConfiguracoesPage() {
  return <TelaDeConfiguracoes tema={await temaAtual()} />;
}
