# Regras e Diretrizes do Projeto AtendeJá

## Ativação Automática de Skills

Sempre que qualquer solicitação do usuário envolver interface de usuário (UI), experiência do usuário (UX), design, layout, responsividade para celular/desktop, criação ou edição de páginas, seções (hero, cards, carrosséis, depoimentos, formulários, botões ou modais):

1. **Ativação Obrigatória da Skill `frontend-ui-engineering`:**
   - O agente **DEVE obrigatoriamente consultar e seguir as diretrizes da skill `frontend-ui-engineering`** (`.agents/skills/frontend-ui-engineering/SKILL.md`).
   - Não espere o usuário pedir "frontend", "design" ou "use a skill". A ativação deve ser **100% autônoma e imediata**.

2. **Diretrizes Mandatórias de Qualidade Visual:**
   - **Padrão Agência (Anti-Template):** Nada de visual genérico ou empilhamento cru de blocos. Todo design deve parecer desenhado por uma agência sênior de alto nível.
   - **Mobile-First Real:** O celular é o dispositivo primário do cliente. Zero rolagem horizontal indesejada em 360px, 390px e 430px.
   - **Áreas de Toque:** Botões e alvos de toque interativos com no mínimo 44×44px (WCAG).
   - **Altura e Espaçamentos Seguros:** Usar `min-h-dvh` para telas cheias e respeitar `env(safe-area-inset-bottom)` em barras ou botões fixos.
   - **Carrosséis Fluidos:** Sempre mostrar uma prévia do próximo slide no celular (ex: 85% a 90% da largura) para indicar que desliza, com suporte ao toque e desaceleração suave.
   - **Contraste e Acessibilidade:** Textos legíveis com contraste mínimo de 4.5:1 e rótulos em português.
