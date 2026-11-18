import { FORMATOS } from "./formatos";

/**
 * Os bancos que o app lê de fábrica, com o nome de cada arquivo que lê deles.
 *
 * Puro de propósito: é a única derivação "banco → arquivos" a partir de
 * `FORMATOS`. A `/formatos` e a `/passos` precisam da mesma lista, e escrevê-la
 * duas vezes deixaria uma das telas prometer um banco que a outra já não lista.
 *
 * Ordem alfabética (pt-BR) por banco, sem repetir banco; os arquivos de cada
 * banco seguem a ordem em que aparecem em `FORMATOS`.
 */
export function bancosDeCodigo(): { banco: string; arquivos: string[] }[] {
  const bancos = [...new Set(FORMATOS.map((f) => f.banco))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );

  return bancos.map((banco) => ({
    banco,
    arquivos: FORMATOS.filter((f) => f.banco === banco).map((f) => f.nome),
  }));
}
