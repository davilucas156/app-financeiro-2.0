import Link from "next/link";
import { SignOutButton, SignUp } from "@clerk/nextjs";
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
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <a
              href={linkSolicitarAcesso()}
              className="font-mono text-[11px] font-bold text-text underline underline-offset-4"
            >
              Solicitar acesso
            </a>
            {/* Sem isto o usuário fica num limbo: autenticado no Clerk, sem
                acesso a nada, e sem caminho para trocar de conta. */}
            <SignOutButton>
              <button
                type="button"
                className="font-mono text-[11px] font-bold text-dim underline underline-offset-4 hover:text-text"
              >
                Sair desta conta
              </button>
            </SignOutButton>
          </div>
        </div>
      ) : (
        <SignUp
          appearance={APARENCIA_CLERK}
          // `/` para a D6 decidir o destino — ver a nota em `FazerLogin`.
          fallbackRedirectUrl="/"
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
