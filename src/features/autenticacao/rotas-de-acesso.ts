/**
 * Os destinos do fluxo de acesso, num só lugar (puro: sem `server-only`, sem
 * Clerk, sem banco).
 *
 * Antes, `/cadastrar?acesso=negado` era um literal escrito no proxy e em
 * `destino-inicial.ts` e lido, por outra string, na página de `/cadastrar` —
 * três pontos ligados só por texto. Aqui moram as constantes e a leitura do
 * parâmetro, para que o proxy (que não pode importar `destino-inicial.ts`:
 * ele traz `server-only`, `auth()` e banco) e as telas concordem.
 */
export const ROTA_ENTRAR = "/entrar";
export const ROTA_ACESSO_NEGADO = "/cadastrar?acesso=negado";
export const ROTA_BEM_VINDO = "/bem-vindo";
export const ROTA_PAINEL = "/dashboard";
/** A tela que ensina a pegar o extrato; fica aqui com as outras rotas do fluxo inicial. */
export const ROTA_PASSOS = "/passos";

/** Os quatro lugares para onde `destinoDoUsuario` pode mandar alguém. */
export type DestinoInicial =
  | typeof ROTA_ENTRAR
  | typeof ROTA_ACESSO_NEGADO
  | typeof ROTA_BEM_VINDO
  | typeof ROTA_PAINEL;

/**
 * `true` quando o parâmetro `acesso` da URL é exatamente `"negado"` — o que o
 * proxy escreve em `ROTA_ACESSO_NEGADO`. Qualquer outra coisa (ausente, outro
 * valor, parâmetro repetido) é `false`.
 */
export function foiRecusado(acesso: string | string[] | undefined): boolean {
  return acesso === "negado";
}
