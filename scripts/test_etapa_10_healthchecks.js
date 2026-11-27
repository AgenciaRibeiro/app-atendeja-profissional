"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

async function runTests() {
  process.env.PORT = "3499";
  process.env.SUPABASE_URL = "https://kunpzzmubfvzmweyxfjp.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_uFZrqtFVvTKsxDTIEsrrhg_AcADOLl7";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_7kRfK5q86vmUhg6PSylSZw_CVqWuA_l";
  process.env.DATA_DIR = path.join(__dirname, "test_data_dir");

  // Inicia servidor
  const srv = require("../server.js");
  await new Promise(r => setTimeout(r, 1000));

  console.log("=== BATERIA DE TESTES ETAPA 10: HEALTHCHECKS, OBSERVABILIDADE E PERSISTÊNCIA ===");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASSOU] ${message}`);
      passed++;
    } else {
      console.error(`[FALHOU] ${message}`);
      process.exitCode = 1;
    }
  }

  // TESTE 1: Liveness probe em /health/live
  const t1 = await fetch("http://localhost:3499/health/live");
  const d1 = await t1.json();
  assert(t1.status === 200 && d1.status === "ok" && d1.type === "liveness", "Endpoint /health/live responde HTTP 200 com type: liveness");

  // TESTE 2: Liveness probe em /api/health/live
  const t2 = await fetch("http://localhost:3499/api/health/live");
  const d2 = await t2.json();
  assert(t2.status === 200 && d2.status === "ok" && typeof d2.uptime_seconds === "number", "Endpoint /api/health/live responde HTTP 200 com uptime numérico");

  // TESTE 3: Readiness probe em /health/ready (contrato determinístico de dependências)
  const t3 = await fetch("http://localhost:3499/health/ready");
  const d3 = await t3.json();
  assert(
    (t3.status === 200 || t3.status === 503) && d3.type === "readiness" && d3.dependencies,
    "Endpoint /health/ready avalia dependências e retorna type: readiness com status determinístico"
  );

  // TESTE 4: Readiness probe em /api/health/ready
  const t4 = await fetch("http://localhost:3499/api/health/ready");
  const d4 = await t4.json();
  assert(d4.type === "readiness" && d4.dependencies.supabase.status === "configured", "Endpoint /api/health/ready reporta Supabase configurado");

  // TESTE 5: Health geral em /api/health contém métricas de memória e versão
  const t5 = await fetch("http://localhost:3499/api/health");
  const d5 = await t5.json();
  assert(d5.version === "2.0.0" && d5.memory && typeof d5.memory.rss_mb === "number", "Endpoint /api/health reporta métricas de memória e versão 2.0.0");

  // TESTE 6: Persistência em DATA_DIR configurável
  const t6 = await fetch("http://localhost:3499/api/public-landing-config");
  const d6 = await t6.json();
  assert(d6.ok === true && d6.data && fs.existsSync(process.env.DATA_DIR), "Diretório de persistência DATA_DIR foi inicializado e responde normalmente");

  // Limpeza
  try {
    if (fs.existsSync(process.env.DATA_DIR)) {
      fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
    }
  } catch (_e) {}

  console.log(`\nResultado: ${passed}/${total} testes aprovados.`);
  if (passed === total) {
    console.log("Todos os testes da Etapa 10 foram concluídos com 100% de sucesso!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Erro fatal nos testes:", err);
  process.exit(1);
});
