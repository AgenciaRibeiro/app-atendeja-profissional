# Arquitetura e fluxo de pagamentos — baseline a validar

## Componentes identificados
Checkout web; backend Node.js em `server.js`; Mercado Pago; workflow n8n `AtendeJá — Mercado Pago (Pix + Cartão + Confirmação Automática + WAHA)`, ID `kawt70Q2DuuG0pMo`; PostgreSQL/Supabase; WAHA.

## Fluxo alvo
1. Checkout solicita criação ao backend.
2. Backend valida plano, preço, ambiente, identidade e pedido.
3. Provedor cria pagamento no sandbox/produção conforme configuração explícita.
4. Webhook valida autenticidade e consulta provedor quando necessário.
5. Idempotência impede processamento duplicado.
6. Backend aplica transição válida de pagamento/assinatura em operação consistente.
7. Status consultado pelo checkout deriva do backend/banco.
8. WhatsApp ativa somente após confirmação confiável, uma vez.
9. Refund/chargeback/cancelamento seguem política aprovada e trilha de auditoria.

## Pontos preliminares
- Nó n8n `Validar Pedido` aparentemente fixa `metodo = 'pix'`.
- Confirmar se cartão está habilitado comercialmente e no Mercado Pago.
- Confirmar endpoint de consulta usado pelo checkout.
- Confirmar atualização do contratante/assinatura no Supabase ou chamada ao backend.
- Confirmar HMAC sobre corpo bruto, idempotência e replay protection.
- Preservar R$ 1,00 no ambiente de teste até JR solicitar mudança.

## Preços confirmados
Teste temporário: R$ 1,00 nos três planos, intencional.
Comerciais: Essencial R$ 197,00; Pro R$ 197,00; Empresa R$ 397,00.
Separação teste/produção deve ser explícita e centralizada no backend. Não publicar preço de teste como comercial.

Não executar pagamentos, mensagens, ativações reais nem workflow ativo. Alterações em workflow ativo, credenciais, pagamentos reais e deploy exigem autorização específica.
