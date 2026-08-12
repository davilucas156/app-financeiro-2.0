/**
 * Página temporária de verificação dos design tokens (A2) e dos componentes
 * base (A3). Existe para conferir a olho que tudo bate com
 * `references/design-system.md`. É substituída pelo redirecionamento da raiz
 * na tarefa D6.
 */
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { POTES_PADRAO, rotuloMeta } from "@/features/onboarding/potes-padrao";

const base = [
  { nome: "bg", classe: "bg-bg", hex: "#060608" },
  { nome: "surface", classe: "bg-surface", hex: "#0d0d10" },
  { nome: "card", classe: "bg-card", hex: "#111116" },
  { nome: "card2", classe: "bg-card2", hex: "#16161c" },
  { nome: "border", classe: "bg-border", hex: "#1e1e26" },
  { nome: "border2", classe: "bg-border2", hex: "#28282f" },
  { nome: "text", classe: "bg-text", hex: "#e8e8f0" },
  { nome: "dim", classe: "bg-dim", hex: "#5a5a70" },
  { nome: "dim2", classe: "bg-dim2", hex: "#3a3a4a" },
];

const semanticas = [
  { nome: "primary", classe: "bg-primary", hex: "#FF5000" },
  { nome: "green", classe: "bg-green", hex: "#00e5a0" },
  { nome: "red", classe: "bg-red", hex: "#ff4f4f" },
  { nome: "gold", classe: "bg-gold", hex: "#ffc94d" },
  { nome: "blue", classe: "bg-blue", hex: "#3d8eff" },
  { nome: "cyan", classe: "bg-cyan", hex: "#00c8d4" },
  { nome: "pink", classe: "bg-pink", hex: "#e040a0" },
  { nome: "purple", classe: "bg-purple", hex: "#a78bfa" },
  { nome: "orange", classe: "bg-orange", hex: "#ff9a3c" },
];

function Amostra({ classe, nome, hex }: { classe: string; nome: string; hex: string }) {
  return (
    <div className="rounded-pote border border-border overflow-hidden">
      <div className={`${classe} h-12`} />
      <div className="p-2.5">
        <p className="font-mono text-[10px] uppercase tracking-wider text-text">{nome}</p>
        <p className="font-mono text-[10px] text-dim">{hex}</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-5 py-10">
      <p className="font-mono text-[9px] uppercase tracking-[2px] text-dim">
        Verificação de tokens e componentes · tarefas A2 e A3
      </p>
      <h1 className="text-3xl font-extrabold tracking-tight mt-2">
        Painel Financeiro 6 Potes
      </h1>

      <SectionTitle>Tipografia</SectionTitle>
      <Card className="space-y-3">
        <p className="text-2xl font-extrabold tracking-tight">
          Syne 800 — Ação, órfão, coração, gestão
        </p>
        <p className="text-base font-normal">
          Syne 400 — o corpo de texto do aplicativo em português.
        </p>
        <p className="font-mono text-xs uppercase tracking-[1.5px] text-dim">
          DM Mono 400 — rótulo em caixa alta
        </p>
        <p className="font-mono text-xl font-medium text-green">R$ 1.234,56</p>
      </Card>

      <SectionTitle>Badge</SectionTitle>
      <Card className="flex flex-wrap items-center gap-3">
        <Badge variant="green">Dentro da meta</Badge>
        <Badge variant="gold">Metas</Badge>
        <Badge variant="blue">Informação</Badge>
        <Badge variant="dim">Sem meta</Badge>
      </Card>

      <SectionTitle>Button</SectionTitle>
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Começar</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button disabled>Desabilitado</Button>
          <Button loading>Enviando</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" disabled>
            Desabilitado
          </Button>
          <Button variant="secondary" loading>
            Enviando
          </Button>
        </div>
        <p className="font-mono text-[10px] text-dim">
          Dívida conhecida: o spinner ignora prefers-reduced-motion.
        </p>
      </Card>

      <SectionTitle>Potes</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {POTES_PADRAO.map((p) => (
          <div
            key={p.slug}
            className="rounded-pote border border-border bg-card overflow-hidden"
          >
            <div className={`${p.classeCor} h-1.5`} />
            <div className="p-3">
              <p className="text-[11px] font-bold leading-tight">
                {p.emoji} {p.nome}
              </p>
              <p className="font-mono text-[10px] text-dim mt-1.5">{p.hex}</p>
              <p className="font-mono text-[10px] text-dim">
                meta {rotuloMeta(p)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle>Cores base</SectionTitle>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {base.map((c) => (
          <Amostra key={c.nome} {...c} />
        ))}
      </div>

      <SectionTitle>Cores semânticas</SectionTitle>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {semanticas.map((c) => (
          <Amostra key={c.nome} {...c} />
        ))}
      </div>

      <SectionTitle>Raios</SectionTitle>
      <div className="flex gap-3">
        <div className="rounded-pote border border-border2 bg-card px-5 py-4 font-mono text-[10px] text-dim">
          rounded-pote · 12px
        </div>
        <div className="rounded-card border border-border2 bg-card px-5 py-4 font-mono text-[10px] text-dim">
          rounded-card · 14px
        </div>
      </div>
    </main>
  );
}
