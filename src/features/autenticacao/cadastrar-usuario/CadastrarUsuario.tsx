import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { APARENCIA_CLERK } from "@/features/autenticacao/aparencia-clerk";
import { linkSolicitarAcesso } from "@/features/autenticacao/contato";

/**
 * Tela de solicitar acesso (tarefa D2 — widget real do Clerk).
 *
 * `naoConvidado` continua sendo nosso: a allowlist é decidida **no servidor**
 * na D3. No estado de recusa o widget some — insistir não adianta, e
 * deixá-lo ali sugere que uma nova tentativa resolveria.
 */
export function CadastrarUsuario({
  naoConvidado = false,
}: {
  naoConvidado?: boolean;
}) {
  return (
    <Card className="p-6">
      <div className="mb-5">
        <Badge variant="gold">Acesso por convite</Badge>
        <p className="mt-3 text-xs text-dim">
          O cadastro está fechado enquanto o app é validado. Só e-mails
          convidados conseguem criar conta.
        </p>
      </div>

      {naoConvidado ? (
        <div
          role="alert"
          className="rounded-pote border border-gold/20 bg-gold/8 px-3.5 py-4"
        >
          <p className="text-xs font-bold text-gold">
            Esse e-mail ainda não tem acesso ao app.
          </p>
          <p className="mt-1.5 text-xs text-dim">
            Nenhuma conta foi criada. Se você acha que deveria ter acesso, peça
            um convite.
          </p>
          <a
            href={linkSolicitarAcesso()}
            className="mt-3 inline-block font-mono text-[11px] font-bold text-text underline underline-offset-4"
          >
            Solicitar acesso
          </a>
        </div>
      ) : (
        <SignUp
          appearance={APARENCIA_CLERK}
          fallbackRedirectUrl="/dashboard"
          signInUrl="/entrar"
        />
      )}

      <p className="mt-5 text-center text-xs text-dim">
        Já tem acesso?{" "}
        <Link
          href="/entrar"
          className="font-bold text-text underline underline-offset-4"
        >
          Entrar
        </Link>
      </p>
    </Card>
  );
}
