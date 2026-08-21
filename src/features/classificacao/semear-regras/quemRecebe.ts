/**
 * Quem nasce com as regras-base da A5 (tarefa D7).
 *
 * ## Por que não é todo mundo
 *
 * 22 das 25 regras são comerciante brasileiro genérico e serviriam para
 * qualquer um. Mas `EDSON` é o mecânico do Davi e `CADILLAC MONTE CARMO` é uma
 * contraparte real da vida dele. Semear isso em outra conta seria mostrar gente
 * da vida dele na tela de regras de um estranho — dado pessoal vazando por
 * conveniência de implementação.
 *
 * ## Por que a lista é própria, e não a do convite
 *
 * Seria fácil reusar `EMAILS_CONVIDADOS`, e estaria errado: aquela lista
 * responde "quem pode entrar", que é outra pergunta. No dia em que ele convidar
 * alguém, essa pessoa herdaria o mecânico dele sem que ninguém tivesse decidido
 * isso.
 *
 * Sem `NEXT_PUBLIC_`, como a allowlist: quem recebe seed não é informação que
 * precise chegar ao navegador.
 */

function normalizar(email: string) {
  return email.trim().toLowerCase();
}

/**
 * **Lista vazia = ninguém recebe.** É o lado seguro para errar: uma conta sem
 * regras pergunta tudo na revisão, e uma conta com as regras erradas classifica
 * em silêncio.
 */
export function recebeRegrasBase(email: string | null | undefined): boolean {
  if (!email) return false;

  const lista = (process.env.EMAILS_COM_REGRAS_BASE ?? "")
    .split(",")
    .map(normalizar)
    .filter(Boolean);

  return lista.includes(normalizar(email));
}
