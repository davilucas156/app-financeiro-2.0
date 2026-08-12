/**
 * Contato para quem tenta entrar sem convite.
 *
 * Fica num lugar só porque aparece em `fazer-login` e em `cadastrar-usuario`:
 * duplicado, o dia em que mudar uma das telas fica com o valor velho.
 *
 * Não é segredo — é um endereço público de contato, e vai para o cliente sem
 * problema (`references/architecture.md`, Thin Client / Fat Server).
 */
export const EMAIL_CONTATO = "davilucascarmo@gmail.com";

export function linkSolicitarAcesso() {
  const assunto = encodeURIComponent("Acesso ao Painel Financeiro 6 Potes");
  return `mailto:${EMAIL_CONTATO}?subject=${assunto}`;
}
