import type { Metadata } from "next";
import { TelaDeConfiguracoes } from "@/features/aparencia/escolher-tema/TelaDeConfiguracoes";
import { letraAtual } from "@/features/aparencia/letra/letraAtual";
import { temaAtual } from "@/features/aparencia/tema/temaAtual";

export const metadata: Metadata = {
  title: "Configurações",
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
 * não da conta. A proteção de acesso é do proxy, e esta página não lê dado por
 * `user_id`, então não depende da linha do usuário.
 */
export default async function ConfiguracoesPage() {
  const [tema, letra] = await Promise.all([temaAtual(), letraAtual()]);

  return <TelaDeConfiguracoes tema={tema} letra={letra} />;
}
