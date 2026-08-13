# Plano — D2 · Ligar `<SignIn />` e `<SignUp />` reais

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D2 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** FRONT-INTEGRADO
**Spec:** `specs/01-fundacao-e-acesso.md`, `/entrar` e `/cadastrar`
**Depende de:** D1 (fechada, commit `8483894`)

## As rotas precisam virar catch-all

Os fluxos do Clerk navegam para sub-rotas próprias (`/entrar/sso-callback`,
etc.). Numa rota simples isso dá 404 no meio do login — o usuário sai do
Google e cai numa página inexistente.

Então `entrar/page.tsx` vira `entrar/[[...rest]]/page.tsx`, e o mesmo para
`cadastrar`. A URL que o usuário vê continua `/entrar` e `/cadastrar`.

## O andaime `?estado=` sai agora

A B1/B2 usaram `?estado=` para você revisar as variações. Com o widget real,
três dos quatro estados deixam de ser nossos:

| Estado | Quem cuida agora |
|---|---|
| `pronto` | o widget |
| `carregando` | o widget (spinner próprio) |
| `erro` | o widget (mensagem própria, dentro do card) |
| `bloqueado` / `recusado` | **continua nosso** — é a allowlist, decidida no servidor na D3 |

Então o `?estado=` some e sobra uma prop `naoConvidado`, que a **D3** vai
alimentar. Mantenho o bloco visual que você aprovou no portão da fase B em vez
de apagar e reescrever daqui a uma tarefa.

## Reuso identificado

- A moldura `(auth)` com a marca (B1) continua servindo às duas telas.
- A aparência do Clerk é a **mesma** nas duas telas → vira um módulo só, no
  nível da área `autenticacao/`, como já foi feito com `LogoGoogle` e
  `contato.ts`.
- **Os tokens da A2 são reaproveitados via `var(--color-*)`.** O Tailwind 4
  emite os tokens do `@theme` no `:root`, então a configuração do Clerk
  referencia as variáveis em vez de repetir hex — a regra "nenhuma cor
  literal em componente" continua valendo dentro da configuração do Clerk.

## Arquivos a criar

- `src/features/autenticacao/aparencia-clerk.ts` — objeto `appearance`
  compartilhado pelas duas telas.
- `src/app/(auth)/entrar/[[...rest]]/page.tsx`
- `src/app/(auth)/cadastrar/[[...rest]]/page.tsx`

## Arquivos a modificar

- `src/features/autenticacao/fazer-login/FazerLogin.tsx` — `<SignIn />` no
  lugar do botão estático; prop reduzida a `naoConvidado`.
- `src/features/autenticacao/cadastrar-usuario/CadastrarUsuario.tsx` — idem
  com `<SignUp />`.
- `references/architecture.md`.

## Arquivos a excluir

- `src/app/(auth)/entrar/page.tsx` e `src/app/(auth)/cadastrar/page.tsx` —
  substituídos pelas catch-all.
- `src/features/autenticacao/LogoGoogle.tsx` — **o Clerk desenha o próprio
  botão do Google**. Manter o nosso seria código morto e, pior, um segundo
  logo que poderia divergir do que o widget mostra.

## Quem já tem sessão não vê a tela de login

A página verifica a sessão **no servidor** antes de renderizar e redireciona.
No D2 o destino é `/dashboard`; a **D6** substitui isso pela decisão completa
(quem não concluiu onboarding vai para `/bem-vindo`). Não vou antecipar a D6
aqui para não espalhar a mesma regra em dois lugares.

## Para onde o usuário vai depois de entrar

`fallbackRedirectUrl="/dashboard"`, e não `forceRedirectUrl`: o "fallback"
deixa o `redirect_url` da query string vencer. Isso é o que faz o
`returnBackUrl` que a D1 gravou realmente funcionar — quem tentou `/upload`
sem sessão volta para `/upload`, não para o painel.

## Caminho feliz

1. `/entrar` mostra o widget do Clerk dentro do nosso card, no dark mode.
2. Clicar em "Continuar com Google" abre o fluxo do Google.
3. Depois de autenticar, cai em `/dashboard` (ou na rota tentada).
4. Voltar a `/entrar` com sessão redireciona sem mostrar o login.

## Edge cases

| Situação | Tratamento |
|---|---|
| Sub-rota do fluxo do Clerk | Resolvida pela catch-all |
| `/entrar` com sessão | Redirecionamento no servidor, antes de renderizar |
| Usuário fecha o popup do Google | O widget volta ao estado inicial sozinho |
| Rede cai no meio | Mensagem do próprio Clerk, dentro do card |
| Altura do card mudando | A B1 reservou altura mínima justamente para isto; confiro se ainda faz sentido com o widget real e ajusto |
| E-mail/senha ainda ligado no painel do Clerk | O widget mostraria campos que a spec não prevê. **Não consigo corrigir por código** — depende da configuração do Davi. Vou verificar o que o widget renderiza e reportar |

## Erros

Erros de autenticação passam a ser do Clerk. O que continua nosso é a recusa
por allowlist, que é **D3** e ainda não tem produtor.

## Thin Client / Fat Server

A verificação de sessão que redireciona acontece **no servidor**, não no
componente. A chave secreta segue sem prefixo público. O widget é cliente por
natureza, mas não decide acesso — quem decide é o middleware (D1).

## Fora do escopo

- Recusa real por allowlist → **D3**
- Webhook e criação do usuário no banco → **D4**/**D5**
- Redirecionamento da raiz → **D6**
- Sair → **D8**

## Critério de pronto (da Etapa 2)

- [ ] Widgets reais no lugar dos botões estáticos
- [ ] Estilizados via `appearance` batendo com o design system
- [ ] Login com Google funcionando ponta a ponta
- [ ] Quem já tem sessão e abre `/entrar` vai para a área interna
