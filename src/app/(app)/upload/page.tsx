import type { Metadata } from "next";
import Link from "next/link";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { hrefDosPassos } from "@/features/ajuda/pegar-o-extrato/hrefDosPassos";
import { FormularioDeEnvio } from "@/features/upload/enviar-extrato/FormularioDeEnvio";
import { listarImportacoes } from "@/features/upload/enviar-extrato/listarImportacoes.service";
import { MesesImportados } from "@/features/upload/enviar-extrato/MesesImportados";
import { mesesDisponiveis } from "@/features/upload/enviar-extrato/mesesDisponiveis";

export const metadata: Metadata = {
  title: "Enviar extrato",
};

/**
 * A rota compõe e busca — nada mais.
 *
 * O `user_id` sai de `garantirUsuario()` e nunca de um parâmetro: a página é o
 * único chamador de `listarImportacoes`, e é ela que lhe passa o `usuario.id`.
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
        ⚠ **O caminho que mais importa até a `/passos`** (spec 09, C2) — o
        porquê está no docblock de `passos/page.tsx`.
      */}
      <p className="text-2xs leading-relaxed text-dim">
        Não lembra como baixar o arquivo no banco?{" "}
        <Link
          href={hrefDosPassos("upload")}
          className="underline underline-offset-4"
        >
          O passo a passo
        </Link>
        .
      </p>

      <div className="mt-4">
        <FormularioDeEnvio mes={meses[0]} meses={meses} />
      </div>

      <MesesImportados envios={envios} />

      {/*
        ⚠ **O caminho até a `/formatos` fica no rodapé, e não no topo** (spec
        11). Quem abre esta tela veio enviar um arquivo, não administrar
        formatos — e o momento de mexer neles é depois de um envio dar errado,
        que é onde a mensagem de erro já oferece ensinar. Aqui embaixo o link
        serve a quem quer conferir ou apagar o que ensinou.
      */}
      <p className="mt-8 text-2xs leading-relaxed text-dim">
        <Link href="/formatos" className="underline underline-offset-4">
          Os formatos que eu leio
        </Link>{" "}
        — e os que você me ensinou.
      </p>
    </>
  );
}
