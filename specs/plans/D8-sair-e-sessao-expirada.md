# Plano — D8 · Sair e sessão expirada

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D8 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** FRONT-INTEGRADO
**Spec:** `specs/01-fundacao-e-acesso.md`, "Shell autenticado"
**Depende de:** D6 (commit `c282db4`)

## Três coisas

### 1. `<UserButton />` real

O avatar do cabeçalho é falso desde a B4 — um `<span>` com iniciais. Sai, entra
o widget do Clerk, com a mesma `APARENCIA_CLERK` das outras telas.

Com ele, `CabecalhoApp` perde a prop `nome`: quem sabe o nome e a foto passa a
ser o Clerk. A moldura de `(app)` **continua** chamando `garantirUsuario()` —
a chamada nunca foi por causa do nome, é a garantia da linha no banco (D5)
antes de qualquer filha ler por `user_id`.

### 2. Para onde o "Sair" volta

⚠ **`afterSignOutUrl` não é mais prop do `<UserButton />` no Core 3.** Migrou
para as opções do `<ClerkProvider>` (confirmado em
`node_modules/@clerk/shared/dist/types/`: `UserButtonProps` não a tem, e
`ClerkOptions` a tem). Passá-la no botão compila — `UserButtonProps` aceita
props extras — e **não faz nada**. Vai no provider.

Destino: `/entrar`. Não `/`, porque quem acabou de sair não tem sessão e `/`
só o mandaria para `/entrar` de qualquer forma — um salto a mais e uma
piscada.

### 3. Voltar para a rota que o usuário tentou

Isto já está montado desde a D1, e a D8 só fecha a última ponta:

| Peça | Onde | O que faz |
|---|---|---|
| `returnBackUrl: req.url` | `proxy.ts` (D1) | põe `?redirect_url=` no destino |
| `fallbackRedirectUrl` (e **não** `force`) | `FazerLogin` (D2) | deixa o `redirect_url` da query vencer |

O que muda: `fallbackRedirectUrl` passa de `/dashboard` para **`/`**, nas duas
telas. Com `/dashboard`, quem entra sem `redirect_url` — o caso normal —
aterrissa no painel mesmo sem ter feito onboarding, furando a decisão da D6.
Apontando para `/`, quem decide é sempre `destinoInicial()`.

## Arquivos a modificar

- `src/app/layout.tsx` — `afterSignOutUrl` no `<ClerkProvider>`.
- `src/features/shell/CabecalhoApp.tsx` — `<UserButton />` no lugar do falso.
- `src/app/(app)/layout.tsx` — para de passar `nome`.
- `src/features/autenticacao/fazer-login/FazerLogin.tsx` — `fallbackRedirectUrl="/"`.
- `src/features/autenticacao/cadastrar-usuario/CadastrarUsuario.tsx` — idem.

## Fora do shell

`/bem-vindo` não tem o `<UserButton />`, e é assim de propósito: quem está lá
tem um botão só, "Começar". Quem precisa sair sem concluir o onboarding sai
pela tela de não convidado ou fechando a aba. Se isso incomodar na prática,
vira tarefa própria — não invento tela agora.

## Edge cases

| Situação | Tratamento |
|---|---|
| Sai estando em `/upload` | `afterSignOutUrl` leva a `/entrar`; a sessão já morreu, então nada renderiza no meio |
| Sessão expira e ele toca em algo | O proxy não vê `userId` → `/entrar?redirect_url=<rota>` |
| Reentra: volta para a rota tentada | `redirect_url` vence o `fallbackRedirectUrl` |
| Entra sem `redirect_url` | Vai para `/`, e a D6 decide entre `/bem-vindo` e `/dashboard` |
| Expira **durante** o onboarding | Volta para `/bem-vindo` depois de reentrar; nada foi gravado |
| Perfil do Google sem foto | O próprio widget cai para iniciais |

## O que dá para verificar sem sessão

O `redirect_url` sendo montado pelo proxy, e o `afterSignOutUrl` chegando de
fato à configuração que o Clerk publica na página. O menu "Sair" em si exige
sessão de verdade — isso fica para o Davi confirmar no navegador.

## Fora do escopo

- Sessões múltiplas / trocar de conta → o app é de um usuário só
- Editar perfil dentro do `<UserProfile />` → outra spec

## Critério de pronto (da Etapa 2)

- [ ] `<UserButton />` real com "Sair" voltando para `/entrar`
- [ ] Sessão expirada redireciona para `/entrar`
- [ ] Após reentrar, volta para a rota que o usuário tentou acessar
