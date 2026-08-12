import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LogoGoogle } from "@/features/autenticacao/LogoGoogle";
import { linkSolicitarAcesso } from "@/features/autenticacao/contato";

/**
 * Tela de solicitar acesso — **protótipo visual** (tarefa B2).
 *
 * Não cria conta nem consulta allowlist: o botão é estático e os estados são
 * maquete. O `<SignUp />` real entra na D2 e a recusa por allowlist passa a
 * ser decidida **no servidor** na D3.
 */
export type EstadoCadastro = "pronto" | "carregando" | "erro" | "recusado";

export function CadastrarUsuario({
  estado = "pronto",
}: {
  estado?: EstadoCadastro;
}) {
  const recusado = estado === "recusado";

  return (
    <Card className="p-6">
      <div className="mb-5">
        <Badge variant="gold">Acesso por convite</Badge>
        <p className="mt-3 text-xs text-dim">
          O cadastro está fechado enquanto o app é validado. Só e-mails
          convidados conseguem criar conta.
        </p>
      </div>

      {estado === "erro" && (
        <p
          role="alert"
          className="mb-4 rounded-pote border border-red/20 bg-red/8 px-3.5 py-3 text-xs text-red"
        >
          Não foi possível conectar. Tente de novo.
        </p>
      )}

      {recusado ? (
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
        /* Mesma área reservada da tela de entrar, para as duas terem a mesma
           altura quando o widget do Clerk entrar (D2). */
        <div className="flex min-h-[84px] flex-col justify-center">
          <Button
            variant="secondary"
            loading={estado === "carregando"}
            className="w-full"
          >
            {estado !== "carregando" && <LogoGoogle />}
            {estado === "carregando" ? "Criando conta…" : "Continuar com Google"}
          </Button>

          <p className="mt-3 text-center font-mono text-[10px] text-dim2">
            Protótipo visual · o cadastro entra na tarefa D2
          </p>
        </div>
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
