import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { Card } from "@/components/ui/Card";
import { APARENCIA_CLERK } from "@/features/autenticacao/aparencia-clerk";
import { linkSolicitarAcesso } from "@/features/autenticacao/contato";

/**
 * Tela de entrar (tarefa D2 — widget real do Clerk).
 *
 * Os estados de carregando e erro deixaram de ser nossos: o widget cuida dos
 * dois. O que continua nosso é a recusa por convite, decidida **no servidor**
 * na tarefa D3 — por isso `naoConvidado` ainda não tem quem o alimente.
 */
export function FazerLogin({
  naoConvidado = false,
}: {
  naoConvidado?: boolean;
}) {
  return (
    <Card className="p-6">
      {naoConvidado && (
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

      <SignIn
        appearance={APARENCIA_CLERK}
        // `fallback` e não `force`: assim o `redirect_url` da query string
        // vence, e quem tentou /upload sem sessão volta para /upload em vez
        // de cair no painel. É o que faz o returnBackUrl da D1 valer.
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/cadastrar"
      />

      <p className="mt-5 text-center text-xs text-dim">
        {naoConvidado ? (
          <a
            href={linkSolicitarAcesso()}
            className="font-bold text-text underline underline-offset-4"
          >
            Solicitar acesso
          </a>
        ) : (
          <>
            Não tem conta?{" "}
            <Link
              href="/cadastrar"
              className="font-bold text-text underline underline-offset-4"
            >
              Solicitar acesso
            </Link>
          </>
        )}
      </p>
    </Card>
  );
}
