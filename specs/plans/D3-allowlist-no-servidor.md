# Plano — D3 · Estado "e-mail não convidado" (allowlist no servidor)

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D3 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** BACK + FRONT-INTEGRADO
**Spec:** `specs/01-fundacao-e-acesso.md`, `/cadastrar` e `/entrar`
**Depende de:** D2 (commit `f23b445`)

## O critério pede algo que o Clerk não permite

O critério da Etapa 2 diz: *"um Google válido fora da allowlist **não cria
sessão** nem linha em `users`"*.

A primeira metade não é alcançável por código nosso. Quando alguém autentica
com o Google, **quem cria a conta e a sessão é o Clerk**, antes de qualquer
linha nossa rodar. Não existe gancho síncrono que permita vetar no meio do
fluxo.

O que dá para garantir, e é o que importa de verdade:

| Promessa | Alcançável? |
|---|---|
| Não vê nenhuma tela interna | **sim** |
| Não ganha linha em `users` | **sim** — a D5 usa o mesmo portão |
| Vê a mensagem de recusa com o contato | **sim** |
| Consegue sair do estado pela metade | **sim** — botão de sair no bloco |
| Nenhuma sessão é criada no Clerk | **não** — fora do nosso alcance |

Vou implementar as quatro primeiras e **corrigir o texto do critério** em vez
de marcá-lo como cumprido. Se você quiser fechar também a quinta, o caminho é
ligar Restrictions → Allowlist no painel do Clerk, que impede o cadastro na
origem. Os dois se somam bem: o painel barra na porta, o nosso código é a
garantia que está versionada e não depende de configuração que alguém pode
desligar sem querer.

## Onde a verificação mora

No `src/proxy.ts`, junto com a checagem de sessão. Foi a escolha certa por
eliminação:

- **Na tela** — não. Tela não é barreira de segurança.
- **No layout de `(app)`** — cobriria as três rotas internas, mas uma rota
  interna futura criada fora daquele grupo escaparia em silêncio.
- **No proxy** — cobre tudo que a lista de rotas protegidas cobre, e é o mesmo
  lugar onde já se decide acesso. Um portão só.

**Custo assumido:** o e-mail não está nos claims padrão da sessão, então
verificar exige uma consulta ao Clerk por requisição de rota interna. Para um
app com um punhado de usuários isso é irrelevante. Se um dia incomodar, a
saída é publicar o e-mail como claim customizado no painel do Clerk e ler do
token — registro isso como otimização conhecida, não como dívida esquecida.

## A lista fica em variável de ambiente

`EMAILS_CONVIDADOS`, separada por vírgula, **sem** prefixo público — a lista
de quem tem acesso não precisa ir para o navegador.

Comparação normalizada (minúsculas, sem espaços) para `Davi@Gmail.com ` e
`davi@gmail.com` não serem tratados como pessoas diferentes.

**Lista vazia = ninguém entra.** É a escolha segura: se a variável sumir num
deploy, o app tranca em vez de abrir para todos. Um app financeiro que falha
aberto é pior do que um que falha fechado.

## Arquivos a criar

- `src/features/autenticacao/allowlist.ts` — `estaConvidado(email)` e a
  leitura da variável.

## Arquivos a modificar

- `src/proxy.ts` — após confirmar sessão, verificar o convite.
- `src/features/autenticacao/cadastrar-usuario/CadastrarUsuario.tsx` — botão
  de sair no bloco de recusa, para o usuário não ficar preso num limbo de
  "logado no Clerk, sem acesso a nada".
- `src/app/(auth)/cadastrar/[[...rest]]/page.tsx` — ler `?acesso=negado` e
  **não** redirecionar quem está nesse estado (hoje ele redirecionaria para
  `/dashboard` por ter sessão, e entraria em laço).
- `.env.example`, `references/architecture.md`.

## O laço que precisa ser evitado

Sem cuidado, isto acontece: usuário não convidado abre `/dashboard` → proxy
manda para `/cadastrar` → a página vê que há sessão e manda para `/dashboard`
→ proxy manda para `/cadastrar`… Redirecionamento infinito.

Por isso `/cadastrar?acesso=negado` **não** redireciona quem tem sessão: é
justamente a tela que essa pessoa precisa ver.

## Caminho feliz

1. E-mail na lista: nada muda, o acesso funciona como na D2.
2. E-mail fora da lista: qualquer rota interna manda para
   `/cadastrar?acesso=negado`, que mostra a recusa e o botão de sair.

## Edge cases

| Situação | Tratamento |
|---|---|
| `EMAILS_CONVIDADOS` ausente ou vazia | Ninguém entra. Falha fechado |
| E-mail com maiúsculas ou espaços | Normalizado dos dois lados |
| Vírgulas sobrando na lista | Entradas vazias descartadas |
| Conta Google sem e-mail primário | Tratado como não convidado |
| Laço de redirecionamento | Coberto acima |
| Usuário convidado depois de ser recusado | Basta entrar de novo; nada fica gravado impedindo |
| Consulta ao Clerk falhar | **Nega o acesso.** Em dúvida, fecha |

## Erros

| Erro | Resposta |
|---|---|
| API do Clerk indisponível | Nega e deixa o usuário na tela de recusa. Não abre por causa de falha de rede |

## Thin Client / Fat Server

O caso mais claro até aqui: a lista de convidados **nunca vai para o
navegador**, e a decisão acontece antes de renderizar. A tela só desenha o
resultado.

## Fora do escopo

- Criar a linha em `users` → **D4**/**D5**, que vão usar este mesmo portão
- Convidar alguém pela interface → nem no MVP nem na fase 2

## Critério de pronto (da Etapa 2), corrigido

- [ ] Google fora da allowlist **não acessa nenhuma tela interna**
- [ ] ~~não cria sessão~~ → **fora do alcance**; o Clerk cria antes de nós.
      Mitigado com botão de sair e, opcionalmente, Restrictions no painel
- [ ] Não ganha linha em `users` — garantido junto com a D5
- [ ] Cai no bloco "não convidado" com o contato do Davi
- [ ] Verificado com uma segunda conta Google — **precisa do Davi**
