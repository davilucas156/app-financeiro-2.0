"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { aparenciaClerk } from "@/features/autenticacao/aparencia-clerk";
import type { Tema } from "@/features/aparencia/tema/tema";
import { useTemaEfetivo } from "@/features/aparencia/tema/useTemaEfetivo";
import { linkSolicitarAcesso } from "@/features/autenticacao/contato";

/**
 * Classes do widget, no vocabulário Tailwind do resto do app (`Button`,
 * `Card`, `CampoDeMeta`) — que é a outra forma que `elements` aceita, além
 * de objeto de CSS.
 *
 * ⚠ **Quem desenha o cartão agora é o próprio Clerk (`card`), não mais um
 * `<Card>` nosso por fora.** As duas molduras uma dentro da outra — a nossa
 * com `border-border`/`p-6`, a dele com a própria borda e sombra — era
 * exatamente o "desalinhado" que se via na tela: bordas duplicadas,
 * cantos arredondados em raios diferentes, um respiro de 24px somado a
 * outro do Clerk. `card` recebe aqui os mesmos tokens do nosso `Card`
 * (`rounded-card border-border bg-card p-6`), e `cardBox`/`rootBox` ficam
 * só de layout — sem fundo, borda ou sombra próprios — para não haver
 * segunda moldura.
 *
 * `footer` some pelo mesmo motivo de duplicação: o Clerk escreve o próprio
 * "Not a member? Sign up", que repetia — fora de tom, em inglês — o convite
 * que esta tela já escreve embaixo, com o link certo para quem não foi
 * convidado.
 *
 * ⚠ **`w-full!`/`min-w-0!` em `card` não são capricho.** Sem eles o cartão
 * do Clerk mede a própria largura mínima de conteúdo (uns 400px) e
 * transborda do cartão — ele é um item flex dentro de `cardBox`, e item
 * flex por padrão não encolhe abaixo do próprio conteúdo
 * (`min-width: auto`). `min-w-0!` é o que permite encolher até os ~330px
 * que sobram num aparelho de 360px.
 *
 * ⚠ **`shadow-none!`, `p-0!`/`p-6!`, `hidden!`, e as cores de `headerSubtitle`
 * e `socialButtonsBlockButton*` levam `!` de propósito.** O Clerk gera a
 * própria classe para sombra, fundo, respiro, `display` e cor de texto
 * destes elementos, e ela vence uma utilitária comum do Tailwind sem aviso
 * — a inspeção no navegador mostrou `display: flex` computado mesmo com
 * `hidden` presente na lista de classes, e a letra do Google saindo em
 * `--color-dim` a 62% de opacidade mesmo com `text-text` escrito. Só o
 * modificador de `!important` do Tailwind 4 (sufixo, não mais prefixo)
 * vence.
 */
const ELEMENTOS_DO_WIDGET = {
  rootBox: "w-full",
  cardBox: "w-full min-w-0!",
  card: "w-full! min-w-0! rounded-card! border! border-border! bg-card! p-6! shadow-none!",
  header: "gap-1.5",
  headerTitle: "text-left text-xl font-extrabold text-text",
  headerSubtitle: "text-left text-sm font-medium text-text!",
  socialButtonsBlockButton:
    "min-h-11 rounded-card border border-border2 bg-card text-text! transition-colors hover:bg-card2",
  socialButtonsBlockButtonText: "text-sm font-bold! text-text!",
  dividerLine: "bg-border2",
  dividerText: "text-2xs font-bold tracking-[1.5px] text-dim uppercase",
  formFieldLabel: "text-2xs font-bold tracking-[1.5px] text-dim uppercase",
  formFieldInput:
    "min-h-11 rounded-card border border-border2 bg-bg text-sm text-text focus:border-primary",
  formButtonPrimary:
    "min-h-11 rounded-card bg-primary text-sm font-bold text-bg transition-colors hover:bg-orange",
  footer: "hidden!",
};

/**
 * Tela de entrar (tarefa D2 — widget real do Clerk).
 *
 * Os estados de carregando e erro deixaram de ser nossos: o widget cuida dos
 * dois. O que continua nosso é a recusa por convite, decidida **no servidor**
 * na tarefa D3 — por isso `naoConvidado` ainda não tem quem o alimente.
 */
export function FazerLogin({
  naoConvidado = false,
  tema,
}: {
  naoConvidado?: boolean;
  tema: Tema;
}) {
  const aparencia = aparenciaClerk(useTemaEfetivo(tema));

  return (
    <div>
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
        appearance={{ ...aparencia, elements: ELEMENTOS_DO_WIDGET }}
        // `fallback` e não `force`: assim o `redirect_url` da query string
        // vence, e quem tentou /upload sem sessão volta para /upload em vez
        // de cair no painel. É o que faz o returnBackUrl da D1 valer.
        //
        // O destino é `/` e não `/dashboard` (D8): quem entra sem
        // `redirect_url` — o caso normal — aterrissaria no painel mesmo sem
        // ter feito onboarding, furando a decisão da D6.
        fallbackRedirectUrl="/"
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
    </div>
  );
}
