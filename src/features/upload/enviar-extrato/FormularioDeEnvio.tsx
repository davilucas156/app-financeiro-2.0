"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CampoDeArquivo } from "@/features/upload/enviar-extrato/CampoDeArquivo";
import { ResumoDaImportacao } from "@/features/upload/enviar-extrato/ResumoDaImportacao";
import { SeletorDeMes } from "@/features/upload/enviar-extrato/SeletorDeMes";
import { enviarExtrato } from "@/features/upload/importar-extrato/importarExtrato.action";
import type {
  CampoDeEnvio,
  ResultadoImportacao,
} from "@/features/upload/importar-extrato/importarExtrato.service";
import { formatarTamanho, recusar } from "@/features/upload/limites";

/**
 * O formulário de verdade (tarefa D3).
 *
 * É o **único** pedaço de cliente desta tela. A lista de meses já importados
 * continua no servidor, e o arquivo continua sendo lido lá — daqui saem
 * bytes, nunca lançamentos
 * (`references/architecture.md`, Thin Client / Fat Server).
 *
 * O `?estado=` que a fase B usava para revisar as variações saiu: agora os
 * estados acontecem de verdade.
 */

type Escolhido = { nome: string; tamanho: string } | null;

const ROTULO: Record<CampoDeEnvio, string> = {
  conta: "Extrato da conta",
  cartao: "Fatura do cartão",
};

export function FormularioDeEnvio({
  mes,
  meses,
}: {
  mes: string;
  meses: string[];
}) {
  const [resultado, agir, enviando] = useActionState<
    ResultadoImportacao | null,
    FormData
  >(enviarExtrato, null);

  const [escolhidos, setEscolhidos] = useState<Record<CampoDeEnvio, Escolhido>>({
    conta: null,
    cartao: null,
  });
  const [erros, setErros] = useState<Record<CampoDeEnvio, string | null>>({
    conta: null,
    cartao: null,
  });

  function aoEscolher(campo: CampoDeEnvio, arquivo: File | undefined) {
    if (!arquivo) {
      setEscolhidos((e) => ({ ...e, [campo]: null }));
      setErros((e) => ({ ...e, [campo]: null }));
      return;
    }

    // Recusa aqui é **conveniência**: evita subir 3 MB para o servidor dizer
    // não. Quem de fato barra é o servidor, que repete a checagem.
    const problema = recusar(arquivo);

    setErros((e) => ({ ...e, [campo]: problema }));
    setEscolhidos((e) => ({
      ...e,
      [campo]: problema
        ? null
        : { nome: arquivo.name, tamanho: formatarTamanho(arquivo.size) },
    }));
  }

  const temArquivo = Boolean(escolhidos.conta || escolhidos.cartao);
  const erroDoServidor = resultado && !resultado.ok ? resultado.erro : null;
  const sucesso = resultado?.ok ? resultado : null;
  const jaImportados = sucesso?.arquivos.filter((a) => a.jaImportado) ?? [];
  const gravados = sucesso?.arquivos.filter((a) => !a.jaImportado) ?? [];

  return (
    <>
      <form action={agir}>
        <Card>
          <SeletorDeMes valor={mes} opcoes={meses} desabilitado={enviando} />

          <div className="mt-5 space-y-3">
            <CampoDeArquivo
              nome="conta"
              rotulo={ROTULO.conta}
              descricao="CSV do Inter, com Data Lançamento, Descrição, Valor e Saldo."
              estado={
                erros.conta ? "erro" : enviando ? "enviando" : escolhidos.conta ? "escolhido" : "vazio"
              }
              arquivo={escolhidos.conta ?? undefined}
              erro={erros.conta ?? undefined}
              onArquivo={(a) => aoEscolher("conta", a)}
            />

            <CampoDeArquivo
              nome="cartao"
              rotulo={ROTULO.cartao}
              descricao="CSV da fatura. Dá para enviar só a conta e mandar o cartão depois."
              opcional
              estado={
                erros.cartao ? "erro" : enviando ? "enviando" : escolhidos.cartao ? "escolhido" : "vazio"
              }
              arquivo={escolhidos.cartao ?? undefined}
              erro={erros.cartao ?? undefined}
              onArquivo={(a) => aoEscolher("cartao", a)}
            />
          </div>

          {/* `disabled` enquanto envia é a primeira camada contra duplo toque.
              As outras duas são os dois únicos do banco (C1/C2), porque
              cliente desabilitado não é garantia de nada. */}
          <Button
            type="submit"
            loading={enviando}
            disabled={!temArquivo}
            className="mt-5 w-full"
          >
            {enviando ? "Lendo o extrato…" : "Importar"}
          </Button>

          <p className="mt-3 text-center font-mono text-3xs leading-relaxed text-dim2">
            O arquivo é lido no servidor. Nada é enviado para fora daqui.
          </p>
        </Card>
      </form>

      {erroDoServidor && (
        <Card role="alert" className="mt-3 border-red/20 bg-red/8">
          <p className="text-xs font-bold text-red">Não deu para importar.</p>
          <p className="mt-1.5 text-xs leading-relaxed text-dim">
            {erroDoServidor}
          </p>
        </Card>
      )}

      {jaImportados.length > 0 && (
        <Card role="alert" className="mt-3 border-blue/20 bg-blue/8">
          <p className="text-xs font-bold text-blue">
            {jaImportados.length === 1
              ? "Esse arquivo já tinha sido importado."
              : "Esses arquivos já tinham sido importados."}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-dim">
            Reconheci pelo conteúdo, não pelo nome — então renomear não engana.
            Nada foi duplicado. Se quiser reimportar, desfaça o envio anterior
            primeiro.
          </p>
        </Card>
      )}

      {sucesso && gravados.length > 0 && (
        <ResumoDaImportacao
          dados={{
            arquivos: gravados.map((a) => ({
              rotulo: ROTULO[a.campo],
              entraram: a.entraram,
              ignoradas: a.ignoradas,
            })),
            excluidos: sucesso.excluidos,
            revisao: sucesso.revisao,
            classificados: sucesso.classificados,
            pendentes: sucesso.pendentes,
            conferir: sucesso.conferir,
          }}
        />
      )}
    </>
  );
}
