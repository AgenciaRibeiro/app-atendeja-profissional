# Estado atual da missão

Missão: auditoria corretiva e estabilização do AtendeJá Profissional.  
Status: ATIVA — Etapas 00, 01, 02, 03, 04, 05, 06, 07, 08 e 09 concluídas.  
Etapa atual: 09 — Autenticação, sessão e painel admin (CONCLUÍDA).  
Última etapa corretiva concluída: 09 — Autenticação, sessão e painel admin (validada com troca segura e exclusão de conta Google, recuperação de senha com verificação em banco e isolamento de rotas em 2026-11-27).  
Próxima etapa: 10 — Healthchecks, observabilidade e persistência.

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
