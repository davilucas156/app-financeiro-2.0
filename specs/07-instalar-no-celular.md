# Spec — Instalar o app no celular

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Depende de:** nada. Não toca banco, não toca serviço, não toca regra de negócio
**Paga uma dívida do `readme.md`:** §13 — *"será PWA/responsivo primeiro"*. O
responsivo está feito desde a spec 01; o **instalável** nunca foi escrito
**Status:** decidida por mim no "faça" do Davi — ver o fim do documento

> ⚠ Nenhum dado real neste documento.

## O que esta funcionalidade resolve

O Davi usa este app pelo celular, uma vez por mês, e hoje chega nele pelo
navegador — digitando ou caçando uma aba. O app tem cabeçalho de site, barra de
endereço em cima e nenhum ícone na tela inicial.

Não é uma funcionalidade nova: é o app parando de parecer uma página.

## O que eu medi antes de desenhar

### Descoberta 1 — não falta quase nada, e o que falta é pequeno

Conferido no repositório:

| Peça | Estado |
|---|---|
| `manifest` | ❌ não existe |
| Ícone de tela inicial (192/512) | ❌ não existe |
| `apple-touch-icon` | ❌ não existe |
| `theme-color` | ❌ não existe |
| `favicon.ico` | ✅ existe |
| Layout responsivo, alvos de toque ≥ 44px | ✅ desde a spec 01 |

O trabalho é o manifesto, os ícones e quatro metas. **A dificuldade desta spec
não está em instalar** — está no que muda **depois** de instalado.

### Descoberta 2 — instalado, a barra do navegador some, e ela estava segurando duas coisas

É o achado que dá trabalho à spec.

**O botão de voltar deixa de existir.** A `/categorias` fica fora da barra de
navegação por decisão do Davi (spec 05, pendência 3) e é alcançada por um link
no rodapé do painel. Conferido: **ela não tem nenhum caminho de volta na tela**.
No navegador, quem trazia de volta era o botão do navegador. Instalado, sobra o
gesto de borda do sistema — que funciona e **não aparece**.

**A barra de status passa a ficar por cima do conteúdo.** Num app escuro, a
alternativa (barra opaca) desenha uma faixa clara em cima de uma tela `#060608`.
Escolhendo a transparente, o cabeçalho fica embaixo do relógio do iPhone e a
barra de navegação inferior fica embaixo da barra de gestos — o item "Revisar"
vira um toque que o sistema intercepta.

### Descoberta 3 — não é preciso service worker, e é melhor não ter

A documentação do Next (`node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`)
é explícita: para instalar bastam **manifesto válido e HTTPS**, e ela diz, com
todas as letras, que dá para disparar o prompt de instalação *"without needing
offline support"*.

Isso importa porque um service worker aqui seria **ativamente perigoso**. Ele
existe para cachear, e o que há para cachear são telas autenticadas de um app
financeiro. Um painel de agosto servido do cache depois de uma reclassificação
mostraria números velhos com cara de novos — que é, palavra por palavra, o modo
de falha que a spec 04 inteira foi escrita para evitar.

> **A régua:** esta spec deixa o app **parecer** um app. Ela não o faz funcionar
> sem internet, e não devia.

## O desenho

### O ícone: seis potes

Fundo `--color-bg`, seis quadrados arredondados num grid 3×2, nas cores dos
potes de `globals.css`. É o nome do produto desenhado, e continua legível a 48px
porque são seis blocos de cor e não um símbolo com detalhe.

Duas versões, e a segunda não é capricho: o Android **recorta o ícone num
círculo**. Sem uma versão `maskable` desenhada menor dentro do mesmo quadrado,
ele recorta a normal e os potes das pontas saem cortados.

⚠ **O ícone é gerado por script, não comitado como binário opaco.** Um PNG sem
procedência é impossível de revisar: ninguém sabe de onde veio a cor, e ajustar
exige abrir um editor. Em `scripts/gerar-icones.mjs` o desenho é código e as
cores saem dos mesmos tokens da tela.

### O nome embaixo do ícone: "6 Potes"

O `short_name` é o rótulo na tela inicial, e o sistema corta com reticências o
que passar de ~12 caracteres. "Painel Financeiro" viraria "Painel Fina…".

### A abertura vai para `/`, não para `/dashboard`

A raiz já decide o destino (spec 01, D6): sem sessão vai para `/entrar`, sem
onboarding vai para `/bem-vindo`. Apontar direto para o painel faria o ícone
abrir uma página que redireciona — uma piscada em toda abertura.

### As duas correções da descoberta 2

- **Área segura** no cabeçalho, na barra inferior e nas telas de acesso. No
  navegador o valor é zero e nada muda.
- **Um "← Painel" visível na `/categorias`.** Quem entra ali precisa de um
  caminho de volta que se vê, e não de saber que existe um gesto.

## O que fica de fora, e por quê

| Fora | Por quê |
|---|---|
| **Service worker / offline** | Descoberta 3. Cachear tela autenticada de app financeiro troca um problema pequeno (abrir sem internet) por um grande (número velho com cara de novo). |
| **Notificação push** | Já era fase 2 no `readme.md`, e agora fica **destravada**: push no iOS exige o app instalado, que é o que esta spec entrega. |
| **Prompt de instalação customizado** | A própria documentação do Next desaconselha: `beforeinstallprompt` não existe no Safari do iPhone, que é onde o Davi está. |
| **Travar a orientação** | Pouparia um caso de layout e tiraria dele a escolha de virar o celular para ler a lista de lançamentos — a tela mais larga do app. |
| **Splash screen do iOS** | São ~15 PNGs, um por tamanho de tela, e o iOS já monta uma a partir de `background_color` e do ícone. |

## Riscos

**O ícone é o único julgamento estético que não dá para adiar.** Ele vai ficar
na tela inicial dele todo dia. É a única coisa aqui que precisa do olho do
Davi — o resto ou funciona ou não.

**`black-translucent` é a escolha arriscada da spec.** Ela é o que faz o app
parecer inteiro num aparelho escuro, e é também o que põe o conteúdo embaixo do
relógio se alguma tela esquecer a área segura. Foram tratadas as três molduras
que existem; uma tela futura fora delas precisa lembrar.

**Instalar não atualiza sozinho de forma óbvia.** Sem service worker, o app
instalado busca a página do servidor a cada abertura — que é exatamente o
comportamento desejado, mas quer dizer que abrir sem internet mostra o erro do
navegador dentro da moldura do app, sem tela bonita.

## Pendências — decididas

⚠ **O Davi disse "faça", não respondeu a nenhuma pergunta.** As decisões abaixo
são minhas e qualquer uma pode ser derrubada.

**1. Service worker?** ➡️ **Não.** Descoberta 3.

**2. O desenho do ícone?** ➡️ **Seis potes coloridos sobre o fundo escuro.** É a
única decisão desta spec que é gosto, e é dele. Trocar é reescrever uma lista de
cores em `scripts/gerar-icones.mjs` e rodar o script.

**3. Barra de status opaca ou transparente?** ➡️ **Transparente**
(`black-translucent`), com área segura tratada. Opaca desenharia uma faixa clara
em cima de um app `#060608`.

**4. `/categorias` entra na barra de navegação agora que não há botão de
voltar?** ➡️ **Não.** São 4 itens desde a D9, e a 360px um quinto deixaria 72px
cada — a decisão dele na spec 05 continua valendo. O que ela ganha é um "←
Painel" próprio, que resolve a volta sem gastar a barra.
