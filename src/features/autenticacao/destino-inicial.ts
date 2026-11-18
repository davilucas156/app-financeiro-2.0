import "server-only";
import { auth } from "@clerk/nextjs/server";
import { obterUsuarioAtual } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { destinoDoUsuario } from "@/features/autenticacao/destinoDoUsuario";
import type { DestinoInicial } from "@/features/autenticacao/rotas-de-acesso";

/**
 * Para onde o usuário deve ir (tarefa D6).
 *
 * A mesma pergunta é feita em três rotas — `/`, `/entrar` e `/cadastrar`.
 * `/bem-vindo` não chama esta função: já tem o usuário em mãos e usa
 * `destinoDoUsuario` direto. Espalhar a regra é o que garante que ela
 * divirja: até a D5, três rotas respondiam com um `/dashboard` fixo que a D2
 * deixou provisório, e nenhuma sabia de `onboarding_concluido_em`.
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
 *
 * A decisão pura está em `destinoDoUsuario` (testável); aqui fica só o I/O.
 */
export async function destinoInicial(): Promise<DestinoInicial> {
  // `obterUsuarioAtual()` **cria a linha se faltar** (D5). Numa tela de login
  // isso soa estranho, mas é o que a spec de `/entrar` pede: primeiro acesso
  // grava o usuário no banco. Visitante anônimo não paga nada — sem `userId`
  // a função sai antes de tocar no banco.
  const usuario = await obterUsuarioAtual();
  if (usuario) return destinoDoUsuario(usuario, true);

  // `null` não quer dizer só "sem sessão" nem só "fora da allowlist":
  // `obterUsuarioAtual()` também devolve `null` quando `salvarUsuario`
  // responde `ignorado_sem_email` ou `usuario: null` (salvar-usuario.ts).
  // Por isso a sessão é consultada de novo — é ela que separa `/entrar` de
  // `/cadastrar?acesso=negado`.
  const { userId } = await auth();

  return destinoDoUsuario(null, Boolean(userId));
}
