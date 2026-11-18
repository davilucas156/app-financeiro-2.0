import { ROTA_PASSOS } from "@/features/autenticacao/rotas-de-acesso";

/**
 * O contrato `?de=` da `/passos`, escrito uma vez só.
 *
 * Quem emite o link (`/upload`) e quem o recebe (`/passos`) importam daqui, em
 * vez de repetir a string `"upload"` à mão nos dois lados.
 */

/** Para onde o "← Voltar" da `/passos` pode levar. */
export type DestinoDeVoltar = "/upload" | "/dashboard";

/** O link para a `/passos`, com a origem quando ela importa para o "Voltar". */
export function hrefDosPassos(de?: "upload"): string {
  return de === undefined ? ROTA_PASSOS : `${ROTA_PASSOS}?de=${de}`;
}

/**
 * Para onde o "← Voltar" da `/passos` leva.
 *
 * ⚠ **Lista fechada, e não o valor cru.** O parâmetro vira o `href` de um link;
 * aceitar qualquer texto deixaria montar `/passos?de=https://...` e o botão
 * levaria para fora do app. Só a string `"upload"` vira `/upload`; ausente,
 * lista (`?de=a&de=b`) ou qualquer outro valor cai no painel.
 */
export function voltarParaDe(de: unknown): DestinoDeVoltar {
  return de === "upload" ? "/upload" : "/dashboard";
}
