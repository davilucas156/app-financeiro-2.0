/**
 * Moldura das telas públicas (`/entrar` e `/cadastrar`).
 *
 * A marca vive aqui, e não dentro de cada tela, para as duas não divergirem.
 * `(auth)` é grupo de rotas: não aparece na URL.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <header className="mb-8">
          <p className="font-mono text-[9px] font-bold tracking-[3px] text-primary uppercase">
            Painel Financeiro
          </p>
          <h1 className="mt-1.5 text-[28px] leading-none font-extrabold tracking-tight">
            6 Potes
          </h1>
          <p className="mt-3 text-sm text-dim">
            Seu dinheiro organizado em potes, todo mês.
          </p>
        </header>

        {children}
      </div>
    </div>
  );
}
