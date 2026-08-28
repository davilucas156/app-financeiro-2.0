/**
 * A formatação do projeto, escrita — porque ela já existia sem estar escrita.
 *
 * O estilo aqui **não é novo**: é o que os arquivos já faziam na maioria dos
 * casos (aspas duplas, ponto e vírgula, 2 espaços, vírgula final). O que muda é
 * que deixou de morar na cabeça de quem edita.
 *
 * ⚠ **O motivo de este arquivo existir é um acidente real.** Sem config, rodar
 * o formatador "para arrumar um arquivo" reformatava o repositório inteiro, e
 * 139 arquivos alheios entraram no commit de uma feature. Com a config e o
 * `npm run format:check`, a formatação vira uma verificação — e verificação não
 * depende de ninguém lembrar.
 */

/** @type {import("prettier").Config} */
const config = {
  // Todos iguais ao padrão do Prettier. Estão escritos assim mesmo: a graça de
  // um padrão é poder lê-lo sem abrir a documentação de outro projeto.
  printWidth: 80,
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  trailingComma: "all",

  /*
   * ⚠ **`auto` porque o Windows e o Git discordam de propósito.** O
   * `core.autocrlf=true` grava LF no repositório e devolve CRLF no disco, então
   * o mesmo arquivo é LF para o Git e CRLF para quem o lê. Fixar `lf` faria o
   * `--check` reprovar arquivos corretos; `auto` mantém o que o arquivo já tem
   * e deixa a normalização com o Git, que é de quem ela é.
   */
  endOfLine: "auto",
};

export default config;
