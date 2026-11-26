# AGENTS.md — Governança obrigatória do AtendeJá Profissional

Autoridade do projeto: JR, proprietário do produto. Este é o ponto de entrada obrigatório para qualquer agente de IA neste repositório.

## Entrada obrigatória
Antes de responder a pedidos de implementação, diagnóstico, revisão ou continuidade:
1. Leia este arquivo integralmente.
2. Leia `GEMINI.md` e as regras aplicáveis em `.agents/rules/`.
3. Identifique e leia as Skills aplicáveis em `.agents/skills/`; reutilize as existentes, sem duplicá-las.
4. Leia `.ai-governance/README.md`, `REGRAS_DE_AUTONOMIA.md`, `PROTOCOLO_DE_EXECUCAO.md` e `POLITICA_DE_AUTORIZACOES.md`.
5. Leia `docs/execucao-ia/ESTADO_ATUAL.md`, `FILA_DE_ETAPAS.md`, `PENDENCIAS_E_BLOQUEIOS.md` e os registros recentes.
6. Para a missão corretiva, leia `docs/auditoria-corretiva/02_PLANO_DE_CORRECOES.md` e a documentação técnica da etapa.
7. Só então informe o próximo passo ou inicie trabalho autorizado.

## Hierarquia
JR é a autoridade máxima sobre escopo, prioridades, decisões comerciais e autorizações críticas. Este arquivo governa a execução; `GEMINI.md`, `.agents/rules/` e `.agents/skills/` continuam obrigatórios como regras especializadas. O plano mestre define a ordem da missão. Em conflito, pare, registre e peça decisão de JR; nunca escolha a interpretação que amplia permissões.

## Missão e foco
Missão atual: auditoria corretiva, estabilização, segurança e validação do produto conforme `docs/auditoria-corretiva/02_PLANO_DE_CORRECOES.md`.
- Não redesenhar nem editar dashboard, landing page ou funcionalidades por iniciativa própria.
- Não criar funcionalidades, refatorações amplas, melhorias cosméticas ou otimizações fora da etapa atual.
- Alterar somente o necessário para o item autorizado e seus testes relacionados.
- Investigações auxiliares são permitidas apenas se necessárias à tarefa ativa; devem ter objetivo e limite, ser registradas e retornar à tarefa original.
- Achados incidentais vão para pendências futuras; não iniciam nova frente.

## Uma etapa por vez
Antes de cada etapa, confirme pré-requisitos, escopo, arquivos e riscos. Execute uma única etapa principal. Ao terminar, revise diff, teste, audite, documente e atualize estado. Só avance se critérios de aceite forem comprovados, sem bloqueios e com autorização vigente. Falha mantém a etapa EM_ANDAMENTO ou BLOQUEADA.

## Pergunta “O que vamos resolver agora?”
É pedido de status, não autorização para alterar arquivos. Releia estado, fila, pendências, último registro e plano. Informe etapa concluída mais recente, próxima etapa exata, motivo, dependências, riscos e evidências faltantes. Se missão encerrada, informe que não há itens pendentes nela; não reabra etapas concluídas.

## Desvios
Investigue outro módulo somente quando indispensável à tarefa ativa. Por padrão, leitura apenas. Não altere esse módulo sem escopo e autorização. Registre o motivo, arquivos consultados, conclusão e retorno à tarefa principal.

## Evidências
Nunca alegue testes, auditorias, backups, deploys ou verificações não executados. Use status VALIDADO, NÃO VALIDADO, NÃO EXECUTADO, BLOQUEADO ou FALHOU. Registre commit, arquivos, comandos, resultados e limitações. Não marque concluído apenas por editar código.

## Ações que exigem autorização específica de JR
Deploy/publicação em produção; cobranças, estornos ou transações reais; exclusão/alteração destrutiva de dados; reset/recriação de banco; migração destrutiva; rotação/alteração de credenciais; cancelamento de serviços/assinaturas; desativação/alteração de workflows ativos; remoção de volumes/backups; mudanças críticas no Coolify/VPS/DNS/firewall; testes intrusivos em produção.

## Encerramento
Etapa fecha somente com critérios, auditoria, documentação e evidências. Missão fecha quando todos os itens obrigatórios forem concluídos ou formalmente dispensados por JR, sem bloqueios críticos, com relatório final e aceite explícito. Preserve o histórico e congele a fila; novas funcionalidades terão nova missão.
