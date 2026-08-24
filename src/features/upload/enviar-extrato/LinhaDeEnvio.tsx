"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { desfazerEnvio } from "@/features/upload/desfazer-envio/desfazerEnvio.action";
import type { ResultadoDesfazer } from "@/features/upload/desfazer-envio/desfazerEnvio.service";
import type { EnvioExibido } from "@/features/upload/enviar-extrato/exibirEnvio";
import {
  LinhasIgnoradas,
  rotuloDeIgnoradas,
} from "@/features/upload/enviar-extrato/LinhasIgnoradas";
import { rotuloDeMes } from "@/lib/mes";

/**
 * Uma linha do histórico, com o desfazer ligado (tarefas B3 e D5).
 *
 * É o **único** pedaço de cliente da lista, e existe por um motivo só: lembrar
 * se esta linha está pedindo confirmação. Isso é estado de tela — não existe no
 * servidor e não vale um parâmetro na URL.
 *
 * Nada de lógica aqui. Quem apaga é a server action, com o `user_id` da
 * sessão; daqui sai apenas o id do envio.
 */
export function LinhaDeEnvio({ envio }: { envio: EnvioExibido }) {
  const [confirmando, setConfirmando] = useState(false);
  const [resultado, agir, apagando] = useActionState<
    ResultadoDesfazer | null,
    FormData
  >(desfazerEnvio, null);

  const mes = rotuloDeMes(envio.mes);
  const erro = resultado && !resultado.ok ? resultado.erro : null;

  return (
    <li className="rounded-card border border-border bg-card px-4 py-3.5">
      {/* Empilha no celular: mês, arquivo e botão lado a lado em 360px
          espremeriam o nome do arquivo até sumir. */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-bold">{mes}</span>
        <span className="font-mono text-[9px] tracking-[1px] text-dim2 uppercase">
          {envio.rotuloDeOrigem}
        </span>
      </div>

      <p className="mt-1 truncate font-mono text-[10px] text-dim2">
        {envio.nomeArquivo}
      </p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-dim">
          {envio.lancamentos} lançamentos · {envio.enviadoEm}
        </span>

        {!confirmando && (
          <Button
            variant="secondary"
            className="shrink-0 px-3.5 text-xs"
            onClick={() => setConfirmando(true)}
            aria-label={`Desfazer a importação de ${mes}, ${envio.lancamentos} lançamentos`}
          >
            Desfazer
          </Button>
        )}
      </div>

      {/*
        As linhas que ficaram de fora, com o motivo — meses depois, não só no
        instante do envio. Fechado por padrão: é informação de conferência, não
        o assunto principal da linha.

        `<details>` nativo e não estado meu: abre e fecha sem JavaScript, e o
        leitor de tela já sabe anunciar que é uma seção expansível.
      */}
      {envio.ignoradas.length > 0 && (
        <details className="mt-3 border-t border-border pt-3">
          <summary className="cursor-pointer font-mono text-[11px] text-gold marker:text-dim2">
            {rotuloDeIgnoradas(envio.ignoradas.length)}
          </summary>
          <LinhasIgnoradas linhas={envio.ignoradas} className="mt-2" />
        </details>
      )}

      {confirmando && (
        <form action={agir}>
          {/*
            O id viaja no formulário, e não numa variável de closure, para o
            servidor receber sempre o mesmo dado — venha o envio de onde vier.
            Ele não autoriza nada sozinho: quem decide é o `user_id` da sessão.
          */}
          <input type="hidden" name="importId" value={envio.id} />

          {/*
            A confirmação diz **o que** vai sumir, com número, mês e arquivo.
            Um "tem certeza?" genérico pede certeza sem dar a informação que
            ela exige.
          */}
          <div
            role="alert"
            className="mt-3 rounded-card border border-red/20 bg-red/8 p-4"
          >
            <p className="text-xs font-bold text-red">
              Apagar {envio.lancamentos} lançamentos de {mes}?
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-dim">
              Vieram de {envio.nomeArquivo}, enviado em {envio.enviadoEm}. Só
              estes somem — o que veio de outros arquivos fica. Dá para enviar o
              mesmo arquivo de novo depois.
            </p>

            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                className="text-xs"
                disabled={apagando}
                onClick={() => setConfirmando(false)}
              >
                Cancelar
              </Button>

              {/* `loading` desabilita: o duplo toque não dispara duas vezes.
                  Se ainda assim disparar, a segunda deleção não acha nada. */}
              <Button
                type="submit"
                loading={apagando}
                className="bg-red text-bg enabled:hover:bg-red/80 text-xs"
              >
                {apagando ? "Apagando…" : "Apagar"}
              </Button>
            </div>

            {erro && (
              <p className="mt-3 text-xs leading-relaxed text-red">{erro}</p>
            )}
          </div>
        </form>
      )}
    </li>
  );
}
