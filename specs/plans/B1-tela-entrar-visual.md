# Plano — B1 · Tela Entrar (visual)

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** B1 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** FRONT-VISUAL
**Spec:** `specs/01-fundacao-e-acesso.md`, página `/entrar`
**Depende de:** A3 (concluída, commit `f4ed391`)

## Contexto lido antes de planejar

- `specs/01-fundacao-e-acesso.md` — componentes e variações de `/entrar`
- `references/architecture.md` — isolamento por comportamento e lista de
  reutilizáveis da fase A
- `references/design-system.md` — tokens e adaptação mobile

## Reuso identificado

- `Card`, `Button` e `cn()` da A3. **Nada de componente novo em
  `components/ui`** nesta tarefa.
- A marca (nome + subtítulo) aparece em `/entrar` **e** em `/cadastrar` (B2).
  Em vez de duplicar, ela vive no layout do grupo de rotas, que as duas telas
  compartilham. A B2 herda de graça.
- `SectionTitle` e `Badge` não têm uso aqui — não vou forçar.

## Onde cada arquivo vive

A regra de isolamento por comportamento do `architecture.md` diz que a rota só
compõe e o comportamento mora em `src/features/`. Então:

```
src/app/(auth)/layout.tsx          ← moldura das telas públicas + marca
src/app/(auth)/entrar/page.tsx     ← só compõe
src/features/autenticacao/fazer-login/FazerLogin.tsx   ← a tela
```

`(auth)` é grupo de rotas: não vira segmento de URL. O caminho continua
`/entrar`. Consertar "fazer login" depois significa mexer só em
`fazer-login/` — nunca em `cadastrar-usuario/`.

## Arquivos a criar

- `src/app/(auth)/layout.tsx` — coluna centrada, mobile-first, com a marca
  no topo. Reutilizado pela B2.
- `src/app/(auth)/entrar/page.tsx` — lê o estado da query string e compõe.
  `metadata.title` próprio.
- `src/features/autenticacao/fazer-login/FazerLogin.tsx` — a tela e seus
  quatro estados.

## Arquivos a modificar

- `references/architecture.md` — registrar a moldura `(auth)` como reutilizável.

## Arquivos a excluir

- `src/features/.gitkeep` — a pasta ganhou conteúdo real.

## Como o Davi vê os quatro estados

A spec pede as variações "renderizáveis via prop". Prop sozinha não é
revisável no navegador — o Davi não tem como disparar um erro de rede numa tela
que ainda não faz nada. Então a `page.tsx` lê `?estado=` da URL e repassa:

| URL | Estado |
|---|---|
| `/entrar` | pronto |
| `/entrar?estado=carregando` | spinner no botão, botão desabilitado |
| `/entrar?estado=erro` | "Não foi possível conectar. Tente de novo." |
| `/entrar?estado=bloqueado` | "Esse e-mail ainda não tem acesso ao app." |

Isso é **andaime de revisão visual e sai na D2**, quando o widget real do Clerk
assume e o estado passa a vir dele. Está anotado no próprio arquivo.

## Conteúdo da tela

- Marca: "Painel Financeiro" + "6 Potes", com o subtítulo "Seu dinheiro
  organizado em potes, todo mês."
- `Card` com o botão "Continuar com Google" (estático) ocupando a área que o
  widget do Clerk vai ocupar, para o tamanho não mudar na D2.
- Link "Não tem conta? Solicitar acesso" → `/cadastrar`.
- Mensagem de estado acima do botão, quando houver.

## Caminho feliz

1. `/entrar` abre escura, centrada, legível em 360px.
2. Os quatro estados renderizam pela query string.
3. `build`, `tsc --noEmit` e `lint` limpos.

## Edge cases

| Situação | Tratamento |
|---|---|
| `?estado=` com valor inválido ou ausente | Cai em "pronto". Sem erro, sem tela quebrada |
| Tela de 360px de largura | Coluna única com `max-width` e padding lateral; o botão ocupa a largura toda |
| Texto longo no botão | O `Button` da A3 já quebra em duas linhas mantendo 44px |
| Logo do Google | SVG inline. Nada de imagem remota — o app não depende de host externo |
| Estado "carregando" com botão clicável | O `loading` do `Button` já desabilita o elemento |
| Leitor de tela na mensagem de erro | `role="alert"` para o erro ser anunciado |

## Erros

Nesta tarefa **não existe erro de verdade** — nada de rede, nada de Clerk,
nada de banco. Os estados de erro são maquete. O tratamento real entra na D2 e
na D3.

## Banco de dados

Não se aplica.

## Thin Client / Fat Server

Nada sensível nesta tela: sem chave, sem validação, sem decisão de acesso. A
allowlist é decidida **no servidor** na D3 — aqui só existe o desenho da
mensagem de recusa.

## Fora do escopo

- `<SignIn />` real do Clerk → **D2**
- Recusa real por allowlist → **D3**
- Redirecionar quem já tem sessão → **D6**
- Tela de cadastro → **B2**

## Critério de pronto (da Etapa 2)

- [ ] `/entrar` mostra marca, botão "Continuar com Google" estático e o link
      "Solicitar acesso"
- [ ] Área reservada do tamanho do widget do Clerk
- [ ] Estados de carregando e erro renderizáveis
- [ ] Legível em tela de 360px
