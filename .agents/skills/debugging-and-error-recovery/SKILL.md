---
name: debugging-and-error-recovery
description: >-
  Diagnostica e orienta a recuperação de falhas de build no Coolify, problemas
  de portas e falhas de healthcheck em containers Docker, com foco em evidências,
  segurança e mudanças controladas. Use SEMPRE que houver falha de deploy no
  Coolify, container caindo ou reiniciando, status 'unhealthy', porta bloqueada
  ou inacessível, erro no Dockerfile, logs de erro em produção ou falha de build.
---

# Skill: Debugging and Error Recovery

## 1. Objetivo

Identificar rapidamente a causa raiz de falhas de infraestrutura e
implantação, especialmente:

-   Builds e deploys com erro no Coolify.
-   Portas inacessíveis, ocupadas ou incorretamente publicadas.
-   Containers Docker que encerram, reiniciam ou ficam indisponíveis.
-   Healthchecks que falham ou mantêm serviços como unhealthy.
-   Problemas de configuração, variáveis de ambiente, rede, volumes e
    dependências.

A prioridade é diagnosticar com evidências antes de alterar
configurações. Não mascarar sintomas com reinicializações ou mudanças
aleatórias.

## 2. Princípios obrigatórios

1.  **Diagnosticar antes de modificar:** coletar logs, estado e
    configuração relevante antes de propor correções.
2.  **Uma hipótese por vez:** relacionar cada hipótese a uma evidência e
    a um teste que possa confirmá-la ou descartá-la.
3.  **Preservar dados:** não remover containers, volumes, imagens,
    bancos ou diretórios persistentes sem autorização explícita e plano
    de recuperação.
4.  **Mudanças mínimas:** corrigir a causa identificada com a menor
    alteração possível.
5.  **Validar depois da correção:** executar testes que comprovem a
    recuperação, não apenas observar que o container iniciou.
6.  **Não inventar resultados:** distinguir claramente fatos observados,
    hipóteses e informações ainda não verificadas.
7.  **Respeitar o ambiente:** considerar versões, arquitetura, rede,
    proxy reverso e particularidades da instalação antes de aplicar
    comandos.

## 3. Fluxo inicial de diagnóstico

Ao receber um relato de falha:

1.  Identificar o serviço, projeto, ambiente e horário aproximado em que
    o problema começou.
2.  Determinar se a falha ocorre no build, durante a inicialização ou
    após o serviço entrar em execução.
3.  Verificar o estado do serviço no Coolify e do container no Docker.
4.  Consultar logs do build e logs de execução, conforme a etapa em que
    ocorreu a falha.
5.  Inspecionar configuração de portas, healthcheck, variáveis de
    ambiente, volumes e redes.
6.  Formular a causa mais provável e indicar a evidência que a sustenta.
7.  Propor um teste de baixo risco antes de qualquer alteração.
8.  Aplicar a correção somente com autorização quando houver impacto
    operacional ou risco de perda de dados.
9.  Revalidar o serviço e registrar o resultado.

## 4. Diagnóstico de builds no Coolify

### 4.1 Coleta de evidências

Inspecionar:

-   Logs completos do build, especialmente a primeira mensagem de erro
    real.
-   Etapa em que a falha ocorre: clone, instalação de dependências,
    compilação, criação da imagem ou publicação.
-   Repositório, branch, commit e diretório-base utilizados.
-   Dockerfile, arquivo de build e configuração de build pack, conforme
    aplicável.
-   Versões de runtime, gerenciador de pacotes e dependências.
-   Scripts de build e comandos de inicialização.
-   Variáveis de ambiente necessárias durante o build, sem expor seus
    valores secretos.
-   Disponibilidade de memória, CPU e espaço em disco do host.

### 4.2 Causas comuns a investigar

-   Comando de build incorreto ou ausente.
-   Diretório-base ou caminho do Dockerfile incorreto.
-   Dependência não declarada ou incompatibilidade de versões.
-   Lockfile ausente, inconsistente ou incompatível com o gerenciador
    utilizado.
-   Variável de ambiente obrigatória ausente.
-   Erro de compilação no código da aplicação.
-   Falha de acesso ao repositório ou ao registry.
-   Falta de memória, disco ou recursos durante o build.
-   Configuração incorreta de build args ou secrets.
-   Diferença entre ambiente local e ambiente de produção.

### 4.3 Método de correção

-   Localizar a primeira falha relevante; erros posteriores podem ser
    apenas consequência.
-   Reproduzir o build localmente, quando viável, usando as mesmas
    versões e configurações não secretas.
-   Corrigir somente o item confirmado.
-   Evitar atualizar todas as dependências como tentativa genérica de
    resolver o problema.
-   Não inserir credenciais em Dockerfile, argumentos persistentes, logs
    ou commits.
-   Após a correção, acompanhar um novo build e confirmar a publicação e
    inicialização.

## 5. Diagnóstico de portas bloqueadas ou inacessíveis

### 5.1 Verificações

Determinar:

-   Qual porta a aplicação realmente escuta dentro do container.
-   Qual porta está publicada no host.
-   Se o mapeamento segue o formato correto `HOST:CONTAINER`.
-   Se a aplicação escuta em `0.0.0.0` quando precisa aceitar conexões
    externas ao próprio container.
-   Se outra aplicação já ocupa a porta do host.
-   Se firewall, regras de rede, proxy reverso ou provedor bloqueiam o
    acesso.
-   Se o serviço está conectado à rede Docker esperada.
-   Se o domínio e o proxy apontam para o serviço e a porta corretos.

### 5.2 Comandos de inspeção

Usar apenas quando compatíveis com o ambiente e com as permissões
disponíveis:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker port NOME_DO_CONTAINER
docker inspect NOME_DO_CONTAINER
docker logs --tail 200 NOME_DO_CONTAINER
```

Em host Linux, para inspecionar portas em escuta:

```bash
ss -lntup
```

Para testar uma conexão HTTP local, se houver endpoint apropriado:

```bash
curl -i --max-time 10 http://127.0.0.1:PORTA/ENDPOINT
```

Substituir os marcadores pelos valores confirmados. Não presumir porta
ou endpoint padrão sem verificar a configuração.

### 5.3 Cuidados

-   Não abrir portas publicamente apenas para testar sem avaliar
    exposição e firewall.
-   Não alterar regras de firewall, proxy ou publicação de portas sem
    identificar o impacto.
-   Não encerrar processos que ocupam uma porta sem identificar a
    aplicação responsável.
-   Preferir testes locais e internos antes de expor o serviço à
    internet.
-   Verificar se o serviço deve ser acessado pelo proxy do Coolify, por
    uma rede Docker interna ou diretamente pelo host.

## 6. Diagnóstico de healthcheck no Docker

### 6.1 Inspeção

Verificar:

-   Estado do container: `running`, `exited`, `restarting` ou
    `unhealthy`.
-   Comando configurado no healthcheck.
-   Intervalo, timeout, período inicial e número de tentativas.
-   Código de saída e saída do teste mais recente.
-   Logs da aplicação no mesmo intervalo.
-   Porta e endpoint usados pelo healthcheck.
-   Dependências necessárias para a aplicação responder.
-   Se a ferramenta usada no teste existe dentro da imagem.

Comandos úteis:

```bash
docker ps
docker inspect --format='{{json .State.Health}}' NOME_DO_CONTAINER
docker logs --tail 200 NOME_DO_CONTAINER
```

Se o container não tiver healthcheck configurado, o campo de saúde
poderá estar ausente. Não interpretar essa ausência como falha ou
sucesso do serviço.

### 6.2 Causas comuns

-   Endpoint de healthcheck incorreto.
-   Porta interna diferente da esperada.
-   Aplicação escutando apenas em `127.0.0.1` quando deveria aceitar
    conexões na interface adequada.
-   Healthcheck executado antes de a aplicação estar pronta.
-   Timeout muito curto ou intervalo inadequado.
-   Comando de teste inexistente na imagem.
-   Dependência externa indisponível.
-   Aplicação iniciou, mas não concluiu a inicialização.
-   Resposta HTTP diferente da faixa esperada pelo teste.

### 6.3 Recuperação

-   Testar o endpoint manualmente dentro do container ou a partir da
    rede Docker apropriada.
-   Comparar o comando de healthcheck com o processo e a porta reais.
-   Ajustar caminho, comando ou temporização apenas quando a causa
    estiver confirmada.
-   Não aumentar timeouts indefinidamente para esconder uma aplicação
    que não inicializa.
-   Após a mudança, verificar a transição para `healthy` e testar também
    a funcionalidade real do serviço.

## 7. Diagnóstico complementar de containers

Quando necessário, verificar:

### Estado e reinicializações

```bash
docker ps -a
docker inspect NOME_DO_CONTAINER
docker logs --since 30m --tail 300 NOME_DO_CONTAINER
```

Investigar código de saída, motivo de encerramento, política de restart
e mensagens de erro.

### Recursos do host

```bash
docker stats --no-stream
df -h
free -h
```

Executar os comandos disponíveis no sistema. Se algum utilitário não
existir, registrar a limitação em vez de presumir o resultado.

### Redes e volumes

```bash
docker network ls
docker inspect NOME_DO_CONTAINER
docker volume ls
```

Inspecionar conectividade, aliases, redes anexadas, montagens e
permissões. Nunca remover ou recriar volumes como primeira tentativa de
recuperação.

## 8. Segurança e operações de risco

As operações abaixo exigem avaliação de impacto e autorização explícita
antes da execução:

-   Reiniciar serviços críticos ou o próprio Docker.
-   Recriar, remover ou substituir containers.
-   Remover imagens, redes ou volumes.
-   Executar `docker system prune`, `docker volume prune` ou comandos
    equivalentes.
-   Alterar firewall, regras de rede, DNS ou proxy reverso.
-   Modificar variáveis de ambiente, secrets ou credenciais de produção.
-   Alterar configurações globais do Coolify.
-   Fazer deploy, rollback ou migração de dados.

Antes de uma operação de risco:

1.  Explicar o motivo e o impacto esperado.
2.  Identificar os serviços e dados potencialmente afetados.
3.  Confirmar a existência de backup ou plano de recuperação quando
    houver risco aos dados.
4.  Apresentar o comando ou a alteração proposta.
5.  Aguardar autorização explícita.
6.  Registrar o resultado real após a execução.

Nunca executar comandos destrutivos por tentativa e erro.

## 9. Formato obrigatório do relatório de diagnóstico

Apresentar resultados de forma objetiva:

### Resumo
-   Serviço afetado:
-   Ambiente:
-   Sintoma:
-   Impacto observado:

### Evidências
-   Estado do container:
-   Mensagem de erro relevante:
-   Logs consultados:
-   Portas e redes verificadas:
-   Healthcheck:
-   Recursos do host:

### Diagnóstico
-   Causa confirmada ou hipótese principal:
-   Evidência que sustenta a conclusão:
-   Outras hipóteses ainda não descartadas:

### Plano de recuperação
-   Ação recomendada:
-   Risco e impacto:
-   Necessidade de autorização:
-   Plano de reversão, quando aplicável:

### Validação
-   Testes executados:
-   Resultado observado:
-   Estado final:
-   Pendências:

Não marcar como resolvido quando apenas o container estiver em execução.
Confirmar também disponibilidade, resposta do endpoint e funcionamento
esperado da aplicação.

## 10. Critérios de conclusão

Uma ocorrência só pode ser declarada resolvida quando:

-   A causa foi identificada ou a limitação do diagnóstico foi
    claramente registrada.
-   A correção foi aplicada de forma controlada e autorizada, quando
    necessário.
-   O build foi concluído, se esse era o problema.
-   O container permanece estável e sem reinicializações inesperadas.
-   As portas e rotas necessárias estão acessíveis pelo caminho
    previsto.
-   O healthcheck está saudável, quando configurado.
-   O endpoint ou fluxo funcional foi testado.
-   Não houve perda de dados nem exposição indevida de serviços.
-   O relatório registra evidências, alterações e pendências.

**Regra final:** não confundir reiniciar com corrigir. A recuperação
deve eliminar ou controlar a causa raiz e ser comprovada por testes
verificáveis.
