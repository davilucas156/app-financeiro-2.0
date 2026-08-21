import type { Metadata } from "next";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { listarRegras } from "@/features/classificacao/gerir-regras/listarRegras.service";
import { TelaDeRegras } from "@/features/classificacao/gerir-regras/TelaDeRegras";

export const metadata: Metadata = {
  title: "Regras · Painel Financeiro 6 Potes",
};

/**
 * A rota compõe e busca — nada mais, como as outras três.
 *
 * ⚠ Rota interna nova **não** é protegida automaticamente: `/regras(.*)` foi
 * acrescentada em `src/proxy.ts`, que é onde a decisão de acesso acontece.
 */
export default async function RegrasPage() {
  const usuario = await garantirUsuario();
  const { regras, categorias } = await listarRegras(usuario.id);

  return <TelaDeRegras regras={regras} categorias={categorias} />;
}
