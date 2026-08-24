# Tarefas — Instalar o app no celular

**Etapa:** 2 (Break) do workflow `dev-workflow-davi`
**Spec de origem:** `specs/07-instalar-no-celular.md` (pendências decididas)
**Status:** ✅ tudo entregue e no ar. Falta o Davi instalar e dizer se o ícone
presta — é a única coisa aqui que é gosto.

Legenda de camada: `INFRA` · `FRONT-VISUAL` · `FRONT-INTEGRADO` · `BACK` · `BANCO`

---

## Por que esta spec não tem fase A nem fase B

As outras seis tinham uma fase pura porque tinham decisão a testar. Aqui não há
nenhuma: não existe função que possa errar, não existe consulta, não existe
texto de consequência. O que existe é **um manifesto, quatro metas e dois
pixels de padding**.

Testar isso com Vitest seria testar que um objeto literal tem as chaves que ele
tem. A verificação real é abrir no celular — e essa não tem como automatizar.

## A ordem é a do risco

O manifesto e o ícone fazem o app **instalar**. As correções de área segura
fazem o app instalado **não ficar pior do que estava**. A segunda metade é a que
tem risco, e é por isso que ela não ficou para depois: um app instalado com o
cabeçalho embaixo do relógio é um app que se desinstala no primeiro uso.

---

## A1 ✅ · Os ícones, gerados por script
**Camada:** INFRA
**Arquivos:** `scripts/gerar-icones.mjs`, `public/icone-{192,512}.png`,
`public/icone-maskable-512.png`, `src/app/apple-icon.png`

Seis potes num grid 3×2, nas cores de `globals.css`, sobre `--color-bg`.

⚠ **Três tamanhos e três propósitos, não um redimensionado.** O `maskable` é
desenhado **menor dentro do mesmo quadrado** porque o Android recorta num
círculo de 80% do lado; o do iOS é opaco e sem `maskable`, que o iOS ignora.

⚠ **Script e não binário comitado.** PNG sem procedência não se revisa e não se
ajusta. Trocar o desenho é editar uma lista de cores e rodar
`node scripts/gerar-icones.mjs`.

## A2 ✅ · O manifesto
**Camada:** INFRA
**Arquivo:** `src/app/manifest.ts`

`short_name: "6 Potes"` — 12 caracteres é o corte do rótulo na tela inicial.
`start_url: "/"` — a raiz já decide o destino desde a D6 da spec 01.
Sem `orientation`.

## A3 ✅ · As metas que o iOS lê
**Camada:** INFRA
**Arquivo:** `src/app/layout.tsx`

O `<link rel="manifest">` e o `apple-touch-icon` o Next emite sozinho. O que
não sai de nenhum dos dois é `appleWebApp` — o iOS ignora o manifesto inteiro e
lê estas metas antigas — mais `themeColor` e `viewportFit` no `viewport`.

⚠ **`formatDetection: { telephone: false }`** entrou junto: o Safari transforma
sequência de dígitos em link de telefone, e esta é uma tela cheia de valores
com ponto e vírgula.

## B1 ✅ · A área segura nas três molduras
**Camada:** FRONT-VISUAL
**Arquivos:** `shell/CabecalhoApp.tsx`, `app/(app)/layout.tsx`,
`shell/NavegacaoPrincipal.tsx`, `app/(auth)/layout.tsx`

Cabeçalho desce abaixo do entalhe; barra inferior sobe acima da barra de
gestos; tela de acesso ganha as duas. **No navegador o valor é zero e nada
muda** — é a propriedade que torna esta tarefa segura de fazer sem um iPhone na
mão.

## B2 ✅ · O caminho de volta da `/categorias`
**Camada:** FRONT-VISUAL
**Arquivo:** `categorias/gerir-categorias/TelaDeCategorias.tsx`

Um "← Painel" no topo. Descoberta 2: a rota fica fora da barra de navegação, e
instalado não há botão de voltar — sobra o gesto de borda, que funciona e não
aparece.

## C1 ✅ · Deploy
**Camada:** INFRA

`npx vercel deploy --prod --yes`.

⚠ **Conferido antes:** o matcher do `src/proxy.ts` já exclui `.webmanifest` e
`.png`, e `/manifest.webmanifest` não está na lista de rotas protegidas. Se
estivesse, o celular pediria login para ler o manifesto e a instalação falharia
sem mensagem nenhuma.

### Conferido em produção

| URL | |
|---|---|
| `/manifest.webmanifest` | 200 `application/manifest+json`, sem pedir login |
| `/icone-192.png`, `/icone-512.png`, `/icone-maskable-512.png` | 200 `image/png` |
| `/apple-icon.png` | 200, com `<link rel="apple-touch-icon" sizes="180x180">` |

E no `<head>`: `theme-color`, `viewport-fit=cover`, `application-name`,
`apple-mobile-web-app-title`, `apple-mobile-web-app-status-bar-style` e
`format-detection`.

⚠ **Uma meta não sai, e é de propósito do Next:** `apple-mobile-web-app-capable`
foi substituída pela padronizada `mobile-web-app-capable`, que é a que aparece.
Do iOS 16.4 em diante o Safari lê o `display: standalone` do próprio manifesto,
então não faz falta. **Num iPhone mais antigo faria**: o app abriria com a barra
de endereço, que é justamente o que esta spec veio tirar. Se acontecer, a
correção é uma linha em `metadata.other` — e é a única razão para pôr de volta
uma meta que o framework tirou.

---

## O que só o Davi pode fechar

Instalar e dizer se o ícone presta. As outras specs terminavam com ele
confirmando que um número estava certo; esta termina com ele olhando para um
desenho na tela inicial e decidindo se quer aquilo ali todo dia.
