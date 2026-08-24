import type { Metadata } from "next";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { listarParaGerir } from "@/features/categorias/gerir-categorias/listarParaGerir.service";
import { TelaDeCategorias } from "@/features/categorias/gerir-categorias/TelaDeCategorias";

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
  const { potes, categorias } = await listarParaGerir(usuario.id);

  return <TelaDeCategorias potes={potes} categorias={categorias} />;
}
