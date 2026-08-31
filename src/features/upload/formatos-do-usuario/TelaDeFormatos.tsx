import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { FORMATOS } from "@/features/upload/ler-arquivo/formatos";
import { EsquecerFormato } from "./EsquecerFormato";
import type { FormatoNaTela } from "./formatosDoUsuario.service";

/**
 * `/formatos` — o que o app aprendeu a ler (spec 11, tarefa D4).
 *
 * ## Por que ela existe na mesma spec, e não depois
 *
 * ⚠ **Um formato salvo errado é pior que um arquivo recusado.** Recusado, a
 * pessoa sabe na hora. Salvo errado, ele importa com convicção todo mês — e a
 * única correção, sem esta tela, seria mexer no banco de dados.
 *
 * ## Ensinar não acontece aqui
 *
 * Ensinar precisa do arquivo, e o arquivo vive na aba do `/upload` (ver
 * `PainelDeMapeamento`). Uma rota de criação aqui teria de pedir o arquivo de
 * novo, o que é exatamente o que a spec quis evitar. Aqui se vê, se apaga, e se
 * reensina — reensinar é mandar o arquivo de novo com o mesmo nome, que o
 * `onConflictDoUpdate` trata como edição.
 */
export function TelaDeFormatos({ formatos }: { formatos: FormatoNaTela[] }) {
  return (
    <>
      <Link
        href="/upload"
        className="inline-flex min-h-11 items-center font-mono text-3xs font-bold tracking-wider text-dim uppercase transition-colors hover:text-text"
      >
        ← Enviar extrato
      </Link>

      <SectionTitle className="mt-2">Formatos que eu leio</SectionTitle>

      <DeCodigo />

      <SectionTitle>Que você me ensinou</SectionTitle>

      {formatos.length === 0 ? (
        <EstadoVazio
          emoji="📄"
          titulo="Você ainda não me ensinou nenhum"
          descricao="Quando eu não reconhecer um arquivo no envio, a tela oferece ensinar. Faço isso uma vez e passo a reconhecer sozinho."
          acao={
            <Link
              href="/upload"
              className="inline-flex min-h-11 items-center rounded-card bg-primary px-5 text-sm font-bold text-bg transition-colors hover:bg-orange"
            >
              Enviar extrato
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {formatos.map((f) => (
            <CartaoDoFormato key={f.id} formato={f} />
          ))}
        </div>
      )}
    </>
  );
}

/**
 * ⚠ **Os de código aparecem, e não dá para editá-los.**
 *
 * Eles foram **medidos em arquivo real** (`references/formatos-de-extrato.md`),
 * e são o caminho rápido: quando o arquivo bate com um deles, o app não pergunta
 * nada. Escondê-los faria a tela dizer "não leio nada" para quem manda extrato
 * do Inter todo mês.
 *
 * A lista sai de `FORMATOS`, e não escrita à mão — a mesma decisão que a spec 09
 * tomou na `/passos`: escrita aqui, ela prometeria um banco no dia em que
 * alguém tirasse o formato de lá.
 */
function DeCodigo() {
  const bancos = [...new Set(FORMATOS.map((f) => f.banco))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );

  return (
    <Card>
      {bancos.map((banco) => (
        <div key={banco} className="not-first:mt-3">
          <p className="text-2xs font-bold text-text">{banco}</p>
          <p className="mt-1 text-3xs leading-relaxed text-dim">
            {FORMATOS.filter((f) => f.banco === banco)
              .map((f) => f.nome)
              .join(" · ")}
          </p>
        </div>
      ))}
      <p className="mt-3 text-3xs leading-relaxed text-dim">
        Estes vêm prontos e não mudam.
      </p>
    </Card>
  );
}

function CartaoDoFormato({ formato }: { formato: FormatoNaTela }) {
  const colunas = Object.entries(formato.colunas)
    .map(([, nome]) => nome)
    .join(", ");

  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 text-2xs font-bold break-words">
          {formato.banco}
        </p>
        <span className="shrink-0 font-mono text-4xs tracking-wider text-dim uppercase">
          {formato.origem === "csv_conta" ? "conta" : "cartão"}
        </span>
      </div>

      <p className="mt-1 text-xs text-dim">{formato.nome}</p>

      <p className="mt-2 font-mono text-4xs leading-relaxed text-dim">
        Colunas: {colunas}
      </p>

      <EsquecerFormato id={formato.id} nome={formato.nome} />
    </Card>
  );
}
