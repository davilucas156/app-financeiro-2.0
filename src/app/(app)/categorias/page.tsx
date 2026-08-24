import type { Metadata } from "next";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { TelaDeCategorias } from "@/features/categorias/gerir-categorias/TelaDeCategorias";
import {
  CATEGORIAS_FALSAS,
  POTES_FALSOS,
} from "@/features/categorias/gerir-categorias/dadosFalsos";

export const metadata: Metadata = {
  title: "Categorias · Painel Financeiro 6 Potes",
};

/**
 * `/categorias` — a tela de arrumação (tarefa C1 da spec 05).
 *
 * ⛔ **Protótipo.** Lê `dadosFalsos.ts` e nada aqui grava. A D1 troca a fonte
 * pelo serviço de verdade e apaga a faixa de aviso junto — mesma mecânica do
 * `/painel` da spec 04, que morreu inteiro quando o `/dashboard` ficou pronto.
 *
 * ## `garantirUsuario()` mesmo sem ler nada dele
 *
 * A rota já está protegida no `proxy.ts`, e o protótipo não consulta o banco.
 * A chamada fica porque a D1 vai precisar dela e porque uma tela de `(app)`
 * que não garante usuário é uma tela que alguém copia amanhã.
 *
 * **Fora da barra de navegação** — decisão do Davi na pendência 3: são 4 itens
 * desde a D9, e a 360px um quinto deixaria 72px cada.
 */
export default async function CategoriasPage() {
  await garantirUsuario();

  return (
    <TelaDeCategorias
      potes={POTES_FALSOS}
      categorias={CATEGORIAS_FALSAS}
      prototipo
    />
  );
}
