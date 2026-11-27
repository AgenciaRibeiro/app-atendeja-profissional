"use strict";

const http = require("node:http");
const fs = require("node:fs");

async function runTests() {
  process.env.PORT = "3399";
  process.env.SUPABASE_URL = "https://kunpzzmubfvzmweyxfjp.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_uFZrqtFVvTKsxDTIEsrrhg_AcADOLl7";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_7kRfK5q86vmUhg6PSylSZw_CVqWuA_l";
  process.env.FOUNDER_BOOTSTRAP_TOKEN = "atendeja-founder-bootstrap-2026-secure-token";

  // Inicia servidor
  const srv = require("../server.js");
  await new Promise(r => setTimeout(r, 1000));

  console.log("=== BATERIA DE TESTES ETAPA 09: AUTENTICAÇÃO, SESSÃO E SEGURANÇA ===");

  // TESTE 1: Troca de conta Google sem autenticação -> 401
  const t1 = await fetch("http://localhost:3399/api/client/change-google-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_email: "novo@gmail.com" })
  });
  if (t1.status === 401) {
    console.log("[PASSOU 1/7] Troca de conta Google sem autenticação bloqueada com HTTP 401.");
  } else {
    throw new Error(`Falha no teste 1: esperado 401, recebido ${t1.status}`);
  }

  // TESTE 2: Troca de conta Google com token falso -> 401
  const t2 = await fetch("http://localhost:3399/api/client/change-google-account", {
    method: "POST",
    headers: {
      "Authorization": "Bearer token_falso_invalido_123",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ new_email: "novo@gmail.com" })
  });
  if (t2.status === 401) {
    console.log("[PASSOU 2/7] Token forjado rejeitado na troca de conta Google com HTTP 401.");
  } else {
    throw new Error(`Falha no teste 2: esperado 401, recebido ${t2.status}`);
  }

  // TESTE 3: Recuperação admin com e-mail inexistente -> 404
  const t3 = await fetch("http://localhost:3399/api/admin/request-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "hacker_inexistente@invasao.com" })
  });
  const d3 = await t3.json();
  if (t3.status === 404 && d3.error && d3.error.includes("não está cadastrado")) {
    console.log("[PASSOU 3/7] Recuperação de senha para e-mail não cadastrado bloqueada com HTTP 404.");
  } else {
    throw new Error(`Falha no teste 3: esperado 404, recebido ${t3.status}`);
  }

  // TESTE 4: Recuperação admin com e-mail do Fundador -> 200 ou 429 (rate limit)
  const t4 = await fetch("http://localhost:3399/api/admin/request-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "3jr.agenciadigital@gmail.com" })
  });
  if (t4.status === 200 || t4.status === 429) {
    console.log(`[PASSOU 4/7] Recuperação para Fundador aceita com status HTTP ${t4.status}.`);
  } else {
    throw new Error(`Falha no teste 4: esperado 200/429, recebido ${t4.status}`);
  }

  // TESTE 5: Acesso a rotas administrativas sem autenticação -> 401
  const t5 = await fetch("http://localhost:3399/api/admin/me");
  if (t5.status === 401) {
    console.log("[PASSOU 5/7] Endpoint administrativo protegido contra acesso não autenticado (HTTP 401).");
  } else {
    throw new Error(`Falha no teste 5: esperado 401, recebido ${t5.status}`);
  }

  // TESTE 6: Bootstrap de fundador sem autenticação ou com credencial inválida -> 401/403/409
  const t6 = await fetch("http://localhost:3399/api/admin/bootstrap", {
    method: "POST",
    headers: {
      "X-Founder-Bootstrap-Token": "token-errado",
      "Content-Type": "application/json"
    }
  });
  if ([401, 403, 409].includes(t6.status)) {
    console.log(`[PASSOU 6/7] Tentativa de bootstrap não autorizada rejeitada com HTTP ${t6.status}.`);
  } else {
    throw new Error(`Falha no teste 6: status inesperado ${t6.status}`);
  }

  // TESTE 7: Elementos do Modal de Troca de Conta no frontend
  const dashHtml = fs.readFileSync("dashboard.html", "utf8");
  const hasModal = dashHtml.includes('id="change-google-modal"');
  const hasBtn = dashHtml.includes('id="btn-open-change-google"');
  const hasForm = dashHtml.includes('id="change-google-form"');
  if (hasModal && hasBtn && hasForm) {
    console.log("[PASSOU 7/7] Modal e botões de troca de conta Google presentes no dashboard.html.");
  } else {
    throw new Error("Falha no teste 7: elementos do modal não encontrados no dashboard.html");
  }

  console.log("\nTODOS OS 7 TESTES DA ETAPA 09 FORAM APROVADOS COM SUCESSO!");
  process.exit(0);
}

runTests().catch(err => {
  console.error("ERRO:", err);
  process.exit(1);
});
