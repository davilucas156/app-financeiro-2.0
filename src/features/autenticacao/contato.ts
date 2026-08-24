/**
 * Contato para quem tenta entrar sem convite.
 *
 * Fica num lugar só porque aparece em `fazer-login` e em `cadastrar-usuario`:
 * duplicado, o dia em que mudar uma das telas fica com o valor velho.
 *
 * Não é segredo — é um endereço público de contato, e vai para o cliente sem
 * problema (`references/architecture.md`, Thin Client / Fat Server).
 */
/*
 * ⚠ **O `156` faz parte do endereço.** Ele esteve faltando aqui desde a D3 da
 * spec 01, e o defeito era mudo dos dois lados: o Davi nunca clica no próprio
 * link de solicitar acesso, e quem clicava mandava e-mail para um endereço que
 * não é dele — sem quique visível, sem erro na tela, sem nada no log.
 *
 * Descoberto quando alguém tentou pedir acesso de verdade e o pedido não
 * chegou. É o tipo de linha que nenhum teste pega: ela está sintaticamente
 * perfeita e semanticamente errada.
 */
export const EMAIL_CONTATO = "davilucascarmo156@gmail.com";

export function linkSolicitarAcesso() {
  const assunto = encodeURIComponent("Acesso ao Painel Financeiro 6 Potes");
  return `mailto:${EMAIL_CONTATO}?subject=${assunto}`;
}
