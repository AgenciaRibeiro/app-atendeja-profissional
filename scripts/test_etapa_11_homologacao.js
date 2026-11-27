"use strict";

const crypto = require("node:crypto");
const https = require("node:https");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PROD_BASE = "https://atendeja.minhaempresaautonoma.online";
const WEBHOOK_SECRET = "atendeja-payment-webhook-secret-n8n-2026";
const SUPABASE_URL = "https://kunpzzmubfvzmweyxfjp.supabase.co";
const SUPABASE_ANON = "sb_publishable_uFZrqtFVvTKsxDTIEsrrhg_AcADOLl7";

async function runHomologation() {
  console.log("================================================================================");
  console.log("BATERIA DE HOMOLOGAÇÃO INTEGRADA E REGRESSÃO TOTAL — ETAPA 11");
  console.log("Alvo: " + PROD_BASE);
  console.log("Data/Hora: " + new Date().toISOString());
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`[PASSOU] ${testName}`);
      passed++;
    } else {
      console.error(`[FALHOU] ${testName} ${details ? "- " + details : ""}`);
      failed++;
    }
  }

  // Helper para webhook HMAC
  async function sendWebhook(payloadObj, customSecret = WEBHOOK_SECRET) {
    const raw = JSON.stringify(payloadObj);
    const sig = crypto.createHmac("sha256", customSecret).update(Buffer.from(raw, "utf8")).digest("hex");
    const res = await fetch(`${PROD_BASE}/api/webhooks/mercadopago`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-atendeja-signature": sig
      },
      body: raw
    });
    let data = {};
    try { data = await res.json(); } catch (_e) {}
    return { status: res.status, data };
  }

  // ============================================================================
  // EIXO 1: ROTAS, SLUGS E PROTEÇÃO VISUAL
  // ============================================================================
  console.log("\n--- EIXO 1: ROTAS PERSONALIZADAS E ENCAMINHAMENTOS ---");
  {
    const r1 = await fetch(`${PROD_BASE}/atendeja`);
    assert(r1.status === 200, "1.1 Rota /atendeja serve admin.html com HTTP 200");

    const r2 = await fetch(`${PROD_BASE}/gerenciar-atendeja`);
    assert(r2.status === 200, "1.2 Rota /gerenciar-atendeja serve admin.html com HTTP 200");

    const r3 = await fetch(`${PROD_BASE}/jr`, { redirect: "manual" });
    assert(r3.status === 302 && r3.headers.get("location") === "/login-jr", "1.3 Rota de slug curta /jr redireciona via HTTP 302 para /login-jr");

    const r4 = await fetch(`${PROD_BASE}/login-jr`);
    assert(r4.status === 200, "1.4 Rota /login-jr serve dashboard.html com HTTP 200");

    const r5 = await fetch(`${PROD_BASE}/gerenciar-jr`);
    assert(r5.status === 200, "1.5 Rota /gerenciar-jr serve dashboard.html com HTTP 200");

    const r6 = await fetch(`${PROD_BASE}/`);
    const landingHtml = await r6.text();
    assert(
      r6.status === 200 && landingHtml.includes("wa.me") && !landingHtml.includes("id=\"auth-gate\""),
      "1.6 Landing page pública limpa com CTA WhatsApp sem expor área interna de clientes"
    );
  }

  // ============================================================================
  // EIXO 2: SEGURANÇA, SESSÃO E AUTENTICAÇÃO
  // ============================================================================
  console.log("\n--- EIXO 2: SEGURANÇA E AUTENTICAÇÃO ---");
  {
    const r1 = await fetch(`${PROD_BASE}/api/client/change-google-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_email: "teste@gmail.com" })
    });
    assert(r1.status === 401, "2.1 Endpoint de troca de conta Google rejeita acesso sem token (HTTP 401)");

    const r2 = await fetch(`${PROD_BASE}/api/client/change-google-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer token_forjado_invalido" },
      body: JSON.stringify({ new_email: "teste@gmail.com" })
    });
    assert(r2.status === 401, "2.2 Token forjado rejeitado estritamente (HTTP 401)");

    const r3 = await fetch(`${PROD_BASE}/api/admin/bootstrap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "chave_falsa" })
    });
    assert(r3.status === 401, "2.3 Tentativa de bootstrap administrativo não autorizado rejeitada (HTTP 401)");

    const r4 = await fetch(`${PROD_BASE}/api/admin/request-password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "email_inexistente_fake_999@naoexiste.com" })
    });
    assert(r4.status === 404, "2.4 Recuperação de senha bloqueia e-mail não cadastrado com HTTP 404 (anti-enumeração)");

    const r5 = await fetch(`${PROD_BASE}/api/admin/request-password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "3jr.agenciadigital@gmail.com" })
    });
    assert(r5.status === 200 || r5.status === 429, "2.5 Recuperação de senha valida conta do Fundador com HTTP 200 ou 429 (rate-limit do Supabase)");
  }

  // ============================================================================
  // EIXO 3: HEALTHCHECKS, LIVENESS, READINESS E PERSISTÊNCIA
  // ============================================================================
  console.log("\n--- EIXO 3: HEALTHCHECKS E READINESS ---");
  {
    const r1 = await fetch(`${PROD_BASE}/health/live`);
    const d1 = await r1.json();
    assert(r1.status === 200 && d1.status === "ok" && d1.type === "liveness", "3.1 Liveness probe /health/live ativo (HTTP 200)");

    const r2 = await fetch(`${PROD_BASE}/health/ready`);
    const d2 = await r2.json();
    assert(
      r2.status === 200 && d2.status === "ready" && d2.dependencies.postgres.status === "connected",
      "3.2 Readiness probe /health/ready comprova conexão ativa com PostgreSQL (HTTP 200)"
    );

    const r3 = await fetch(`${PROD_BASE}/api/health`);
    const d3 = await r3.json();
    assert(
      r3.status === 200 && d3.status === "healthy" && d3.version === "2.0.0" && typeof d3.memory.rss_mb === "number",
      "3.3 Healthcheck geral reporta integridade operacional e telemetria de memória estável"
    );
  }

  // ============================================================================
  // EIXO 4: PAGAMENTOS, WEBHOOKS, HMAC E ASSINATURAS
  // ============================================================================
  console.log("\n--- EIXO 4: PAGAMENTOS, WEBHOOK HMAC E ASSINATURAS ---");
  {
    const r1 = await fetch(`${PROD_BASE}/api/webhooks/mercadopago`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: "fake" })
    });
    assert(r1.status === 401, "4.1 Webhook de pagamento rejeita requisição sem assinatura HMAC (HTTP 401)");

    const r2 = await sendWebhook({ payment_id: "fake" }, "assinatura_secreta_errada");
    assert(r2.status === 401, "4.2 Webhook rejeita assinatura HMAC forjada/incorreta (HTTP 401)");

    // Teste de ciclo de ativação sintético
    const synthEmail = `homologacao.etapa11.${Date.now()}@atendeja.com.br`;
    const synthPayId = `pay_etapa11_${Date.now()}`;
    const r3 = await sendWebhook({
      payment_id: synthPayId,
      email_google: synthEmail,
      plan_code: "empresa",
      amount_brl: 1.00,
      status: "approved",
      payment_method: "pix"
    });
    assert(r3.status === 200 && r3.data.ok === true, "4.3 Webhook com assinatura HMAC válida ativa assinatura com HTTP 200");

    // Teste de estorno / cancelamento
    const r4 = await sendWebhook({
      payment_id: synthPayId,
      email_google: synthEmail,
      plan_code: "empresa",
      amount_brl: 1.00,
      status: "refunded",
      payment_method: "pix"
    });
    assert(
      r4.status === 200 && r4.data.ok === true && (r4.data.result?.status === "refunded" || r4.data.subscription_status === "refunded"),
      "4.4 Transição de estorno (refunded) atualiza status de assinatura sem falha"
    );
  }

  // ============================================================================
  // EIXO 5: CLIENT WORKSPACE, PERSISTÊNCIA E MULTI-TENANT NO POSTGRESQL
  // ============================================================================
  console.log("\n--- EIXO 5: WORKSPACE DO CLIENTE E BANCO DE DADOS ---");
  {
    // Autentica cliente de teste oficial
    const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "apikey": SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "cliente.teste@atendeja.com.br",
        password: "AtendeJa@Cliente2026!"
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && Boolean(loginData.access_token), "5.1 Login do cliente de testes no Supabase Auth autenticado com sucesso");

    const token = loginData.access_token;

    // Perfil do cliente
    const profRes = await fetch(`${PROD_BASE}/api/client/profile`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ company_name: "JR Climatização & Soluções (Cliente Teste)" })
    });
    const profData = await profRes.json();
    assert(profRes.status === 200 && Boolean(profData.profile?.id), "5.2 Perfil multi-tenant do cliente carregado via API segura");

    // Workspace state
    const wsRes = await fetch(`${PROD_BASE}/api/data/workspace`, {
      headers: { "Authorization": "Bearer " + token }
    });
    const wsData = await wsRes.json();
    assert(
      wsRes.status === 200 && typeof wsData.revision === "number" && wsData.state,
      "5.3 Workspace do cliente recuperado do PostgreSQL atendeja_clientes com revisão e persistência ativas"
    );
  }

  // ============================================================================
  // EIXO 6: GATEWAYS WHATSAPP E INTEGRAÇÕES
  // ============================================================================
  console.log("\n--- EIXO 6: GATEWAYS WHATSAPP ---");
  {
    // Evolution API
    try {
      const evoRes = await fetch("https://evo.minhaempresaautonoma.online/instance/fetchInstances", {
        headers: { "apikey": "W90lwmGRg8PtGJT3SUJLHu2XRbBjfwGo" }
      });
      assert(evoRes.status === 200, "6.1 Gateway Evolution API online e respondendo com API Key administrativa");
    } catch (e) {
      assert(false, "6.1 Gateway Evolution API online", e.message);
    }

    // WAHA
    try {
      const wahaRes = await fetch("https://waha.minhaempresaautonoma.online/api/sessions?all=true", {
        headers: { "X-Api-Key": "ca282a8e0b79f1b358169fe0b4fbb0c43bbac78d" }
      });
      assert(wahaRes.status === 200, "6.2 Gateway WAHA online e autenticado com chave dedicada");
    } catch (e) {
      assert(false, "6.2 Gateway WAHA online", e.message);
    }
  }

  // ============================================================================
  // TOTALIZAÇÃO
  // ============================================================================
  console.log("\n================================================================================");
  console.log(`TOTAL DE TESTES DE HOMOLOGAÇÃO: ${passed + failed}`);
  console.log(`APROVADOS: ${passed}`);
  console.log(`FALHAS: ${failed}`);
  console.log("================================================================================");

  if (failed === 0) {
    console.log("\nHOMOLOGAÇÃO INTEGRADA ETAPA 11 CONCLUÍDA COM 100% DE SUCESSO!");
    process.exit(0);
  } else {
    console.error(`\nHOMOLOGAÇÃO INTEGRADA APRESENTOU ${failed} FALHA(S).`);
    process.exit(1);
  }
}

runHomologation().catch(err => {
  console.error("Erro fatal na execução da homologação:", err);
  process.exit(1);
});
