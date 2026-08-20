import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { diaEMes, emReais } from "@/lib/dinheiro";
import type { LancamentoFalso } from "./dadosFalsos";

/**
 * O lançamento que você está decidindo (tarefa B1).
 *
 * ## A descrição aparece com os espaços originais
 *
 * `ACME  CLOUD SUB   SAN FRANCISCO CA` tem colunas alinhadas por espaço. O HTML
 * colapsa espaço repetido por padrão, e aí comerciante, cidade e país viram uma
 * frase só. `whitespace-pre-wrap` em fonte mono devolve a estrutura.
 *
 * É o que você lê para decidir — e você lê melhor com as colunas de pé.
 *
 * ## Nunca trunca
 *
 * Descrição cortada com `…` esconde exatamente a metade que costuma
 * identificar: a maquininha vem na frente, e o nome útil é o segundo campo.
 */
export function CartaoDoLancamento({ l }: { l: LancamentoFalso }) {
  const entrada = l.direcao === "entrada";

  return (
    <Card className="mt-4">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`font-mono text-[22px] leading-none font-bold ${
            entrada ? "text-green" : "text-text"
          }`}
        >
          {emReais(entrada ? l.valorCentavos : -l.valorCentavos)}
        </span>

        <span className="shrink-0 font-mono text-xs text-dim">
          {diaEMes(l.data)}
        </span>
      </div>

      {/* A descrição crua, do jeito que o banco escreveu. */}
      <p className="mt-4 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap text-text">
        {l.descricao}
      </p>

      {l.pessoa && (
        <p className="mt-3 text-xs text-dim">
          Contraparte:{" "}
          <strong className="font-bold text-text">{l.pessoa}</strong>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="dim">
          {l.origem === "csv_cartao" ? "Cartão" : "Conta"}
        </Badge>

        {l.parcela && <Badge variant="dim">Parcela {l.parcela}</Badge>}

        {/*
          O palpite do banco entra como palpite, e o rótulo diz isso. A spec
          mediu uma clínica veterinária chegando como SERVICOS e outra como
          PETSHOP no mesmo mês — mostrar isso como categoria seria dar a ele
          uma autoridade que ele não tem.
        */}
        {l.categoriaDoBanco && (
          <span className="font-mono text-[10px] tracking-[0.5px] text-dim2 uppercase">
            banco diz: {l.categoriaDoBanco.toLowerCase()}
          </span>
        )}
      </div>
    </Card>
  );
}
