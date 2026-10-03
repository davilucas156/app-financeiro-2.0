/**
 * Recalcula `transactions.mes_referencia` com a regra nova.
 *
 * ## Por que existe
 *
 * Até a mudança da `mesDoLancamento`, **toda** linha de fatura ia para o mês
 * escolhido na tela de envio. A fatura que vence em outubro traz compras de
 * mais ou menos 25/08 a 24/09, então as saídas de setembro apareciam em
 * outubro — e a aba de outubro, sem entrada nenhuma, parecia um mês quebrado.
 *
 * A regra nova lê a data de cada linha. A data sempre esteve gravada, então
 * isto é um `update`, não uma migration: nenhuma coluna muda de forma.
 *
 * ## ⚠ Não escreve sem `--aplicar`
 *
 * Sem o argumento, ele só mede e imprime o antes e o depois de cada mês. É a
 * ordem certa: o recálculo muda os totais de meses que já foram olhados, e
 * decidir isso sem ver os números é decidir no escuro.
 *
 * ## O recorte, e o que ele não toca
 *
 * - **`imports.mes_referencia` fica como está.** Lá o campo quer dizer "qual
 *   fatura é esta", que é exatamente o que ele continua sendo — e é dele que a
 *   parcela tira o mês dela.
 * - **`monthly_income` fica como está.** A renda é declarada por mês pela
 *   pessoa; não é derivada de lançamento nenhum.
 * - **`status`, `par_de` e classificação ficam como estão.** O par que se anula
 *   casa por data e valor, e nenhum dos dois muda aqui.
 *
 * Uso, da raiz do projeto:
 *
 *     node scripts/recalcular-mes-de-referencia.mjs            # só mede
 *     node scripts/recalcular-mes-de-referencia.mjs --aplicar  # grava
 */
import { readFileSync } from "node:fs";
import ws from "ws";
import { neonConfig, Pool } from "@neondatabase/serverless";

neonConfig.webSocketConstructor = ws;

const APLICAR = process.argv.includes("--aplicar");

/*
 * A regra nova, em SQL, igual à da `mesDoLancamento`.
 *
 * ⚠ Se uma das duas mudar sem a outra, o reenvio de um arquivo passa a gravar
 * um mês diferente do que este script gravou, e a divergência não tem sintoma.
 */
const REGRA = `
  case
    when t.origem = 'csv_cartao' and t.parcela is not null then i.mes_referencia
    else to_char(t.data, 'YYYY-MM')
  end
`;

const url = readFileSync(".env.local", "utf8").match(
  /^DATABASE_URL=["']?([^"'\r\n]+)/m,
)?.[1];

if (!url) {
  console.error("DATABASE_URL não encontrada em .env.local.");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });

const brl = (centavos) =>
  (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/*
 * Uma consulta só, sem descrição e sem nome de ninguém: o antes e o depois têm
 * de sair do **mesmo instantâneo**, senão um envio em voo apareceria num lado e
 * não no outro.
 */
const { rows } = await pool.query(`
  select
    t.mes_referencia as antes,
    ${REGRA} as depois,
    t.direcao,
    t.status,
    t.origem,
    t.parcela is not null as parcelado,
    t.valor_centavos
  from transactions t
  join imports i on i.id = t.import_id and i.user_id = t.user_id
`);

const meses = new Map();

const doMes = (mes) => {
  if (!meses.has(mes)) {
    meses.set(mes, {
      antes: { entrou: 0, saiu: 0, n: 0 },
      depois: { entrou: 0, saiu: 0, n: 0 },
    });
  }
  return meses.get(mes);
};

let mudam = 0;
const mudamPorTipo = new Map();

for (const r of rows) {
  if (r.antes !== r.depois) {
    mudam += 1;
    const tipo = `${r.origem}${r.parcelado ? " (parcela)" : ""}: ${r.antes} → ${r.depois}`;
    mudamPorTipo.set(tipo, (mudamPorTipo.get(tipo) ?? 0) + 1);
  }

  // O painel não soma `excluido`, então o antes e o depois também não — é o
  // número da tela que precisa ser comparável, não o da tabela.
  if (r.status === "excluido") continue;

  const valor = Number(r.valor_centavos);
  const campo = r.direcao === "entrada" ? "entrou" : "saiu";

  const a = doMes(r.antes).antes;
  a[campo] += valor;
  a.n += 1;

  const d = doMes(r.depois).depois;
  d[campo] += valor;
  d.n += 1;
}

console.log(`${rows.length} lançamentos lidos. ${mudam} mudariam de mês.\n`);

if (mudam > 0) {
  console.log("Para onde vão:");
  for (const [tipo, quantos] of [...mudamPorTipo].sort()) {
    console.log(`  ${String(quantos).padStart(4)}  ${tipo}`);
  }
  console.log();
}

const cab = [
  "mês",
  "entrou antes",
  "entrou depois",
  "saiu antes",
  "saiu depois",
  "n",
];
console.log(
  [
    cab[0].padEnd(8),
    cab[1].padStart(14),
    cab[2].padStart(14),
    cab[3].padStart(14),
    cab[4].padStart(14),
    "  n antes → depois",
  ].join(""),
);

for (const mes of [...meses.keys()].sort()) {
  const { antes, depois } = meses.get(mes);
  // A seta só aparece onde o número muda: coluna igual é ruído que esconde a
  // linha que importa.
  const marca = (a, b) => (a === b ? "" : " *");

  console.log(
    [
      mes.padEnd(8),
      brl(antes.entrou).padStart(14),
      (brl(depois.entrou) + marca(antes.entrou, depois.entrou)).padStart(14),
      brl(antes.saiu).padStart(14),
      (brl(depois.saiu) + marca(antes.saiu, depois.saiu)).padStart(14),
      `   ${String(antes.n).padStart(3)} → ${String(depois.n).padStart(3)}`,
    ].join(""),
  );
}

if (!APLICAR) {
  console.log(
    "\nNada foi gravado. Rode com --aplicar para gravar, se os números acima fizerem sentido.",
  );
  await pool.end();
  process.exit(0);
}

/*
 * ⚠ **Um comando só, e não linha por linha.** São centenas de linhas; um
 * `update` por id abriria a janela de ficar metade recalculado se a conexão
 * caísse no meio, e meio recálculo é pior do que nenhum: não há como saber de
 * fora qual metade é qual.
 */
const { rowCount } = await pool.query(`
  update transactions t
  set mes_referencia = ${REGRA}
  from imports i
  where i.id = t.import_id
    and i.user_id = t.user_id
    and t.mes_referencia <> ${REGRA}
`);

console.log(`\n${rowCount} lançamentos gravados com o mês novo.`);

await pool.end();
