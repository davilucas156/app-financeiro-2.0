"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { esquecerFormato } from "./ensinarFormato.action";

/**
 * Apagar um formato ensinado (spec 11, tarefa D4).
 *
 * ## A confirmação diz o que apagar **não** faz
 *
 * ⚠ **Apagar formato não apaga lançamento.** Receita de leitura e comida são
 * coisas diferentes: o formato descreve como ler o arquivo, os lançamentos são
 * o que foi lido. Desfazer importação já existe na `/upload` desde a spec 02, e
 * é lá que continua.
 *
 * Sem esta frase, "apagar" ao lado de um cartão que fala de extratos parece
 * apagar os extratos — e a pessoa não arrisca, ou arrisca achando que perdeu o
 * mês.
 *
 * ⚠ **O que a confirmação não diz é quantos envios usaram este formato**, e a
 * ausência é deliberada: esse número exigiria uma coluna `formato_id` em
 * `imports`, contra a promessa desta spec de não alterar tabela existente. A
 * consequência real — voltar a pedir para ser ensinado — é dizível sem ele.
 */
export function EsquecerFormato({ id, nome }: { id: string; nome: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [apagando, transicao] = useTransition();

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="mt-3 inline-flex min-h-11 items-center font-mono text-3xs font-bold tracking-wider text-dim uppercase transition-colors hover:text-red"
      >
        Esquecer este formato
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-pote border border-red/20 bg-red/8 p-3">
      <p className="text-xs leading-relaxed text-text">
        Esquecer <strong className="font-bold">{nome}</strong>?
      </p>
      <p className="mt-1.5 text-3xs leading-relaxed text-dim">
        Os lançamentos que ele já importou <strong>continuam onde estão</strong>
        . O que muda é daqui para a frente: arquivos desse banco voltam a pedir
        para ser ensinados.
      </p>

      {erro && (
        <p role="alert" className="mt-2 text-3xs text-red">
          {erro}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          loading={apagando}
          onClick={() =>
            transicao(() => {
              void esquecerFormato(id).then((r) => {
                if (!r.ok) setErro(r.erro ?? "Não deu para esquecer.");
              });
            })
          }
        >
          Esquecer
        </Button>
        <Button variant="secondary" onClick={() => setConfirmando(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
