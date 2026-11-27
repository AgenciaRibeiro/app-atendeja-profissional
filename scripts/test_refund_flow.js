const crypto = require('crypto');
const https = require('https');

const secret = 'atendeja-payment-webhook-secret-n8n-2026';
const testPaymentId = 'synth_refund_test_' + Date.now();
const testEmail = 'synthetic.etapa05.' + Date.now() + '@atendeja.com.br';

function sendWebhook(payloadObj) {
  return new Promise((resolve, reject) => {
    const raw = JSON.stringify(payloadObj);
    const sig = crypto.createHmac('sha256', secret).update(Buffer.from(raw, 'utf8')).digest('hex');
    const req = https.request('https://atendeja.minhaempresaautonoma.online/api/webhooks/mercadopago', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-atendeja-signature': 'sha256=' + sig
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (_e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(raw);
    req.end();
  });
}

async function run() {
  console.log('--- TESTE SINTÉTICO ETAPA 05: REEMBOLSO E ESTADOS ---');
  console.log('Payment ID de teste:', testPaymentId);
  console.log('E-mail de teste:', testEmail);

  // 1. Simular aprovação inicial do pagamento
  console.log('\n[1/3] Enviando aprovação de pagamento (approved)...');
  const resApproved = await sendWebhook({
    payment_id: testPaymentId,
    email_google: testEmail,
    plan_code: 'pro',
    amount_brl: 1.00,
    status: 'approved',
    payment_method: 'pix'
  });
  console.log('Status HTTP:', resApproved.status);
  console.log('Resposta:', resApproved.data);

  if (resApproved.status !== 200 || !resApproved.data.ok) {
    throw new Error('Falha ao simular aprovação');
  }

  // 2. Simular evento de reembolso (refunded)
  console.log('\n[2/3] Enviando evento de reembolso (refunded)...');
  const resRefunded = await sendWebhook({
    payment_id: testPaymentId,
    email_google: testEmail,
    plan_code: 'pro',
    amount_brl: 1.00,
    status: 'refunded',
    payment_method: 'pix'
  });
  console.log('Status HTTP:', resRefunded.status);
  console.log('Resposta:', resRefunded.data);

  if (resRefunded.status !== 200 || !resRefunded.data.ok) {
    throw new Error('Falha ao simular reembolso');
  }

  // 3. Simular duplicidade de reembolso (idempotência)
  console.log('\n[3/3] Enviando duplicidade de reembolso (idempotência)...');
  const resDuplicate = await sendWebhook({
    payment_id: testPaymentId,
    email_google: testEmail,
    plan_code: 'pro',
    amount_brl: 1.00,
    status: 'refunded',
    payment_method: 'pix'
  });
  console.log('Status HTTP:', resDuplicate.status);
  console.log('Resposta:', resDuplicate.data);

  console.log('\n--- Teste concluído com sucesso ---');
  console.log('Dados sintéticos para verificação e cleanup:');
  console.log('email:', testEmail);
  console.log('payment_id:', testPaymentId);
}

run().catch(err => {
  console.error('Erro no teste:', err);
  process.exit(1);
});
