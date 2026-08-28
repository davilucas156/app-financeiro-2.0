import type { Metadata } from "next";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { listarParaGerir } from "@/features/categorias/gerir-categorias/listarParaGerir.service";
import { TelaDeCategorias } from "@/features/categorias/gerir-categorias/TelaDeCategorias";
import { rendaDoMes } from "@/features/painel/renda-do-mes/rendaDoMes.service";
import { mesAtual } from "@/lib/mes";

export const metadata: Metadata = {
  title: "Categorias · Painel Financeiro 6 Potes",
};

/**
 * `/categorias` — a tela de arrumação (tarefas C1 e D1).
 *
 * A rota compõe e busca — nada mais. O `user_id` sai de `garantirUsuario()` e
 * nunca de um parâmetro: é a razão de `listarParaGerir` não aceitar id de fora.
 *
 * O protótipo e o `dadosFalsos.ts` saíram aqui, junto com a faixa que os
 * anunciava — mesma mecânica do `/painel` da spec 04, que morreu inteiro quando
 * o `/dashboard` ficou pronto. Tela que lê o banco não precisa de dado
 * inventado, e deixar os dois convivendo garantiria que um dia alguém veria o
 * falso achando que era o real.
 *
 * **Fora da barra de navegação** — decisão do Davi na pendência 3: são 4 itens
 * desde a D9, e a 360px um quinto deixaria 72px cada.
 */
export default async function CategoriasPage() {
  const usuario = await garantirUsuario();

  /*
   * ⚠ **Uma consulta a mais, e ela paga por si** (spec 13, C3).
   *
   * A tela não mostra o valor da renda — só precisa saber se **existe**. Sem
   * ela, `metaDoPote` devolve `null` para todo pote: o percentual fica lá,
   * correto, e invisível. Quem mexeu na meta e não viu nada acontecer conclui
   * que o app não salvou.
   *
   * As duas consultas são independentes, então vão juntas.
   */
  const [{ potes, categorias }, renda] = await Promise.all([
    listarParaGerir(usuario.id),
    rendaDoMes(usuario.id, mesAtual()),
  ]);

  return (
    <TelaDeCategorias
      potes={potes}
      categorias={categorias}
      temRenda={renda !== null}
    />
  );
}
