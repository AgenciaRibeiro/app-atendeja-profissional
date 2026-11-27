# Relatório de Reconhecimento Inicial e Linha de Base — Etapa 00

> **Projeto:** AtendeJá Profissional  
> **Branch de Trabalho:** `governance/autonomia-auditoria-corretiva`  
> **Commit Base:** `17dd355a9301dcbc40c61dd99e031663d3b542a6`  
> **Data de Execução:** 2026-11-26  
> **Responsável Técnico:** Agente IA sob governança de JR (Proprietário do Produto)  
> **Status da Etapa 00:** Concluída para avaliação de JR  

---

## 1. Linha de Base Atualizada

- **Repositório Oficial:** `https://github.com/AgenciaRibeiro/app-atendeja-profissional.git`
- **Branch Ativa:** `governance/autonomia-auditoria-corretiva`
- **Commit HEAD:** `17dd355` — *docs(operations): record governance structure verification*
- **Sincronização com Remoto:** Atualizado (0 commits à frente, 0 atrás de `origin/governance/autonomia-auditoria-corretiva`). Árvore de trabalho limpa.
- **Relação com a Branch `main`:** A branch de trabalho descende diretamente de `main` (`56e647f`). A PR draft aberta para merge é a #1 (`https://github.com/AgenciaRibeiro/app-atendeja-profissional/pull/1`).
- **Validação de Código e Sintaxe Local:** Todos os 12 arquivos JavaScript do projeto foram validados com `node --check` sem nenhum erro de sintaxe. Não foram encontradas credenciais reais versionadas no histórico do Git.
- **Ambiente de Testes Autorizado:** Conforme decisão explícita de JR, não há ambiente de homologação/staging remoto isolado confirmado. Toda validação técnica da missão corretiva deve ocorrer estritamente em ambiente local com dados sintéticos.

---

## 2. Evidências Coletadas

1. **Integridade de Código vs. Produção:**
   - Foi realizada a verificação criptográfica (hash SHA-256 e git blob hash) dos arquivos estáticos servidos no domínio público de produção `https://atendeja.minhaempresaautonoma.online/` (`index.html`, `checkout.js`, `app.js`, `dashboard.js`, `admin.js`, `config.js`, `styles.css`, `sw.js`).
   - **Resultado:** Os arquivos em produção correspondem exatamente aos blobs do commit HEAD (`17dd355`).
2. **Proteção de Arquivos Sensíveis em Produção:**
   - Requisições diretas a `/server.js`, `/.env`, `/data/admin_api_connections.json`, `/data/landing_page_config.json`, `/db/supabase_control_plane.sql` e `/package.json` retornaram status HTTP `404 Not Found`, confirmando a barreira imposta pela função `serveStatic` no backend.
3. **Comportamento do Endpoint `/api/health`:**
   - Responde com HTTP `200 OK` e corpo `{"ok":true,"supabaseConfigured":true,"postgresConfigured":true}`.
   - Análise estática do código (`server.js`, linha 1121) demonstrou que essa rota apenas avalia se as variáveis de ambiente estão preenchidas (`Boolean(...)`), sem executar verificação ativa de conectividade (`SELECT 1` no pool ou ping no Supabase).
4. **Domínio Alternativo:**
   - `https://www.atendeja.minhaempresaautonoma.online` falha na resolução de DNS (`Could not resolve host`), operando apenas o domínio sem `www`.
5. **Inconsistências Documentais Internas:**
   - `docs/execucao-ia/ESTADO_ATUAL.md` cita "aguardando início da Etapa 00", enquanto `docs/execucao-ia/FILA_DE_ETAPAS.md` registra "EM_ANDAMENTO". A autorização expressa de JR desta data iniciou formalmente a Etapa 00.
   - `docs/auditoria-corretiva/08_HISTORICO_DE_ALTERACOES.md` continha marcações provisórias ("Preencher"), enquanto o `REGISTRO_DE_EXECUCAO.md` já havia registrado o commit `e872ef4`.

---

## 3. Estado dos Serviços

| Serviço | Domínio / Porta | Estado Observado | Evidência / Observação |
|---|---|---|---|
| Aplicação Web (Produção) | `https://atendeja.minhaempresaautonoma.online` | OPERACIONAL (HTTP 200) | Responde requisições públicas; certificado SSL Let's Encrypt ativo. |
| Domínio WWW | `https://www.atendeja.minhaempresaautonoma.online` | INACESSÍVEL | Erro de DNS (registro CNAME/A ausente para www). |
| API Backend | Rota `/api/health` | RESPONDENDO (HTTP 200) | Indica variáveis de Supabase e Postgres configuradas. Liveness ativo; readiness dependente de refatoração. |
| Host VPS / Coolify (LAN) | `192.168.1.11:22` | INALCANÇÁVEL LOCALMENTE | Timeout de conexão SSH da máquina local. O acesso remoto direto não está disponível a partir deste runner. |
| Supabase Control Plane | `kunpzzmubfvzmweyxfjp.supabase.co` | CONFIGURADO EM PROD | Referenciado no `.env.example`, `server.js` e `db/README.md`. |
| n8n Webhook Gateway | `n8nweb.minhaempresaautonoma.online` | CONFIGURADO NO FRONTEND | Endpoint `/webhook/atendeja/criar-checkout` definido em `config.js`. |

---

## 4. Situação dos Volumes e Backups

1. **Volumes Persistentes no Container:**
   - A inspeção do `Dockerfile` confirmou que **não há diretiva `VOLUME` declarada**.
   - No `server.js` (linhas 516 e 607), os arquivos `admin_api_connections.json` e `landing_page_config.json` são lidos e gravados no diretório local `./data/`.
   - Se o container no Coolify for recriado sem um bind mount ou volume persistente explicitamente configurado na interface do Coolify para `/app/data`, **todas as chaves de API e configurações de landing page serão perdidas a cada novo deploy**.
2. **Rotinas de Backup:**
   - Não há rotinas de backup, scripts de `pg_dump` ou automações versionadas no repositório.
   - O plano em `docs/auditoria-corretiva/06_PLANO_BACKUP_E_RECUPERACAO.md` e o histórico anterior apontam ausência de backups programados no Coolify.
   - **Bloqueio Mantido:** Nenhuma alteração destrutiva ou migração em produção poderá ser realizada sem a prévia configuração e teste de restauração de backup do PostgreSQL.

---

## 5. Confirmação das Condições de Isolamento

- **Isolamento de Produção:** Nenhuma credencial de produção foi alterada, nenhum workflow do n8n foi disparado, nenhuma transação financeira ou mensagem de WhatsApp real foi emitida.
- **Ambiente de Testes:** Todas as validações funcionais das etapas subsequentes deverão ser executadas exclusivamente de forma local (`localhost`), utilizando mocks, fixtures de dados sintéticos ou instâncias de banco temporárias criadas estritamente para teste.
- **Isolamento de Contexto:** Não foram utilizadas nem referenciadas quaisquer informações ou credenciais pertencentes a outros projetos (incluindo ID LINK ou servidores alheios).

---

## 6. Reclassificação dos 15 Achados Preliminares

Com base na inspeção estática aprofundada do código-fonte, dos schemas SQL e das verificações públicas de rede, os 15 achados preliminares do relatório `01_RELATORIO_AUDITORIA_COMPLETA.md` foram reclassificados:

| # | Achado Preliminar | Classificação na Etapa 00 | Evidência Técnica Identificada |
|---|---|:---:|---|
| 01 | **Divergência de Preços dos Planos** | **ATUAL** | `checkout.js` define R$ 1,00 para teste em produção (confirmado por JR); `index.html` e `docs` exibem 49/97/197; preços comerciais finais definidos por JR são 197/197/397. |
| 02 | **Erro SQL Próximo a `undefined`** | **ATUAL** | O SQL puro não contém a palavra `undefined`. No entanto, `server.js` (linha 172) possui um `ReferenceError` em runtime (`entry` fora de escopo dentro de `readRawBody`), e a geração dinâmica de query em `planning_goals` (linha 423) pode interpolar parâmetros indefinidos se o payload for incompleto. |
| 03 | **Ausência de Backups Agendados** | **ATUAL** | Inexistência de rotinas de backup ou scripts versionados; servidor inalcançável via SSH; backup com restauração testada segue como pendência bloqueante. |
| 04 | **Falta de Persistência em Disco para Dados Locais** | **ATUAL** | `Dockerfile` não define volumes; pasta `data/` armazena conexões de API em JSON e depende de bind mount manual no Coolify para não ser apagada em deploys. |
| 05 | **Workflow de Pagamentos / n8n** | **ATUAL** | O checkout faz polling para o n8n (`status-pagamento`), enquanto o backend possui webhook próprio (`/api/webhooks/mercadopago`). Falta comprovação de ciclo de vida completo integrado. |
| 06 | **Falha de Revogação em Refund e Chargeback** | **ATUAL** | **Comprovado no SQL:** em `supabase_control_plane.sql` (linha 417), a função `process_payment_event` ignora novos status se já estiver `approved` (`CASE WHEN status = 'approved' AND p_status <> 'approved' THEN status ELSE p_status END`). Não há revogação de `subscription_status` em caso de estorno/contestação. |
| 07 | **Webhook HMAC e Ausência de Replay Protection** | **ATUAL** | Validação HMAC sobre corpo bruto existe e usa `crypto.timingSafeEqual` (`server.js`, linha 1065), mas não há verificação de timestamp contra replay attacks. |
| 08 | **Rate Limiting em Memória e Falha de Escopo** | **ATUAL** | `limiter` é um `Map` volátil em memória. A linha 172 de `server.js` tenta aplicar limite por plano mas falha ao referenciar `entry` indefinida. |
| 09 | **Segredos de IA em Texto Plano no Disco** | **ATUAL** | `writeApiConnections` salva chaves de OpenAI, Groq, Gemini em `data/admin_api_connections.json` em JSON sem criptografia em repouso. |
| 10 | **Vulnerabilidade SSRF em Provedor OpenCode** | **ATUAL** | `validateEndpointUrl` protege conexões gerais de API, mas `testProviderConnection` (`server.js`, linha 670) aceita parâmetro `baseUrl` sem validação contra IPs privados/locais. |
| 11 | **Healthcheck Passivo (Sem Teste de Dependências)** | **ATUAL** | `/api/health` retorna `200 OK` apenas checando presença de strings de configuração, sem testar conectividade real com PostgreSQL ou Supabase. |
| 12 | **Ausência de Testes Automatizados** | **ATUAL** | `package.json` possui apenas o script `"start": "node server.js"`. Não há suíte de testes unitários ou de integração. |
| 13 | **Divergências na Documentação** | **ATUAL** | `README.md` exibe versão 2.0.0 e badge de 95% de testes; `package.json` está na 1.0.0 e sem testes. |
| 14 | **Fluxos Demonstrativos e Fallbacks** | **ATUAL** | `executeAiChat` gera respostas estáticas baseadas em regex quando não há API Key configurada. Leads `demo-*` são injetados localmente no dashboard. |
| 15 | **Instabilidade e Deploys Anteriores da Infra** | **PENDENTE DE EVIDÊNCIA** | O endpoint público responde de forma estável (HTTP 200), mas logs internos de crashes passados no Coolify e reinícios do PostgreSQL não puderam ser extraídos devido à inacessibilidade da porta SSH local. |

---

## 7. Riscos Identificados

1. **Risco Crítico de Segurança (SSRF):** A rota de teste de conexão com o provedor OpenCode permite envio de URLs arbitrárias sem filtro de rede interna.
2. **Risco Crítico de Negócio (Inadimplência/Fraude):** A lógica SQL atual de pagamentos não revoga o acesso caso uma assinatura sofra chargeback ou reembolso no Mercado Pago.
3. **Risco Operacional de Perda de Dados:** Se a aplicação for recriada no Coolify sem volume para `/app/data`, credenciais de provedores e configurações da landing page serão resetadas.
4. **Risco de Falso Positivo no Monitoramento:** O healthcheck atual não detecta queda do banco de dados, mantendo o container com status "healthy" mesmo se o banco estiver fora do ar.

---

## 8. Pendências e Bloqueios

- **Bloqueio Ativo para Produção:** Nenhuma alteração destrutiva, reset de dados ou aplicação de migration pode ser feita em produção sem backup prévio e ambiente de homologação validado.
- **Pendência Técnica para a Etapa 01:** Montar ambiente local com banco PostgreSQL sintético para reproduzir e auditar minuciosamente os arquivos SQL (`postgres_clientes.sql` e `supabase_control_plane.sql`).

---

## 9. Critérios de Aceite da Etapa 00

| Critério de Aceite | Status | Justificativa / Evidência |
|---|:---:|---|
| Linha de base técnica e documental atualizada | **ATENDIDO** | Branch, commit, hashes e integridade verificados contra produção. |
| Riscos classificados | **ATENDIDO** | Riscos de SSRF, revogação de pagamento, persistência e healthcheck detalhados. |
| Ambiente seguro identificado | **ATENDIDO** | Delimitado exclusivamente para ambiente local com dados sintéticos (zero impacto em prod). |
| 15 achados preliminares reclassificados | **ATENDIDO** | 14 classificados como ATUAL com evidências de código; 1 como PENDENTE DE EVIDÊNCIA. |
| Zero alterações em produção | **ATENDIDO** | Somente leituras públicas executadas; nenhum dado ou serviço foi alterado. |

---

## 10. Recomendação para a Próxima Etapa

Com todos os critérios de aceite da Etapa 00 comprovados e documentados, a recomendação técnica é:

1. **Aprovação da Etapa 00 por JR.**
2. **Autorização para a Etapa 01 — Integridade PostgreSQL e Migrações:**
   - **Foco da Etapa 01:** Analisar a fundo a sintaxe, ordem de execução, idempotência e políticas RLS de `postgres_clientes.sql` e `supabase_control_plane.sql`.
   - **Ambiente:** Execução estritamente local em container ou instância isolada de teste com dados sintéticos, sem tocar no PostgreSQL de produção.
   - **Correção da função de pagamentos:** Planejar a adequação da função `process_payment_event` para suportar corretamente os estados de `refunded` e `charged_back` com suspensão de acesso, conforme as regras de negócio de JR.
