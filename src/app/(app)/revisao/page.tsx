import type { Metadata } from "next";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { listarPendentes } from "@/features/classificacao/revisar-lancamento/listarPendentes.service";
import { TelaDeRevisao } from "@/features/classificacao/revisar-lancamento/TelaDeRevisao";

export const metadata: Metadata = {
  title: "Revisar · Painel Financeiro 6 Potes",
};

/**
 * A rota compõe e busca — nada mais.
 *
 * O `user_id` sai de `garantirUsuario()` e nunca de um parâmetro: é a razão de
 * `listarPendentes` não aceitar id de fora.
 *
 * O protótipo atrás de `?estado=` e o andaime da fase B saíram aqui, junto com
 * `dadosFalsos.ts`. Tela que lê o banco não precisa de dado inventado, e
 * deixar os dois convivendo garantiria que um dia alguém veria o falso
 * achando que era o real.
 */
export default async function RevisaoPage() {
  const usuario = await garantirUsuario();
  const { pendentes, categorias } = await listarPendentes(usuario.id);

  return (
    <TelaDeRevisao
      pendentes={pendentes}
      categorias={categorias}
      mes={pendentes[0]?.data.slice(0, 7) ?? ""}
    />
  );
}
