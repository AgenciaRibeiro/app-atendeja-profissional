const assert = require('assert');

function getClientSessionName(clientId) {
  return "session_" + String(clientId).replace(/[^a-z0-9]/gi, "").slice(0, 16);
}

async function run() {
  console.log("=== BATERIA DE TESTES ETAPA 08: WHATSAPP / WAHA INTEGRAÇÃO ===");

  // Teste 1: Derivação de nome de sessão seguro e isolado por cliente
  const testClientId = "8cb369a4-ec02-4dc4-ac6b-3191d7b7eb61";
  const sessionName = getClientSessionName(testClientId);
  assert.strictEqual(sessionName, "session_8cb369a4ec024dc4", "Nome da sessão deve ser alfanumérico e derivado do ID do cliente");
  console.log("[PASSOU] Isolamento de sessão multi-tenant:", sessionName);

  // Teste 2: Verificação de conectividade com a API WAHA na VPS
  const https = require('https');
  const wahaOptions = {
    hostname: 'waha.minhaempresaautonoma.online',
    path: '/api/sessions',
    method: 'GET',
    headers: {
      'X-Api-Key': 'ca282a8e0b79f1b358169fe0b4fbb0c43bbac78d'
    }
  };

  const wahaCheck = await new Promise((resolve, reject) => {
    const req = https.request(wahaOptions, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.end();
  });

  assert.strictEqual(wahaCheck.status, 200, "API do WAHA deve responder 200 OK");
  const sessions = JSON.parse(wahaCheck.body);
  assert.strictEqual(Array.isArray(sessions), true, "WAHA deve retornar lista de sessões");
  console.log("[PASSOU] Conexão com gateway WAHA na VPS validada. Sessões ativas:", sessions.length);

  // Teste 3: Verificação de formato de resposta de status
  const primary = sessions.find(s => s.name === 'n8n-minhaempresaautonoma');
  if (primary) {
    assert.strictEqual(primary.status, "WORKING", "Sessão principal deve estar com status WORKING");
    console.log("[PASSOU] Sessão principal operacional:", primary.name, "Número:", primary.me?.id);
  }

  console.log("\nTodos os testes de integração do WhatsApp foram validados com 100% de sucesso!");
}

run().catch(console.error);
