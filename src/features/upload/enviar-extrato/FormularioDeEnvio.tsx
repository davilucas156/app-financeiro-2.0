"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CampoDeArquivo } from "@/features/upload/enviar-extrato/CampoDeArquivo";
import { PainelDeMapeamento } from "@/features/upload/formatos-do-usuario/PainelDeMapeamento";
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

/**
 * ⚠ **O `File` fica guardado, e nao so o nome** (spec 11).
 *
 * E o que permite ensinar um formato sem pedir o arquivo de novo: o objeto
 * vive na memoria desta aba, e o painel de mapeamento o reenvia a cada ajuste.
 * Sem isto, quem recebe "nao reconheci" teria de escolher o arquivo outra vez
 * -- que e onde a spec dizia que a pessoa desiste.
 */
type Escolhido = { nome: string; tamanho: string; arquivo: File } | null;

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

  const [escolhidos, setEscolhidos] = useState<Record<CampoDeEnvio, Escolhido>>(
    {
      conta: null,
      cartao: null,
    },
  );
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
        : {
            nome: arquivo.name,
            tamanho: formatarTamanho(arquivo.size),
            arquivo,
          },
    }));
  }

  const formRef = useRef<HTMLFormElement>(null);
  const [ensinando, setEnsinando] = useState(false);

  const temArquivo = Boolean(escolhidos.conta || escolhidos.cartao);
  const erroDoServidor = resultado && !resultado.ok ? resultado.erro : null;
  const sucesso = resultado?.ok ? resultado : null;
  const jaImportados = sucesso?.arquivos.filter((a) => a.jaImportado) ?? [];
  const gravados = sucesso?.arquivos.filter((a) => !a.jaImportado) ?? [];

  /*
   * ⚠ **Só o erro de reconhecimento vira convite para ensinar.** Campo trocado
   * ou arquivo grande demais não se resolvem com um formato novo, e oferecer o
   * botão ali mandaria a pessoa mapear um arquivo que o app já sabe ler.
   */
  const podeEnsinar =
    erroDoServidor !== null && /reconheci|faltar/i.test(erroDoServidor);

  const paraEnsinar =
    escolhidos.conta?.arquivo ?? escolhidos.cartao?.arquivo ?? null;

  return (
    <>
      <form ref={formRef} action={agir}>
        <Card>
          <SeletorDeMes valor={mes} opcoes={meses} desabilitado={enviando} />

          <div className="mt-5 space-y-3">
            <CampoDeArquivo
              nome="conta"
              rotulo={ROTULO.conta}
              descricao="CSV do Inter, com Data Lançamento, Descrição, Valor e Saldo."
              estado={
                erros.conta
                  ? "erro"
                  : enviando
                    ? "enviando"
                    : escolhidos.conta
                      ? "escolhido"
                      : "vazio"
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
                erros.cartao
                  ? "erro"
                  : enviando
                    ? "enviando"
                    : escolhidos.cartao
                      ? "escolhido"
                      : "vazio"
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

      {erroDoServidor && !ensinando && (
        <Card role="alert" className="mt-3 border-red/20 bg-red/8">
          <p className="text-xs font-bold text-red">Não deu para importar.</p>
          <p className="mt-1.5 text-xs leading-relaxed text-dim">
            {erroDoServidor}
          </p>

          {/*
            ⚠ **O beco sem saída ganha porta** (spec 11, tarefa D3).
            Até aqui, "não reconheci este arquivo" era o fim: o extrato não
            entrava, o mês não fechava, e o app não servia para quem tem conta
            em outro banco. O botão só aparece quando o app **não reconheceu** o
            arquivo — erro de mês ou de campo trocado não se resolve ensinando.
          */}
          {podeEnsinar && (
            <>
              <p className="mt-3 text-xs leading-relaxed text-dim">
                Se este arquivo é de outro banco, dá para me ensinar a lê-lo.
                Faço isso uma vez e reconheço sozinho a partir do próximo envio.
              </p>
              <Button
                variant="secondary"
                onClick={() => setEnsinando(true)}
                className="mt-4"
              >
                Ensinar o app a ler este arquivo
              </Button>
            </>
          )}
        </Card>
      )}

      {ensinando && paraEnsinar && (
        <PainelDeMapeamento
          arquivo={paraEnsinar}
          aoDesistir={() => setEnsinando(false)}
          /*
           * ⚠ **Salvar não termina o trabalho: importar termina.** A pessoa veio
           * subir um extrato, não configurar um app. Depois de gravar o formato,
           * o formulário reenvia o mesmo arquivo — que agora é reconhecido.
           */
          aoSalvar={() => {
            setEnsinando(false);
            formRef.current?.requestSubmit();
          }}
        />
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
