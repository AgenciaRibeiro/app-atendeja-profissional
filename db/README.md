# Bancos do AtendeJá Profissional

O projeto separa o controle da plataforma dos dados usados pelos contratantes:

| Banco | Uso | Arquivo de estrutura |
|---|---|---|
| Supabase `kunpzzmubfvzmweyxfjp` | Admin do Fundador, cadastro mestre, planos, assinaturas e auditoria | [`supabase_control_plane.sql`](./supabase_control_plane.sql) |
| PostgreSQL dedicado no Coolify | Leads, conversas, planejamento, assistentes e conexões de cada contratante | [`postgres_clientes.sql`](./postgres_clientes.sql) |

Os arquivos são uma **estrutura-base**, não uma aplicação já integrada. No estado verificado em 23/11/2026, o Supabase estava saudável e sem migrações, e o Coolify tinha o PostgreSQL `atendeja-postgres-clientes` saudável, mas sem aplicação web criada. Nenhum SQL foi aplicado nesta preparação.

## Segurança do Supabase

- O contratante consulta o próprio cadastro; para editar perfil, usa a RPC `register_client_profile`, que não aceita plano, status de assinatura ou datas do trial como parâmetros.
- Tabelas administrativas usam RLS. O cadastro de administradores não aceita que um usuário se eleve a admin; o bootstrap inicial do Fundador só pode ser chamado com `service_role`, uma única vez.
- `vw_founder_clients_overview` usa `security_invoker` e fica disponível apenas para sessões autorizadas pela RLS. Confirme suporte a essa opção na versão PostgreSQL do projeto antes de aplicar.
- Logs administrativos são append-only para evitar edição ou remoção por sessões comuns.
- A chave `secret` (equivalente privilegiada da antiga `service_role`) nunca deve ir para HTML, JavaScript público ou armazenamento do navegador. Use `publishable` no cliente. O backend aceita os nomes antigos de ambiente apenas para compatibilidade de transição.

## Segurança do PostgreSQL operacional

- A role `atendeja_app_runtime` é uma role de grupo sem login, sem privilégios administrativos e sem `BYPASSRLS`. O login real da API deve ser criado no Coolify com uma senha secreta fora do repositório e receber essa role.
- RLS forçada limita todas as tabelas pelo contexto `app.current_client_id`. A API só deve definir esse valor após validar o JWT Supabase e resolver o contratante no cadastro mestre.
- A sincronização do dashboard usa `client_workspace_state`: um snapshot JSONB por contratante, com revisão otimista para evitar sobrescrita entre sessões. Os dados de plano e acesso são sempre lidos do cadastro no Supabase; não são aceitos a partir do navegador. As tabelas relacionais seguem definidas para relatórios e integrações futuras.
- Defina o contexto com `SET LOCAL app.current_client_id = '<UUID-validado>'` dentro de cada transação. Nunca aceite o `client_id` enviado pelo navegador como prova de identidade e nunca exponha `DATABASE_URL` ao frontend.
- As FKs compostas em mensagens e histórico obrigam que os registros apontem para um lead do mesmo contratante.
- `secret_ref` é apenas uma referência a um cofre; não grave chaves reais em `api_connections`. A API deve bloquear SSRF: negar loopback, redes privadas, endereços de metadados e redirecionamentos para esses destinos.

## Integração ainda necessária

Existe agora uma base local de API Node (`server.js`), um painel separado do Fundador (`admin.html`) e um login Google para o dashboard do contratante. Após autenticar, o perfil básico é criado/vinculado no Supabase; o estado de trabalho do dashboard sincroniza como snapshot versionado no PostgreSQL.

### Migração do armazenamento local

O dashboard mantém estas chaves de navegador: `atendeja_tenant_v1`, `atendeja_leads_v2` (com fallback de `atendeja_leads_v1`), `atendeja_history_v1`, `atendeja_planning_v1`, `atendeja_assistants_v1`, `atendeja_connections_v1` e `atendeja_plan_state_v1`. A migração inicial grava um snapshot em `client_workspace_state`; não copia estado de plano, token, chave de API ou logo em base64. As tabelas relacionais do schema não são preenchidas por esse snapshot e exigirão uma migração posterior antes de relatórios SQL por lead.

No primeiro login autenticado, o app remove os leads `demo-*` e registros de histórico de demonstração; cria uma cópia local de recuperação; e importa o restante se o PostgreSQL ainda não tiver snapshot. Se outra sessão tiver revisado os dados, a escrita para e preserva o estado local para evitar sobrescrita silenciosa. O armazenamento local continua como cache/offline e a versão remota vence ao iniciar sem alterações locais pendentes. Segredos e chaves não entram no snapshot; imagem de logo permanece local até configurar Supabase Storage.

O snapshot já está preparado no código local, mas exige aplicar o SQL no PostgreSQL e validar o runtime antes de ser usado. A configuração de Google OAuth e a integração real do workflow de pagamento continuam pendentes.

Antes de produção, ainda é necessário:

1. Configurar Google OAuth no Supabase, incluindo Client ID/secret e URLs de retorno para os domínios aprovados.
2. Validar a sincronização versionada do snapshot com contas e sessões separadas; migrar o snapshot para as tabelas relacionais antes de habilitar relatórios SQL detalhados.
3. Ligar o workflow Mercado Pago/n8n ao webhook HMAC da API, validar assinatura e idempotência em homologação e confirmar atualização da assinatura no Supabase.
4. Guardar chaves de provedores em cofre ou secret manager; persistir apenas referência e últimos quatro caracteres.
5. Manter proteção SSRF também no serviço que efetivamente realiza chamadas externas; validação DNS no cadastro não impede DNS rebinding posterior.
6. Aplicar limites de assistentes/APIs conforme o plano no backend e definir retenção e atendimento a pedidos LGPD. `raw_metadata` deve conter somente campos necessários, nunca tokens, dados de cartão ou payloads integrais.

Variáveis esperadas na API/Coolify (valores somente em segredo privado):

- `SUPABASE_URL=https://kunpzzmubfvzmweyxfjp.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` (pública; não substitui autorização)
- `SUPABASE_SECRET_KEY` (somente backend)
- `DATABASE_URL` (conexão interna do PostgreSQL Coolify)
- `CORS_ORIGIN=https://atendeja.minhaempresaautonoma.online` (origem HTTPS do app e da API)
- `MP_WEBHOOK_SECRET` (validação servidor a servidor)
- `PAYMENT_WEBHOOK_SECRET` (HMAC entre n8n e a API AtendeJá; segredo independente, somente no servidor)
- `API_SECRET_ENCRYPTION_KEY` (somente se não houver cofre externo)
- `PORT=3000`

## Ordem de implantação

1. Confirmar a versão do PostgreSQL e se o banco Coolify tem dados ou schema preexistente; não aplicar esses baselines sobre dados sem plano de migração.
2. Criar backup e verificar que é possível restaurá-lo.
3. Tratar os SQLs atuais como baselines para banco novo; para qualquer banco existente, criar migração numerada que altere o schema sem recriá-lo. Aplicar primeiro em homologação e validar permissões com contas separadas de Fundador, contratante e runtime.
4. Criar o primeiro usuário do Fundador pelo provedor Google, obter seu UUID em Auth e chamar `bootstrap_first_founder` a partir de backend confiável usando service role. Não enviar a chave de serviço ao navegador.
5. Criar o login da API no Coolify, conceder a role `atendeja_app_runtime` e configurar segredos pela interface/cofre do Coolify.
6. Implementar e revisar a API e conectar o frontend. Só então criar/publicar a aplicação no Coolify.

O endpoint `POST /api/webhooks/mercadopago` aceita um corpo JSON com `payment_id`, `email_google`, `plan_code`, `amount_brl`, `status`, `payment_method` e, opcionalmente, `paid_at`. O n8n deve calcular HMAC-SHA256 do corpo JSON bruto com `PAYMENT_WEBHOOK_SECRET` e enviar `X-AtendeJa-Signature: sha256=<hex>`. Só eventos assinados são aceitos; `payment_id` é idempotente e pagamentos aprovados ativam o plano. O workflow atual não está ligado a esse endpoint nem validado em homologação.

O PostgreSQL de clientes já existente foi apenas conferido como saudável; não foi inspecionado quanto a conteúdo nem alterado. O deploy e a execução de migrações permanecem pendentes de revisão final e autorização do Fundador.
