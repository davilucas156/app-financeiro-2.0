"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { estiloDoPote } from "@/features/aparencia/tema/estiloDoPote";
import { FALHA_DE_CONEXAO } from "@/lib/falhaDeConexao";
import { contar } from "@/lib/plural";
import {
  agruparPorPote,
  type CategoriaEscolhivel,
} from "@/features/classificacao/revisar-lancamento/categorias";
import { apagar, editar } from "./mexerNaRegra.action";
import {
  rotuloDoTipo,
  TAMANHO_MAXIMO_DO_TEXTO_DA_REGRA,
  textoEditavelDe,
  textoEhEditavel,
  type RegraNaTela,
} from "./regrasNaTela";

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
          <p className="font-mono text-4xs font-bold tracking-[1.5px] text-dim uppercase">
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
          style={estiloDoPote(regra.poteCor)}
          aria-hidden="true"
        />
        <strong className="font-bold text-text">
          {regra.categoriaEmoji} {regra.categoriaNome}
        </strong>
        <span className="text-dim">· {regra.poteNome}</span>
      </p>

      <p className="mt-2 text-xs text-dim">
        {regra.jaClassificou === 0
          ? "Ainda não classificou nada."
          : `Já classificou ${contar(regra.jaClassificou, "lançamento", "lançamentos")}.`}
      </p>

      {modo === "vendo" && (
        <div className="mt-4 flex gap-2">
          <Button
            variant="secondary"
            className="flex-1 text-xs"
            onClick={() => setModo("editando")}
          >
            Editar
          </Button>
          <Button
            variant="secondary"
            className="flex-1 text-xs"
            onClick={() => setModo("apagando")}
          >
            Apagar
          </Button>
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
  const textoAtual = textoEditavelDe(regra.criterio);

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
      try {
        const r = await editar({
          id: regra.id,
          categoriaId,
          texto: editavel ? texto : undefined,
        });

        if (r.ok) aoFechar();
        else setErro(r.erro);
      } catch {
        setErro(FALHA_DE_CONEXAO);
      }
    });

  return (
    <div className="mt-4 border-t border-border pt-4">
      {editavel ? (
        <label className="block">
          <span className="font-mono text-4xs font-bold tracking-[1.5px] text-dim uppercase">
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
            maxLength={TAMANHO_MAXIMO_DO_TEXTO_DA_REGRA}
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
        <span className="font-mono text-4xs font-bold tracking-[1.5px] text-dim uppercase">
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

      <p className="mt-3 text-2xs leading-relaxed text-dim">
        Vale daqui para frente. Os {regra.jaClassificou} lançamentos que ela já
        classificou ficam como estão.
      </p>

      <div className="mt-4 flex gap-2">
        <Button
          variant="primary"
          className="flex-1"
          onClick={salvar}
          loading={salvando}
        >
          Salvar
        </Button>
        <Button
          variant="secondary"
          className="flex-1 text-xs"
          onClick={aoFechar}
          disabled={salvando}
        >
          Cancelar
        </Button>
      </div>

      {erro && (
        <p role="alert" className="mt-2 text-2xs leading-relaxed text-red">
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
        <Button
          variant="primary"
          className="flex-1"
          onClick={() =>
            iniciar(async () => {
              setErro(null);
              try {
                const r = await apagar(regra.id);
                if (!r.ok) setErro(r.erro);
              } catch {
                setErro(FALHA_DE_CONEXAO);
              }
            })
          }
          loading={apagando}
        >
          Apagar
        </Button>
        <Button
          variant="secondary"
          className="flex-1 text-xs"
          onClick={aoFechar}
          disabled={apagando}
        >
          Manter
        </Button>
      </div>

      {erro && (
        <p role="alert" className="mt-2 text-2xs leading-relaxed text-red">
          {erro}
        </p>
      )}
    </div>
  );
}
