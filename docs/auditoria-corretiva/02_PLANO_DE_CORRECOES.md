# Plano mestre — ordem de correção e homologação

## Objetivo
Tornar o produto íntegro, seguro e funcional nos fluxos existentes, sem novas funcionalidades ou redesign por iniciativa própria.

## Decisões confirmadas por JR
- R$ 1,00 nos três planos é preço de teste intencional e temporário. Preservar até orientação contrária.
- Preços comerciais finais informados: Essencial R$ 197,00; Pro R$ 197,00; Empresa R$ 397,00.
- Documentar política/procedimento de reembolso e chargeback; não inventar prazos, garantias ou condições.
- Investigação e desenvolvimento corretivo em ambiente seguro permitidos. Produção e ações críticas dependem de aprovação específica.
- Nenhum deploy, cobrança real ou execução do workflow foi autorizado por esta missão.

## Ordem obrigatória — uma etapa principal por vez
### 00 — Revalidar baseline e preparar ambiente seguro
Confirmar branch/commit, mudanças recentes, estado de serviços, ambiente isolado, dados sintéticos, backup e rollback. Não alterar produção.
Aceite: baseline atualizada, riscos classificados e ambiente seguro identificado.

### 01 — Integridade PostgreSQL e migrações
Revisar SQL, ordem, idempotência, referências a `undefined`, constraints, RLS e schema. Reproduzir em banco isolado.
Aceite: causa identificada ou não reproduzida com evidência; scripts testados isoladamente; nenhum dado real alterado.

### 02 — Backup e recuperação
Definir backup, retenção, armazenamento separado e restauração isolada. Alterações operacionais em produção exigem aprovação.
Aceite: backup válido e restauração comprovada; procedimento documentado.

### 03 — Segurança multi-tenant e autorização
Auditar autenticação, autorização, RLS, tenant derivado da sessão, IDOR, endpoints admin/cliente e RPC. Testes A/B sintéticos.
Aceite: acesso cruzado negado no backend e banco; operações legítimas funcionais.

### 04 — Pagamentos Mercado Pago, backend e n8n
Mapear criação, confirmação, consulta, idempotência, HMAC e atualização de cliente/assinatura. Corrigir Pix fixo se cartão estiver contratado e habilitado. Sandbox/mocks somente.
Aceite: métodos suportados coerentes; evento confiável atualiza estado uma única vez; consulta e webhook consistentes; nenhuma transação real.

### 05 — Reembolso, chargeback e estados
Mapear eventos reais do provedor e regras comerciais aprovadas. Definir processo, responsabilidades, evidências, comunicação e conciliação.
Aceite: duplicidade/ordem de eventos não corrompem estado; política e texto público aprovados por JR antes de produção.

### 06 — Segredos, SSRF e hardening
Auditar credenciais, logs, URLs, allowlists, redes privadas e DNS rebinding. Testar SSRF em ambiente isolado.
Aceite: segredos fora do frontend/repositório/logs; validação de URL robusta e testada.

### 07 — Limites por plano e rate limit
Verificar catálogo, limites backend, consistência UI/API/DB e rate limit por rota/usuário/plano/instância.
Aceite: limites comprovados por testes de fronteira; não dependem da interface.

### 08 — WhatsApp/WAHA e automações
Validar sessão, ativação pós-pagamento, idempotência, pausa humana, webhooks e falhas. Sem mensagens reais.
Aceite: cenários simulados comprovados sem ativação/mensagem duplicada.

### 09 — Autenticação, sessão e painel admin
Auditar login, bootstrap, autorização, expiração/revogação, CSRF/CORS e logs. Não alterar layout do dashboard sem pedido.
Aceite: acesso administrativo e sessões validados; regressões testadas.

### 10 — Healthchecks, observabilidade e persistência
Distinguir liveness/readiness, dependências, armazenamento persistente e logs. Mudanças em Coolify/produção exigem autorização.
Aceite: readiness e persistência comprovadas em ambiente isolado.

### 11 — Regressão e homologação integrada
Testar cadastro, login, CRM, pagamento sandbox, ativação, WhatsApp simulado, admin e isolamento.
Aceite: matriz concluída; falhas críticas corrigidas ou formalmente bloqueadas; nenhum teste real.

### 12 — Documentação final e encerramento
Consolidar arquitetura, decisões, política, backup, relatórios, limitações e riscos residuais.
Aceite: itens obrigatórios com evidência, relatório final e aceite explícito de JR. Congelar a fila; melhorias futuras serão missão nova.

## Regras de avanço
A IA apresenta/executa somente etapa atual. Pode avançar automaticamente após auditoria aprovada se pré-requisitos e autorização estiverem satisfeitos. Se depender de JR, marcar AGUARDANDO_JR e parar. Achados novos não mudam a ordem sem justificativa e decisão de JR. Nunca usar deploy de produção como teste.

## Encerramento
Código implementado não basta: exigir testes, auditoria, documentação e evidências. Pendência obrigatória só pode ser dispensada por decisão explícita de JR.
