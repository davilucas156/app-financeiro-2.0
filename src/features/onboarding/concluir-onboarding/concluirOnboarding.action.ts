"use server";

import { redirect } from "next/navigation";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { concluirOnboarding } from "@/features/onboarding/concluir-onboarding/concluirOnboarding.service";

/**
 * O que o botão "Começar" chama (tarefa D7).
 *
 * **Não recebe nada do cliente.** O `user_id` vem de `garantirUsuario()`, que
 * o lê da sessão no servidor, e os potes vêm do módulo do servidor. Um
 * cliente que pudesse enviar a lista de potes poderia enviar qualquer outra
 * (`references/architecture.md`, Thin Client / Fat Server).
 */
export type EstadoOnboarding = "erro" | null;

/**
 * A assinatura tem dois parâmetros ignorados porque é assim que o
 * `useActionState` chama a action: estado anterior e `FormData`. Nenhum dos
 * dois é lido — ver acima.
 */
export async function prepararConta(
  _anterior: EstadoOnboarding,
  _dados: FormData,
): Promise<EstadoOnboarding> {
  const usuario = await garantirUsuario();

  // Saída antecipada: nem abre transação para quem já concluiu.
  if (!usuario.onboardingConcluidoEm) {
    try {
      await concluirOnboarding(usuario.id);
    } catch (erro) {
      console.error("[onboarding] falha ao preparar a conta", erro);
      return "erro";
    }
  }

  // ⚠ **Fora do `try`.** O `redirect()` do Next funciona lançando uma
  // exceção; dentro do bloco acima, o `catch` a engoliria e a tela mostraria
  // "erro" logo depois de gravar tudo com sucesso.
  redirect("/dashboard");
}
