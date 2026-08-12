import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LogoGoogle } from "@/features/autenticacao/LogoGoogle";
import { linkSolicitarAcesso } from "@/features/autenticacao/contato";

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
            href={linkSolicitarAcesso()}
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
