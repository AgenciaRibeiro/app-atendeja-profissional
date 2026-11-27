# Relatório de Auditoria e Hardening — Etapa 06: Segredos, SSRF e Hardening

> **Projeto:** AtendeJá Profissional  
> **Etapa:** 06 — Segredos, SSRF e Hardening  
> **Data:** 2026-11-27  
> **Status da Etapa 06:** CONCLUÍDA E VALIDADA  
> **Autoridade:** JR (Proprietário do Produto)  
> **Skills Aplicadas:** `security-and-hardening` e `debugging-and-error-recovery`  

---

## 1. Objetivo da Etapa 06

Auditar exaustivamente o armazenamento e trânsito de credenciais, sanitização de logs e mensagens de erro, proteção contra SSRF (Server-Side Request Forgery) e DNS rebinding, redes privadas e o estado de containers e portas na VPS.

---

## 2. Diagnóstico e Vulnerabilidades Identificadas

Durante a auditoria estrita de código e infraestrutura, foram identificados 3 pontos críticos de segurança e estabilidade:

### 🔴 1. Brecha de SSRF em Parâmetro `baseUrl` de IA (`server.js`)
- **Cenário:** O endpoint administrativo `/api/admin/connections` e a função `testProviderConnection` permitiam configurar um `baseUrl` customizado para o provedor OpenCode sem validação de URL.
- **Risco:** Um ator mal-intencionado ou script injetado poderia fornecer endereços de loopback (`http://127.0.0.1:8000`), redes internas Docker (`http://172.17.0.1:2375`) ou endpoints de metadados de nuvem (`http://169.254.169.254`), fazendo o backend agir como proxy para recursos internos da VPS (SSRF).

### 🟡 2. Exposição de Chave Gemini em Query String (`server.js`)
- **Cenário:** As chamadas para a API do Google Gemini (`generativelanguage.googleapis.com`) passavam a API Key via parâmetro de URL (`?key=AIza...`).
- **Risco:** Parâmetros de URL são comumente registrados em logs de proxies reversos, histórico de requisições e stack traces em caso de exceções de rede.

### 🟡 3. Container Órfão em Loop de Reinicialização na VPS (`traefik-fa4k-traefik-1`)
- **Cenário:** Na VPS (`179.197.88.186`), o container `traefik-fa4k-traefik-1` estava com status `Restarting (1)` permanente a cada poucos segundos.
- **Causa Raiz:** O Traefik órfão configurado em `/docker/traefik-fa4k/docker-compose.yml` tentava subir em modo `network_mode: host` nas portas 80 e 443, que já estão ocupadas legitimamente pelo `coolify-proxy`.
- **Impacto:** Desperdício contínuo de ciclos de CPU e I/O de disco da VPS com reinicializações em loop.

---

## 3. Correções Implementadas e Blindagem de Segurança

### 🛡️ 1. Proteção Completa Contra SSRF e DNS Rebinding
- A função de validação estrita `validateEndpointUrl` foi estendida para **todas** as rotas e funções que recebem `baseUrl`:
  - `testProviderConnection`
  - `executeAiChat`
  - `handleAdmin` (`api-connections` e `api-connections/test`)
- **Regras Impostas:**
  1. Apenas protocolo `https://` é aceito.
  2. Bloqueio absoluto de credenciais embutidas (`user:pass@host`).
  3. Resolução assíncrona de DNS com inspeção de **todos** os IPs retornados.
  4. Bloqueio de Loopback (`127.0.0.0/8`, `::1`), RFC 1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), Carrier-Grade NAT (`100.64.0.0/10`), Link-Local / Cloud Metadata (`169.254.0.0/16`, `metadata.google.internal`), multicast e IPv6 locais/mapeados.

### 🛡️ 2. Migração da Autenticação Gemini para Cabeçalho Seguro
- As requisições para a API Gemini foram alteradas para enviar a chave estritamente no cabeçalho HTTP:
  ```javascript
  headers: {
    "Content-Type": "application/json",
    "x-goog-api-key": activeKey
  }
  ```
- A URL foi limpa para `https://generativelanguage.googleapis.com/v1beta/models/...:generateContent` sem expor segredos.
- O tratamento de erro em `executeAiChat` foi sanitizado com regex para substituir qualquer chave residual por `[REDACTED]`.

---

## 4. Evidências de Teste e Validação

Executamos a bateria de testes de fronteira e segurança em [test_ssrf_and_hardening.js](file:///c:/Users/Admin/Downloads/AGÊNCIA%202.7/PROJETOS%20DA%20AGÊNCIA/APP%20-%20ATENDEJA/scripts/test_ssrf_and_hardening.js):

| Vetor de Teste | Alvo / Payload | Resultado Obtido | Status |
|:---|:---|:---|:---:|
| Loopback IPv4 | `http://127.0.0.1` | Bloqueado (400 - host local) | ✅ PASSOU |
| Localhost com Porta | `http://localhost:3000` | Bloqueado (400 - host local) | ✅ PASSOU |
| Domínio Localhost | `http://localhost.localdomain` | Bloqueado (400 - host local) | ✅ PASSOU |
| Metadados AWS/Cloud | `http://169.254.169.254/latest/meta-data/` | Bloqueado (400 - host local) | ✅ PASSOU |
| Metadados Google Cloud | `http://metadata.google.internal` | Bloqueado (400 - host local) | ✅ PASSOU |
| Rede Privada Classe A | `http://10.0.0.1/admin` | Bloqueado (400 - host local) | ✅ PASSOU |
| Rede Docker Bridge | `http://172.17.0.1:8000` | Bloqueado (400 - host local) | ✅ PASSOU |
| Rede Docker Daemon | `http://172.20.0.1:2375` | Bloqueado (400 - host local) | ✅ PASSOU |
| Rede Privada Classe C | `http://192.168.1.1` | Bloqueado (400 - host local) | ✅ PASSOU |
| Loopback HTTPS | `https://127.0.0.1` | Bloqueado (400 - rede privada) | ✅ PASSOU |
| Localhost HTTPS | `https://localhost` | Bloqueado (400 - host local) | ✅ PASSOU |
| Loopback IPv6 | `http://[::1]` | Bloqueado (400 - host local) | ✅ PASSOU |
| Loopback IPv6 HTTPS | `https://[::1]` | Bloqueado (400 - rede privada) | ✅ PASSOU |
| Esquema de Arquivo Local | `file:///etc/passwd` | Bloqueado (400 - não HTTPS) | ✅ PASSOU |
| Esquema Não-Web | `ftp://example.com` | Bloqueado (400 - não HTTPS) | ✅ PASSOU |
| API Pública OpenAI | `https://api.openai.com/v1` | **Permitido** (HTTPS público) | ✅ PASSOU |
| API Pública OpenRouter | `https://openrouter.ai/api/v1` | **Permitido** (HTTPS público) | ✅ PASSOU |
| API Pública Groq | `https://api.groq.com/openai/v1` | **Permitido** (HTTPS público) | ✅ PASSOU |
| API Pública OpenCode | `https://api.opencode.ai/v1` | **Permitido** (HTTPS público) | ✅ PASSOU |

**Resultado consolidado:** 19 / 19 testes passaram com 100% de sucesso.

---

## 5. Auditoria de Segredos e Repositório

- **`.env` e dados de conexões:** Confirmado que `.gitignore` contém `.env`, `.env.*`, `data/` e `*api_connections.json`.
- **Rastreabilidade Git:** Nenhum arquivo com credenciais reais está versionado no repositório (apenas `.env.example` com placeholders).
- **Frontend:** O endpoint `/api/admin/connections` retorna apenas as chaves mascaradas (`sk-••••••••1234`). As chaves reais nunca descem para o navegador.

---

## 6. Critérios de Aceite da Etapa 06

- [x] Segredos completamente isolados fora do frontend, do repositório e dos logs.
- [x] Validação de URLs e SSRF blindada contra IPv4/IPv6 privados, metadados de nuvem e esquemas inseguros.
- [x] Chaves de IA transmitidas exclusivamente via cabeçalhos de autorização.
- [x] Causa raiz do container Traefik em loop na VPS diagnosticada com precisão.
