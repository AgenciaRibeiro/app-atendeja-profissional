---
name: onboarding-sem-atrito-zero-friction
description: Projeta e implementa processo de onboarding sem atrito em 2 a 3 etapas, com cadastro simplificado, conexão automática de WhatsApp por QR Code e isolamento multi-tenant nos bastidores.
---

# SKILL — ONBOARDING SEM ATRITO (ZERO FRICTION)

## 1. OBJETIVO

Projetar e implementar um processo de onboarding (primeiro acesso e configuração inicial) extremamente simples, rápido e intuitivo.

O usuário deve conseguir criar sua conta, cadastrar sua empresa ou atividade profissional e conectar seu WhatsApp em no máximo 2 ou 3 etapas principais.

O princípio central é:

**O profissional deve conseguir começar a utilizar o sistema sem precisar entender tecnologia, APIs, servidores, webhooks ou configurações técnicas.**

O sistema deve fazer o trabalho técnico nos bastidores.

## 2. PRINCÍPIOS DE EXPERIÊNCIA

- Simplicidade acima de complexidade.
- Poucos campos e etapas.
- Linguagem acessível e sem jargões técnicos.
- Interface mobile-first.
- Orientações claras e objetivas.
- Feedback visual imediato.
- Configuração automática sempre que possível.
- Solicitar somente informações realmente necessárias.
- Não exigir conhecimentos técnicos do usuário.
- Permitir que o usuário retome um cadastro interrompido.

Evitar formulários extensos, configurações avançadas durante o primeiro acesso e solicitações repetitivas de informações.

## 3. FLUXO DE ONBOARDING

O onboarding deve ser organizado em até três etapas principais.

### ETAPA 1 — CRIAR CONTA

Solicitar somente os dados essenciais:

- Nome.
- E-mail.
- Senha ou autenticação por método seguro.
- Nome da empresa ou atividade profissional.

Requisitos:
- Validar os campos automaticamente.
- Exibir mensagens de erro compreensíveis.
- Evitar solicitar dados que possam ser preenchidos posteriormente.
- Criar a organização e associar o usuário responsável.
- Garantir isolamento multi-tenant desde a criação da conta.

### ETAPA 2 — CONECTAR WHATSAPP

Apresentar uma opção clara:

**Conectar meu WhatsApp**

A integração deve utilizar o provedor configurado pelo sistema, como WAHA, Evolution API ou Meta Cloud API, conforme a arquitetura homologada.

Quando utilizar uma integração baseada em QR Code:

1. Criar ou solicitar uma sessão de WhatsApp pelo backend.
2. Gerar o QR Code de conexão.
3. Exibir o QR Code na interface.
4. Orientar o usuário a abrir o WhatsApp e acessar a opção de dispositivos conectados.
5. Aguardar a confirmação da conexão.
6. Atualizar automaticamente o status na interface.

O usuário não deve precisar configurar manualmente:
- Endereços de API.
- Webhooks.
- Tokens.
- Chaves de autenticação.
- URLs de servidores.
- Identificadores técnicos de sessão.

Essas configurações pertencem exclusivamente à infraestrutura administrativa.

IMPORTANTE:
A conexão por QR Code deve respeitar as limitações do provedor escolhido. Não prometer compatibilidade universal entre todos os métodos de conexão.

Quando utilizar a Meta Cloud API, implementar o fluxo oficial de autorização e configuração, respeitando as permissões e etapas exigidas pela plataforma.

### ETAPA 3 — FINALIZAÇÃO E PRIMEIRO ACESSO

Após confirmar a conexão:

- Exibir mensagem de sucesso.
- Identificar o número conectado, quando disponibilizado pelo provedor.
- Validar o estado real da sessão no backend.
- Criar as configurações iniciais necessárias.
- Disponibilizar o painel principal.
- Apresentar uma orientação rápida sobre como utilizar o sistema.

Mensagem sugerida:

"Pronto! Seu WhatsApp está conectado. Agora você pode começar a organizar seus atendimentos e aproveitar as oportunidades do seu negócio."

Se houver configurações adicionais, permitir que sejam realizadas posteriormente.

## 4. AUTOMAÇÃO DO PROCESSO

O backend deve executar automaticamente as operações técnicas necessárias.

Responsabilidades:

- Criar a organização e o usuário.
- Associar o usuário ao tenant correto.
- Criar a sessão de WhatsApp.
- Solicitar e armazenar informações de conexão de forma segura.
- Gerenciar QR Codes temporários.
- Receber e validar eventos do provedor.
- Atualizar o estado da conexão.
- Configurar webhooks automaticamente.
- Registrar erros e tentativas.
- Recuperar sessões quando suportado.
- Impedir duplicação de sessões indevidas.

A interface deve consumir apenas endpoints seguros do backend.

Nunca expor credenciais administrativas, tokens de integração ou chaves secretas no frontend.

## 5. ESTADOS VISUAIS DA CONEXÃO

A interface deve apresentar estados claros:

- NÃO CONECTADO.
- PREPARANDO CONEXÃO.
- AGUARDANDO LEITURA DO QR CODE.
- CONECTANDO.
- CONECTADO.
- CONEXÃO EXPIRADA.
- FALHA NA CONEXÃO.
- DESCONECTADO.

Cada estado deve apresentar uma orientação objetiva sobre o que está acontecendo e qual ação o usuário pode realizar.

Não apresentar uma conexão como concluída antes da confirmação real do provedor.

## 6. RECUPERAÇÃO DE ERROS

O onboarding deve prever:

- QR Code expirado.
- Falha na comunicação com o provedor.
- Sessão já existente.
- Número desconectado.
- Falha de autenticação.
- Interrupção durante o cadastro.
- Instabilidade temporária da infraestrutura.

Disponibilizar ações simples:

- Gerar novo QR Code.
- Tentar novamente.
- Verificar conexão.
- Retomar configuração.
- Solicitar ajuda ao suporte.

Evitar mensagens técnicas como stack traces, códigos internos ou erros diretamente provenientes da API.

Registrar detalhes técnicos nos logs internos para facilitar o diagnóstico.

## 7. SEGURANÇA E MULTI-TENANT

A simplicidade do onboarding não pode comprometer a segurança.

Requisitos obrigatórios:

- Cada sessão deve pertencer a uma organização específica.
- Usuários não podem visualizar sessões de outros tenants.
- Todas as operações devem validar autorização no backend.
- Tokens e credenciais devem ser armazenados de forma segura.
- QR Codes devem possuir validade limitada.
- Webhooks devem ter mecanismos de autenticação e validação.
- Eventos devem ser processados com idempotência.
- Operações de conexão e desconexão devem possuir auditoria.
- Não permitir que o frontend escolha livremente identificadores de sessões de outros clientes.

Aplicar políticas de acesso no PostgreSQL/Supabase e validações complementares no backend.

## 8. EXPERIÊNCIA MOBILE-FIRST

A experiência deve funcionar perfeitamente em smartphones.

Prioridades:

- QR Code com tamanho adequado.
- Instruções simples e visuais.
- Botões com área de toque confortável.
- Layout responsivo.
- Carregamento rápido.
- Indicadores de progresso.
- Atualização automática do estado da conexão.
- Não exigir rolagem excessiva.

Quando o usuário estiver acessando o sistema pelo mesmo celular em que utiliza o WhatsApp, apresentar instruções alternativas compatíveis com o método de conexão disponível.

## 9. MÉTRICAS DE ONBOARDING

Monitorar:

- Cadastros iniciados.
- Cadastros concluídos.
- Conexões de WhatsApp iniciadas.
- Conexões concluídas.
- Tempo médio até a primeira conexão.
- Taxa de abandono por etapa.
- Falhas de conexão.
- Tentativas de recuperação.
- Usuários que chegaram ao primeiro atendimento.

Utilizar esses dados para identificar pontos de atrito e melhorar continuamente o processo.

## 10. TESTES OBRIGATÓRIOS

Antes da homologação, testar:

1. Cadastro de um novo usuário.
2. Criação automática da organização.
3. Associação correta do usuário ao tenant.
4. Conexão de WhatsApp com sucesso.
5. Expiração e renovação do QR Code.
6. Falha temporária do provedor.
7. Retomada de onboarding interrompido.
8. Desconexão e reconexão.
9. Isolamento entre organizações.
10. Funcionamento em dispositivos móveis.
11. Proteção das credenciais.
12. Atualização correta dos estados da conexão.

## 11. CRITÉRIOS DE ACEITAÇÃO

A implementação será considerada homologável quando:

- O cadastro puder ser realizado em até três etapas principais.
- O usuário não precisar realizar configurações técnicas manuais.
- A conexão do WhatsApp funcionar com o provedor homologado.
- O estado da conexão refletir a situação real.
- O onboarding puder ser retomado após interrupções.
- A interface funcionar em dispositivos móveis.
- O isolamento multi-tenant estiver validado.
- Credenciais não estiverem expostas no frontend.
- Erros forem tratados com orientações compreensíveis.
- O primeiro acesso ao painel ocorrer sem configurações desnecessárias.

## 12. DIRETRIZ FINAL

O onboarding não deve ensinar o usuário a configurar a tecnologia.

Deve permitir que ele simplesmente informe o necessário, conecte seu WhatsApp e comece a utilizar a solução.

**Menos configurações. Menos etapas. Menos dúvidas. Mais velocidade até o primeiro resultado.**

A tecnologia deve trabalhar nos bastidores para tornar a experiência simples, segura e profissional.
