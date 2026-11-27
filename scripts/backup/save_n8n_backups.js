const fs = require('fs');
const path = require('path');

const backupsDir = path.join(__dirname, '..', '..', 'backups', 'n8n');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

function processFile(srcPath, destName) {
  try {
    const raw = fs.readFileSync(srcPath, 'utf8');
    const jsonStart = raw.indexOf('{');
    if (jsonStart !== -1) {
      const data = JSON.parse(raw.slice(jsonStart));
      const destPath = path.join(backupsDir, destName);
      fs.writeFileSync(destPath, JSON.stringify(data.workflow, null, 2), 'utf8');
      console.log('Salvo:', destPath);
    }
  } catch (err) {
    console.error('Erro ao processar', srcPath, err.message);
  }
}

processFile('C:\\Users\\Admin\\.gemini\\antigravity\\brain\\1f30dbe1-94ca-4eed-8f25-f29c0981c6c9\\.system_generated\\steps\\423\\output.txt', 'kawt70Q2DuuG0pMo_MercadoPago_Pix_Cartao_WAHA.json');
processFile('C:\\Users\\Admin\\.gemini\\antigravity\\brain\\1f30dbe1-94ca-4eed-8f25-f29c0981c6c9\\.system_generated\\steps\\425\\output.txt', 'RN5fo9acYbGIVujC_Pix_Direto_WAHA.json');

const tmiWorkflow = {
  "id": "tmiMFW7MwRAZ7XK6",
  "name": "My workflow",
  "active": true,
  "triggerCount": 1,
  "nodeCount": 3,
  "parentFolderId": "86ccDQYrivxdtcXe",
  "nodes": [
    {
      "parameters": {
        "path": "atendeja/status-pagamento",
        "responseMode": "responseNode"
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.2,
      "position": [0, 0],
      "id": "49dff0b5-596e-48e2-ae0d-a97e8b96c4d3",
      "name": "Webhook"
    },
    {
      "parameters": {
        "url": "=https://api.mercadopago.com/v1/payments/{{ $json.query?.paymentId || $json.query?.id || '' }}",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpBearerAuth"
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.5,
      "position": [224, 0],
      "id": "2e247355-d111-4190-b0c6-d10ba62e4d93",
      "name": "HTTP Request"
    },
    {
      "parameters": {
        "enableResponseOutput": false,
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify({ ok: true, paymentId: $json.id || null, status: $json.status || 'pending', approved: $json.status === 'approved' }) }}"
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.5,
      "position": [448, 0],
      "id": "06558878-d33c-4ae5-8a39-95e22150dbdc",
      "name": "Respond to Webhook"
    }
  ]
};

fs.writeFileSync(path.join(backupsDir, 'tmiMFW7MwRAZ7XK6_Status_Pagamento.json'), JSON.stringify(tmiWorkflow, null, 2), 'utf8');
console.log('Salvo tmiMFW7MwRAZ7XK6_Status_Pagamento.json');
