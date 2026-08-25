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
  //
  /*
   * ⚠ **Vai para `/passos` e não para `/dashboard`** (spec 09, tarefa C2).
   *
   * A tela de boas-vindas explica o **método**: os potes, os percentuais, o que
   * fica fora do rateio. Depois dela, o painel está vazio — e o botão que ele
   * oferece pede um arquivo que a pessoa ainda não tem.
   *
   * O passo que falta acontece **fora do app**, no aplicativo do banco, e é o
   * único que ninguém adivinha. Mandar direto para o painel era entregar uma
   * tela em branco a quem acabou de entender a ideia e ainda não sabe o gesto.
   *
   * A `/passos` termina com "Enviar extrato", então o caminho até o painel não
   * ficou mais longo: ficou explicado.
   */
  redirect("/passos");
}
