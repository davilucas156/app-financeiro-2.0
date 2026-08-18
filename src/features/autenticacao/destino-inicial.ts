import "server-only";
import { auth } from "@clerk/nextjs/server";
import type { Usuario } from "@/db/schema";
import { obterUsuarioAtual } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";

/**
 * Para onde o usuário deve ir (tarefa D6).
 *
 * A mesma pergunta é feita em quatro rotas — `/`, `/entrar`, `/cadastrar` e
 * `/bem-vindo`. Espalhar a regra é o que garante que ela divirja: até a D5,
 * três delas respondiam com um `/dashboard` fixo que a D2 deixou provisório,
 * e nenhuma sabia de `onboarding_concluido_em`.
 *
 * | Estado | Destino |
 * |---|---|
 * | Sem sessão | `/entrar` |
 * | Sessão, e-mail fora da allowlist | `/cadastrar?acesso=negado` |
 * | Sessão, convidado, onboarding pendente | `/bem-vindo` |
 * | Sessão, convidado, onboarding concluído | `/dashboard` |
 *
 * A segunda linha não está na spec da raiz: é consequência da D3. Quem não
 * foi convidado **tem** sessão, e mandá-lo para `/dashboard` só o faria bater
 * no proxy e voltar. Um salto a menos, e o destino é a única tela que essa
 * pessoa pode ver.
 */
/**
 * A decisão em si, sem I/O — os quatro ramos da tabela acima em forma pura.
 *
 * Separada de `destinoInicial()` para poder ser exercitada nos quatro
 * estados. Pela porta de cima só dá para alcançar os que a sessão do momento
 * permite, e "onboarding concluído" é justamente o que não se alcança antes
 * da D7 existir.
 *
 * Recebe `Usuario`, não `userId` — não consulta nada, então não há como
 * usá-la para alcançar a conta alheia.
 */
export function destinoDoUsuario(
  usuario: Usuario | null,
  temSessao: boolean,
): string {
  if (usuario) {
    return usuario.onboardingConcluidoEm ? "/dashboard" : "/bem-vindo";
  }

  // Sem linha, mas **com** sessão, só há um motivo: o e-mail não está na
  // allowlist. `obterUsuarioAtual()` devolve `null` nos dois casos, e é aqui
  // que eles se separam.
  return temSessao ? "/cadastrar?acesso=negado" : "/entrar";
}

export async function destinoInicial(): Promise<string> {
  // `obterUsuarioAtual()` **cria a linha se faltar** (D5). Numa tela de login
  // isso soa estranho, mas é o que a spec de `/entrar` pede: primeiro acesso
  // grava o usuário no banco. Visitante anônimo não paga nada — sem `userId`
  // a função sai antes de tocar no banco.
  const usuario = await obterUsuarioAtual();
  if (usuario) return destinoDoUsuario(usuario, true);

  const { userId } = await auth();

  return destinoDoUsuario(null, Boolean(userId));
}
