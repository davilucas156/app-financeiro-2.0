/**
 * Limites de arquivo, num lugar só.
 *
 * Vive fora dos módulos `server-only` porque **os dois lados precisam dele**:
 * o cliente para recusar antes de enviar, o servidor para recusar de novo.
 * Duplicar o número em dois arquivos garantiria que um dia divergissem — e o
 * dia em que divergissem, o usuário veria "pode enviar" seguido de "grande
 * demais".
 *
 * Não é segredo: saber que o limite é 2 MB não ajuda ninguém a atacar nada.
 */

/** 2 MB. O extrato real tem 1,7 KB e a fatura 3,1 KB — é folga, não aperto. */
export const TAMANHO_MAXIMO = 2 * 1024 * 1024;

export const EXTENSOES_ACEITAS = [".csv"] as const;

/**
 * O `accept` do `<input type="file">`: as extensões e o MIME. Mora aqui, e não
 * no JSX, para a lista que o seletor mostra e a que `recusar` confere não
 * poderem divergir.
 */
export const ACCEPT_DO_INPUT = [...EXTENSOES_ACEITAS, "text/csv"].join(",");

/** O limite como aparece nas mensagens: "2 MB", e não o "2,0 MB" de `formatarTamanho`. */
export const LIMITE_EM_TEXTO = limiteEmTexto(TAMANHO_MAXIMO);

/**
 * Os dois campos do envio: o `name` do input e a chave de tudo que o acompanha.
 * A lista e o tipo nascem juntos, para quem itera sobre os campos (a action)
 * não poder esquecer um campo novo.
 */
export const CAMPOS_DE_ENVIO = ["conta", "cartao"] as const;
export type CampoDeEnvio = (typeof CAMPOS_DE_ENVIO)[number];

function limiteEmTexto(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return Number.isInteger(mb) ? `${mb} MB` : formatarTamanho(bytes);
}

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1).replace(".", ",")} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Devolve a mensagem de recusa, ou `null` se o arquivo serve. */
export function recusar(arquivo: {
  name: string;
  size: number;
}): string | null {
  const nome = arquivo.name.toLowerCase();

  if (!EXTENSOES_ACEITAS.some((e) => nome.endsWith(e))) {
    return `Só aceito arquivo ${EXTENSOES_ACEITAS.join(", ")}. Exporte o extrato em CSV no app do banco.`;
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    return `Esse arquivo tem ${formatarTamanho(arquivo.size)} e o limite é ${LIMITE_EM_TEXTO}.`;
  }

  // `!(> 0)` e não `=== 0`: cobre também NaN e tamanho negativo.
  if (!(arquivo.size > 0)) {
    return "Esse arquivo está vazio.";
  }

  return null;
}
