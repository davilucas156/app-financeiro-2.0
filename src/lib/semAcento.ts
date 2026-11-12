/**
 * Tira os acentos de um texto, sem mexer em caixa nem em espaços.
 *
 * O `NFD` separa cada letra acentuada na letra base mais a marca combinante, e
 * a faixa U+0300–U+036F é o bloco de marcas combinantes do latim. Escrita com
 * o escape `\u`, e não com o caractere literal, para o arquivo-fonte não
 * depender de como o editor mostra um acento invisível.
 */
export function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
