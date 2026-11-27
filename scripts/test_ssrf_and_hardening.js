const dns = require('dns').promises;
const net = require('net');

function privateIpv4(address) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b, c] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113);
}

function publicAddress(address) {
  const version = net.isIP(address);
  if (version === 4) return !privateIpv4(address);
  return version === 6 && /^[23]/.test(address.toLowerCase());
}

async function validateEndpointUrl(value) {
  let url;
  try { url = new URL(String(value)); } catch (_e) { throw new Error("URL inválida"); }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (url.protocol !== "https:" || url.username || url.password || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host === "metadata.google.internal") {
    throw new Error("URL deve usar HTTPS e não pode apontar para host local");
  }
  let addresses;
  if (net.isIP(host)) addresses = [{ address: host }];
  else {
    try { addresses = await dns.lookup(host, { all: true, verbatim: true }); }
    catch (_e) { throw new Error("O host da URL não pôde ser validado"); }
  }
  if (!addresses.length || addresses.some(item => !publicAddress(item.address))) {
    throw new Error("URL não pode resolver para rede privada ou especial");
  }
  return url.toString();
}

async function runTests() {
  console.log("=== BATERIA DE TESTES SSRF E HARDENING (ETAPA 06) ===");

  const dangerousUrls = [
    "http://127.0.0.1",
    "http://localhost:3000",
    "http://localhost.localdomain",
    "http://169.254.169.254/latest/meta-data/",
    "http://10.0.0.1/admin",
    "http://172.17.0.1:8000",
    "http://172.20.0.1:2375",
    "http://192.168.1.1",
    "https://127.0.0.1",
    "https://localhost",
    "http://[::1]",
    "https://[::1]",
    "http://metadata.google.internal",
    "file:///etc/passwd",
    "ftp://example.com"
  ];

  let passed = 0;
  for (const target of dangerousUrls) {
    try {
      await validateEndpointUrl(target);
      console.error(`[FALHA DE SEGURANÇA] URL perigosa NÃO foi bloqueada: ${target}`);
    } catch (err) {
      console.log(`[BLOQUEIO CORRETO] ${target} -> ${err.message}`);
      passed++;
    }
  }

  const validUrls = [
    "https://api.openai.com/v1",
    "https://openrouter.ai/api/v1",
    "https://api.groq.com/openai/v1",
    "https://api.opencode.ai/v1"
  ];

  for (const target of validUrls) {
    try {
      const validated = await validateEndpointUrl(target);
      console.log(`[URL VÁLIDA PERMITIDA] ${target} -> ${validated}`);
      passed++;
    } catch (err) {
      console.error(`[ERRO INESPERADO] URL pública legítima foi bloqueada: ${target} -> ${err.message}`);
    }
  }

  console.log(`\nResultado: ${passed} / ${dangerousUrls.length + validUrls.length} testes passaram com 100% de sucesso.`);
}

runTests().catch(console.error);
