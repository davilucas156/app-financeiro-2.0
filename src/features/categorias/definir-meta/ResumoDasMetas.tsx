import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { somaDasMetas, type PoteQueConta } from "./somaDasMetas";
import { VoltarAoPadrao } from "./VoltarAoPadrao";

/**
 * Quanto os potes somam, e o aviso de quem ainda não declarou renda (C3).
 *
 * ## Informa, e não trava
 *
 * A linha da soma existe porque somar 250% sem nunca saber não serve — e
 * **não** porque 100 seja obrigatório. Nada no app soma potes: cada um se mede
 * contra a própria meta. Forçar o fechamento em 100 transformaria "quero
 * apertar o Transporte" numa conta de fechar caixa.
 *
 * ⚠ **O aviso da renda é a defesa contra o risco 2 da spec:** mexer nas metas,
 * salvar, e não ver efeito nenhum. Sem renda declarada, `metaDoPote` devolve
 * `null` para todo pote — o percentual está lá, correto, e invisível. Sem esta
 * frase, o que a pessoa conclui é que o app não salvou.
 *
 * ⚠ **Sem `"use client"`, mas roda no cliente.** É renderizado dentro de
 * `TelaDeCategorias` (que é cliente), então entra no bundle do navegador. Não
 * use aqui `cookies()`, `headers()`, segredos nem nada de `server-only`.
 */
export function ResumoDasMetas({
  potes,
  temRenda,
}: {
  potes: PoteQueConta[];
  temRenda: boolean;
}) {
  const { frase } = somaDasMetas(potes);

  return (
    <>
      <p className="mt-4 font-mono text-2xs leading-relaxed text-dim">
        {frase}
      </p>

      <VoltarAoPadrao />

      {!temRenda && (
        <Card className="mt-2 border-gold/30 bg-gold/8">
          <p className="text-2xs leading-relaxed text-dim">
            <strong className="font-bold text-gold">
              As metas ainda não vão aparecer.
            </strong>{" "}
            Elas são fatias da sua renda, e você ainda não informou nenhuma —
            até lá o painel mostra o gasto sem barra.{" "}
            <Link href="/dashboard" className="underline underline-offset-4">
              Informar a renda
            </Link>
            .
          </p>
        </Card>
      )}
    </>
  );
}
