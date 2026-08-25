import type { Metadata } from "next";
import Link from "next/link";
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

      {/*
        ⚠ **O caminho que mais importa até a `/passos`** (spec 09, C2), e o
        menos óbvio. O gesto de baixar o arquivo se repete uma vez por mês, e
        onze meses depois ninguém lembra em que menu do banco ele ficava. Um
        tutorial que só existe no primeiro acesso não está lá na hora em que se
        precisa dele.
      */}
      <p className="text-[11px] leading-relaxed text-dim">
        Não lembra como baixar o arquivo no banco?{" "}
        <Link href="/passos?de=upload" className="underline underline-offset-4">
          O passo a passo
        </Link>
        .
      </p>

      <div className="mt-4">
        <FormularioDeEnvio mes={meses[0]} meses={meses} />
      </div>

      <MesesImportados envios={envios} />
    </>
  );
}
