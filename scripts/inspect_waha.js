const https = require('https');

function wahaRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'waha.minhaempresaautonoma.online',
      path,
      method,
      headers: {
        'X-Api-Key': 'ca282a8e0b79f1b358169fe0b4fbb0c43bbac78d',
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw), headers: res.headers });
        } catch (_e) {
          resolve({ status: res.statusCode, raw, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function testWahaLifecycle() {
  const sessionName = 'test_session_' + Date.now();
  console.log('1. Creating session:', sessionName);
  await wahaRequest('/api/sessions', 'POST', { name: sessionName });

  console.log('2. Starting session...');
  await wahaRequest('/api/sessions/' + sessionName + '/start', 'POST');

  console.log('3. Polling for SCAN_QR_CODE status...');
  let qrCode = null;
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const detail = await wahaRequest('/api/sessions/' + sessionName, 'GET');
    console.log(`Poll ${i+1}: status = ${detail.data?.status}`);
    if (detail.data?.status === 'SCAN_QR_CODE') {
      const qrRes = await wahaRequest('/api/' + sessionName + '/auth/qr?format=raw', 'GET');
      console.log('QR Code obtained successfully! Length:', (qrRes.data?.raw || qrRes.raw)?.length);
      qrCode = qrRes.data || qrRes.raw;
      break;
    }
  }

  console.log('4. Stopping and deleting session...');
  await wahaRequest('/api/sessions/' + sessionName + '/stop', 'POST');
  await wahaRequest('/api/sessions/' + sessionName, 'DELETE');
  console.log('Cleanup complete!');
}

testWahaLifecycle().catch(console.error);
