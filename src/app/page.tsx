/**
 * Página temporária de verificação dos design tokens (tarefa A2).
 * Existe para conferir a olho que as cores e fontes batem com
 * `references/design-system.md`. É substituída pelo redirecionamento
 * da raiz na tarefa D6.
 */

const potes = [
  { nome: "Custos Fixos", emoji: "🏠", classe: "bg-pote-fix", hex: "#FF5000", meta: "30%" },
  { nome: "Liberdade Financeira", emoji: "📈", classe: "bg-pote-lib", hex: "#00e5a0", meta: "25%" },
  { nome: "Conforto & Lazer", emoji: "🎮", classe: "bg-pote-laz", hex: "#3d8eff", meta: "15%" },
  { nome: "Metas / Sonhos", emoji: "★", classe: "bg-pote-met", hex: "#ffc94d", meta: "15%" },
  { nome: "Transporte", emoji: "🚗", classe: "bg-pote-tra", hex: "#00c8d4", meta: "10%" },
  { nome: "Conhecimento", emoji: "📚", classe: "bg-pote-con", hex: "#e040a0", meta: "5%" },
  { nome: "Manutenção", emoji: "🔧", classe: "bg-pote-mec", hex: "#26c9a0", meta: "eventual" },
  { nome: "Outros / Repasses", emoji: "·", classe: "bg-pote-out", hex: "#5a5a70", meta: "sem meta" },
];

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

function Titulo({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mt-10 mb-4">
      <h2 className="font-mono text-[9px] font-bold uppercase tracking-[2.5px] text-dim whitespace-nowrap">
        {children}
      </h2>
      <span className="flex-1 h-px bg-border2" />
    </div>
  );
}

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
        Verificação de tokens · tarefa A2
      </p>
      <h1 className="text-3xl font-extrabold tracking-tight mt-2">
        Painel Financeiro 6 Potes
      </h1>

      <Titulo>Tipografia</Titulo>
      <div className="rounded-card border border-border bg-card p-5 space-y-3">
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
      </div>

      <Titulo>Potes</Titulo>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {potes.map((p) => (
          <div
            key={p.nome}
            className="rounded-pote border border-border bg-card overflow-hidden"
          >
            <div className={`${p.classe} h-1.5`} />
            <div className="p-3">
              <p className="text-[11px] font-bold leading-tight">
                {p.emoji} {p.nome}
              </p>
              <p className="font-mono text-[10px] text-dim mt-1.5">{p.hex}</p>
              <p className="font-mono text-[10px] text-dim">meta {p.meta}</p>
            </div>
          </div>
        ))}
      </div>

      <Titulo>Cores base</Titulo>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {base.map((c) => (
          <Amostra key={c.nome} {...c} />
        ))}
      </div>

      <Titulo>Cores semânticas</Titulo>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {semanticas.map((c) => (
          <Amostra key={c.nome} {...c} />
        ))}
      </div>

      <Titulo>Raios</Titulo>
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
