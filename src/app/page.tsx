import { redirect } from "next/navigation";
import { destinoInicial } from "@/features/autenticacao/destino-inicial";

/**
 * A raiz não tem tela (tarefa D6): ela decide e desvia.
 *
 * A decisão é de Server Component, com `redirect()` **antes** de renderizar —
 * o navegador recebe um 307 e nunca chega a pintar tela de espera. Uma versão
 * no cliente piscaria "carregando" em toda abertura do app.
 *
 * Até aqui esta rota era a verificação visual dos tokens e componentes das
 * tarefas A2/A3. Ela cumpriu o papel e sai; o que documentava está em
 * `references/design-system.md`, e o arquivo continua no histórico do git.
 */
export default async function Home() {
  redirect(await destinoInicial());
}
