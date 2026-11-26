# Política de autorizações

JR autorizou investigação, auditoria, documentação e desenvolvimento corretivo em ambiente seguro conforme a missão em `docs/auditoria-corretiva/`. Isso não autoriza produção.

Permitido dentro da etapa: leitura, análise estática, testes locais/isolados sem impacto real, alterações mínimas em branch de trabalho, fixtures sintéticas e documentação.

Exige autorização específica de JR: deploy/publicação; cobrança, reembolso, estorno ou transação real; exclusão ou migração destrutiva; reset/recriação de banco; rotação de credenciais; cancelamento de serviços/assinaturas; alteração/desativação de workflows ativos; remoção de volumes/backups; mudanças críticas em Coolify/VPS/DNS/firewall; testes intrusivos em produção.

Preparar script, plano, migração revisável ou rollback não significa autorização para executá-los em produção. Nunca imprimir segredos no chat ou versioná-los. Se suspeitar de exposição, interromper e reportar.
