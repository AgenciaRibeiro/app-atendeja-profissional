---
trigger: always_on
---

# Regra Permanente: Frontend Mobile-First & Micro-Interações

Sempre que a tarefa envolver componentes, telas de smartphone, navegação com uma única mão, microinterações, formulários móveis, estados visuais (carregando, skeletons, feedback de clique, prevenção de cliques duplos, animações funcionais), Kanban touch/mobile, orçamentos no celular ou acessibilidade tátil:

- **Ativação Obrigatória:** Aplique e consulte imediatamente a skill `frontend-mobile-first-and-micro-interactions` (`.agents/skills/frontend-mobile-first-and-micro-interactions/SKILL.md`).
- **Sinergia com `frontend-ui-engineering`:** Trabalhar em conjunto harmônico — `frontend-ui-engineering` garante estética profissional de agência e design tokens; `frontend-mobile-first-and-micro-interactions` assegura ergonomia para uso com uma mão, alvos de toque >= 44px, feedback visual imediato e desempenho sob conexões móveis.
- **Hierarquia Inegociável:** Priorize sempre: **Usabilidade → Desempenho → Acessibilidade → Consistência → Estética.**
- **Ergonomia e Áreas de Toque:** Garantir áreas de interação >= 44 a 48px CSS, posicionar ações críticas na zona de alcance do polegar e evitar rolagem horizontal indesejada.
- **Microinterações:** Fornecer feedback visual em toda ação (botões com estado de loading, bloqueio temporário contra cliques duplos, validação de campos inline e animações funcionais sutis).
- **Cobertura de 9 Estados:** Sempre tratar: Carregando, Conteúdo Carregado, Vazio (Empty State), Erro de Carregamento, Falha de Conexão, Operação em Andamento, Operação Concluída, Não Autorizado e Dados Desatualizados.
- **Confiabilidade:** Nunca apresentar operação como concluída antes da confirmação do backend (ou prever reversão visual em caso de falha de optimistic update).
