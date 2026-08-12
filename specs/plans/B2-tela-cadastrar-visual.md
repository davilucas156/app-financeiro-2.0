# Plano — B2 · Tela Cadastrar (visual)

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** B2 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** FRONT-VISUAL
**Spec:** `specs/01-fundacao-e-acesso.md`, página `/cadastrar`
**Depende de:** B1 (concluída, commit `8b98b94`)

## Reuso identificado

- **Moldura `(auth)` da B1** — a marca já está lá. Esta tela não escreve
  cabeçalho nenhum.
- `Card`, `Button`, `Badge` e `cn()` das fases A.
- **`LogoGoogle` e o e-mail de contato** já existem, mas *dentro* da
  `FazerLogin.tsx`. Ver a seção seguinte — é o ponto sensível deste plano.

## Exceção explícita à regra de isolamento

A regra do `architecture.md` diz que implementar `cadastrar-usuario/` **não
deve tocar** `fazer-login/`. Este plano abre uma exceção, e ela precisa do seu
aval porque é justamente a regra que evita o "efeito cobertor de pobre":

A B1 deixou dois trechos dentro de `FazerLogin.tsx` que a B2 também precisa:
o SVG do logo do Google e o endereço de contato do Davi. As opções eram:

1. **Duplicar** nas duas telas — dois SVGs para manter, e o dia em que o
   e-mail mudar, uma das telas fica com o valor velho.
2. **Subir para o nível da área** `autenticacao/`, que é o pai comum dos dois
   comportamentos.

Escolho a 2. Isso mantém o isolamento no que importa: `fazer-login/` e
`cadastrar-usuario/` continuam sem depender **um do outro** — os dois passam a
depender do pai. Mexer no login continua não quebrando o cadastro.

O custo é uma modificação pontual em `FazerLogin.tsx` (troca de código local
por import), prevista aqui e em nenhum outro lugar.

## Arquivos a criar

- `src/features/autenticacao/LogoGoogle.tsx` — SVG inline, movido da B1.
- `src/features/autenticacao/contato.ts` — `EMAIL_CONTATO`, usado nos dois
  `mailto:`. Um lugar só para mudar.
- `src/features/autenticacao/cadastrar-usuario/CadastrarUsuario.tsx` — a tela
  e seus quatro estados.
- `src/app/(auth)/cadastrar/page.tsx` — só compõe, com `metadata` própria.

## Arquivos a modificar

- `src/features/autenticacao/fazer-login/FazerLogin.tsx` — **exceção acima**:
  remove o `LogoGoogle` local e o e-mail literal, passa a importar. Nenhuma
  mudança visual.
- `references/architecture.md` — registrar os dois arquivos compartilhados e a
  nova rota.

## Estados

Mesmo andaime de revisão da B1, via `?estado=`:

| URL | Estado |
|---|---|
| `/cadastrar` | pronto |
| `/cadastrar?estado=carregando` | spinner, botão desabilitado |
| `/cadastrar?estado=erro` | falha genérica de conexão |
| `/cadastrar?estado=recusado` | bloco "e-mail não convidado" |

Sai na D2/D3, quando o `<SignUp />` real e a allowlist do servidor assumem.

## Conteúdo da tela

- Aviso **sempre visível** de que o acesso é por convite (`Badge` + frase).
- `Card` com o botão "Continuar com Google" estático, na mesma área reservada
  da B1 para as duas telas terem a mesma altura.
- Bloco "não convidado", oculto por padrão: explicação + `mailto:`.
- Link "Já tem acesso? Entrar" → `/entrar`.

## Caminho feliz

1. `/cadastrar` abre com a mesma moldura de `/entrar` e o aviso de convite.
2. Os quatro estados renderizam pela query string.
3. `/entrar` continua idêntica ao que foi aprovado na B1.
4. `build`, `tsc --noEmit` e `lint` limpos.

## Edge cases

| Situação | Tratamento |
|---|---|
| `?estado=` inválido | Cai em "pronto" |
| Estado "recusado" | O botão do Google some: insistir não adianta, e deixá-lo ali sugere que uma nova tentativa resolveria |
| Ida e volta `/entrar` ↔ `/cadastrar` | Links nos dois sentidos, com `next/link` |
| Assunto do `mailto:` com acento | Percent-encoded |
| Tela de 360px | Herda a coluna única da moldura |

## Erros

Não existe erro real: nada de rede, Clerk ou banco. Os estados são maquete.

## Banco de dados

Não se aplica.

## Thin Client / Fat Server

O texto de recusa é só desenho. **Quem decide se um e-mail está na allowlist é
o servidor, na D3** — nada nesta tela participa dessa decisão, e o e-mail de
contato não é segredo.

## Fora do escopo

- `<SignUp />` real → **D2**
- Recusa real por allowlist → **D3**
- Onboarding → **B3**

## Critério de pronto (da Etapa 2)

- [ ] `/cadastrar` mostra o aviso de acesso fechado, o botão estático e o link
      "Entrar"
- [ ] O bloco "e-mail não convidado" existe e é visualizável, com o `mailto:`
- [ ] `/entrar` segue intacta visualmente
