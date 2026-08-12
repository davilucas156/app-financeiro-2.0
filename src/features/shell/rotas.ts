/**
 * As três rotas internas do app.
 *
 * Um lugar só: a navegação lê daqui, e qualquer breadcrumb ou atalho futuro
 * também deve ler. Acrescentar uma rota interna é acrescentar uma entrada
 * aqui, não editar um `<nav>` à mão.
 */
export type RotaInterna = {
  href: "/dashboard" | "/upload" | "/revisao";
  rotulo: string;
  /** Descrição para leitor de tela, já que o rótulo é curto. */
  descricao: string;
};

export const ROTAS_INTERNAS: RotaInterna[] = [
  { href: "/dashboard", rotulo: "Painel", descricao: "Painel do mês" },
  { href: "/upload", rotulo: "Enviar", descricao: "Enviar extrato" },
  { href: "/revisao", rotulo: "Revisar", descricao: "Revisar transações" },
];
