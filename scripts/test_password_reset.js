"use strict";

const http = require("node:http");

async function test() {
  process.env.PORT = "3299";
  process.env.SUPABASE_URL = "https://kunpzzmubfvzmweyxfjp.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_uFZrqtFVvTKsxDTIEsrrhg_AcADOLl7";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_7kRfK5q86vmUhg6PSylSZw_CVqWuA_l";
  
  // Inicia servidor em background
  const srv = require("../server.js");
  await new Promise(r => setTimeout(r, 1000));

  console.log("=== TESTE 1: Recuperação com e-mail inexistente ===");
  const res1 = await fetch("http://localhost:3299/api/admin/request-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "email_que_nao_existe_12345@gmail.com" })
  });
  const data1 = await res1.json();
  console.log("Status esperado 404, recebido:", res1.status);
  console.log("Mensagem de erro recebida:", data1.error);
  if (res1.status === 404 && data1.error.includes("não está cadastrado")) {
    console.log("[PASSOU] E-mail inexistente rejeitado com 404 e mensagem clara.");
  } else {
    throw new Error("Falha no teste 1!");
  }

  console.log("\n=== TESTE 2: Recuperação com e-mail válido do Fundador ===");
  const res2 = await fetch("http://localhost:3299/api/admin/request-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "3jr.agenciadigital@gmail.com" })
  });
  const data2 = await res2.json();
  console.log("Status recebido:", res2.status);
  console.log("Resposta recebida:", data2);
  if (res2.status === 200 || res2.status === 429) {
    console.log("[PASSOU] E-mail válido processado pelo Supabase Auth.");
  } else {
    throw new Error("Falha no teste 2!");
  }

  console.log("\nTodos os testes de recuperação de senha passaram com sucesso!");
  process.exit(0);
}

test().catch(err => {
  console.error("ERRO:", err);
  process.exit(1);
});
