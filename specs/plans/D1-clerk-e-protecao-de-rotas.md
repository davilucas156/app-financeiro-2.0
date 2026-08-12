# Plano — D1 · Configurar Clerk + proteção de rotas

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D1 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** INFRA + BACK
**Spec:** `specs/01-fundacao-e-acesso.md`, "Proteção de rotas"
**Depende de:** fase C (fechada, commit `d4a7c34`)

`@clerk/nextjs` 7.7.4 aceita `next ^16.1` e React `~19.2.3` — compatível com
o que já está instalado.

## Esta é a tarefa que torna a moldura interna real

Até aqui `/dashboard`, `/upload` e `/revisao` abrem para qualquer pessoa com a
URL — inclusive no deploy que já está no ar. O `architecture.md` registra em
destaque que **a moldura não protege nada**. A D1 é quem passa a proteger.

## Reuso identificado

- Nada a reaproveitar: é a primeira integração de autenticação.
- As rotas internas já estão declaradas em `src/features/shell/rotas.ts` (B4),
  mas **não vou derivar o matcher delas**. Ver "decisão" abaixo.

## Decisão: a lista de rotas protegidas é escrita à mão

Seria elegante gerar o matcher do middleware a partir de `rotas.ts`. Não vou.

`rotas.ts` existe para desenhar a barra de navegação. Se amanhã alguém
remover um item de lá para tirá-lo do menu — motivo puramente visual — a rota
sairia da proteção junto, silenciosamente. Uma decisão de UI viraria um buraco
de segurança.

A lista de proteção é escrita explicitamente no middleware, e inclui
`/bem-vindo`, que **não** está em `rotas.ts` porque não aparece no menu.

## Arquivos a criar

- `src/middleware.ts` — `clerkMiddleware` com a lista de rotas protegidas.

## Arquivos a modificar

- `src/app/layout.tsx` — envolver a árvore em `<ClerkProvider>`.
- `.env.example` — acrescentar as URLs de sign-in/sign-up, para o Clerk
  redirecionar para `/entrar` e `/cadastrar` em vez das telas dele.
- `package.json` — `@clerk/nextjs`.
- `references/architecture.md` — registrar a proteção e corrigir a nota que
  diz que nada protege as rotas internas.

## Rotas protegidas

| Rota | Protegida? |
|---|---|
| `/dashboard`, `/upload`, `/revisao` | sim |
| `/bem-vindo` | sim — é onboarding de usuário já autenticado |
| `/entrar`, `/cadastrar` | não |
| `/` | não — hoje é a página de tokens; vira redirecionamento na D6 |

## O que fica com o Davi (não consigo fazer por você)

1. Criar a aplicação no dashboard do Clerk.
2. **Habilitar só o Google** em Social Connections, e **desabilitar
   e-mail/senha** — a spec fechou Google como único método, e deixar
   e-mail/senha ligado abriria um caminho de entrada que nenhuma tela cobre.
3. Copiar `CLERK_SECRET_KEY` e `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` para o
   `.env.local`.
4. Allowlist: se o plano do Clerk oferecer Restrictions → Allowlist, ligue com
   `davilucascarmo@gmail.com`. **Se não oferecer, não tem problema** — a
   recusa por convite é implementada por nós no servidor, na D3, que é a
   barreira que vale de qualquer forma.

## O que fica bloqueado

Sem as chaves, **não posso verificar** que a proteção funciona: o
`clerkMiddleware` precisa da chave para rodar. Vou verificar o que dá
(compilação, tipos, lint) e deixar explícito que a verificação de
comportamento fica pendente.

**Se o `<ClerkProvider>` impedir o build sem chave**, não commito o projeto
quebrado: reporto e aguardo. Prefiro travar a entregar um repositório que não
compila.

## Caminho feliz

1. `@clerk/nextjs` instalado.
2. Middleware protegendo as quatro rotas.
3. `<ClerkProvider>` na raiz.
4. `build`, `tsc --noEmit` e `lint` limpos.
5. **Com as chaves:** abrir `/dashboard` sem sessão redireciona para
   `/entrar`; com sessão, abre.

## Edge cases

| Situação | Tratamento |
|---|---|
| Requisição a arquivo estático | O matcher exclui `_next` e extensões de arquivo — middleware não roda à toa |
| Rota interna nova criada no futuro | **Não é protegida automaticamente.** Registrado no `architecture.md` como passo obrigatório ao criar rota interna |
| Sessão expirada | O Clerk redireciona para a URL de sign-in configurada (`/entrar`) |
| Voltar para a rota tentada após entrar | É a **D8**; aqui só garanto o bloqueio |
| `/` continuar pública | Correto por enquanto — vira redirecionamento na D6 |

## Erros

| Erro | Resposta |
|---|---|
| Chave ausente em execução | O Clerk falha com mensagem própria, que já diz o que falta |
| Chave secreta vazar para o cliente | Impossível por engano: só `NEXT_PUBLIC_*` vai para o bundle, e a secreta não tem esse prefixo |

## Thin Client / Fat Server

Esta é a tarefa mais alinhada à regra: a decisão de acesso passa a acontecer
**antes de renderizar**, no servidor. Nenhuma tela decide se pode ou não ser
vista. `CLERK_SECRET_KEY` nunca leva o prefixo público.

## Banco de dados

Não se aplica. Gravar o usuário é **D4** (webhook) e **D5** (garantia na
primeira requisição).

## Fora do escopo

- `<SignIn />` e `<SignUp />` reais → **D2**
- Allowlist no servidor → **D3**
- Webhook → **D4**
- Redirecionamentos da raiz → **D6**

## Critério de pronto (da Etapa 2)

- [ ] App do Clerk com só Google — **do Davi**
- [ ] Allowlist — **do Davi** (ou D3)
- [ ] Chaves em variável de ambiente, a secreta sem prefixo público
- [ ] Middleware bloqueando `/dashboard`, `/upload`, `/revisao` e `/bem-vindo`
