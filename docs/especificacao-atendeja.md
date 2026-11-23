# Especificação Visual, Copy e UX — **AtendeJá** (Landing Page SaaS + Onboarding por Nicho)

- **Autor:** BEZALEL (`ASV-13-01` — Branding e Design)
- **Request ID:** `ATENDEJA-LP-20261123-BEZALEL`
- **Produto:** **AtendeJá** — Atendimento imediato, controle de orçamentos e lembretes no WhatsApp para prestadores de serviços e empresas.
- **Diretriz Central:** SaaS Premium Dark, pouco texto, zero cara de template genérico de IA, cards interativos estilo **21st.dev**, animações **GSAP 3 + ScrollTrigger** e **Onboarding Interativo por Nicho** em 3 passos.

---

## 1. Sistema de Design & Identidade Visual

### 1.1 Paleta Oficial
- **Fundo principal (`--bg-main`):** `#090B0E`
- **Superfície elevada / Cards (`--bg-elevated`):** `#11141A` (ou `rgba(17, 20, 26, 0.78)` com `backdrop-filter: blur(12px)`)
- **Acento primário (`--accent-emerald`):** `#25D366` / `#10B981`
- **Destaque secundário sutil (`--accent-gold`):** `#D4AF37` (uso cirúrgico: badge *Mais escolhido* do plano Pro e micro-detalhes)
- **Texto primário (`--text-primary`):** `#F5F5F3`
- **Texto secundário (`--text-secondary`):** `#9CA3AF`
- **Borda padrão (`--border-subtle`):** `rgba(255, 255, 255, 0.08)`

### 1.2 Tipografia
- **Display / Títulos:** `Space Grotesk` (600, 700) — tracking `-0.02em`
- **Corpo / UI:** `Inter` (400, 500, 600)

### 1.3 Logo SVG Geométrico Exclusivo (**AtendeJá**)
Ícone minimalista combinando um balão de chat angular com um raio de velocidade interno (representando resposta imediata), em `#25D366` / `#10B981`:

```html
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
  <rect x="2" y="2" width="28" height="28" rx="8" fill="#11141A" stroke="rgba(16,185,129,0.45)" stroke-width="1.5"/>
  <path d="M17.5 7.5L10.5 17H15.5L14.5 24.5L21.5 15H16.5L17.5 7.5Z" fill="#25D366"/>
</svg>
```
Acompanhado do wordmark `AtendeJá` (`Space Grotesk`, 700, `#F5F5F3`, com `Já` opcionalmente em `#25D366`).

### 1.4 Atmosfera e Interatividade (21st.dev + GSAP 3)
- **Fundo:** grid arquitetônico sutil (`64px × 64px`, `rgba(255,255,255,0.022)`) + halo radial esmeralda no Hero (`rgba(16, 185, 129, 0.10)`).
- **Cards 21st.dev (`.glow-card`):**
  - Rastreamento de ponteiro `--mouse-x` / `--mouse-y` (via `pointermove` apenas em `@media (pointer: fine)`).
  - Borda brilhante `1px` (`::before` com `mask-composite: exclude`) em `#10B981` (`rgba(16, 185, 129, 0.6)`); no card **Pro**, combinar toque sutil dourado `#D4AF37`.
  - Spotlight interno (`::after`, `radial-gradient(380px circle at var(--mouse-x) var(--mouse-y), rgba(16, 185, 129, 0.08), transparent 60%)`).
  - Micro-tilt 3D (`±2deg`) no hover.
- **GSAP 3 + ScrollTrigger:**
  - Entrada imediata no Hero (`stagger: 0.1s`, `power3.out`).
  - Scroll reveals com `once: true` (`start: "top 84%"`) nos cards de solução, nichos e planos.
  - Respeito obrigatório a `prefers-reduced-motion: reduce` via `gsap.matchMedia()` e fallback seguro se CDN falhar.

---

## 2. Estrutura e Copy Enxuta da Landing Page

### 2.1 Header (Sticky Glassmorphism)
- **Esquerda:** Logo SVG + `AtendeJá`
- **Centro (links âncora):** `Como funciona` (`#como-funciona`) • `Nichos` (`#nichos`) • `Planos` (`#planos`)
- **Direita (CTA):** Botão `"Começar agora"` (abre o Onboarding ou rola suavemente para `#planos`)

### 2.2 Hero Section
- **Eyebrow:** `ATENDIMENTO IMEDIATO • CONTROLE DE ORÇAMENTOS`
- **Headline (H1):** `Pare de perder clientes por demora no WhatsApp.`
- **Subtítulo:** `Responda leads em segundos, organize seus orçamentos e nunca mais esqueça um retorno combinado.`
- **CTAs:**
  - Primário (`#25D366`, texto `#090B0E`): `Escolher meu plano` (rola para `#planos`)
  - Secundário (outline sutil): `Testar agora` (abre o Onboarding direto no Passo 1)
- **Preview Visual Enxuto do Fluxo (lado direito no desktop / abaixo no mobile):**
  Card glassmorphism limpo mostrando 3 nós conectados em sequência horizontal/vertical:
  1. **Lead chega** (`"Oi, preciso de um orçamento..."`)
  2. **Chat WhatsApp responde na hora** (`AtendeJá • 24h`)
  3. **Orçamento + Follow-up no dia certo** (`Lembrete ativo ✓`)

### 2.3 Seção 3 — Cards de Solução (`#como-funciona`, estilo 21st.dev)
- **Título da Seção:** `Tudo o que você precisa para não perder nenhuma venda`
- **Grid 3 Colunas (`.glow-card`):**
  1. **01 / Atendimento Imediato 24h**
     - *Copy:* `Seu cliente chama, recebe resposta na hora e já informa o que precisa — mesmo fora do horário.`
  2. **02 / Controle de Orçamentos**
     - *Copy:* `Visualize cada orçamento enviado, pendente ou aprovado em um só lugar, sem planilhas soltas.`
  3. **03 / Lembrete no Dia Combinado**
     - *Copy:* `Retorne para o cliente exatamente na data prometida e aumente sua taxa de fechamento.`

### 2.4 Seção 4 — Nichos Atendidos (`#nichos`)
- **Título da Seção:** `Feito para quem vive de atendimento e orçamento`
- **Faixa de Chips Limpos (com ícones SVG lineares 18px):**
  - `Elétrica e Hidráulica`
  - `Climatização`
  - `Marcenaria`
  - `Reformas e Obras`
  - `Estética Automotiva`
  - `Consultorias e Serviços`

### 2.5 Seção 5 — Planos e Preços (`#planos`)
- **Título da Seção:** `Planos transparentes para o tamanho da sua operação`
- **3 Cards de Plano (`.glow-card`):**
  1. **Essencial** — **R$ 49**/mês
     - *Para autônomos e quem está começando.*
     - `• Atendimento automático 24h`
     - `• Captura de dados do orçamento`
     - `• Painel simples de solicitações`
     - CTA: `Contratar` (abre Onboarding com plano `Essencial`)
  2. **Pro** *(Badge dourado sutil: `Mais escolhido`)* — **R$ 97**/mês
     - *Para quem quer atender rápido e fechar mais.*
     - `• Tudo do plano Essencial`
     - `• Controle completo de orçamentos`
     - `• Lembretes automáticos de follow-up`
     - CTA: `Contratar` (abre Onboarding com plano `Pro`)
  3. **Empresa** — **R$ 197**/mês
     - *Para equipes com maior volume diário.*
     - `• Tudo do plano Pro`
     - `• Múltiplos atendentes e setores`
     - `• Relatórios e suporte prioritário`
     - CTA: `Contratar` (abre Onboarding com plano `Empresa`)

---

## 3. Onboarding Interativo por Nicho (Modal / Drawer em 3 Passos)

Acionado ao clicar em qualquer botão `"Contratar"` ou `"Testar agora"`. Fundo escurecido (`rgba(0,0,0,0.75)` + `backdrop-filter: blur(8px)`), card central limpo (`max-width: 620px`) com barra de progresso `Passo 1 de 3` → `2 de 3` → `3 de 3`.

### Passo 1 — Confirmar Plano e Escolher o Nicho
- **Topo:** Pill editável mostrando o plano selecionado (ex.: `Plano selecionado: Pro — R$ 97/mês` com seletor rápido se quiser trocar).
- **Pergunta:** `Qual é o segmento da sua empresa?`
- **Cards clicáveis (Grid 2×3 ou 2×4, ícones SVG limpos):**
  1. `Elétrica / Hidráulica`
  2. `Climatização`
  3. `Marcenaria`
  4. `Reformas`
  5. `Estética Automotiva`
  6. `Consultoria / Serviços`
  7. `Outro nicho` *(ao selecionar, exibe input curto: "Qual é o seu nicho?")*
- **Ação:** `Continuar`

### Passo 2 — Configurar seu App
- **Pergunta:** `Como devemos personalizar seu atendimento?`
- **Campos (máximo 4, altura `48px`):**
  1. `Nome da empresa` (`empresa`, obrigatório)
  2. `Nome do atendente no chat` (`atendente`, obrigatório — *Ex.: Lucas ou Atendimento Silva*)
  3. `WhatsApp comercial` (`whatsapp`, obrigatório, máscara `(00) 00000-0000`)
  4. `Cidade / Região` (`cidade`, obrigatório)
- **Ações:** `Voltar` | `Gerar meu Setup`

### Passo 3 — Setup Pronto!
- **Ícone de check esmeralda (`#25D366`)** + **Título:** `Seu AtendeJá está pronto para ativação!`
- **Resumo Personalizado (dinâmico conforme nicho e plano escolhidos):**
  - Exibe: Plano (`{plano}`), Nicho (`{nicho}`), Empresa (`{empresa}`), Atendente (`{atendente}`).
  - Lista enxuta do que será ativado para o nicho (ex.: *Fluxo de qualificação para {nicho}*, *Saudação automática com "{atendente}"*, *Controle de orçamentos e lembretes*).
- **Ações Finais:**
  - **Botão Primário:** `Ativar minha conta agora` → dispara `POST` para webhook configurável (`config.js`: `WEBHOOK_URL`) com feedback de loading e confirmação.
  - **Botão Secundário:** `Finalizar no WhatsApp` → abre WhatsApp oficial com mensagem pré-preenchida contendo Plano + Nicho + Empresa para ativação assistida.

---

## 4. Contrato de Payload (Onboarding Webhook)

```json
{
  "origem": "atendeja-lp-onboarding",
  "plano": "Essencial | Pro | Empresa",
  "valor_mensal": 49,
  "nicho": "string",
  "empresa": "string",
  "atendente": "string",
  "whatsapp": "string",
  "cidade": "string",
  "submittedAt": "ISO-8601"
}
```
