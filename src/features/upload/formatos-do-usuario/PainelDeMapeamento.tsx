"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { emReais } from "@/lib/dinheiro";
import {
  FORMATOS_DE_DATA,
  FORMATOS_DE_NUMERO,
  ROTULOS_DE_DATA,
  ROTULOS_DE_NUMERO,
} from "@/features/upload/ler-arquivo/dialetos";
import type { Papel } from "@/features/upload/ler-arquivo/formatos";
import type { Palpite } from "@/features/upload/ler-arquivo/palpite";
import type { Previa } from "@/features/upload/ler-arquivo/previa";
import {
  ensinarFormato,
  palpitarFormato,
  preverMapeamento,
} from "./ensinarFormato.action";
import {
  PAPEIS_OBRIGATORIOS,
  ROTULOS_DO_PAPEL,
  SEPARADORES_VALIDOS,
} from "./formatoDoUsuario";

/**
 * Ensinar o app a ler um arquivo (spec 11, tarefas D1 e D2).
 *
 * ## Ela acontece aqui dentro, e não numa rota
 *
 * ⚠ **É consequência direta da decisão estrutural da spec**: o arquivo fica no
 * navegador, num objeto `File` que não sobrevive a uma navegação. Uma rota
 * `/formatos/novo` teria de pedir o arquivo **de novo** — e a spec dizia, sobre
 * o caminho até aqui, que _"reenviar seria a primeira desistência"_.
 *
 * Então o mapeamento abre no lugar da mensagem de erro, com o arquivo que a
 * pessoa já escolheu. A `/formatos` existe para ver e apagar o que foi
 * ensinado; ensinar acontece onde o arquivo está.
 *
 * ## Toda resposta chega pré-preenchida
 *
 * ⚠ **Não é conforto, é a funcionalidade.** São sete perguntas técnicas
 * seguidas — separador, aspas, cabeçalho, três colunas, data, número, sinal.
 * Em branco, ninguém termina. O `palpitar` responde as sete antes de a tela
 * aparecer, e o que resta é conferir.
 *
 * ## O sinal se decide olhando a consequência, não a pergunta
 *
 * A frase "R$ 4.812,00 de gasto e R$ 0,00 de entrada" muda **ao vivo** quando a
 * marcação troca. É a defesa contra o erro que faria todo gasto do cartão virar
 * receita — e ela funciona para quem não sabe o que é convenção de sinal.
 */
export function PainelDeMapeamento({
  arquivo,
  aoDesistir,
  aoSalvar,
}: {
  arquivo: File;
  aoDesistir: () => void;
  /** Chamado depois de salvar, para o `/upload` poder reenviar o arquivo. */
  aoSalvar: () => void;
}) {
  const [palpite, setPalpite] = useState<Palpite | null>(null);
  const [cabecalho, setCabecalho] = useState<string[]>([]);
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [nome, setNome] = useState("");
  const [banco, setBanco] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pensando, transicao] = useTransition();

  /*
   * ⚠ **O arquivo vai junto em toda chamada**, e é o que permite os bytes nunca
   * tocarem disco. Ele já está na memória desta aba; reenviá-lo custa até 2 MB
   * por ajuste, e os ajustes são poucos e deliberados.
   */
  function comArquivo(mapeamento?: Palpite): FormData {
    const fd = new FormData();
    fd.set("arquivo", arquivo);
    if (mapeamento) fd.set("mapeamento", JSON.stringify(mapeamento));
    return fd;
  }

  useEffect(() => {
    let vivo = true;

    void palpitarFormato(comArquivo()).then((r) => {
      if (!vivo) return;
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      setPalpite(r.palpite);
      setCabecalho(r.cabecalho);
      setPrevia(r.previa);
      setNome(sugerirNome(r.palpite.origem));
    });

    return () => {
      vivo = false;
    };
    // Só ao receber o arquivo: reagir a cada mudança relançaria o palpite por
    // cima do que a pessoa já corrigiu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arquivo]);

  function mexer(novo: Palpite) {
    setPalpite(novo);
    setErro(null);

    transicao(() => {
      void preverMapeamento(comArquivo(novo)).then((r) => {
        if (r.ok) {
          setCabecalho(r.cabecalho);
          setPrevia(r.previa);
        }
      });
    });
  }

  function salvar() {
    if (!palpite) return;

    const fd = comArquivo({ ...palpite });
    fd.set("mapeamento", JSON.stringify({ ...palpite, nome, banco }));

    transicao(() => {
      void ensinarFormato(fd).then((r) => {
        if (r.ok) aoSalvar();
        else setErro(r.erro);
      });
    });
  }

  if (erro && !palpite) {
    return (
      <Card role="alert" className="mt-3 border-red/20 bg-red/8">
        <p className="text-xs leading-relaxed text-red">{erro}</p>
        <Button variant="secondary" onClick={aoDesistir} className="mt-4">
          Voltar
        </Button>
      </Card>
    );
  }

  if (!palpite) {
    return (
      <Card className="mt-3">
        <p className="text-xs text-dim">Lendo o arquivo…</p>
      </Card>
    );
  }

  return (
    <Card className="mt-3">
      <p className="font-mono text-4xs font-bold tracking-[1.5px] text-dim uppercase">
        Ensinar este arquivo
      </p>
      <p className="mt-2 text-xs leading-relaxed text-dim">
        Já tentei adivinhar tudo. Confira o que está abaixo — se estiver certo,
        é só salvar.
      </p>

      <Consequencia previa={previa} pensando={pensando} />

      <Grupo titulo="Como o arquivo separa as colunas">
        <div className="flex flex-wrap gap-2">
          {SEPARADORES_VALIDOS.map((s) => (
            <Opcao
              key={s}
              marcada={palpite.dialeto.separador === s}
              onClick={() =>
                mexer({
                  ...palpite,
                  dialeto: { ...palpite.dialeto, separador: s },
                })
              }
            >
              {rotuloDoSeparador(s)}
            </Opcao>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Qual coluna é o quê">
        <div className="space-y-2">
          {(["data", "descricao", "valor", "saldo"] as Papel[]).map((papel) => (
            <EscolhaDeColuna
              key={papel}
              papel={papel}
              cabecalho={cabecalho}
              escolhida={palpite.colunas[papel]}
              onEscolher={(i) =>
                mexer({
                  ...palpite,
                  colunas: comColuna(palpite.colunas, papel, i),
                })
              }
            />
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Como ele escreve data e dinheiro">
        <div className="space-y-2">
          <Seletor
            rotulo="Data"
            valor={palpite.formatoData}
            opcoes={FORMATOS_DE_DATA.map((f) => ({
              valor: f,
              rotulo: ROTULOS_DE_DATA[f],
            }))}
            onTrocar={(v) =>
              mexer({ ...palpite, formatoData: v as Palpite["formatoData"] })
            }
          />
          <Seletor
            rotulo="Dinheiro"
            valor={palpite.formatoNumero}
            opcoes={FORMATOS_DE_NUMERO.map((f) => ({
              valor: f,
              rotulo: ROTULOS_DE_NUMERO[f],
            }))}
            onTrocar={(v) =>
              mexer({
                ...palpite,
                formatoNumero: v as Palpite["formatoNumero"],
              })
            }
          />
        </div>
      </Grupo>

      <Grupo titulo="Que arquivo é este">
        <div className="flex flex-wrap gap-2">
          <Opcao
            marcada={palpite.origem === "csv_conta"}
            onClick={() => mexer({ ...palpite, origem: "csv_conta" })}
          >
            Extrato da conta
          </Opcao>
          <Opcao
            marcada={palpite.origem === "csv_cartao"}
            onClick={() => mexer({ ...palpite, origem: "csv_cartao" })}
          >
            Fatura do cartão
          </Opcao>
        </div>
      </Grupo>

      <Grupo titulo="O que o sinal de menos quer dizer">
        <div className="flex flex-wrap gap-2">
          <Opcao
            marcada={palpite.sinalNegativo === "saida"}
            onClick={() => mexer({ ...palpite, sinalNegativo: "saida" })}
          >
            Dinheiro que saiu
          </Opcao>
          <Opcao
            marcada={palpite.sinalNegativo === "entrada"}
            onClick={() => mexer({ ...palpite, sinalNegativo: "entrada" })}
          >
            Dinheiro que entrou
          </Opcao>
        </div>
        {/*
          ⚠ **O aviso aponta para cima, para os números.** A pergunta em si é
          de convenção contábil e ninguém sabe conferir a própria resposta; o
          que dá para conferir é o total, que muda ao vivo logo acima.
        */}
        <p className="mt-2 text-3xs leading-relaxed text-dim">
          Na dúvida, olhe os totais lá em cima ao trocar esta opção. O certo é o
          que bate com o que você sabe do mês.
        </p>
      </Grupo>

      <Grupo titulo="Como chamar este formato">
        <div className="space-y-2">
          <Campo valor={banco} aoMudar={setBanco} rotulo="Banco" />
          <Campo valor={nome} aoMudar={setNome} rotulo="Nome do arquivo" />
        </div>
      </Grupo>

      {erro && (
        <p role="alert" className="mt-4 text-xs leading-relaxed text-red">
          {erro}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={salvar} loading={pensando} disabled={!banco || !nome}>
          Salvar e importar
        </Button>
        <Button variant="secondary" onClick={aoDesistir}>
          Desistir
        </Button>
      </div>

      <p className="mt-3 font-mono text-3xs leading-relaxed text-dim">
        O arquivo é lido no servidor a cada ajuste, e nunca fica guardado.
      </p>
    </Card>
  );
}

/**
 * ⚠ **É esta a parte que substitui a pergunta pela consequência.**
 *
 * O número grande não é enfeite: com o sinal trocado, "R$ 4.812,00 de gasto"
 * vira "R$ 4.812,00 de entrada", e quem não faz ideia do que é convenção de
 * sinal sabe que não recebeu isso.
 */
function Consequencia({
  previa,
  pensando,
}: {
  previa: Previa | null;
  pensando: boolean;
}) {
  if (!previa) return null;

  return (
    <div
      aria-live="polite"
      className={`mt-4 rounded-pote border border-border2 bg-card2 p-4 transition-opacity ${
        pensando ? "opacity-50" : ""
      }`}
    >
      <p className="text-xs leading-relaxed">
        <strong className="font-bold">
          {previa.lancamentos === 1
            ? "1 lançamento"
            : `${previa.lancamentos} lançamentos`}
        </strong>
        {": "}
        <span className="font-mono text-text">
          {emReais(previa.saiuCentavos)}
        </span>{" "}
        de gasto e{" "}
        <span className="font-mono text-text">
          {emReais(previa.entrouCentavos)}
        </span>{" "}
        de entrada.
      </p>

      {previa.ignoradas > 0 && (
        <p className="mt-1.5 text-3xs leading-relaxed text-gold">
          {previa.ignoradas === 1
            ? "1 linha não deu para ler"
            : `${previa.ignoradas} linhas não deram para ler`}
          .
        </p>
      )}

      <ConferenciaDoSaldo previa={previa} />

      {previa.amostra.length > 0 && (
        <ul className="mt-3 space-y-1 font-mono text-4xs text-dim">
          {previa.amostra.map((l, i) => (
            <li key={i} className="flex gap-2">
              <span className="shrink-0">{l.data}</span>
              <span className="min-w-0 flex-1 truncate">{l.descricao}</span>
              <span className="shrink-0">
                {l.direcao === "saida" ? "−" : "+"}
                {emReais(l.valorCentavos)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * A testemunha independente, quando o arquivo traz uma.
 *
 * ⚠ **Quando não dá para provar, ela diz que não deu.** Fatura de cartão nunca
 * traz saldo, e fingir que conferiu seria pior que admitir — a régua é a do
 * `references/formatos-de-extrato.md`: somar o que o próprio parser leu não
 * prova nada.
 */
function ConferenciaDoSaldo({ previa }: { previa: Previa }) {
  if (!previa.saldo) {
    return (
      <p className="mt-1.5 text-3xs leading-relaxed text-dim">
        Este arquivo não tem coluna de saldo, então não dá para conferir a
        leitura por fora. Confie nos totais acima.
      </p>
    );
  }

  const { batem, transicoes } = previa.saldo;

  if (batem === transicoes) {
    return (
      <p className="mt-1.5 text-3xs leading-relaxed text-green">
        A coluna de saldo confere: as {transicoes} transições batem. A leitura
        está certa.
      </p>
    );
  }

  return (
    <p className="mt-1.5 text-3xs leading-relaxed text-red">
      A coluna de saldo não fecha ({batem} de {transicoes} transições). Alguma
      coluna ou algum formato ainda está errado.
    </p>
  );
}

function EscolhaDeColuna({
  papel,
  cabecalho,
  escolhida,
  onEscolher,
}: {
  papel: Papel;
  cabecalho: string[];
  escolhida: number | undefined;
  onEscolher: (i: number | undefined) => void;
}) {
  const obrigatoria = PAPEIS_OBRIGATORIOS.includes(papel);

  return (
    <label className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-2xs text-dim">
        {ROTULOS_DO_PAPEL[papel]}
        {!obrigatoria && <span className="text-dim"> (opcional)</span>}
      </span>
      <select
        value={escolhida ?? ""}
        onChange={(e) =>
          onEscolher(e.target.value === "" ? undefined : Number(e.target.value))
        }
        className="min-h-11 min-w-0 flex-1 rounded-card border border-border2 bg-card px-3 text-xs text-text"
      >
        <option value="">{obrigatoria ? "— escolha —" : "— nenhuma —"}</option>
        {cabecalho.map((nome, i) => (
          <option key={i} value={i}>
            {nome.trim() === "" ? `coluna ${i + 1}` : nome.trim()}
          </option>
        ))}
      </select>
    </label>
  );
}

function Seletor({
  rotulo,
  valor,
  opcoes,
  onTrocar,
}: {
  rotulo: string;
  valor: string;
  opcoes: { valor: string; rotulo: string }[];
  onTrocar: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-2xs text-dim">{rotulo}</span>
      <select
        value={valor}
        onChange={(e) => onTrocar(e.target.value)}
        className="min-h-11 min-w-0 flex-1 rounded-card border border-border2 bg-card px-3 text-xs text-text"
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </label>
  );
}

function Campo({
  rotulo,
  valor,
  aoMudar,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-2xs text-dim">{rotulo}</span>
      <input
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        maxLength={60}
        className="min-h-11 min-w-0 flex-1 rounded-card border border-border2 bg-card px-3 text-xs text-text"
      />
    </label>
  );
}

function Grupo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-2xs font-bold text-text">{titulo}</p>
      {children}
    </div>
  );
}

function Opcao({
  marcada,
  onClick,
  children,
}: {
  marcada: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={marcada}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center rounded-card border px-4 text-xs font-bold transition-colors ${
        marcada
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border2 bg-card text-dim hover:bg-card2 hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function comColuna(
  colunas: Partial<Record<Papel, number>>,
  papel: Papel,
  i: number | undefined,
): Partial<Record<Papel, number>> {
  const novo = { ...colunas };
  if (i === undefined) delete novo[papel];
  else novo[papel] = i;
  return novo;
}

function rotuloDoSeparador(s: string): string {
  if (s === ";") return "; ponto e vírgula";
  if (s === ",") return ", vírgula";
  if (s === "\t") return "tabulação";
  return "| barra";
}

function sugerirNome(origem: string): string {
  return origem === "csv_cartao" ? "Fatura do cartão" : "Extrato da conta";
}
