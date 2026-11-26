# Plano de backup e recuperação

## Inventário
PostgreSQL/Supabase (schema, dados, funções, triggers, policies e extensões); arquivos/configurações locais da aplicação; workflows n8n (sem exportar segredos em claro); configuração Coolify necessária; código e variáveis em secret manager.

## Requisitos
- Definir RPO/RTO com JR.
- Backup automatizado, retenção e cópia fora da VPS principal.
- Criptografia em trânsito/repouso e acesso mínimo.
- Alertas para falhas e verificação de integridade.
- Teste de restauração periódico em ambiente isolado.
- Registrar data, origem, checksum, versão e resultado.
- Backup só é considerado válido após restauração testada.

## Recuperação
Identificar incidente; preservar evidências; escolher ponto aprovado; restaurar em ambiente isolado; validar integridade; executar smoke tests; obter autorização de JR antes de substituir produção/redirecionar tráfego.

Na inspeção preliminar não havia backup agendado visível no Coolify para o banco. Revalidar. Volume persistente não substitui backup.
