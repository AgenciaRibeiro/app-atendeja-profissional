# Estado atual da missão

Missão: auditoria corretiva e estabilização do AtendeJá Profissional.  
Status: ATIVA — aguardando início da Etapa 00.  
Etapa atual: 00 — Revalidar linha de base e preparar ambiente seguro.  
Última etapa corretiva concluída: nenhuma sob este protocolo.  
Próxima ação: verificar branch/commit, mudanças posteriores à auditoria, estado dos serviços, ambiente isolado e backups sem alterar produção.

## Escopo congelado
Corrigir e validar problemas existentes conforme o plano mestre. Não redesenhar dashboard/landing nem criar funcionalidades.

## Decisões confirmadas
- R$ 1,00 nos três planos é preço de teste intencional.
- Preços comerciais: Essencial R$ 197,00; Pro R$ 197,00; Empresa R$ 397,00.
- Política de reembolso/chargeback será documentada; termos comerciais dependem de aprovação de JR.
- Investigação e correções em ambiente seguro permitidas; produção e ações críticas exigem autorização específica.

## Segurança
Não presumir staging. Confirmar antes de testar. Não executar workflow n8n ativo, cobrança, mensagem real, migração ou deploy de produção.

Ao concluir/interromper, atualizar status, resultado, commit, evidências, bloqueios e próxima ação. Não apagar histórico.
