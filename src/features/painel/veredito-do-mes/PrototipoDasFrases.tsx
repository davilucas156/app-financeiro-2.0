import Link from "next/link";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SecaoDoComparativo } from "@/features/painel/comparar-meses/SecaoDoComparativo";
import { compararMeses } from "@/features/painel/comparar-meses/comparativo";
import { FaixaDoVeredito } from "./FaixaDoVeredito";
import { insightDoPote } from "./insightDoPote";
import { vereditoDoMes } from "./veredito";

/**
 * Os quatro vereditos e os dois comparativos, ao mesmo tempo (fase B).
 *
 * ## ⚠ Isto morre nas tarefas D1 e D2
 *
 * É andaime, e está escrito para ser apagado inteiro. Nenhum outro arquivo o
 * importa a não ser a `dashboard/page.tsx`, atrás de `?estado=frases`.
 *
 * ## Por que existe
 *
 * A B1 e a B2 já entraram ligadas no mês de verdade — tudo o que elas precisam
 * já estava na tela. Mas o mês de verdade produz **um** dos quatro vereditos,
 * e o comparativo ainda não tem serviço que o alimente.
 *
 * Aprovar um texto que se lê uma vez por mês olhando para um quarto dele seria
 * aprovar no escuro. Aqui os quatro aparecem juntos, com dados inventados, na
 * mesma tela e na mesma largura de celular.
 *
 * ⚠ **Nenhum número desta tela é do Davi.** Os potes são os do seed, os valores
 * são inventados, e é para ficarem inventados: esta tela existe para julgar
 * texto, não conta.
 */
export function PrototipoDasFrases() {
  return (
    <>
      <p className="rounded-card border border-dashed border-gold/40 bg-card p-4 text-xs leading-relaxed text-gold">
        <strong>Protótipo.</strong> Números inventados, para você julgar as
        frases. O painel de verdade continua em{" "}
        <Link href="/dashboard" className="underline underline-offset-4">
          /dashboard
        </Link>
        .
      </p>

      <SectionTitle>Os quatro vereditos</SectionTitle>

      <div className="space-y-3">
        {EXEMPLOS.map((exemplo) => (
          <div key={exemplo.titulo}>
            <p className="font-mono text-[10px] text-dim2">{exemplo.titulo}</p>
            <FaixaDoVeredito veredito={vereditoDoMes(exemplo.mes)} />
          </div>
        ))}

        <div>
          <p className="font-mono text-[10px] text-dim2">
            5 · sem renda declarada — o silêncio
          </p>
          <p className="mt-2 text-xs text-dim">
            (nada aparece aqui, de propósito — o campo de renda logo abaixo já
            está cobrando a mesma coisa)
          </p>
          <FaixaDoVeredito
            veredito={vereditoDoMes({
              ...EXEMPLOS[3].mes,
              rendaDeclaradaCentavos: null,
            })}
          />
        </div>
      </div>

      <SectionTitle>A linha do insight</SectionTitle>

      <div className="space-y-2">
        {INSIGHTS.map((exemplo) => (
          <div
            key={exemplo.titulo}
            className="rounded-card border border-border bg-card p-4"
          >
            <p className="font-mono text-[10px] text-dim2">{exemplo.titulo}</p>
            <p className="mt-1.5 text-sm font-bold">
              {exemplo.emoji} {exemplo.nome}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-text">
              {insightDoPote(exemplo.pote, exemplo.meta) ?? (
                <span className="text-dim">
                  (nada — pote sem meta não tem dentro nem fora)
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      {COMPARATIVOS.map((exemplo) => (
        <div key={exemplo.titulo}>
          <p className="mt-8 font-mono text-[10px] text-dim2">
            {exemplo.titulo}
          </p>
          <SecaoDoComparativo
            comparativo={compararMeses(exemplo.historico, exemplo.mes)}
            potes={POTES}
          />
        </div>
      ))}
    </>
  );
}

const pote = (
  nome: string,
  emoji: string,
  totalCentavos: number,
  metaCentavos: number | null,
) => ({ nome, emoji, totalCentavos, lancamentos: 4, metaCentavos });

const RENDA = 400_000;

const EXEMPLOS = [
  {
    titulo: "1 · cobertura baixa — manda revisar, e para aí",
    mes: {
      cobertura: { saiuPct: 41, entrouPct: null, completa: false },
      rendaDeclaradaCentavos: RENDA,
      saiuCentavos: 320_000,
      potes: [pote("Transporte", "🚗", 180_000, 60_000)],
    },
  },
  {
    titulo: "2 · o mês não cabe na renda — pergunta, não acusa",
    mes: {
      cobertura: { saiuPct: 100, entrouPct: null, completa: true },
      rendaDeclaradaCentavos: RENDA,
      saiuCentavos: 1_240_000,
      potes: [pote("Transporte", "🚗", 180_000, 60_000)],
    },
  },
  {
    titulo: "3 · um pote destoou",
    mes: {
      cobertura: { saiuPct: 97, entrouPct: null, completa: false },
      rendaDeclaradaCentavos: RENDA,
      saiuCentavos: 380_000,
      potes: [
        pote("Conforto & Lazer", "🎮", 121_000, 60_000),
        pote("Transporte", "🚗", 74_000, 60_000),
      ],
    },
  },
  {
    titulo: "4 · o mês fechou dentro",
    mes: {
      cobertura: { saiuPct: 100, entrouPct: null, completa: true },
      rendaDeclaradaCentavos: RENDA,
      saiuCentavos: 340_000,
      potes: [
        pote("Conforto & Lazer", "🎮", 52_000, 60_000),
        pote("Transporte", "🚗", 58_000, 60_000),
      ],
    },
  },
];

const INSIGHTS = [
  {
    titulo: "as duas metades",
    nome: "Transporte",
    emoji: "🚗",
    pote: {
      tipo: "gasto" as const,
      totalCentavos: 96_000,
      lancamentos: 11,
      categorias: [
        { nome: "Gasolina", totalCentavos: 80_600 },
        { nome: "Ônibus", totalCentavos: 9_400 },
        { nome: "Apps", totalCentavos: 6_000 },
      ],
    },
    meta: { metaCentavos: 60_000 },
  },
  {
    titulo: "abaixo da meta, sem categoria dominante",
    nome: "Conforto & Lazer",
    emoji: "🎮",
    pote: {
      tipo: "gasto" as const,
      totalCentavos: 42_000,
      lancamentos: 7,
      categorias: [
        { nome: "Compras online", totalCentavos: 18_000 },
        { nome: "Alimentação fora", totalCentavos: 14_000 },
        { nome: "Assinaturas", totalCentavos: 10_000 },
      ],
    },
    meta: { metaCentavos: 60_000 },
  },
  {
    titulo: "pote sem meta — o silêncio da descoberta 3",
    nome: "Outros / Repasses",
    emoji: "·",
    pote: {
      tipo: "gasto" as const,
      totalCentavos: 21_600,
      lancamentos: 3,
      categorias: [{ nome: "Repasses e empréstimos", totalCentavos: 21_600 }],
    },
    meta: { metaCentavos: null },
  },
];

const POTES = [
  { id: "transporte", nome: "Transporte", emoji: "🚗", cor: "#00b4d8" },
  { id: "lazer", nome: "Conforto & Lazer", emoji: "🎮", cor: "#3d8eff" },
  { id: "fixos", nome: "Custos Fixos", emoji: "🏠", cor: "#ff7a2f" },
];

const COMPARATIVOS = [
  {
    titulo: "comparativo · um mês só",
    mes: "2026-06",
    historico: [
      {
        mes: "2026-06",
        coberturaSaiuPct: 100,
        potes: [
          { poteId: "transporte", totalCentavos: 96_000 },
          { poteId: "lazer", totalCentavos: 42_000 },
          { poteId: "fixos", totalCentavos: 88_000 },
        ],
      },
    ],
  },
  {
    titulo: "comparativo · quatro meses, um deles mal classificado",
    mes: "2026-06",
    historico: [
      {
        mes: "2026-03",
        coberturaSaiuPct: 100,
        potes: [
          { poteId: "transporte", totalCentavos: 74_000 },
          { poteId: "lazer", totalCentavos: 61_000 },
          { poteId: "fixos", totalCentavos: 84_000 },
        ],
      },
      {
        mes: "2026-04",
        coberturaSaiuPct: 38,
        potes: [
          { poteId: "transporte", totalCentavos: 21_000 },
          { poteId: "lazer", totalCentavos: 9_000 },
          { poteId: "fixos", totalCentavos: 12_000 },
        ],
      },
      {
        mes: "2026-05",
        coberturaSaiuPct: 96,
        potes: [
          { poteId: "transporte", totalCentavos: 68_000 },
          { poteId: "lazer", totalCentavos: 27_000 },
          { poteId: "fixos", totalCentavos: 91_000 },
        ],
      },
      {
        mes: "2026-06",
        coberturaSaiuPct: 100,
        potes: [
          { poteId: "transporte", totalCentavos: 96_000 },
          { poteId: "lazer", totalCentavos: 42_000 },
          { poteId: "fixos", totalCentavos: 88_000 },
        ],
      },
    ],
  },
  {
    titulo: "comparativo · há meses, e nenhum classificado o bastante",
    mes: "2026-06",
    historico: [
      {
        mes: "2026-04",
        coberturaSaiuPct: 22,
        potes: [{ poteId: "transporte", totalCentavos: 18_000 }],
      },
      {
        mes: "2026-05",
        coberturaSaiuPct: 51,
        potes: [{ poteId: "transporte", totalCentavos: 40_000 }],
      },
      {
        mes: "2026-06",
        coberturaSaiuPct: 100,
        potes: [
          { poteId: "transporte", totalCentavos: 96_000 },
          { poteId: "lazer", totalCentavos: 42_000 },
          { poteId: "fixos", totalCentavos: 88_000 },
        ],
      },
    ],
  },
];
