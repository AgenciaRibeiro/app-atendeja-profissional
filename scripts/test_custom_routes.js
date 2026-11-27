const http = require("http");
const assert = require("assert");
const { fork } = require("child_process");

async function run() {
  console.log("=== BATERIA DE TESTES: ROTAS PERSONALIZADAS E REDIRECIONAMENTOS ===");

  const TEST_PORT = 3199;
  const child = fork("server.js", [], {
    env: Object.assign({}, process.env, {
      PORT: String(TEST_PORT),
      FOUNDER_BOOTSTRAP_TOKEN: "test-token"
    }),
    stdio: ["ignore", "pipe", "pipe", "ipc"]
  });

  child.stdout.on("data", d => process.stdout.write("[SERVER] " + d));
  child.stderr.on("data", d => process.stderr.write("[SERVER ERR] " + d));

  await new Promise((resolve) => setTimeout(resolve, 3000));

  function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(`http://127.0.0.1:${TEST_PORT}${path}`, Object.assign({
        method: "GET"
      }, options), (res) => {
        let body = "";
        res.on("data", chunk => body += chunk);
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
      });
      req.on("error", reject);
      req.end();
    });
  }

  try {
    // 1. Admin login route: /atendeja
    const atendejaRes = await request("/atendeja");
    assert.strictEqual(atendejaRes.status, 200);
    assert.ok(atendejaRes.body.includes("admin.js") || atendejaRes.body.includes("Painel do Fundador") || atendejaRes.body.includes("admin"), "Deve servir admin.html");
    console.log("[PASSOU] Rota /atendeja serve admin.html com HTTP 200");

    // 2. Admin dashboard route: /gerenciar-atendeja
    const gerenciarAtendejaRes = await request("/gerenciar-atendeja");
    assert.strictEqual(gerenciarAtendejaRes.status, 200);
    assert.ok(gerenciarAtendejaRes.body.includes("admin.js") || atendejaRes.body.includes("Painel do Fundador"), "Deve servir admin.html");
    console.log("[PASSOU] Rota /gerenciar-atendeja serve admin.html com HTTP 200");

    // 3. Client slug route: /paulopintor (deve redirecionar 302 para /login-paulopintor)
    const slugRes = await request("/paulopintor");
    assert.strictEqual(slugRes.status, 302);
    assert.strictEqual(slugRes.headers.location, "/login-paulopintor");
    console.log("[PASSOU] Rota /paulopintor redireciona via HTTP 302 para /login-paulopintor");

    // 3.1 Slug curto (2 caracteres): /jr (deve redirecionar 302 para /login-jr)
    const jrSlugRes = await request("/jr");
    assert.strictEqual(jrSlugRes.status, 302);
    assert.strictEqual(jrSlugRes.headers.location, "/login-jr");
    console.log("[PASSOU] Rota curta /jr redireciona via HTTP 302 para /login-jr");

    // 4. Client login page: /login-paulopintor
    const loginSlugRes = await request("/login-paulopintor");
    assert.strictEqual(loginSlugRes.status, 200);
    assert.ok(loginSlugRes.body.includes("dashboard.js") || loginSlugRes.body.includes("auth-gate"), "Deve servir dashboard.html");
    console.log("[PASSOU] Rota /login-paulopintor serve dashboard.html com HTTP 200");

    // 5. Client dashboard page: /gerenciar-paulopintor
    const gerenciarSlugRes = await request("/gerenciar-paulopintor");
    assert.strictEqual(gerenciarSlugRes.status, 200);
    assert.ok(gerenciarSlugRes.body.includes("dashboard.js") || gerenciarSlugRes.body.includes("app-layout"), "Deve servir dashboard.html");
    console.log("[PASSOU] Rota /gerenciar-paulopintor serve dashboard.html com HTTP 200");

    // 6. Landing page: index.html sem botão de login, com WhatsApp
    const homeRes = await request("/");
    assert.strictEqual(homeRes.status, 200);
    assert.ok(homeRes.body.includes("Falar no WhatsApp"), "Menu deve ter botão direto para WhatsApp");
    assert.ok(!homeRes.body.includes('href="/admin"') && !homeRes.body.includes('href="/dashboard"'), "Landing não deve expor rotas internas");
    console.log("[PASSOU] Landing page entrega botão direto para WhatsApp sem expor login/dashboard");

    console.log("\nTodos os 6 testes de rotas personalizadas foram aprovados com 100% de sucesso!");
  } finally {
    child.kill();
  }
}

run().catch(err => {
  console.error("FALHA:", err);
  process.exit(1);
});
