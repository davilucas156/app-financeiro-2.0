import { estaNaListaDeEmails, normalizarEmail } from "@/lib/listaDeEmails";

/**
 * Quem tem convite para usar o app.
 *
 * A lista vive em `EMAILS_CONVIDADOS`, **sem** prefixo público: quem tem
 * acesso não é informação que precise ir para o navegador
 * (`references/architecture.md`, Thin Client / Fat Server).
 *
 * Não usa `import "server-only"` porque este módulo também roda no bundle do
 * proxy, que é servidor mas não é React Server Component. A garantia aqui é
 * a ausência do prefixo `NEXT_PUBLIC_`: sem ele, a variável não chega ao
 * cliente.
 */

export function emailsConvidados(): string[] {
  return (process.env.EMAILS_CONVIDADOS ?? "")
    .split(",")
    .map(normalizarEmail)
    .filter(Boolean); // descarta vírgulas sobrando
}

/**
 * **Lista vazia = ninguém entra.** Escolha deliberada: se a variável sumir
 * num deploy, o app tranca em vez de abrir para todo mundo. Um app financeiro
 * que falha aberto é pior do que um que falha fechado.
 */
export function estaConvidado(email: string | null | undefined): boolean {
  return estaNaListaDeEmails(email, process.env.EMAILS_CONVIDADOS);
}
