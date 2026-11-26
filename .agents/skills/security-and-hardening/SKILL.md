---
name: security-and-hardening
description: >-
  Protege integrações com WhatsApp e provedores de IA por meio de mascaramento
  de segredos, validação estrita de webhooks e práticas seguras de configuração,
  execução e auditoria. Use SEMPRE que lidar com chaves de API (WhatsApp, IA,
  Supabase), webhooks (validação HMAC, assinatura, replay, idempotência),
  variáveis de ambiente, autenticação, isolamento multi-tenant, mascaramento de
  senhas/tokens no frontend ou sanitização de logs e erros.
---

# Skill: Security and Hardening

## 1. Objetivo

Aplicar controles de segurança às integrações do sistema, com atenção
especial a:

-   Chaves, tokens e segredos de WhatsApp.
-   Chaves de API e credenciais de provedores de inteligência
    artificial.
-   Endpoints e eventos recebidos por webhooks.
-   Logs, mensagens de erro, telas administrativas e arquivos de
    configuração.

O princípio central é **não expor segredos e não confiar em solicitações
recebidas sem validação**.

## 2. Regras obrigatórias para segredos

### 2.1 Armazenamento

-   Nunca inserir tokens, API keys, app secrets, access tokens, refresh
    tokens ou credenciais diretamente no código-fonte, prompts,
    exemplos, documentação pública ou repositório Git.
-   Preferir variáveis de ambiente ou um gerenciador de segredos
    apropriado ao ambiente de execução.
-   Em produção, restringir o acesso aos segredos aos serviços e
    processos que realmente precisam deles.
-   Não armazenar segredos em `localStorage`, `sessionStorage`, cookies
    acessíveis por JavaScript ou no frontend.
-   Não enviar segredos ao navegador. Chamadas autenticadas a provedores
    externos devem ocorrer no backend, salvo quando o provedor oferecer
    um fluxo público e seguro especificamente concebido para o cliente.
-   Não registrar segredos em logs, telemetria, relatórios de erro,
    traces, URLs, parâmetros de consulta ou mensagens de depuração.
-   Não incluir valores reais de segredos em testes, fixtures, capturas
    de tela ou documentação.

### 2.2 Mascaramento de valores

Ao exibir uma credencial em painel, formulário, resposta de API, log ou
relatório:

-   Mostrar apenas um identificador e uma pequena parte não sensível do
    valor, quando isso for necessário para reconhecimento.
-   Usar mascaramento consistente, por exemplo: `••••••••ABCD`.
-   Para segredos curtos ou cujo trecho final também possa permitir
    identificação indevida, exibir apenas `Configurado` ou
    `Não configurado`.
-   Nunca devolver o valor integral de um segredo em endpoints de
    leitura.
-   Nunca considerar o mascaramento visual como proteção de
    armazenamento: o valor original deve continuar protegido no backend.
-   Em formulários de edição, deixar o campo vazio ou indicar que existe
    uma credencial configurada. Só substituir o segredo quando o usuário
    fornecer um novo valor.
-   Não preencher automaticamente campos com o segredo existente.

### 2.3 Respostas e erros

-   Sanitizar mensagens de erro antes de apresentá-las ao usuário.
-   Não repassar diretamente respostas de provedores que possam conter
    cabeçalhos, tokens ou dados sensíveis.
-   Não incluir segredos em stack traces acessíveis ao cliente.
-   Se um segredo for exposto, orientar sua revogação/rotação imediata e
    verificar logs, histórico do repositório e sistemas afetados.

## 3. Validação estrita de webhooks

Todo webhook recebido deve ser tratado como entrada externa não
confiável.

### 3.1 Autenticidade

-   Validar a assinatura criptográfica conforme o mecanismo oficial do
    provedor, sempre que disponível.
-   Para assinaturas HMAC, usar a chave secreta correta, o corpo bruto
    exato da requisição e comparação em tempo constante.
-   Não validar assinatura sobre um JSON reserializado: diferenças de
    espaços, codificação ou ordem podem alterar o conteúdo assinado.
-   Rejeitar assinatura ausente, inválida, malformada ou calculada com
    segredo incorreto.
-   Não considerar um token estático enviado em query string como
    substituto adequado de assinatura criptográfica.
-   Usar HTTPS em todos os endpoints expostos publicamente.

### 3.2 Integridade, origem e formato

-   Validar método HTTP, `Content-Type`, tamanho máximo do corpo e
    estrutura esperada.
-   Validar campos obrigatórios, tipos, comprimentos, formatos e limites
    permitidos.
-   Rejeitar campos críticos ausentes, tipos inesperados e payloads
    malformados.
-   Não confiar em `User-Agent`, IP de origem ou cabeçalhos não
    autenticados como prova isolada de legitimidade.
-   Se o provedor publicar faixas oficiais de IP, elas podem ser usadas
    como camada adicional, nunca como único controle quando houver
    assinatura disponível.
-   Evitar aceitar eventos ou ações que não estejam explicitamente
    previstos na integração.

### 3.3 Replay e duplicidade

-   Validar timestamp ou janela temporal, quando o protocolo do provedor
    oferecer esse recurso.
-   Rejeitar eventos fora da janela de tolerância definida e
    documentada.
-   Usar identificador único do evento para deduplicação.
-   Persistir o identificador processado de forma atômica, com proteção
    contra concorrência.
-   Projetar handlers para processamento idempotente: receber o mesmo
    evento novamente não deve repetir efeitos críticos.
-   Não inventar suporte a timestamp ou identificador quando o provedor
    não os fornecer; documentar a limitação e aplicar os controles
    disponíveis.

### 3.4 Processamento seguro

-   Validar a autenticidade antes de executar ações de negócio.
-   Não executar comandos, consultas ou operações administrativas
    diretamente a partir de valores recebidos no payload.
-   Aplicar autorização no contexto da conta, organização ou tenant
    correspondente.
-   Impedir que um evento de um tenant acesse dados de outro tenant.
-   Limitar taxa de requisições e aplicar timeouts.
-   Não manter conexões ou transações abertas durante chamadas externas
    demoradas.
-   Responder com códigos HTTP apropriados, sem revelar detalhes
    internos da validação.

### 3.5 Verificação inicial do webhook

Quando o provedor exigir um desafio de verificação inicial:

-   Implementar o procedimento documentado oficialmente pelo provedor.
-   Comparar o token de verificação com o valor configurado no servidor.
-   Retornar o desafio somente após a validação bem-sucedida.
-   Não confundir o desafio inicial com a autenticação criptográfica dos
    eventos posteriores.

## 4. Proteções adicionais

-   Aplicar princípio do menor privilégio às credenciais e contas de
    serviço.
-   Separar credenciais de desenvolvimento, homologação e produção.
-   Rotacionar segredos periodicamente e imediatamente após suspeita de
    comprometimento.
-   Definir limites de uso e permissões mínimos nas chaves dos
    provedores de IA.
-   Não permitir que o frontend escolha livremente endpoints internos ou
    URLs de callback sem validação, evitando SSRF.
-   Validar e normalizar dados externos antes de persistir ou
    reutilizar.
-   Aplicar proteção contra XSS, injeção, CSRF e abuso de endpoints
    conforme o contexto da aplicação.
-   Manter dependências e runtimes atualizados, avaliando avisos de
    segurança.
-   Registrar eventos de segurança sem registrar o conteúdo secreto:
    falhas de assinatura, tentativas inválidas, rate limits e alterações
    de credenciais.

## 5. Procedimento de implementação

Antes de alterar código:

1.  Identificar a arquitetura, o backend responsável pelas integrações e
    os pontos onde os segredos são armazenados.
2.  Localizar telas, endpoints, logs e respostas de API que possam expor
    credenciais.
3.  Identificar o provedor de WhatsApp e cada provedor de IA utilizado.
4.  Consultar a documentação oficial de cada provedor para confirmar o
    mecanismo de assinatura, cabeçalhos, algoritmo, formato do corpo e
    regras de verificação.
5.  Registrar o comportamento atual e os riscos encontrados.

Durante a implementação:

1.  Centralizar leitura e acesso aos segredos no backend.
2.  Implementar mascaramento na camada de apresentação e sanitização na
    camada de logs.
3.  Criar validação de webhook específica para cada provedor, sem
    presumir que todos usam o mesmo padrão.
4.  Validar assinatura sobre o corpo bruto, quando exigido pelo
    protocolo.
5.  Aplicar validação de esquema, limites, deduplicação e idempotência.
6.  Proteger o isolamento entre tenants e aplicar autorização antes de
    qualquer operação.
7.  Criar testes automatizados para os cenários válidos e inválidos.

Após a implementação:

1.  Executar testes sem utilizar credenciais reais em fixtures ou logs.
2.  Confirmar que nenhum endpoint de leitura retorna segredos completos.
3.  Confirmar que assinaturas inválidas ou ausentes são rejeitadas.
4.  Confirmar que eventos duplicados não repetem operações.
5.  Verificar que erros não revelam segredos nem detalhes internos.
6.  Documentar arquivos alterados, controles implementados, testes
    executados e limitações restantes.

## 6. Matriz mínima de testes

| Cenário | Resultado esperado |
|---|---|
| Segredo configurado e exibido no painel | Valor mascarado ou status de configuração |
| Consulta de credencial pela API | Nunca retorna o valor integral |
| Campo de credencial não alterado | Segredo existente permanece intacto |
| Webhook com assinatura válida | Prossegue para validação e processamento |
| Webhook sem assinatura obrigatória | Rejeitado |
| Webhook com assinatura inválida | Rejeitado |
| Corpo alterado após assinatura | Rejeitado |
| Payload malformado ou acima do limite | Rejeitado com resposta controlada |
| Evento duplicado | Não repete efeitos |
| Evento fora da janela temporal | Rejeitado, quando o protocolo oferecer timestamp |
| Evento de outro tenant | Não acessa nem altera dados alheios |
| Erro interno durante processamento | Não expõe segredos ou stack trace ao cliente |

## 7. Restrições e cuidados

-   Não inventar nomes de cabeçalhos, algoritmos, formatos de assinatura
    ou regras de autenticação.
-   Não aplicar uma implementação genérica de HMAC a todos os provedores
    sem confirmar a documentação oficial.
-   Não remover validações existentes sem justificativa técnica e teste
    de regressão.
-   Não alterar produção, rotacionar credenciais, revogar tokens ou
    interromper integrações sem autorização explícita do responsável.
-   Não afirmar que o sistema está seguro apenas porque os valores
    aparecem mascarados na interface.
-   Se não houver informação suficiente sobre o provedor, registrar a
    pendência e solicitar a documentação ou configuração necessária
    antes de implementar a validação específica.

## 8. Critérios de conclusão

A tarefa só pode ser declarada concluída quando houver evidências de
que:

-   Segredos não são expostos no frontend, nas respostas de API ou nos
    logs.
-   O armazenamento e o acesso às credenciais estão restritos ao backend
    autorizado.
-   Cada webhook possui validação compatível com a documentação oficial
    do respectivo provedor.
-   Payloads inválidos são rejeitados antes de produzir efeitos.
-   Duplicidade, replay e isolamento entre tenants são tratados conforme
    os recursos disponíveis no protocolo.
-   Os testes relevantes foram executados e seus resultados
    documentados.

**Regra final:** segurança não deve ser presumida. Toda proteção
implementada precisa ser demonstrada por código, configuração ou teste
verificável.
