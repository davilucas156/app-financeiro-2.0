/**
 * A renda declarada, como a tela a vê (tarefas C1 e D2).
 *
 * ⚠ **Num arquivo puro, e não dentro do serviço.** `rendaDoMes.service.ts` tem
 * `import "server-only"`, e `CampoDeRenda.tsx` é componente de cliente. Um
 * `import type` de lá seria apagado na compilação e provavelmente funcionaria —
 * "provavelmente" não é o padrão desta base, que trata a barreira do
 * `server-only` como erro de compilação e não como recomendação.
 */
export type RendaDeclarada = {
  centavos: number;
  /** O mês em que ela foi de fato informada. */
  mesDeOrigem: string;
  /**
   * Veio de um mês anterior, não deste.
   *
   * É o que deixa a tela dizer "herdada de junho" — a defesa contra a renda
   * envelhecer em silêncio depois de um aumento.
   */
  herdada: boolean;
};
