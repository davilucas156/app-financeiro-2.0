import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Tela de entrar — **protótipo visual** (tarefa B1).
 *
 * Não autentica nada: o botão é estático e os estados são maquete. O widget
 * real do Clerk assume o lugar do botão na tarefa D2, e a recusa por allowlist
 * passa a ser decidida no servidor na D3.
 */
export type EstadoFazerLogin = "pronto" | "carregando" | "erro" | "bloqueado";

export function FazerLogin({
  estado = "pronto",
}: {
  estado?: EstadoFazerLogin;
}) {
  return (
    <Card className="p-6">
      {estado === "erro" && (
        <p
          role="alert"
          className="mb-4 rounded-pote border border-red/20 bg-red/8 px-3.5 py-3 text-xs text-red"
        >
          Não foi possível conectar. Tente de novo.
        </p>
      )}

      {estado === "bloqueado" && (
        <div
          role="alert"
          className="mb-4 rounded-pote border border-gold/20 bg-gold/8 px-3.5 py-3"
        >
          <p className="text-xs font-bold text-gold">
            Esse e-mail ainda não tem acesso ao app.
          </p>
          <p className="mt-1.5 text-xs text-dim">
            O acesso está fechado enquanto o app é validado.
          </p>
        </div>
      )}

      {/* Área reservada ao widget do Clerk (D2). A altura mínima existe para
          o cartão não mudar de tamanho quando o widget real entrar. */}
      <div className="flex min-h-[84px] flex-col justify-center">
        <Button
          variant="secondary"
          loading={estado === "carregando"}
          className="w-full"
        >
          {estado !== "carregando" && <LogoGoogle />}
          {estado === "carregando" ? "Entrando…" : "Continuar com Google"}
        </Button>

        <p className="mt-3 text-center font-mono text-[10px] text-dim2">
          Protótipo visual · o login entra na tarefa D2
        </p>
      </div>

      {estado === "bloqueado" ? (
        <p className="mt-5 text-center text-xs text-dim">
          <a
            href="mailto:davilucascarmo@gmail.com?subject=Acesso%20ao%20Painel%20Financeiro"
            className="font-bold text-text underline underline-offset-4"
          >
            Solicitar acesso
          </a>
        </p>
      ) : (
        <p className="mt-5 text-center text-xs text-dim">
          Não tem conta?{" "}
          <Link
            href="/cadastrar"
            className="font-bold text-text underline underline-offset-4"
          >
            Solicitar acesso
          </Link>
        </p>
      )}
    </Card>
  );
}

/** Logo do Google em SVG inline — o app não depende de host externo. */
function LogoGoogle() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="size-4 shrink-0">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
