/**
 * O mecanismo comum a toda allowlist de e-mail por variável de ambiente do
 * projeto — convite (`EMAILS_CONVIDADOS`) e regras-base do seed (D7,
 * `EMAILS_COM_REGRAS_BASE`).
 *
 * As duas listas respondem perguntas diferentes e continuam separadas: uma é
 * "quem pode entrar", a outra é "quem herda dado pessoal de terceiro no
 * seed" — ver `quemRecebe.ts` para o porquê de não reusar uma allowlist pela
 * outra. Só o **parsing** — `trim`, `lowercase`, `split` por vírgula — era
 * duplicado byte a byte entre os dois arquivos; nasce aqui para parar de ser.
 */

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * **Lista vazia ou variável ausente = ninguém bate.** O lado seguro para
 * errar nos dois usos: convite fechado e seed não semeado, e não o
 * contrário.
 */
export function estaNaListaDeEmails(
  email: string | null | undefined,
  valorDaVariavel: string | undefined,
): boolean {
  if (!email) return false;

  const lista = (valorDaVariavel ?? "")
    .split(",")
    .map(normalizarEmail)
    .filter(Boolean);

  return lista.includes(normalizarEmail(email));
}
