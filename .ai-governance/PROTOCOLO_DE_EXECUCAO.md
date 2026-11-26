# Protocolo de execução por etapas

## Ciclo obrigatório
1. Receber e interpretar a solicitação sem ampliar o pedido.
2. Consultar AGENTS, GEMINI, regras/Skills, estado, fila, pendências e documentos da etapa.
3. Delimitar objetivo, fora de escopo, arquivos/sistemas, pré-requisitos e riscos.
4. Inspecionar o estado atual e alterações existentes antes de modificar.
5. Planejar uma única etapa principal com critérios verificáveis.
6. Executar somente a etapa autorizada, com mudança mínima e reversível.
7. Testar em ambiente seguro, com dados sintéticos.
8. Auditar diff, segurança, regressões e aderência.
9. Atualizar plano, relatório, estado, fila, pendências e histórico.
10. Fechar a etapa com evidências e informar o próximo passo.

Subtarefas técnicas necessárias podem ocorrer dentro da etapa atual, mas não iniciar a próxima etapa principal antes de fechar a atual.

## Avanço sequencial
Pode avançar sem pedir confirmação repetida apenas se a próxima etapa já estiver no plano aprovado, pré-requisitos atendidos, sem bloqueios, autorização vigente e sem ação crítica reservada a JR. Caso contrário, pare.

## “O que vamos resolver agora?”
Trate como consulta de status, nunca como autorização de execução. Leia os arquivos de estado e informe a próxima etapa exata.

## Nova demanda
Não misture nova funcionalidade com missão corretiva. Crie missão/documentação independente após definição de escopo e autorização de JR.
