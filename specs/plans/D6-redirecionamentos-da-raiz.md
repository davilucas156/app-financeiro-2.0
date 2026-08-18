# Plano — D6 · Redirecionamentos da raiz

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D6 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** BACK
**Spec:** `specs/01-fundacao-e-acesso.md`, "Página: Raiz (`/`)"
**Depende de:** D5 (commit `f4e1f8f`)

## A regra

| Estado | Destino |
|---|---|
| Sem sessão | `/entrar` |
| Sessão, e-mail fora da allowlist | `/cadastrar?acesso=negado` |
| Sessão, convidado, onboarding pendente | `/bem-vindo` |
| Sessão, convidado, onboarding concluído | `/dashboard` |

As linhas 1, 3 e 4 são a spec da raiz. **A linha 2 não está lá** e é
consequência da D3: quem não foi convidado tem sessão, e mandá-lo para
`/dashboard` só o faria bater no proxy e voltar. Um salto a menos, e o destino
é a única tela que essa pessoa pode ver.

## Um lugar só, quatro chamadores

`src/features/autenticacao/destino-inicial.ts` — `destinoInicial()`.

A mesma pergunta é feita em quatro rotas, e hoje três respondem **errado** com
um `/dashboard` fixo que a D2/D3 deixaram provisório:

| Rota | Hoje | Depois |
|---|---|---|
| `/` | página de verificação de tokens (A2/A3) | `destinoInicial()` |
| `/entrar` | `if (userId) redirect("/dashboard")` | `destinoInicial()` |
| `/cadastrar` | idem, com guarda anti-laço | idem, com a guarda mantida |
| `/bem-vindo` | nada | volta para `/dashboard` se já concluiu |

Espalhar a regra é o que garante que ela divirja. Uma função, quatro
chamadores.

## Por que `/entrar` pode gravar no banco

`destinoInicial()` chama `obterUsuarioAtual()` (D5), que **cria a linha se
faltar**. Numa tela de login isso parece estranho, mas é exatamente o que a
spec pede em `/entrar`: "autentica com sucesso, mas é o primeiro acesso → cria
sessão, **grava o usuário no banco** e redireciona para `/bem-vindo`".

Visitante anônimo não paga nada por isso: sem `userId`, a função sai antes de
tocar no banco.

## A guarda anti-laço de `/cadastrar` continua

Quem foi recusado tem sessão. Sem a guarda: `/cadastrar` redireciona,
o destino é `/cadastrar?acesso=negado`, que redireciona de novo. A condição
`if (!recusado)` é o que quebra o ciclo — esta é justamente a tela que essa
pessoa precisa ver.

## `/bem-vindo` depois de concluído

A spec de `/bem-vindo` pede: "abre já tendo concluído o onboarding →
redireciona para `/dashboard`". É redirecionamento por
`onboarding_concluido_em`, então é desta tarefa e não da D7 — a D7 é a
**gravação**.

## A página de tokens sai

`src/app/page.tsx` é hoje a verificação visual das tarefas A2/A3, e o plano da
A2 já dizia que a D6 a substituiria. Some do app, continua no histórico do git.
O que ela documentava está em `references/design-system.md`.

## Sem piscar tela intermediária

Tudo decidido em Server Component, com `redirect()` antes de renderizar. O
navegador recebe 307 direto — nunca chega a pintar uma tela de espera.

## Edge cases

| Situação | Tratamento |
|---|---|
| Sessão viva de conta apagada no Clerk | A D5 limpa `removido_em`; segue o fluxo normal |
| Convidado cuja linha não existe e o webhook está fora do ar | A D5 cria; a decisão sai correta na mesma requisição |
| Não convidado abre `/cadastrar` sem o parâmetro | Vai para `/cadastrar?acesso=negado` e **para** ali |
| `/entrar/sso-callback` no meio do login | Rota catch-all; o comportamento é o mesmo que já existia, só muda o destino |
| Falha ao gravar o usuário | Erro sobe. Melhor uma tela de erro do que redirecionar para um app sem linha no banco |

## Thin Client / Fat Server

Nenhuma decisão de destino chega ao cliente. O `userId` vem de `auth()`.

## Fora do escopo

- Gravar potes e marcar `onboarding_concluido_em` → **D7**
- Sair e sessão expirada → **D8**

## Critério de pronto (da Etapa 2)

- [ ] `/` manda para `/entrar`, `/bem-vindo` ou `/dashboard` conforme sessão e
      `onboarding_concluido_em`
- [ ] Decisão no servidor, sem piscar tela intermediária
