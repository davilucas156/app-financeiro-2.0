"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { agruparPorPote, type CategoriaEscolhivel } from "@/features/classificacao/revisar-lancamento/categorias";
import { apagar, editar } from "./mexerNaRegra.action";
import { rotuloDoTipo, textoEhEditavel, type RegraNaTela } from "./regrasNaTela";

/**
 * Uma regra, em três estados: vendo, editando, confirmando a exclusão
 * (tarefa D9).
 *
 * ## O número é a parte que dá confiança
 *
 * "Já classificou 8" transforma uma lista de textos numa lista de
 * consequências. Regra com zero é suspeita — ou o texto está errado, ou ela
 * nunca foi usada; regra com 8 é onde pensar duas vezes antes de mexer.
 *
 * ## Apagar pede dois toques
 *
 * E o segundo diz o tamanho do estrago: quantos vieram dela, e o que acontece
 * com eles (nada). Apagar 27 regras por engano num toque seria a pior sessão
 * possível nesta tela.
 */
export function CartaoDaRegra({
  regra,
  categorias,
}: {
  regra: RegraNaTela;
  categorias: CategoriaEscolhivel[];
}) {
  const [modo, setModo] = useState<"vendo" | "editando" | "apagando">("vendo");

  return (
    <Card className="mt-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
            {rotuloDoTipo(regra.criterio)}
          </p>
          <p className="mt-1 font-mono text-sm break-words text-text">
            {regra.texto}
          </p>
        </div>

        {regra.origem === "seed" && <Badge variant="dim">veio pronta</Badge>}
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-dim">
        <span aria-hidden="true">→</span>
        <span
          className="inline-block size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: regra.poteCor }}
          aria-hidden="true"
        />
        <strong className="font-bold text-text">
          {regra.categoriaEmoji} {regra.categoriaNome}
        </strong>
        <span className="text-dim2">· {regra.poteNome}</span>
      </p>

      <p className="mt-2 text-xs text-dim">
        {regra.jaClassificou === 0
          ? "Ainda não classificou nada."
          : regra.jaClassificou === 1
            ? "Já classificou 1 lançamento."
            : `Já classificou ${regra.jaClassificou} lançamentos.`}
      </p>

      {modo === "vendo" && (
        <div className="mt-4 flex gap-2">
          <Secundario onClick={() => setModo("editando")}>Editar</Secundario>
          <Secundario onClick={() => setModo("apagando")}>Apagar</Secundario>
        </div>
      )}

      {modo === "editando" && (
        <Editor
          regra={regra}
          categorias={categorias}
          aoFechar={() => setModo("vendo")}
        />
      )}

      {modo === "apagando" && (
        <Exclusao regra={regra} aoFechar={() => setModo("vendo")} />
      )}
    </Card>
  );
}

function Editor({
  regra,
  categorias,
  aoFechar,
}: {
  regra: RegraNaTela;
  categorias: CategoriaEscolhivel[];
  aoFechar: () => void;
}) {
  const editavel = textoEhEditavel(regra.criterio);
  const textoAtual =
    regra.criterio.tipo === "descricao_contem"
      ? regra.criterio.termo
      : regra.criterio.tipo === "pessoa"
        ? regra.criterio.nome
        : "";

  const [texto, setTexto] = useState(textoAtual);
  const [categoriaId, setCategoriaId] = useState(regra.categoriaId);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  // Direção `saida` só ordena a lista de potes; nesta tela não há lançamento
  // para dar a direção, e renda no fim é a ordem mais comum.
  const grupos = agruparPorPote(categorias, "saida");

  const salvar = () =>
    iniciar(async () => {
      setErro(null);
      const r = await editar({
        id: regra.id,
        categoriaId,
        texto: editavel ? texto : undefined,
      });

      if (r.ok) aoFechar();
      else setErro(r.erro);
    });

  return (
    <div className="mt-4 border-t border-border pt-4">
      {editavel ? (
        <label className="block">
          <span className="font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
            Procurar por
          </span>
          {/*
            ⚠ Nada é normalizado por baixo do pano: o campo mostra o que está
            gravado e grava o que você escreveu. Trocar `PETROBRAS` por `PETRO`
            passa a pegar `PETROLINA`, e não dá para prever isso sem os
            lançamentos na mão — a defesa aqui é ver o texto exato.
          */}
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={salvando}
            className="mt-1.5 min-h-11 w-full rounded-card border border-border2 bg-bg px-3 font-mono text-sm text-text disabled:opacity-40"
          />
        </label>
      ) : (
        <p className="text-xs leading-relaxed text-dim">
          Esta regra casa por valor e direção, não por texto — não há o que
          corrigir aqui além do destino.
        </p>
      )}

      <label className="mt-3 block">
        <span className="font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
          Mandar para
        </span>
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          disabled={salvando}
          className="mt-1.5 min-h-11 w-full rounded-card border border-border2 bg-bg px-3 text-sm text-text disabled:opacity-40"
        >
          {grupos.map((g) => (
            <optgroup key={g.pote.id} label={`${g.pote.emoji} ${g.pote.nome}`}>
              {g.categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.nome}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <p className="mt-3 text-[11px] leading-relaxed text-dim">
        Vale daqui para frente. Os {regra.jaClassificou} lançamentos que ela já
        classificou ficam como estão.
      </p>

      <div className="mt-4 flex gap-2">
        <Primario onClick={salvar} carregando={salvando}>
          Salvar
        </Primario>
        <Secundario onClick={aoFechar} desabilitado={salvando}>
          Cancelar
        </Secundario>
      </div>

      {erro && (
        <p role="alert" className="mt-2 text-[11px] leading-relaxed text-red">
          {erro}
        </p>
      )}
    </div>
  );
}

function Exclusao({
  regra,
  aoFechar,
}: {
  regra: RegraNaTela;
  aoFechar: () => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [apagando, iniciar] = useTransition();

  return (
    <div className="mt-4 rounded-card border border-red/20 bg-red/8 p-4">
      <p className="text-xs font-bold text-red">Apagar esta regra?</p>

      <p className="mt-1.5 text-xs leading-relaxed text-dim">
        {regra.jaClassificou === 0
          ? "Ela nunca classificou nada, então nenhum lançamento muda."
          : `Os ${regra.jaClassificou} lançamentos que ela já classificou ficam onde estão — e continuam explicados pelo texto que os pegou. O que muda é daqui para frente: eles vão passar a pedir decisão na próxima importação.`}
      </p>

      <div className="mt-4 flex gap-2">
        <Primario
          onClick={() =>
            iniciar(async () => {
              setErro(null);
              const r = await apagar(regra.id);
              if (!r.ok) setErro(r.erro);
            })
          }
          carregando={apagando}
        >
          Apagar
        </Primario>
        <Secundario onClick={aoFechar} desabilitado={apagando}>
          Manter
        </Secundario>
      </div>

      {erro && (
        <p role="alert" className="mt-2 text-[11px] leading-relaxed text-red">
          {erro}
        </p>
      )}
    </div>
  );
}

function Primario({
  onClick,
  carregando,
  children,
}: {
  onClick: () => void;
  carregando: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={carregando}
      aria-busy={carregando || undefined}
      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-card bg-primary px-4 text-sm font-bold text-bg transition-colors hover:bg-orange disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Secundario({
  onClick,
  desabilitado = false,
  children,
}: {
  onClick: () => void;
  desabilitado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-card border border-border2 bg-card px-4 text-xs font-bold text-text transition-colors hover:bg-card2 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
