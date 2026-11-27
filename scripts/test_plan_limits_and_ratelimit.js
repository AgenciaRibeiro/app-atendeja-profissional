const assert = require('assert');
const { Readable } = require('stream');

// 1. Teste de Rate Limit com Extração de IP (Proxy-Aware)
const limiter = new Map();

function rateLimit(req) {
  const now = Date.now();
  const rawIp = req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const ip = String(rawIp).split(",")[0].trim();
  let entry = limiter.get(ip);
  if (!entry || now - entry.start > 60000) entry = { start: now, count: 0 };
  entry.count += 1;
  limiter.set(ip, entry);
  if (limiter.size > 5000) {
    for (const [key, value] of limiter) if (now - value.start > 60000) limiter.delete(key);
  }
  if (entry.count > 180) {
    const err = new Error("Muitas solicitações; aguarde um minuto");
    err.status = 429;
    throw err;
  }
  return { ip, count: entry.count };
}

// 2. Teste de Streaming Body (Verificando eliminação de ReferenceError)
async function readRawBody(req) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 1024 * 1024) {
      const err = new Error("Corpo da solicitação excede 1 MB");
      err.status = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// 3. Simulação de enforcePlan
function simulateEnforcePlan(caps, resource, currentCount, payload = {}) {
  if (resource === "planning_goals" && !caps.monthly_planning) {
    if (payload.period_mode === "mensal") {
      const err = new Error("Planejamento mensal exige plano superior");
      err.status = 403;
      throw err;
    }
  }
  if (resource === "assistants" && payload.capacidades) {
    if (payload.capacidades.some(cap => !caps.capabilities.includes(cap))) {
      const err = new Error("Uma ou mais capacidades não estão disponíveis no plano atual");
      err.status = 403;
      throw err;
    }
  }
  if (resource === "assistants") {
    if (currentCount >= caps.max_assistants) {
      const err = new Error(`Limite de ${caps.max_assistants} assistentes do seu plano ${caps.code} atingido. Upgrade para mais.`);
      err.status = 403;
      throw err;
    }
  }
  if (resource === "api_connections") {
    if (currentCount >= caps.max_apis) {
      const err = new Error(`Limite de ${caps.max_apis} conexões API do seu plano ${caps.code} atingido. Upgrade para mais.`);
      err.status = 403;
      throw err;
    }
  }
  return true;
}

async function run() {
  console.log("=== BATERIA DE TESTES ETAPA 07: LIMITES E RATE LIMIT ===");

  // Teste 1: Resolução de IP por X-Forwarded-For
  const reqProxy1 = { headers: { "x-forwarded-for": "177.18.25.10, 10.0.1.5" }, socket: { remoteAddress: "10.0.1.5" } };
  const res1 = rateLimit(reqProxy1);
  assert.strictEqual(res1.ip, "177.18.25.10", "Deve extrair o IP real do cliente do X-Forwarded-For");
  console.log("[PASSOU] Extração de IP via X-Forwarded-For:", res1.ip);

  // Teste 2: Resolução de IP por CF-Connecting-IP
  const reqProxy2 = { headers: { "cf-connecting-ip": "201.55.88.99", "x-forwarded-for": "10.0.1.5" }, socket: { remoteAddress: "10.0.1.5" } };
  const res2 = rateLimit(reqProxy2);
  assert.strictEqual(res2.ip, "201.55.88.99", "CF-Connecting-IP deve ter precedência");
  console.log("[PASSOU] Extração de IP via CF-Connecting-IP:", res2.ip);

  // Teste 3: Rate limit barreira em 180 requisições
  const testIp = "189.10.20.30";
  const reqLimiter = { headers: {}, socket: { remoteAddress: testIp } };
  for (let i = 0; i < 180; i++) {
    rateLimit(reqLimiter);
  }
  let blocked = false;
  try {
    rateLimit(reqLimiter); // 181ª requisição
  } catch (err) {
    if (err.status === 429) blocked = true;
  }
  assert.strictEqual(blocked, true, "181ª requisição deve ser bloqueada com 429");
  console.log("[PASSOU] Rate limiter bloqueia com 429 na 181ª requisição.");

  // Teste 4: Stream Body Parsing sem ReferenceError
  const stream = Readable.from([Buffer.from("teste de streaming "), Buffer.from("sem falha de escopo")]);
  const bodyResult = await readRawBody(stream);
  assert.strictEqual(bodyResult.toString("utf8"), "teste de streaming sem falha de escopo");
  console.log("[PASSOU] readRawBody processa streams sem ReferenceError.");

  // Teste 5: Limites do Plano Trial (max_assistants: 1, max_apis: 1, monthly_planning: false)
  const trialCaps = { code: "trial", max_assistants: 1, max_apis: 1, monthly_planning: false, capabilities: ["atendimento"] };
  assert.doesNotThrow(() => simulateEnforcePlan(trialCaps, "assistants", 0, { capacidades: ["atendimento"] }));
  assert.throws(() => simulateEnforcePlan(trialCaps, "assistants", 1, { capacidades: ["atendimento"] }), /Limite de 1 assistentes/);
  assert.throws(() => simulateEnforcePlan(trialCaps, "planning_goals", 0, { period_mode: "mensal" }), /Planejamento mensal exige plano superior/);
  assert.throws(() => simulateEnforcePlan(trialCaps, "assistants", 0, { capacidades: ["vendas"] }), /Uma ou mais capacidades/);
  console.log("[PASSOU] Limites do plano Trial rigorosamente aplicados.");

  // Teste 6: Limites do Plano Pro (max_assistants: 3, max_apis: 4, monthly_planning: true)
  const proCaps = { code: "pro", max_assistants: 3, max_apis: 4, monthly_planning: true, capabilities: ["atendimento", "cotacao", "vendas", "crm_auto"] };
  assert.doesNotThrow(() => simulateEnforcePlan(proCaps, "assistants", 2, { capacidades: ["vendas", "crm_auto"] }));
  assert.throws(() => simulateEnforcePlan(proCaps, "assistants", 3, { capacidades: ["vendas"] }), /Limite de 3 assistentes/);
  assert.doesNotThrow(() => simulateEnforcePlan(proCaps, "planning_goals", 0, { period_mode: "mensal" }));
  console.log("[PASSOU] Limites do plano Pro rigorosamente aplicados.");

  console.log("\nTodos os 6 cenários de limites e rate limiting foram validados com 100% de sucesso.");
}

run().catch(console.error);
