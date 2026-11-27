# Estado atual da missão

Missão: auditoria corretiva e estabilização do AtendeJá Profissional.  
Status: ATIVA — Etapas 00, 01, 02, 03, 04, 05 e 06 concluídas; Etapa 07 pronta para autorização.  
Etapa atual: 06 — Segredos, SSRF e hardening (CONCLUÍDA).  
Última etapa corretiva concluída: 06 — Segredos, SSRF e hardening (validada com 19 testes em 2026-11-27).  
Próxima ação: Autorização formal de JR para iniciar a Etapa 07 (Limites por plano e rate limit).

## Escopo congelado
Corrigir e validar problemas existentes conforme o plano mestre. Não redesenhar dashboard/landing nem criar funcionalidades.

## Decisões confirmadas
- R$ 1,00 nos três planos é preço de teste intencional em produção mantido integralmente.
- Preços comerciais futuros: Essencial R$ 197,00; Pro R$ 197,00; Empresa R$ 397,00.
- Opção de Cartão de Crédito removida definitivamente do fluxo de pagamentos por decisão de JR; esteira 100% Pix Direto.
- n8n agora notifica o webhook do AtendeJá com HMAC SHA-256 e ativa o cliente no Supabase automaticamente.
- Link da mensagem WAHA corrigido para `https://atendeja.minhaempresaautonoma.online/dashboard.html`.

## Segurança
Não presumir staging. Confirmar antes de testar. Não executar cobrança real, mensagem real não autorizada ou migração destrutiva.

Ao concluir/interromper, atualizar status, resultado, commit, evidências, bloqueios e próxima ação. Não apagar histórico.
