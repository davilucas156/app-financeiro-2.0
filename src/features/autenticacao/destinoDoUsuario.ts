import type { Usuario } from "@/db/schema";
import {
  ROTA_ACESSO_NEGADO,
  ROTA_BEM_VINDO,
  ROTA_ENTRAR,
  ROTA_PAINEL,
  type DestinoInicial,
} from "@/features/autenticacao/rotas-de-acesso";

/**
 * A decisão em si, sem I/O — os quatro ramos da tabela de `destinoInicial()`
 * em forma pura.
 *
 * Separada de `destinoInicial()` para poder ser exercitada nos quatro
 * estados. Pela porta de cima só dá para alcançar os que a sessão do momento
 * permite, e "onboarding concluído" é justamente o que não se alcança antes
 * da D7 existir. Mora em módulo próprio porque `destino-inicial.ts` é
 * `server-only` e o Vitest não o carrega.
 *
 * Recebe `Usuario`, não `userId` — não consulta nada, então não há como
 * usá-la para alcançar a conta alheia.
 */
export function destinoDoUsuario(
  usuario: Usuario | null,
  temSessao: boolean,
): DestinoInicial {
  if (usuario) {
    return usuario.onboardingConcluidoEm ? ROTA_PAINEL : ROTA_BEM_VINDO;
  }

  // Sem linha, mas **com** sessão: quem chama só chega aqui por dois motivos
  // — e-mail fora da allowlist (o caso comum) ou `obterUsuarioAtual()` ter
  // devolvido `null` por outro motivo com sessão viva. É aqui que "sem
  // sessão" e "com sessão, sem linha" se separam.
  return temSessao ? ROTA_ACESSO_NEGADO : ROTA_ENTRAR;
}
