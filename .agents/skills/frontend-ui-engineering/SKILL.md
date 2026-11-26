---
name: frontend-ui-engineering
description: >-
  Garante UI bonita, atrativa e responsiva em projetos de clientes (landing
  pages, sites, apps, SaaS, PWA): pesquisa referências visuais antes de desenhar
  (Pinterest, 21st.dev, Mobbin, Land-book, Recent, Awwwards, Magic UI,
  Aceternity, Tailark), monta tokens de design, implementa layouts mobile-first,
  carrosséis fluidos e compatibilidade perfeita entre desktop e celular, e testa
  em vários viewports. Use SEMPRE que o pedido envolver criar ou revisar telas,
  páginas, seções, hero, cards, galerias, navbar ou menu mobile, carrossel,
  slider, depoimentos, responsividade, layout quebrado no celular, "deixar
  bonito", "visual profissional", inspiração, referência, moodboard, componente
  pronto, template, shadcn, 21st.dev ou Tailwind — mesmo que o usuário não peça
  "frontend" ou "design" explicitamente. Complementa frontend-design (direção
  estética), beleza-ux (skeleton, a11y, PWA) e escalabilidade-performance
  (imagens, code splitting).
---

# Frontend UI Engineering — projetos de clientes

Projeto de cliente é vitrine: o cliente abre no celular, passa o dedo e decide em segundos
se aquilo "parece de agência" ou "parece de template". Esta skill faz duas coisas:

1. **Obriga a buscar boa referência antes de desenhar** (nunca partir do zero nem do
   primeiro layout que vier à cabeça).
2. **Garante a engenharia**: layout responsivo sem quebra, carrosséis fluidos no toque e
   resultado idêntico em qualidade no desktop e no celular.

Stack assumida: **Next.js (App Router) + Tailwind CSS (+ shadcn/ui)**. Se o projeto usar
outra stack, mantenha os princípios e adapte o código.

## Como esta skill se encaixa com as outras

| Preciso de... | Use |
|---|---|
| Direção estética, tipografia, fugir do visual genérico | `frontend-design` |
| Skeleton, modal, atalhos, ARIA, PWA/offline | `beleza-ux` |
| `next/image`, paginação, code splitting, métricas | `escalabilidade-performance` |
| Onde buscar referência, componentes prontos, responsivo, carrossel, teste em celular | **esta skill** |

Se o projeto tiver regras próprias sobre bibliotecas (por exemplo, aprovação prévia para
adicionar animação), a regra do projeto prevalece sobre os exemplos daqui.

---

## Fluxo de trabalho (sempre nesta ordem)

1. **Briefing mínimo.** Nicho, público, objetivo principal (CTA: WhatsApp, reserva,
   orçamento, agendamento), tom, identidade do cliente (logo, cores, fotos reais) e sites
   que o cliente já citou. Se faltar algo, pergunte no máximo 3 coisas ou assuma e declare
   a suposição.
2. **Buscar referências** (seção 1): no mínimo 3, de fontes diferentes — uma de direção
   visual, uma de padrão de UX/conversão e uma de componente pronto.
3. **Decidir e registrar.** Escolha 2–3 referências e anote **o que pegar de cada uma**
   (ritmo de seções, tipografia, tratamento de imagem, motion) num `DESIGN-BRIEF.md`
   (seção 4).
4. **Implementar mobile-first** (seção 5), usando componentes prontos (seção 3) adaptados
   aos tokens do cliente.
5. **Carrosséis e galerias** seguindo a seção 6.
6. **Testar** em vários viewports e em celular de verdade (seção 7) e passar o checklist.
7. **Entregar ao usuário:** as referências escolhidas (com links), o que foi aproveitado
   de cada uma e os screenshots de mobile e desktop.

---

## 1. Onde pesquisar referências

> Catálogo verificado em 26/11/2026. Ferramentas mudam: o Godly virou **Recent**
> (godly.website redireciona) e o UX Archive saiu do ar. Se um link falhar, busque uma
> alternativa e avise o usuário.

### Direção visual e moodboard (clima, paleta, fotografia, art direction)

| Fonte | Link | Use para |
|---|---|---|
| **Pinterest** | pinterest.com | Moodboard por cliente: clima, paleta, fotografia, estilo. Ótimo para sentir a vibe, fraco para padrão de UX |
| **Recent** (antigo Godly) | recent.design | Sites, apps e motion recém-publicados, atualizado todo dia |
| **Awwwards** | awwwards.com | Trabalhos premiados por júri. Inspira, mas costuma priorizar espetáculo sobre usabilidade |
| **Siteinspire** | siteinspire.com | Curadoria consistente e limpa desde 2010 |
| **Minimal Gallery / Httpster** | minimal.gallery · httpster.net | Layouts sóbrios, tipografia forte |
| **CSS Design Awards** | cssdesignawards.com | Sites de alto nível técnico |
| **Behance / Dribbble** | behance.net · dribbble.com | Identidade e conceitos. São conceito, não produto entregue |

### Padrões de UX e conversão (como produtos reais resolvem o problema)

| Fonte | Link | Use para |
|---|---|---|
| **Land-book** | land-book.com | Landing pages filtradas por tipo, cor e indústria |
| **Lapa Ninja** | lapa.ninja | Landing pages por categoria |
| **One Page Love** | onepagelove.com | Sites de uma página |
| **Mobbin** | mobbin.com | Telas e fluxos de apps reais. Plano grátis limitado; MCP só em plano pago |
| **Refero** | refero.design | Referências web e iOS, com fluxos. Plano grátis limitado; MCP em plano pago |
| **Page Flows** | pageflows.com | Fluxos de SaaS web |
| **Collect UI** | collectui.com | Inspiração por componente (pricing, formulário, carrossel) |
| **GoodUI** | goodui.org | Padrões de interface testados em A/B |

### Componentes e blocos prontos (React + Tailwind + shadcn)

| Fonte | Link | Use para |
|---|---|---|
| **21st.dev** | 21st.dev | Marketplace de componentes da comunidade. Instala com um comando do shadcn (seção 3) |
| **shadcn/ui** | ui.shadcn.com | Base do sistema: Sheet, Drawer, Dialog, Carousel (Embla), Tabs, Skeleton |
| **Magic UI** | magicui.design | 150+ componentes animados gratuitos (MIT); blocos e templates no plano Pro |
| **Aceternity UI** | ui.aceternity.com | 200+ blocos com muito movimento (hero, bento, parallax); gratuito + Pro |
| **Tailark** | tailark.com | 300+ blocos de marketing focados em conversão |
| **Shadcnblocks / shadcn.io** | shadcnblocks.com · shadcn.io | Catálogos grandes de seções (misto gratuito e pago) |
| Cult UI, Origin UI, ReUI, Skiper UI | busque pelo nome | Complementos de qualidade para shadcn |
| **Embla Carousel** | embla-carousel.com | Motor de carrossel (é o que o carousel do shadcn usa) |
| **Swiper** | swiperjs.com | Carrossel com efeitos, thumbs, zoom e slides virtuais |
| **Lucide / Phosphor** | lucide.dev · phosphoricons.com | Ícones consistentes |

### Modelos e templates completos (para estudar estrutura, não para entregar cru)

Framer Marketplace (framer.com/marketplace/templates), Webflow Templates, Figma Community
(figma.com/community), Vercel Templates (vercel.com/templates) e as páginas/templates do
Aceternity, Magic UI e Tailark. Use para entender a estrutura e o ritmo da página; o que vai
para o cliente é a sua versão, com a identidade dele.

### IA para rascunho (nunca entregar direto)

v0 (v0.app), Google Stitch (stitch.withgoogle.com), Lovable (lovable.dev), Bolt (bolt.new).
Servem para explorar direções rápidas. Todo rascunho passa pelos tokens do cliente e pelo
checklist desta skill antes de virar entrega.

### Tipografia, cor, imagem e motion

| Fonte | Link | Use para |
|---|---|---|
| **Fontshare** | fontshare.com | Fontes profissionais gratuitas, inclusive uso comercial |
| **Google Fonts** | fonts.google.com | Maior catálogo, bom suporte em Next (`next/font`) |
| **Fontpair / Typewolf** | fontpair.co · typewolf.com | Combinações de fontes que funcionam |
| **Coolors** | coolors.co | Gerar e salvar paletas |
| **Realtime Colors** | realtimecolors.com | Ver a paleta aplicada numa interface de verdade antes de decidir |
| **WebAIM Contrast Checker** | webaim.org/resources/contrastchecker | Conferir contraste (mínimo 4,5:1 no texto) |
| **Unsplash / Pexels** | unsplash.com · pexels.com | Fotos de apoio (confira a licença). Foto real do cliente vence banco de imagem |
| **LottieFiles / Rive / Spline** | lottiefiles.com · rive.app · spline.design | Animação e 3D leves, quando o projeto justificar |

---

## 2. Como usar as fontes na prática

**Pinterest.** Busque em inglês, combinando nicho + tipo de peça. Exemplos por nicho:

- `restaurant landing page hero`, `buffet website design`
- `dental clinic website ui`, `beauty salon website design`
- `internet provider landing page`, `pricing cards ui`
- Padrões: `bento grid website`, `mobile bottom navigation ui`, `testimonial carousel design`

Monte **um board por cliente** com 10–20 pins, use "mais como este" nos que acertaram e
extraia paleta, estilo de foto e clima. Pinterest é moodboard; para decidir estrutura de
página, confirme em Land-book, Lapa Ninja ou Mobbin.

**Acesso do agente às fontes.** Pinterest, Behance, Dribbble e Mobbin costumam exigir login
ou bloquear leitura automática. Se a leitura falhar, não insista com atalhos (curl, espelhos,
caches). Peça ao usuário os links, pins ou prints escolhidos, ou use as galerias abertas
(Recent, Land-book, Lapa Ninja, Siteinspire) e a busca de imagens.

**Quando o usuário mandar prints ou links.** Antes de codar, descreva o que viu em termos de
tokens: grid, escala tipográfica, raio, sombra, densidade de espaçamento, tratamento de
imagem. Isso evita a cópia literal e vira insumo do `DESIGN-BRIEF.md`.

---

## 3. 21st.dev e componentes prontos

**Pré-requisito:** projeto com shadcn/ui configurado (`components.json`) e Tailwind.

**Instalar um componente:**

```bash
npx shadcn@latest add "https://21st.dev/r/AUTOR/COMPONENTE"
```

O comando cria os arquivos do componente e das dependências, estende o tema do Tailwind e
adiciona estilos globais necessários. Revise o que mudou (`git status` e `git diff`) antes
de seguir.

**21st MCP (antigo Magic MCP):** permite buscar, gerar e instalar componentes do catálogo
direto do agente.

```bash
npx @21st-dev/cli@latest init --client claude
# outros clientes: cursor, codex, vscode, devin
```

A chave de API é criada pelo usuário em 21st.dev/mcp. Nunca grave a chave no repositório
nem nesta skill.

**Depois de instalar qualquer componente, sempre:**

1. Trocar cores, fonte e raio pelos **tokens do cliente** (variáveis CSS do tema).
2. Trocar textos, ícones e imagens pelos reais, em português do Brasil.
3. Testar no celular: muitas demos foram feitas só para desktop.
4. Remover dependências e efeitos que não estão em uso.
5. Conferir a versão de Tailwind e React do projeto; se o componente assumir outra, adaptar.

**Regra anti-template.** Não monte a página só empilhando blocos de bibliotecas. Gaste a
ousadia em um ponto (um hero memorável ou uma interação marcante) e mantenha o resto
sóbrio e consistente. Efeito em toda seção cansa e entrega a cara de template.

---

## 4. Do briefing aos tokens (`DESIGN-BRIEF.md`)

Crie este arquivo na raiz do projeto antes de codar e atualize quando a direção mudar:

```md
# DESIGN-BRIEF — NOME DO CLIENTE

- Nicho / público / objetivo principal (CTA):
- Referências escolhidas (link + o que aproveitar):
  1. [site ou pin] — ritmo de seções e hero
  2. [site ou pin] — tipografia
  3. [componente do 21st.dev] — carrossel de depoimentos
- Cores (4–6, com hex e papel): primária, secundária, fundo, superfície, texto, destaque
- Tipografia: fonte de título, fonte de texto, escala (ex.: 14/16/20/30/48)
- Forma: raio padrão, sombra, borda, base de espaçamento (4 ou 8 px)
- Imagem: fotos reais do cliente? tratamento (cor, máscara, proporção)
- Motion: um momento de destaque + microinterações; reduced-motion respeitado
- Evitar: clichês do nicho e restrições do cliente
```

Transforme em tokens no Tailwind (`theme.extend` ou variáveis CSS do shadcn) para que **uma
troca de cor ou fonte propague para o site inteiro**.

---

## 5. Responsividade impecável

**Base**

- **Mobile-first**: estilo base é o celular; `sm:` `md:` `lg:` `xl:` só acrescentam.
- Viewport meta correta (o Next já injeta; não desative o zoom do usuário).
- Largura total sem rolagem horizontal em qualquer tela (verificação automática na seção 7).

**Layout**

- Container padrão: `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`.
- Altura de tela cheia com `min-h-dvh`, **não** `100vh` (a barra do navegador no celular
  quebra o `100vh`). Requer Tailwind 3.4+.
- Em `flex` e `grid`, filho que contém texto longo ou imagem precisa de `min-w-0`; senão
  estoura a largura.
- Grades que se ajustam sozinhas: `grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4`.
- Componente reutilizável que muda conforme o espaço onde está: container queries
  (`@container`).
- Elementos fixos no rodapé (barra de ações, botão de WhatsApp) respeitam a área segura:
  `pb-[env(safe-area-inset-bottom)]`.

**Texto**

- Tamanhos fluidos com `clamp()` para títulos grandes, em vez de saltar entre breakpoints.
- `text-balance` em títulos e `text-pretty` em parágrafos; linha de texto abaixo de ~75
  caracteres.
- Nunca deixe palavra longa estourar o card: `break-words` onde houver conteúdo do usuário.

**Imagens**

- Sempre com proporção reservada (`aspect-[4/3]` etc.) e `object-cover`, para não haver
  salto de layout. `next/image` com `sizes` correto e `priority` só na imagem principal da
  primeira dobra. Detalhes de loader e formatos em `escalabilidade-performance`.

**Toque**

- Alvo de toque **≥ 44×44 px** (mínimo absoluto 24×24 px, WCAG 2.2) e espaço entre alvos.
- Campos de formulário com `text-base` (16 px) ou mais; abaixo disso o iOS dá zoom ao focar.
- Efeito `hover` não pode ser a única forma de acessar algo: no celular não existe hover.
  Mostre a informação sempre ou use toque/foco.
- Foco de teclado visível em tudo que é interativo (`focus-visible:`).

**Navegação**

- Menu mobile em Sheet/Drawer com focus trap e fechamento por `Esc` (ver `beleza-ux`).
- Header fixo + âncoras: use `scroll-mt-*` nas seções para o título não ficar escondido.
- CTA principal visível sem rolar no celular (botão fixo ou no hero).

**Larguras para pensar o layout:** 360, 390, 430 (celulares), 768 (tablet), 1024, 1280 e
1536+ (desktop). Em desktop largo, limite a largura do conteúdo; tela imensa com texto
esticado parece descuido.

---

## 6. Carrosséis fluidos

### Qual solução usar

| Situação | Solução |
|---|---|
| Poucos itens (até 3–4) que cabem em coluna ou grade | **Sem carrossel**: empilhar no celular e grade no desktop |
| Trilho de cards deslizável, sem loop nem autoplay | **CSS `scroll-snap`** (zero JavaScript) |
| Loop, setas, bolinhas, autoplay, sincronizar com estado | **shadcn Carousel (Embla)** — `npx shadcn@latest add carousel` |
| Efeitos (coverflow, cards, creative), miniaturas, zoom, slides virtuais | **Swiper** (módulo `a11y` ligado) |
| Faixa infinita de logos | CSS `animation` linear, pausada em `prefers-reduced-motion` |

Observação: o Embla é "headless" (você escreve a interface e a acessibilidade). O Swiper
traz módulos prontos de UI e acessibilidade, mas é maior. Para a maioria dos projetos
Next.js, comece pelo carousel do shadcn.

### Regras

1. **Mostre um pedaço do próximo slide** no celular (`basis-[85%]` a `basis-[90%]`): é o
   sinal visual de que dá para deslizar.
2. **Setas só em telas com mouse** (`hidden md:inline-flex`) e **dentro** do container. As
   setas do shadcn nascem fora da área (`-left-12`) e estouram a tela no celular.
3. **Bolinhas ou contador**: bolinhas com área de toque de pelo menos 24 px (ideal 44 px).
   Com mais de ~6 slides, troque as bolinhas por contador ("3 / 8").
4. **Autoplay desligado por padrão no celular.** Se usar: pausar com hover, foco e toque,
   oferecer botão de pausa e **desligar com `prefers-reduced-motion`**. Movimento
   automático acima de 5 s precisa de controle de pausa (WCAG 2.2.2).
5. **Não sequestre a rolagem vertical**: o gesto vertical sobre o carrossel precisa rolar a
   página. Em trilho CSS use `overscroll-x-contain`; em Swiper ajuste o ângulo de toque.
6. **Sem salto de layout**: slides com proporção/altura fixa e imagens com tamanho
   reservado. Só o primeiro slide carrega com prioridade; os demais em `lazy`.
7. **Acessibilidade**: região com `aria-label` ("Depoimentos de clientes"), cada slide
   identificado ("1 de 5"), botões com rótulo em português ("Slide anterior", "Próximo
   slide"), navegação por setas do teclado. O carousel do shadcn já traz `role` e
   `aria-roledescription` (confira no arquivo gerado); acrescente o `aria-label`.
8. **Next.js**: componente com `"use client"`, sem `window` no render, e limpeza de
   listeners (`api.off`) no desmonte.

### Exemplo 1 — trilho com CSS `scroll-snap` (sem JavaScript)

```tsx
<section aria-label="Pratos mais pedidos">
  <div
    role="region"
    aria-label="Lista de pratos, deslize para o lado"
    tabIndex={0}
    className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-4 scroll-pl-4
               [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  >
    {itens.map((item) => (
      <article
        key={item.id}
        className="w-[82%] shrink-0 snap-start sm:w-[45%] lg:w-[30%]"
      >
        {/* conteúdo do card */}
      </article>
    ))}
  </div>
</section>
```

### Exemplo 2 — shadcn Carousel (Embla) com bolinhas e autoplay respeitando movimento reduzido

```tsx
"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

type Item = { id: string; texto: string; autor: string };

export function CarrosselDepoimentos({ itens }: { itens: Item[] }) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [atual, setAtual] = React.useState(0);
  // Começa "reduzido" (parado): seguro no servidor e até o navegador responder.
  const [reduzirMovimento, setReduzirMovimento] = React.useState(true);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduzirMovimento(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setAtual(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const plugins = React.useMemo(
    () =>
      reduzirMovimento
        ? []
        : [Autoplay({ delay: 6000, stopOnInteraction: true, stopOnMouseEnter: true })],
    [reduzirMovimento],
  );

  return (
    <div>
      <Carousel
        setApi={setApi}
        plugins={plugins}
        opts={{ align: "start", loop: true }}
        aria-label="Depoimentos de clientes"
      >
        <CarouselContent className="-ml-3 md:-ml-4">
          {itens.map((item) => (
            <CarouselItem
              key={item.id}
              className="basis-[88%] pl-3 sm:basis-1/2 md:pl-4 lg:basis-1/3"
            >
              <figure className="h-full rounded-2xl border p-5">
                <blockquote>{item.texto}</blockquote>
                <figcaption className="mt-3 text-sm">{item.autor}</figcaption>
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* Setas só com mouse e dentro da área, para não estourar a tela no celular */}
        <CarouselPrevious className="left-2 hidden md:inline-flex" />
        <CarouselNext className="right-2 hidden md:inline-flex" />
      </Carousel>

      <div className="mt-4 flex justify-center">
        {itens.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => api?.scrollTo(i)}
            aria-label={`Ir para o depoimento ${i + 1}`}
            aria-current={i === atual}
            className="grid h-11 w-8 place-items-center focus-visible:outline focus-visible:outline-2"
          >
            <span
              className={`h-2 rounded-full transition-all motion-reduce:transition-none ${
                i === atual ? "w-6 bg-foreground" : "w-2 bg-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
```

CSS nativo para carrossel (pseudo-elementos `::scroll-button` e `::scroll-marker`) existe
em navegadores Chromium recentes, mas não em todos. Só use como melhoria progressiva, com a
versão com JavaScript ou `scroll-snap` como base.

---

## 7. Testar desktop e celular

**Automático (Playwright).** Detecta rolagem horizontal e gera screenshots em vários
tamanhos, em Chromium e WebKit (o WebKit aproxima o Safari). Rode com o site no ar:

```ts
// scripts/check-responsive.ts
// Uso: npx playwright install chromium webkit && npx tsx scripts/check-responsive.ts http://localhost:3000
import { chromium, webkit } from "playwright";
import { mkdirSync } from "node:fs";

const url = process.argv[2] ?? "http://localhost:3000";
const telas = [
  { nome: "cel-360", width: 360, height: 780 },
  { nome: "cel-390", width: 390, height: 844 },
  { nome: "cel-430", width: 430, height: 932 },
  { nome: "tablet-768", width: 768, height: 1024 },
  { nome: "desk-1280", width: 1280, height: 800 },
  { nome: "desk-1536", width: 1536, height: 864 },
];

mkdirSync("shots", { recursive: true });

for (const [motor, tipo] of [["chromium", chromium], ["webkit", webkit]] as const) {
  const browser = await tipo.launch();
  for (const t of telas) {
    const ctx = await browser.newContext({
      viewport: { width: t.width, height: t.height },
      hasTouch: t.width < 1024,
      isMobile: t.width < 768,
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    const excesso = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    console.log(`${motor} ${t.nome}: ${excesso > 0 ? `ROLAGEM HORIZONTAL de ${excesso}px` : "ok"}`);
    await page.screenshot({ path: `shots/${motor}-${t.nome}.png`, fullPage: true });
    await ctx.close();
  }
  await browser.close();
}
```

Abra os screenshots e **olhe de verdade**: corte de texto, botão sobreposto, imagem
esticada, espaçamento desigual. Se algum viewport mostrar rolagem horizontal, corrija antes
de seguir.

**Manual, sempre que houver carrossel ou menu mobile:**

- DevTools no modo dispositivo (toque simulado) e rotação para paisagem.
- **Um iPhone real (Safari) e um Android real (Chrome)**: inércia do deslize, barra do
  navegador, teclado em formulário e área segura só aparecem fora do simulador.
- Teclado: `Tab` percorre tudo, setas navegam no carrossel, `Esc` fecha menu e modal.
- Conexão lenta (throttling "Fast 4G"): o layout não pode pular quando as imagens chegam.

---

## 8. Licenças e ética (projeto de cliente)

- **Inspiração não é cópia.** Não clone o layout, os textos, as imagens ou a marca de outro
  site. Extraia princípios (ritmo, hierarquia, proporção) e crie a versão do cliente.
- Componentes de bibliotecas gratuitas costumam ser MIT; **blocos e templates Pro têm
  licença própria**. Confira se a licença cobre uso em projeto de cliente antes de usar.
- Fotos de banco de imagem: leia a licença (uso comercial, atribuição). Prefira fotos reais
  do cliente.
- Fontes: use as que permitem uso comercial (Fontshare e Google Fonts permitem).
- Chaves de API e tokens nunca entram no repositório.

---

## Checklist final de revisão

Antes de entregar qualquer tela, seção ou projeto:

- [ ] Havia pelo menos 3 referências de fontes diferentes, e o `DESIGN-BRIEF.md` diz o que
      foi aproveitado de cada uma.
- [ ] Cores, fonte, raio e espaçamento vêm de tokens do cliente; nada com cara de template
      cru ou efeito em toda seção.
- [ ] Mobile-first: sem rolagem horizontal em 360, 390, 430, 768, 1280 e 1536 px, em
      Chromium e WebKit.
- [ ] `min-h-dvh` no lugar de `100vh`; filhos de flex/grid com `min-w-0`; área segura
      respeitada em elementos fixos.
- [ ] Imagens com proporção reservada, `sizes` correto e `priority` só na primeira dobra.
- [ ] Alvos de toque ≥ 44 px, campos com 16 px ou mais, nada que dependa só de hover.
- [ ] Carrosséis: mostram pedaço do próximo slide no celular, setas só no desktop e dentro
      da área, autoplay desligado ou pausável e respeitando `prefers-reduced-motion`,
      rótulos em português, sem salto de layout.
- [ ] Testado em um iPhone (Safari) e um Android (Chrome) reais, ou o usuário foi avisado
      de que esse passo ainda falta.
- [ ] Licenças de componentes, fotos e fontes conferidas para uso comercial.
- [ ] Skeletons, modais, foco e PWA revisados conforme `beleza-ux`; imagens e carga
      conforme `escalabilidade-performance`.

Se algum item não se aplica, diga explicitamente por quê — não deixe passar em silêncio.
