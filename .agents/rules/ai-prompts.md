---
trigger: always_on
---

# Regra Permanente: Engenharia de Prompts e IA Especializada

Sempre que a tarefa envolver:
- Criação, customização, teste ou ajuste de Prompts de Inteligência Artificial
- Assistentes Virtuais (ASVs) por nicho (climatização, elétrica, marcenaria, etc.)
- Extração de dados da conversa em JSON estruturado
- Cálculos, estimativas ou regras de orçamentos comerciais
- Atualização e movimentação de cards no CRM Kanban a partir de conversas

**Ações Obrigatórias do Agente:**
1. Consulte e aplique as diretrizes da skill `prompt-engineering-and-specialized-ai` (`.agents/skills/prompt-engineering-and-specialized-ai/SKILL.md`).
2. **Respeite a Diretriz das 4 Camadas:**
   - **Camada 1 (LLM):** Atendimento natural, perguntas de triagem, zero alucinações de preço.
   - **Camada 2 (Extração):** Formatação rigorosa em JSON com campos pendentes como `null`.
   - **Camada 3 (Backend):** Autoridade comercial. Cálculos matemáticos SEMPRE em código determinístico no backend.
   - **Camada 4 (CRM/Kanban):** Deduplicação de leads e atualização automática dos estágios do funil.
3. Não permita que o modelo de linguagem invente preços, prazos ou execute operações de banco de dados sem a validação do backend.
