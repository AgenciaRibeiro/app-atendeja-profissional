const assert = require("assert");

const EVOLUTION_BASE_URL = "https://evo.minhaempresaautonoma.online";
const EVOLUTION_API_KEY = "W90lwmGRg8PtGJT3SUJLHu2XRbBjfwGo";

async function evoFetch(path, options = {}) {
  const url = `${EVOLUTION_BASE_URL}${path}`;
  const headers = Object.assign({
    "apikey": EVOLUTION_API_KEY
  }, options.headers || {});
  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof Buffer)) {
    body = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }
  return fetch(url, Object.assign({}, options, { body, headers, signal: AbortSignal.timeout(15000) }));
}

function getClientSessionName(clientId) {
  return "session_" + String(clientId).replace(/[^a-z0-9]/gi, "").slice(0, 16);
}

async function run() {
  console.log("=== BATERIA DE TESTES: EVOLUTION API INTEGRAÇÃO ===");

  // 1. Multi-tenant session name derivation
  const fakeClientId = "8cb369a4-ec02-4dc4-ba8f-a9db7f017417";
  const sessionName = getClientSessionName(fakeClientId);
  assert.strictEqual(sessionName, "session_8cb369a4ec024dc4");
  console.log("[PASSOU] Isolamento de sessão multi-tenant:", sessionName);

  // 2. Healthcheck & version
  const rootRes = await fetch(EVOLUTION_BASE_URL + "/");
  assert.strictEqual(rootRes.status, 200);
  const rootJson = await rootRes.json();
  assert.strictEqual(rootJson.status, 200);
  console.log("[PASSOU] Evolution API online na VPS. Versão:", rootJson.version);

  // 3. Authenticated endpoint
  const instRes = await evoFetch("/instance/fetchInstances");
  assert.strictEqual(instRes.status, 200);
  console.log("[PASSOU] Autenticação com Global API Key validada com sucesso.");

  // 4. Create test instance & QR code generation
  const createRes = await evoFetch("/instance/create", {
    method: "POST",
    body: {
      instanceName: sessionName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS"
    }
  });
  assert.strictEqual(createRes.status, 201);
  const createJson = await createRes.json();
  assert.ok(createJson.qrcode?.base64, "QR code base64 deve ser gerado");
  assert.ok(createJson.qrcode.base64.startsWith("data:image/png;base64,"), "Deve ser um Data URL PNG válido");
  console.log("[PASSOU] Instância criada com sucesso e QR Code Base64 Data URL gerado.");

  // 5. Query connection state
  const stateRes = await evoFetch("/instance/connectionState/" + sessionName);
  assert.strictEqual(stateRes.status, 200);
  const stateJson = await stateRes.json();
  console.log("[PASSOU] Estado da conexão verificado:", stateJson.instance?.state);

  // 6. Connect route to refresh QR
  const connRes = await evoFetch("/instance/connect/" + sessionName);
  assert.strictEqual(connRes.status, 200);
  const connJson = await connRes.json();
  assert.ok(connJson.base64, "Endpoint connect deve retornar QR base64");
  console.log("[PASSOU] Endpoint /instance/connect retornou QR Code atualizado.");

  // 7. Cleanup & delete instance
  const delRes = await evoFetch("/instance/delete/" + sessionName, { method: "DELETE" });
  assert.strictEqual(delRes.status, 200);
  console.log("[PASSOU] Instância de teste removida com sucesso.");

  console.log("\nTodos os 7 testes de integração da Evolution API foram validados com 100% de sucesso!");
}

run().catch(err => {
  console.error("FALHA:", err);
  process.exit(1);
});
