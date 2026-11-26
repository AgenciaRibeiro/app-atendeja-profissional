---
name: devops-infrastructure-docker-coolify-vps
description: Gerencia infraestrutura DevOps em VPS utilizando Docker e Coolify, incluindo containers, healthchecks, backups, certificados SSL, monitoramento, segurança e otimização de custos.
---

# DEVOPS & INFRAESTRUTURA — DOCKER, COOLIFY E VPS

## 1. OBJETIVO

Projetar, implementar, manter e otimizar a infraestrutura responsável por executar os sistemas e aplicações em servidores VPS.

Garantir disponibilidade, segurança, desempenho, recuperação de falhas e baixo custo operacional.

A infraestrutura deve ser organizada para permitir:

- Implantação automatizada de aplicações.
- Gerenciamento de containers Docker.
- Orquestração e monitoramento pelo Coolify.
- Verificação automática de saúde dos serviços.
- Backups programados e verificáveis.
- Renovação automática de certificados SSL.
- Monitoramento de recursos da VPS.
- Recuperação de serviços após falhas.
- Controle de consumo de CPU, memória e armazenamento.
- Crescimento sustentável da infraestrutura.

Priorizar soluções eficientes, seguras e econômicas, sem comprometer a confiabilidade.

## 2. DIAGNÓSTICO DA INFRAESTRUTURA

Antes de qualquer alteração, inspecionar o ambiente existente.

Identificar:

- Sistema operacional da VPS.
- Versão do Docker Engine.
- Docker Compose disponível.
- Versão do Coolify.
- Containers em execução.
- Imagens utilizadas.
- Volumes persistentes.
- Redes Docker.
- Portas expostas.
- Domínios configurados.
- Certificados SSL.
- Uso de CPU.
- Uso de memória RAM.
- Espaço disponível em disco.
- Serviços essenciais.
- Rotinas de backup existentes.

Não presumir que a infraestrutura está vazia ou que pode ser reorganizada livremente.

Não remover containers, volumes, redes, imagens ou aplicações sem verificar sua finalidade e dependências.

## 3. GERENCIAMENTO DE CONTAINERS DOCKER

Utilizar Docker e Docker Compose para organizar aplicações e serviços.

### Boas práticas

- Utilizar imagens oficiais ou de fornecedores confiáveis.
- Preferir versões estáveis e controladas.
- Evitar a utilização indiscriminada de `latest`.
- Definir políticas de reinicialização adequadas.
- Utilizar volumes persistentes quando necessário.
- Configurar limites de recursos.
- Separar serviços conforme suas responsabilidades.
- Criar redes internas quando aplicável.
- Evitar exposição pública desnecessária de portas.
- Utilizar variáveis de ambiente protegidas.
- Manter configurações versionadas.
- Evitar containers privilegiados sem justificativa.

### Persistência

Identificar quais serviços precisam preservar dados entre reinicializações.

Exemplos:

- PostgreSQL.
- Redis, quando persistência for necessária.
- Bancos de dados.
- Arquivos enviados por usuários.
- Dados de aplicações.
- Configurações e arquivos operacionais.

Nunca considerar o filesystem interno de um container como armazenamento persistente confiável.

Antes de atualizar ou recriar um container, verificar seus volumes e os dados que serão preservados.

## 4. DOCKER COMPOSE

Manter arquivos Docker Compose organizados e documentados.

Cada serviço deve possuir:

- Nome identificável.
- Imagem e versão controladas.
- Política de reinicialização.
- Variáveis de ambiente necessárias.
- Redes apropriadas.
- Volumes persistentes quando aplicável.
- Limites de recursos quando necessários.
- Healthcheck compatível com o serviço.
- Dependências corretamente definidas.

Utilizar arquivos `.env` protegidos e nunca versionar segredos.

Não duplicar configurações entre Docker Compose e Coolify sem compreender qual ferramenta controla cada serviço.

Evitar conflitos entre configurações gerenciadas manualmente e configurações administradas pelo Coolify.

## 5. HEALTHCHECKS E DISPONIBILIDADE

Implementar verificações automáticas para identificar se cada serviço está realmente funcionando.

Não confundir container em execução com aplicação saudável.

### Healthchecks devem verificar

- Inicialização do processo.
- Disponibilidade da aplicação.
- Resposta do endpoint de saúde.
- Conectividade com dependências essenciais.
- Disponibilidade do banco de dados quando necessário.
- Tempo limite de resposta.
- Quantidade de tentativas.
- Intervalo entre verificações.

### Exemplo conceitual para aplicação HTTP

```yaml
healthcheck:
  test:
    - CMD
    - node
    - -e
    - "fetch('http://127.0.0.1:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 40s
```

O exemplo deve ser adaptado à linguagem, à porta e ao endpoint real da aplicação.

Não utilizar comandos de healthcheck que não existam dentro da imagem do container.

### Endpoints recomendados

Quando aplicável, separar:

`/health`
Verifica se o processo está ativo e consegue responder.

`/ready`
Verifica se a aplicação está preparada para receber solicitações, incluindo dependências essenciais.

Evitar que verificações frequentes executem consultas pesadas ou operações destrutivas.

### Recuperação

- Identificar serviços com falha.
- Coletar logs.
- Verificar dependências.
- Avaliar reinicialização controlada.
- Evitar ciclos infinitos de reinicialização.
- Registrar falhas recorrentes.
- Alertar quando a recuperação automática não funcionar.

Não reiniciar serviços indiscriminadamente sem diagnóstico.

## 6. COOLIFY — GERENCIAMENTO E DEPLOY

Utilizar o Coolify como plataforma de gerenciamento e implantação das aplicações, respeitando a arquitetura existente.

### Responsabilidades

- Cadastrar e gerenciar aplicações.
- Configurar repositórios Git.
- Configurar branches de implantação.
- Gerenciar variáveis de ambiente.
- Configurar domínios.
- Administrar certificados SSL.
- Monitorar deploys.
- Consultar logs.
- Identificar falhas de build.
- Gerenciar serviços Docker.
- Acompanhar o estado das aplicações.

### Deploy seguro

Antes de publicar uma nova versão:

1. Verificar o estado atual da aplicação.
2. Identificar a versão em produção.
3. Validar alterações e dependências.
4. Confirmar as variáveis necessárias.
5. Verificar disponibilidade de recursos.
6. Executar build.
7. Implantar a nova versão.
8. Executar healthchecks.
9. Verificar logs.
10. Confirmar funcionamento dos principais fluxos.

Não considerar um deploy bem-sucedido apenas porque o container iniciou.

### Rollback

Manter condições para retornar a uma versão estável.

Antes de executar rollback:

- Identificar a versão anterior.
- Verificar compatibilidade do banco.
- Avaliar alterações de schema.
- Preservar dados persistentes.
- Verificar se a reversão é segura.

Não executar rollback de banco de dados automaticamente sem avaliar os riscos de perda ou incompatibilidade de dados.

## 7. BACKUPS AUTOMÁTICOS

Implementar uma estratégia de backup para proteger os dados e permitir recuperação em caso de falha.

### Componentes que podem exigir backup

- PostgreSQL.
- Bancos de dados de aplicações.
- Volumes persistentes.
- Arquivos enviados por usuários.
- Configurações essenciais.
- Arquivos Docker Compose.
- Documentação de infraestrutura.
- Configurações necessárias para reconstruir os serviços.

### PostgreSQL

Utilizar ferramentas apropriadas, como `pg_dump`, para gerar backups consistentes.

Considerar:

- Backup lógico.
- Backup físico quando necessário.
- Backup de roles e permissões.
- Backup de objetos e extensões relevantes.
- Compatibilidade entre versões.
- Integridade dos arquivos gerados.

Não copiar simplesmente os arquivos internos de um PostgreSQL em execução como se fossem um backup consistente.

### Política de retenção

Definir uma política configurável, por exemplo:

- Backups diários.
- Retenção diária de 7 dias.
- Retenção semanal de 4 semanas.
- Retenção mensal de 3 meses.

Os períodos devem ser ajustados conforme a criticidade, o volume de dados e o custo de armazenamento.

### Armazenamento

- Não manter a única cópia do backup na própria VPS.
- Utilizar armazenamento externo ou outro destino independente.
- Proteger os arquivos com criptografia.
- Restringir permissões de acesso.
- Evitar exposição por URLs públicas.
- Monitorar o espaço disponível.
- Registrar data, tamanho e resultado de cada execução.

Quando possível, aplicar a estratégia 3-2-1:

- Três cópias dos dados.
- Duas mídias ou meios de armazenamento diferentes.
- Uma cópia externa ao ambiente principal.

### Verificação de backups

Um backup somente será considerado válido após:

1. Confirmar que o processo terminou sem erros.
2. Verificar se o arquivo existe.
3. Conferir seu tamanho.
4. Validar sua integridade.
5. Realizar testes periódicos de restauração em ambiente isolado.

Nunca executar testes de restauração diretamente sobre o banco de produção.

### Recuperação

Documentar procedimentos para:

- Restaurar banco de dados.
- Recuperar arquivos.
- Reconstruir containers.
- Recuperar configurações.
- Reestabelecer domínios e serviços.
- Validar integridade após a recuperação.

Definir objetivos de recuperação:

**RPO:** quantidade máxima de dados que a empresa aceita perder em determinado incidente.

**RTO:** tempo máximo desejado para restabelecer o serviço.

Esses objetivos devem ser definidos conforme a criticidade do sistema.

## 8. SSL, HTTPS E CERTIFICADOS AUTOMÁTICOS

Garantir comunicação criptografada entre usuários e aplicações.

Utilizar os recursos de gerenciamento de certificados do Coolify quando compatíveis com a configuração de domínio e proxy.

### Requisitos

- HTTPS habilitado nos domínios públicos.
- Certificados válidos.
- Renovação automática.
- Redirecionamento HTTP para HTTPS.
- Verificação de validade.
- Monitoramento de falhas de renovação.
- Configuração adequada de DNS.
- Portas necessárias disponíveis.
- Proteção das chaves privadas.

### Certificados

Utilizar autoridades certificadoras confiáveis, como Let's Encrypt, quando adequado.

Verificar:

- Resolução DNS.
- Acessibilidade dos domínios.
- Configuração do proxy reverso.
- Disponibilidade das portas necessárias.
- Validade dos certificados.
- Funcionamento da renovação automática.

Não armazenar certificados ou chaves privadas em repositórios públicos.

Não desativar a validação TLS para contornar problemas de certificado.

## 9. SEGURANÇA DA VPS

Aplicar medidas de proteção ao servidor.

### Acesso administrativo

- Utilizar autenticação SSH por chave quando possível.
- Restringir acessos administrativos.
- Evitar login root direto quando a arquitetura permitir.
- Utilizar senhas fortes.
- Manter usuários e permissões organizados.
- Restringir portas desnecessárias.
- Utilizar firewall.
- Monitorar tentativas de acesso indevido.

### Atualizações

- Manter sistema operacional atualizado.
- Atualizar Docker e componentes de infraestrutura de forma controlada.
- Avaliar atualizações de segurança.
- Evitar atualizações automáticas que possam interromper serviços críticos.
- Criar backup antes de atualizações de alto impacto.

### Segredos

- Não inserir senhas ou tokens diretamente em arquivos versionados.
- Utilizar variáveis protegidas.
- Restringir acesso aos arquivos de configuração.
- Evitar exposição de segredos em logs.
- Rotacionar credenciais quando necessário.

### Docker

- Evitar containers privilegiados.
- Evitar montagem desnecessária do socket Docker.
- Restringir volumes montados.
- Utilizar redes internas.
- Evitar exposição pública de portas internas.
- Aplicar princípio do menor privilégio.

## 10. MONITORAMENTO DE RECURSOS

Monitorar continuamente a utilização dos recursos da VPS.

### Indicadores

- CPU.
- Memória RAM.
- Swap.
- Espaço em disco.
- I/O de disco.
- Tráfego de rede.
- Containers ativos.
- Reinicializações.
- Uso de armazenamento dos volumes.
- Estado dos bancos de dados.
- Tempo de resposta das aplicações.

### Otimização

- Definir limites de CPU e memória quando apropriado.
- Identificar containers com consumo excessivo.
- Remover imagens não utilizadas com segurança.
- Identificar logs excessivamente grandes.
- Aplicar rotação de logs.
- Evitar serviços duplicados.
- Revisar processos desnecessários.
- Avaliar a necessidade real de cada container.

Não reduzir recursos de serviços críticos sem medir o impacto.

Não executar limpeza agressiva de volumes Docker.

Comandos como `docker system prune --volumes` exigem análise e autorização, pois podem remover dados persistentes.

## 11. LOGS E DIAGNÓSTICO

Centralizar ou organizar logs para facilitar investigação de falhas.

Analisar:

- Logs de aplicações.
- Logs de containers.
- Logs do Docker.
- Logs de proxy.
- Logs de banco de dados.
- Logs de deploy.
- Logs de backup.
- Eventos do sistema operacional.

Implementar rotação e retenção para evitar que os logs consumam todo o armazenamento.

Não registrar senhas, tokens, chaves privadas ou dados pessoais desnecessários.

Quando ocorrer uma falha:

1. Identificar o serviço afetado.
2. Consultar logs.
3. Verificar dependências.
4. Avaliar recursos disponíveis.
5. Identificar a causa provável.
6. Aplicar correção controlada.
7. Validar a recuperação.
8. Documentar o incidente.

## 12. AUTOMAÇÕES OPERACIONAIS

Criar rotinas automatizadas para reduzir tarefas manuais e prevenir incidentes.

Exemplos:

- Verificação periódica de saúde dos serviços.
- Monitoramento de espaço em disco.
- Execução programada de backups.
- Verificação da integridade dos backups.
- Monitoramento de certificados SSL.
- Alertas de indisponibilidade.
- Limpeza controlada de arquivos temporários.
- Relatórios periódicos de infraestrutura.

Utilizar cron, systemd timers, automações do Coolify ou ferramentas adequadas à arquitetura existente.

Evitar criar múltiplos mecanismos para executar a mesma rotina sem necessidade.

Todas as automações devem gerar registros de execução e permitir identificar falhas.

## 13. MONITORAMENTO CENTRALIZADO E ALERTAS INTELIGENTES

Implementar uma estrutura centralizada de monitoramento da VPS e dos serviços hospedados, permitindo identificar falhas, antecipar problemas e notificar os responsáveis automaticamente.

O monitoramento deve contemplar infraestrutura, aplicações, banco de dados, backups, certificados SSL e disponibilidade dos serviços.

### 13.1 Indicadores monitorados

Monitorar continuamente:

- Disponibilidade da VPS.
- Uso de CPU.
- Uso de memória RAM e Swap.
- Espaço disponível em disco.
- Estado dos containers Docker.
- Reinicializações inesperadas.
- Disponibilidade do PostgreSQL.
- Disponibilidade das aplicações.
- Respostas dos endpoints de saúde.
- Execução e integridade dos backups.
- Validade dos certificados SSL.
- Falhas de deploy.
- Erros críticos nos serviços.

### 13.2 Sistema de alertas

Implementar notificações automáticas para os responsáveis pela infraestrutura.

Priorizar integração com Telegram e, quando apropriado, WhatsApp.

Classificar os alertas por gravidade:

**CRÍTICO**
- VPS indisponível.
- Banco de dados fora do ar.
- Aplicação principal indisponível.
- Falha grave de armazenamento.
- Backup crítico não executado.
- Suspeita de comprometimento da infraestrutura.

**ATENÇÃO**
- Uso elevado de CPU.
- Memória RAM próxima do limite.
- Disco próximo da capacidade máxima.
- Container reiniciando repetidamente.
- Certificado SSL próximo do vencimento.
- Falhas recorrentes em serviços secundários.

**INFORMATIVO**
- Backup concluído.
- Deploy concluído.
- Serviço recuperado.
- Certificado renovado.
- Rotina de manutenção executada.

### 13.3 Regras de notificação

- Enviar alertas somente quando houver condições relevantes.
- Evitar notificações repetidas para o mesmo incidente.
- Implementar deduplicação e controle de frequência.
- Registrar horário de início e recuperação.
- Informar o serviço afetado.
- Informar a gravidade.
- Apresentar uma descrição objetiva do problema.
- Informar a ação recomendada.
- Enviar notificação de recuperação quando o serviço voltar ao normal.

### 13.4 Monitoramento de backups

Criar verificações específicas para identificar:

- Backup não iniciado.
- Backup interrompido.
- Backup com erro.
- Arquivo ausente.
- Tamanho inesperadamente reduzido.
- Falha na transferência para armazenamento externo.
- Falha na verificação de integridade.

Não considerar um backup válido somente porque um arquivo foi gerado.

### 13.5 Monitoramento de certificados SSL

Verificar periodicamente:

- Validade dos certificados.
- Domínios associados.
- Prazo restante até o vencimento.
- Estado da renovação automática.

Configurar alertas preventivos, por exemplo, quando faltarem 30, 14 e 7 dias para o vencimento.

### 13.6 Arquitetura recomendada

Avaliar ferramentas adequadas ao tamanho da infraestrutura.

Possibilidades:

- Uptime Kuma: disponibilidade e monitoramento de endpoints.
- Prometheus: coleta de métricas.
- Grafana: visualização de indicadores e dashboards.
- Alertmanager: gerenciamento de alertas.
- n8n: automações e distribuição de notificações.
- Telegram Bot API: envio de alertas.

Não instalar todas as ferramentas automaticamente.

Primeiro avaliar os recursos disponíveis na VPS, o monitoramento já existente e o custo operacional de cada componente.

Priorizar uma arquitetura leve e incremental.

### 13.7 Segurança e confiabilidade

- Não expor dashboards administrativos publicamente sem autenticação.
- Proteger tokens e credenciais.
- Restringir acesso às métricas sensíveis.
- Utilizar conexões criptografadas quando aplicável.
- Evitar incluir senhas e dados privados nas notificações.
- Garantir que a falha do sistema de alertas não comprometa as aplicações monitoradas.
- Registrar incidentes e notificações.

### 13.8 Critérios de homologação

- Os serviços essenciais estão sendo monitorados.
- Os alertas críticos estão funcionando.
- As notificações chegam ao canal configurado.
- Alertas duplicados são controlados.
- Eventos de recuperação são registrados.
- Backups possuem monitoramento independente.
- Certificados SSL possuem alertas preventivos.
- O sistema de monitoramento não compromete os recursos da VPS.

Não declarar o monitoramento concluído antes de executar testes reais de alerta e recuperação.

## 14. OTIMIZAÇÃO DE CUSTOS

A infraestrutura deve ser dimensionada de acordo com a demanda real.

Priorizar:

- Uso eficiente de CPU e memória.
- Redução de containers desnecessários.
- Serviços compartilhados quando houver segurança e justificativa.
- Armazenamento externo econômico para backups.
- Logs com retenção adequada.
- Imagens Docker menores.
- Processos de build eficientes.
- Monitoramento do crescimento de armazenamento.
- Evitar contratação antecipada de recursos não utilizados.

Não economizar eliminando backups, segurança, monitoramento ou redundância necessária.

A redução de custos não pode comprometer a integridade dos dados nem a disponibilidade dos serviços.

## 15. TESTES E HOMOLOGAÇÃO

Antes de considerar uma infraestrutura pronta, executar testes adequados.

### Testes mínimos

1. Inicialização dos containers.
2. Reinicialização controlada da VPS.
3. Funcionamento dos healthchecks.
4. Recuperação de serviços após falha.
5. Disponibilidade das aplicações.
6. Conectividade entre serviços.
7. Persistência dos volumes.
8. Execução de backup.
9. Verificação de integridade do backup.
10. Restauração em ambiente isolado.
11. Renovação ou simulação controlada de validação SSL.
12. Verificação de acesso HTTPS.
13. Monitoramento de recursos.
14. Funcionamento de alertas.
15. Recuperação após falha de deploy.

Testar cenários de falha sem comprometer os serviços de produção.

## 16. REGRAS DE EXECUÇÃO

Antes de realizar qualquer alteração:

1. Inspecionar o ambiente.
2. Identificar serviços e dependências.
3. Verificar o impacto da mudança.
4. Confirmar se existe backup recente.
5. Elaborar plano de execução.
6. Definir procedimento de recuperação.

Durante a execução:

- Trabalhar por etapas.
- Preferir alterações reversíveis.
- Evitar comandos destrutivos.
- Não remover volumes sem autorização.
- Não interromper serviços críticos sem necessidade.
- Não alterar portas sem verificar conflitos.
- Não substituir configurações gerenciadas pelo Coolify sem compreender seus efeitos.
- Documentar mudanças.

Operações de risco elevado, como exclusão de volumes, remoção de bancos, alterações de firewall, mudanças de DNS e reinicializações de serviços críticos, exigem autorização explícita.

## 17. CRITÉRIOS DE CONCLUSÃO

A infraestrutura somente poderá ser considerada homologada quando:

- Os containers estiverem funcionando corretamente.
- Os serviços essenciais possuírem verificações de saúde adequadas.
- Os volumes persistentes estiverem identificados.
- Os deploys estiverem documentados.
- Os backups estiverem automatizados.
- A integridade dos backups estiver sendo verificada.
- A restauração tiver sido testada.
- Os certificados SSL estiverem válidos.
- A renovação automática estiver configurada.
- Os recursos da VPS estiverem sendo monitorados.
- Os logs possuírem retenção adequada.
- Os procedimentos de recuperação estiverem documentados.
- Não existirem exposições desnecessárias de portas ou credenciais.

Ao concluir, apresentar relatório contendo:

1. Arquitetura da infraestrutura.
2. Containers e serviços gerenciados.
3. Recursos utilizados.
4. Healthchecks implementados.
5. Rotinas de backup.
6. Destino e retenção dos backups.
7. Evidências de testes de restauração.
8. Domínios e certificados configurados.
9. Monitoramento e alertas.
10. Problemas identificados.
11. Melhorias implementadas.
12. Pendências e recomendações.

## 18. DIRETRIZ FINAL

A infraestrutura deve ser confiável, econômica, segura e fácil de manter.

O objetivo não é apenas manter containers em execução, mas garantir que os sistemas permaneçam disponíveis, que os dados estejam protegidos e que falhas possam ser identificadas e recuperadas com previsibilidade.

Priorizar sempre:

**Disponibilidade → Integridade dos dados → Segurança → Recuperação → Eficiência de custos.**
