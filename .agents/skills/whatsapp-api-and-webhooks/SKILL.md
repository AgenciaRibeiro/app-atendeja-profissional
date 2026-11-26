---
name: whatsapp-api-and-webhooks
description: >-
  Especialista em integração de APIs de WhatsApp, gateways, gerenciamento de
  sessões, webhooks, eventos em tempo real e recuperação de conexões. Trabalha
  em conjunto com security-and-hardening (proteção de segredos e webhooks) e
  debugging-and-error-recovery (diagnóstico de infraestrutura e falhas). Use
  SEMPRE que envolver WAHA, Evolution API, Meta WhatsApp Cloud API, QR Code,
  conexão ou desconexão de instâncias, envio/recebimento de mensagens,
  webhooks de mensagens ou status, integração com n8n ou reconexão automática.
---

# Skill: WhatsApp API and Webhooks Integration

## 1. Objetivo

Desenvolver, integrar, monitorar e manter conexões entre sistemas e plataformas de WhatsApp, permitindo comunicação confiável entre usuários, aplicações, automações e Assistentes Virtuais (ASVs).

A Skill deve dominar as seguintes tecnologias:

- WAHA (WhatsApp HTTP API).
- Evolution API.
- Meta WhatsApp Cloud API oficial.
- Webhooks HTTP.
- APIs REST.
- WebSockets, quando suportados.
- Integrações com n8n.
- Sistemas de filas e processamento assíncrono.

## 2. Conhecimento dos provedores

### 2.1 WAHA

Conhecer a arquitetura e os recursos do WAHA:

- Criação e gerenciamento de sessões.
- Geração e leitura de QR Code.
- Inicialização e encerramento de sessões.
- Envio e recebimento de mensagens.
- Recebimento de eventos por webhook.
- Monitoramento da conexão.
- Identificação de sessões desconectadas.
- Gerenciamento de instâncias.
- Tratamento de erros e reconexões.

Consultar a documentação oficial da versão instalada antes de implementar endpoints ou parâmetros.

Documentação: https://waha.devlike.pro/

### 2.2 Evolution API

Dominar os recursos da Evolution API:

- Criação de instâncias.
- Conexão e desconexão de sessões.
- Geração de QR Code.
- Envio de mensagens de texto e mídia.
- Recebimento de mensagens.
- Configuração de webhooks.
- Gerenciamento de eventos.
- Monitoramento de conexão.
- Integração com n8n.
- Tratamento de falhas de sessão.

Consultar a documentação oficial correspondente à versão instalada.

Documentação: https://doc.evolution-api.com/

### 2.3 Meta WhatsApp Cloud API

Conhecer a API oficial da Meta:

- Cadastro e gerenciamento de aplicativos.
- Configuração de WhatsApp Business Account.
- Phone Number ID.
- Access Tokens.
- Webhook de verificação.
- Assinatura e validação de eventos.
- Envio e recebimento de mensagens.
- Templates de mensagens.
- Status de entrega e leitura.
- Limites e políticas de utilização.
- Tratamento de erros da API.

Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api/

Não presumir que recursos de sessão por QR Code disponíveis em gateways baseados em WhatsApp Web também existem na Cloud API oficial.

## 3. Gerenciamento de sessões

O sistema deve implementar mecanismos para acompanhar o estado de cada conexão.

Estados recomendados:

- `CREATED`: instância criada.
- `CONNECTING`: iniciando conexão.
- `QR_REQUIRED`: aguardando leitura do QR Code.
- `CONNECTED`: conexão ativa.
- `DISCONNECTED`: conexão encerrada.
- `RECONNECTING`: tentando restabelecer conexão.
- `ERROR`: falha identificada.
- `STOPPED`: sessão interrompida intencionalmente.

Requisitos:

1. Identificar o estado real da sessão.
2. Registrar alterações de estado.
3. Exibir o QR Code somente quando necessário.
4. Atualizar o estado após autenticação.
5. Detectar desconexões.
6. Diferenciar desconexão voluntária de falha inesperada.
7. Evitar criação de múltiplas sessões para a mesma instância.
8. Preservar o vínculo entre instância, empresa e usuário autorizado.

## 4. Gerenciamento de QR Code

Quando o provedor oferecer autenticação por QR Code:

- Solicitar o QR Code pelo mecanismo documentado.
- Exibir o código atualizado na interface administrativa.
- Controlar sua validade conforme o provedor.
- Detectar quando o QR Code expirar.
- Solicitar um novo código quando necessário.
- Identificar quando a autenticação foi concluída.
- Remover o QR Code da interface após a conexão.
- Não armazenar QR Codes permanentemente.
- Não registrar QR Codes em logs.

O sistema não deve presumir que a conexão foi estabelecida apenas porque o QR Code foi exibido. A confirmação deve ocorrer por evento ou consulta de estado documentada pelo provedor.

## 5. Webhooks e eventos em tempo real

Implementar recebimento e processamento de eventos externos.

Eventos que devem ser considerados:

### Mensagens
- `MESSAGE_RECEIVED`
- `MESSAGE_SENT`
- `MESSAGE_UPDATED`
- `MESSAGE_DELETED`
- `MESSAGE_REVOKED`

Os nomes acima são categorias internas sugeridas. Cada provedor pode utilizar nomes e estruturas diferentes.

### Status de mensagens
- `PENDING`
- `SENT`
- `DELIVERED`
- `READ`
- `FAILED`

Não presumir que todos os provedores oferecem os mesmos estados ou garantem a mesma sequência de eventos.

### Sessões
- `SESSION_CREATED`
- `SESSION_CONNECTED`
- `SESSION_DISCONNECTED`
- `SESSION_RECONNECTING`
- `SESSION_ERROR`
- `QR_CODE_UPDATED`

### Outros eventos
- Alterações de grupos.
- Alterações de participantes.
- Eventos de presença, quando disponíveis.
- Alterações de perfil.
- Eventos administrativos.

## 6. Processamento confiável de webhooks

Todo evento recebido deve passar por validação.

Regras obrigatórias:

1. Validar a autenticidade da requisição conforme o provedor.
2. Validar estrutura e formato do payload.
3. Identificar a instância de origem.
4. Identificar a empresa ou tenant responsável.
5. Registrar o identificador do evento, quando disponível.
6. Evitar processamento duplicado.
7. Processar eventos de maneira idempotente.
8. Encaminhar eventos válidos para processamento assíncrono quando necessário.
9. Registrar falhas sem expor tokens ou informações sensíveis.
10. Implementar controle de tentativas e recuperação.

O endpoint de webhook deve responder rapidamente e evitar executar tarefas demoradas durante a requisição HTTP.

Quando utilizar filas:

- Persistir o evento antes de confirmar recebimento, conforme a arquitetura adotada.
- Processar em workers independentes.
- Implementar tentativas controladas.
- Utilizar fila de mensagens com falha definitiva (Dead Letter Queue), quando disponível.
- Permitir reprocessamento seguro de eventos.

## 7. Reconexão automática

Implementar recuperação de conexões para provedores que utilizem sessões persistentes.

Estratégia recomendada:

1. Detectar desconexão inesperada.
2. Registrar horário e motivo informado.
3. Consultar o estado real da sessão.
4. Verificar se a sessão ainda pode ser recuperada.
5. Tentar reconectar conforme os recursos documentados.
6. Aplicar intervalo progressivo entre tentativas (Exponential Backoff).
7. Estabelecer limite de tentativas.
8. Evitar múltiplos processos de reconexão simultâneos.
9. Solicitar intervenção humana quando a autenticação exigir nova leitura de QR Code.
10. Notificar o administrador sobre falhas persistentes.

**IMPORTANTE:**
A reconexão automática não deve tentar contornar autenticação, bloqueios ou mecanismos de segurança do provedor. Quando uma nova autenticação for necessária, o sistema deve solicitar intervenção autorizada.

## 8. Integração com n8n

Preparar integrações para comunicação com workflows do n8n.

Possibilidades:

- Receber mensagens do WhatsApp.
- Identificar contatos.
- Consultar CRM.
- Acionar ASVs.
- Encaminhar mensagens para agentes especializados.
- Enviar respostas.
- Registrar histórico de conversas.
- Atualizar status de mensagens.
- Notificar operadores humanos.
- Gerenciar pausas de atendimento.

Regras:

- Não duplicar mensagens.
- Preservar o identificador original da mensagem.
- Manter contexto da conversa.
- Implementar controle de concorrência.
- Evitar loops entre webhooks e respostas automáticas.
- Respeitar pausas humanas.
- Permitir transferência de atendimento para operadores.

## 9. Segurança

Aplicar obrigatoriamente:

- HTTPS.
- Autenticação das APIs.
- Validação de assinatura dos webhooks, quando suportada.
- Mascaramento de tokens e credenciais.
- Proteção contra requisições não autorizadas.
- Rate limiting.
- Controle de acesso por usuário e empresa.
- Isolamento entre tenants.
- Logs sem informações sensíveis.
- Rotação de credenciais.
- Proteção contra replay de eventos.
- Validação de origem conforme os mecanismos disponíveis.

Nunca expor tokens de WhatsApp no frontend.
Nunca armazenar credenciais diretamente no código-fonte.

## 10. Monitoramento e diagnóstico

Disponibilizar informações para acompanhamento:

- Total de instâncias.
- Sessões conectadas.
- Sessões desconectadas.
- Sessões aguardando QR Code.
- Eventos recebidos.
- Mensagens enviadas.
- Mensagens recebidas.
- Falhas de envio.
- Webhooks rejeitados.
- Eventos duplicados.
- Tempo de processamento.
- Tentativas de reconexão.
- Erros por provedor.

Criar registros de auditoria para alterações administrativas e mudanças de sessão. Não apresentar dados estimados como métricas reais.

## 11. Procedimento de implementação

Antes de implementar:

1. Identificar o provedor utilizado.
2. Verificar a versão instalada.
3. Consultar a documentação oficial.
4. Identificar os endpoints disponíveis.
5. Mapear os eventos suportados.
6. Verificar a infraestrutura de webhook.
7. Identificar a arquitetura de filas e persistência.
8. Avaliar a integração com o CRM e os ASVs existentes.

Durante a implementação:

1. Criar uma camada de integração independente do provedor.
2. Padronizar internamente os eventos recebidos.
3. Implementar validação e autenticação.
4. Criar gerenciamento de sessões.
5. Implementar processamento assíncrono.
6. Criar mecanismo de recuperação.
7. Implementar logs e monitoramento.
8. Garantir isolamento entre empresas.

Após a implementação:

1. Testar conexão.
2. Testar QR Code, quando aplicável.
3. Testar envio de mensagens.
4. Testar recebimento de mensagens.
5. Testar status de entrega.
6. Simular desconexão.
7. Testar reconexão.
8. Testar eventos duplicados.
9. Testar webhook inválido.
10. Validar integração com n8n.

## 12. Critérios de conclusão

A integração somente poderá ser considerada homologada quando:

- A conexão estiver funcional.
- O envio e recebimento de mensagens estiverem comprovados.
- Os eventos estiverem sendo processados corretamente.
- Os status de mensagens forem tratados conforme o provedor.
- As desconexões forem identificadas.
- A recuperação funcionar dentro das limitações do provedor.
- O QR Code funcionar quando aplicável.
- Os webhooks estiverem protegidos.
- Eventos duplicados não causarem efeitos repetidos.
- A integração estiver documentada.
- Os testes tiverem evidências registradas.

## 13. Regra final

A Skill deve desenvolver integrações robustas, independentes de provedor e preparadas para crescimento.

Não presumir que WAHA, Evolution API e Meta Cloud API possuem a mesma arquitetura ou funcionalidades.
Consultar sempre a documentação oficial da versão utilizada.
Priorizar disponibilidade, segurança, rastreabilidade e continuidade operacional.

## 14. Integração Sinérgica com outras Skills

Esta Skill **deve trabalhar obrigatoriamente em conjunto** com:

1. **`security-and-hardening`**:
   - Assegurar mascaramento de tokens e chaves no backend e em telas administrativas.
   - Aplicar validação estrita de assinaturas criptográficas (HMAC sobre corpo bruto) nos webhooks de mensagens e status.
   - Garantir isolamento absoluto entre tenants (empresas) para que eventos do cliente A nunca toquem dados do cliente B.
   - Sanitizar logs e mensagens de erro para nunca registrar tokens ou payloads com dados sensíveis.

2. **`debugging-and-error-recovery`**:
   - Diagnosticar falhas de conexão, queda de containers de instâncias de WhatsApp (WAHA, Evolution API) no Docker/Coolify e problemas de portas (`Connection refused`, `IPv6 vs IPv4`).
   - Coletar a primeira mensagem real de erro nos logs antes de aplicar correções.
   - Validar a recuperação com testes de conectividade e status do healthcheck antes de declarar o serviço restabelecido.

Com essa tríade (**`whatsapp-api-and-webhooks`** + **`security-and-hardening`** + **`debugging-and-error-recovery`**), a IA possui especialização simultânea na integração funcional, nos mecanismos de proteção contra vazamentos/ataques e na recuperação ágil de falhas de infraestrutura.
