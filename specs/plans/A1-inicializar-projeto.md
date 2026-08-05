# Plano — A1 · Inicializar o projeto Next.js

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** A1 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** INFRA
**Status:** aguardando aprovação do Davi

## Contexto lido antes de planejar

- `references/architecture.md` — estrutura de pastas alvo e regra Thin Client/Fat Server
- `references/design-system.md` — tipografia e cores (consumidas na A2, não aqui)
- Ambiente verificado: Node **v20.17.0**, npm **10.8.2**
- Versões atuais: Next **16.3.0**, Tailwind **4.3.3**, `@clerk/nextjs` **7.6.5**
  (aceita `next ^16.1.0-0` e React `~19.2.3` — sem conflito de peer dependency)

## Reuso identificado

Nada a reutilizar: o repositório não tem código. O scaffold oficial do
`create-next-app` é o "reuso" desta tarefa — não escrevemos config à mão.

## Decisão principal: scaffold em pasta temporária

`create-next-app` **aborta em diretório não-vazio**. O repositório já tem
`readme.md`, `references/`, `specs/`, `planejamento_anual_davi.html`, `.claude/`
e o `.code-workspace` — ele recusaria rodar aqui.

Pior: no Windows o sistema de arquivos é *case-insensitive*, então o `README.md`
gerado pelo scaffold **sobrescreveria o `readme.md`** que é o documento de
requisitos do produto.

Por isso: gerar o scaffold no diretório temporário da sessão e copiar para o
repositório apenas os arquivos escolhidos, deixando `README.md` para trás.

Comando (no diretório temporário):

```
npx create-next-app@latest app --typescript --tailwind --eslint --app \
  --src-dir --import-alias "@/*" --use-npm --turbopack --skip-install
```

`--skip-install` porque o `npm install` roda depois, já no repositório, para o
`node_modules` nascer no lugar certo.

## Arquivos a criar

Copiados do scaffold (raiz do repositório):

- `package.json` — deps (next 16, react 19, tailwind 4) e scripts `dev`/`build`/`start`/`lint`
- `package-lock.json` — gerado pelo install
- `tsconfig.json` — TypeScript strict + alias `@/*` → `src/*`
- `next.config.ts` — configuração vazia do Next
- `postcss.config.mjs` — plugin do Tailwind 4
- `eslint.config.mjs` — flat config do ESLint
- `next-env.d.ts` — tipos do Next
- `.gitignore` — do scaffold, **acrescentando** `.env*` (exceto `.env.example`)
- `public/` — assets estáticos do scaffold
- `src/app/layout.tsx` — layout raiz (fontes/tokens ficam para a A2)
- `src/app/page.tsx` — página inicial provisória; substituir o conteúdo padrão do
  Next por um placeholder de uma linha, para não deixar marketing da Vercel no app
- `src/app/globals.css` — `@import "tailwindcss"` (tokens ficam para a A2)

Escritos por mim (estrutura de `references/architecture.md`):

- `src/features/.gitkeep` — comportamentos isolados
- `src/components/ui/.gitkeep` — componentes reutilizáveis
- `src/db/.gitkeep` — schema, migrations e queries
- `src/lib/.gitkeep` — clients server-only
- `.env.example` — chaves vazias e comentadas de Clerk, Postgres, Blob e Anthropic,
  documentando quais são públicas e quais são secretas

> Os `.gitkeep` existem porque o git não versiona pasta vazia. Saem quando cada
> pasta ganhar o primeiro arquivo de verdade.

**Não copiar:** `README.md` (colidiria com `readme.md`) e `.git/` do temporário.

## Arquivos a modificar

- `references/architecture.md` — trocar a árvore "estrutura-alvo" pela árvore
  real, e remover o aviso de "projeto não inicializado" do cabeçalho.

Nenhum outro arquivo existente é tocado. Em particular, **`readme.md`,
`planejamento_anual_davi.html`, `specs/**` e `.claude/settings.local.json`
não são modificados**.

## Caminho feliz

1. Scaffold gerado no diretório temporário, sem tocar no repositório.
2. Arquivos da lista copiados para a raiz do repositório.
3. Pastas de `src/` criadas com `.gitkeep`.
4. `.env.example` e ajuste do `.gitignore` escritos.
5. `npm install` na raiz do repositório.
6. `npm run dev` sobe em `http://localhost:3000` mostrando o placeholder.
7. `npx tsc --noEmit` e `npm run lint` passam limpos.
8. `references/architecture.md` atualizado com a árvore real.

## Edge cases

| Situação | Tratamento |
|---|---|
| `create-next-app` recusa o diretório não-vazio | Já contornado: ele roda no temporário, nunca no repositório |
| `README.md` do scaffold vs `readme.md` do produto (Windows case-insensitive) | O `README.md` não é copiado. Verifico o `readme.md` depois da cópia para confirmar que ainda é o documento de requisitos |
| Pastas de `src/` vazias sumirem do git | `.gitkeep` em cada uma |
| `node_modules` dentro do OneDrive | Fica no `.gitignore`, mas o OneDrive ainda tenta sincronizar milhares de arquivos e pode travar o install. Se acontecer, a saída é excluir `node_modules` da sincronização do OneDrive — aviso o Davi, não mexo na configuração dele |
| Porta 3000 ocupada | Subir com `npm run dev -- -p 3001` e registrar isso na verificação |
| `create-next-app` fizer pergunta interativa apesar das flags | As flags cobrem todas as opções; se sobrar alguma, acrescento `--yes` |
| Scaffold vier com Tailwind 4 (config em CSS) e não 3 (config em JS) | É o esperado. A A2 assume `@theme` no CSS, não `tailwind.config.ts` |

## Erros

| Erro | Resposta |
|---|---|
| `npm install` falha por rede | Repetir uma vez; persistindo, reportar a saída ao Davi sem deixar `node_modules` pela metade |
| Versão do Node incompatível | Next 16 exige Node ≥ 20.9; a máquina tem 20.17. Se a checagem reclamar mesmo assim, parar e avisar — não vou instalar/trocar Node por conta própria |
| `npm run dev` sobe mas a página quebra | Reportar o erro do terminal antes de mexer em qualquer coisa |
| Cópia sobrescrever algum arquivo existente | A lista de cópia é explícita, arquivo por arquivo. Se algo fora dela for necessário, **paro e aviso** (regra da Etapa 4) |

## Banco de dados

Não se aplica. A1 não toca em banco — isso é a fase C.

## Fora do escopo desta tarefa

Deixado explícito para não haver desvio durante a execução:

- Fontes, cores e tokens do design system → **A2**
- Componentes `Card`/`Badge`/`Button`/`SectionTitle` → **A3**
- Instalar `@clerk/nextjs`, driver de Postgres ou SDK da Anthropic → fases C e D
  (a A1 só deixa os nomes das variáveis documentados no `.env.example`)
- Deploy na Vercel → **E1**

## Critério de pronto (da Etapa 2)

- [ ] `npm run dev` sobe o app numa página em branco
- [ ] TypeScript, Tailwind e ESLint configurados
- [ ] Árvore de pastas de `references/architecture.md` existe
- [ ] `.env.example` criado
- [ ] `.gitignore` cobrindo `.env*`

## Decisão pendente do Davi

O repositório está em `master` **sem nenhum commit**, e o ambiente indica `main`
como branch principal. Não vou commitar nem renomear branch sem você pedir.
Quando quiser, eu faço o primeiro commit com o scaffold + os documentos das
etapas 1 e 2.
