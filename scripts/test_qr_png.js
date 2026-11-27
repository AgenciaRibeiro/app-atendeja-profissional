const https = require('https');

const req = https.request({
  hostname: 'waha.minhaempresaautonoma.online',
  path: '/api/n8n-minhaempresaautonoma/auth/qr',
  method: 'GET',
  headers: {
    'X-Api-Key': 'ca282a8e0b79f1b358169fe0b4fbb0c43bbac78d',
    'Accept': 'image/png'
  }
}, res => {
  console.log('Status:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
});

req.on('error', console.error);
req.end();
