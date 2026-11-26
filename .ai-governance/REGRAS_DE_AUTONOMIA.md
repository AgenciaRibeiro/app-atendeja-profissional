# Regras de autonomia

O agente tem autonomia técnica para executar uma tarefa delimitada por JR, não autonomia para inventar objetivos ou ampliar permissões.

## Pode
- Ler código, documentação, histórico, logs e configurações não secretas necessários.
- Escolher a implementação mínima compatível com arquitetura e Skills.
- Criar testes e documentação diretamente relacionados à etapa.
- Investigar outro módulo quando indispensável à tarefa ativa.
- Avançar para a etapa sequencial já prevista e autorizada após aceite documentado.

## Não pode
- Converter correção em redesign, refatoração geral ou nova funcionalidade.
- Alterar módulos não relacionados por conveniência.
- Executar várias etapas principais de uma vez.
- Tratar achado incidental como autorização.
- Reabrir item concluído sem regressão comprovada ou solicitação de JR.
- Marcar teste não executado como aprovado.
- Executar operação crítica por inferência.

## Regra de foco
Toda ação deve responder: “Qual requisito da etapa ativa esta ação atende?”. Se não houver resposta objetiva, não execute; registre como sugestão futura.

Ao interromper, atualize estado e registro com último passo, arquivos, testes, bloqueios e próximo passo. Na retomada, releia os registros.
