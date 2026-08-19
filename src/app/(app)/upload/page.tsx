import type { Metadata } from "next";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { FormularioDeEnvio } from "@/features/upload/enviar-extrato/FormularioDeEnvio";
import { listarImportacoes } from "@/features/upload/enviar-extrato/listarImportacoes.service";
import { MesesImportados } from "@/features/upload/enviar-extrato/MesesImportados";
import { mesesDisponiveis } from "@/features/upload/enviar-extrato/SeletorDeMes";

export const metadata: Metadata = {
  title: "Enviar extrato · Painel Financeiro 6 Potes",
};

/**
 * A rota compõe e busca — nada mais.
 *
 * O `user_id` sai de `garantirUsuario()` e nunca de um parâmetro: é a razão de
 * `listarImportacoes` não aceitar id de fora.
 *
 * A chamada não custa uma consulta a mais — a moldura de `(app)` já garantiu o
 * usuário nesta requisição, e `obterUsuarioAtual` é embrulhado em `cache()`.
 */
export default async function UploadPage() {
  const usuario = await garantirUsuario();

  const meses = mesesDisponiveis();
  const envios = await listarImportacoes(usuario.id);

  return (
    <>
      <SectionTitle>Enviar extrato</SectionTitle>

      <FormularioDeEnvio mes={meses[0]} meses={meses} />

      <MesesImportados envios={envios} />
    </>
  );
}
