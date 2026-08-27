import Link from "next/link";

/**
 * O ano que a `/comparativo` está mostrando (spec 12, tarefa C2).
 *
 * ⚠ **Devolve `null` quando a conta tem um ano só** (pendência 8). Um controle
 * de uma opção promete uma escolha que não existe: ele ocupa a linha mais nobre
 * da tela para dizer que não há nada a decidir.
 *
 * ## Menor que as abas, e é de propósito
 *
 * A fileira de abas logo acima navega entre telas; esta escolhe um recorte
 * dentro da tela em que já se está. Dar às duas o mesmo peso faria a segunda
 * parecer uma terceira aba, e trocar de ano parecer trocar de assunto.
 *
 * Ainda assim ela é `min-h-11`: alvo de toque é regra do projeto desde a spec
 * 03, e "menor" aqui é a caixa, nunca a área tocável.
 */
export function SeletorDeAno({
  anos,
  ano,
}: {
  /** Só anos que têm mês. Quem garante isso é a `anosDoHistorico`. */
  anos: string[];
  ano: string;
}) {
  if (anos.length < 2) return null;

  return (
    <nav aria-label="Ano do comparativo" className="flex items-center gap-1.5">
      {anos.map((a) => (
        <Link
          key={a}
          href={`/comparativo?ano=${a}`}
          aria-current={a === ano ? "page" : undefined}
          className={`inline-flex min-h-11 items-center rounded-card border px-3 font-mono text-3xs font-bold transition-colors ${
            a === ano
              ? "border-blue/40 bg-blue/10 text-blue"
              : "border-border2 bg-card text-dim hover:bg-card2 hover:text-text"
          }`}
        >
          {a}
        </Link>
      ))}
    </nav>
  );
}
