const crypto = require('crypto');
const https = require('https');

const secret = 'atendeja-payment-webhook-secret-n8n-2026';
const payload = JSON.stringify({
  payment_id: 'test-validation-' + Date.now(),
  email_google: 'teste@atendeja.com.br',
  plan_code: 'pro',
  amount_brl: 1.00,
  status: 'pending',
  payment_method: 'pix'
});

const sig = crypto.createHmac('sha256', secret).update(Buffer.from(payload, 'utf8')).digest('hex');
console.log('Calculated Signature:', sig);

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
    console.log('HTTP Status:', res.statusCode);
    console.log('Response Body:', data);
  });
});

req.on('error', err => console.error('Error:', err.message));
req.write(payload);
req.end();
