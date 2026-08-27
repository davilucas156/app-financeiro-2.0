import type { Metadata } from "next";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { formatosNaTela } from "@/features/upload/formatos-do-usuario/formatosDoUsuario.service";
import { TelaDeFormatos } from "@/features/upload/formatos-do-usuario/TelaDeFormatos";

export const metadata: Metadata = {
  title: "Formatos · Painel Financeiro 6 Potes",
};

/**
 * `/formatos` — o que o app aprendeu a ler (spec 11, tarefa D4).
 *
 * **Fora da barra de navegação**, como `/categorias`, `/configuracoes` e
 * `/comparativo`: são 4 itens desde a D9 da spec 03, e a 360px um quinto
 * derrubaria o alvo de toque abaixo dos 44px. O caminho até aqui é o `/upload`,
 * que é onde formato importa.
 *
 * ⚠ **A rota entrou à mão no `src/proxy.ts`** — rota interna nova não é
 * protegida automaticamente, e esta lê e escreve linhas por `user_id`.
 */
export default async function FormatosPage() {
  const usuario = await garantirUsuario();

  return <TelaDeFormatos formatos={await formatosNaTela(usuario.id)} />;
}
