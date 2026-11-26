"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const dns = require("node:dns").promises;
const net = require("node:net");
const { Pool } = require("pg");

const ROOT = __dirname;
try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(path.join(__dirname, ".env"));
  } else if (fs.existsSync(path.join(__dirname, ".env"))) {
    const rawEnv = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
    for (const line of rawEnv.split("\n")) {
      const match = /^\s([\w.-]+)\s=\s(.)?\s*$/.exec(line);
      if (match && process.env[match[1]] === undefined) {
        let val = (match[2] || "").trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[match[1]] = val;
      }
    }
  }
} catch (_e) {}

const PORT = Number(process.env.PORT || 3000);
const SUPABASE_URL = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DATABASE_URL = process.env.DATABASE_URL || "";
const BOOTSTRAP_TOKEN = process.env.FOUNDER_BOOTSTRAP_TOKEN || "";
const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "";
const CORS_ORIGINS = new Set(String(process.env.CORS_ORIGIN || "").split(",").map(x => x.trim()).filter(Boolean));
const STATUS_VALUES = new Set(["trial", "active", "past_due", "canceled", "suspended"]);
const PLAN_CODE = /^[a-z0-9_-]{1,40}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const limiter = new Map();
const pool = DATABASE_URL ? new Pool({
  connectionString: DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.PGSSL === "true"
    ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== "false" }
    : false
}) : null;

const RESOURCES = {
  leads: {
    table: "leads",
    fields: ["nome", "whatsapp", "servico", "nicho", "valor", "retorno_data", "stage", "obs", "auto_stage", "last_auto_reason"],
    order: "created_at DESC"
  },
  lead_messages: {
    table: "lead_messages",
    fields: ["lead_id", "sender", "content", "detected_trigger", "moved_to_stage"],
    order: "created_at ASC"
  },
  lead_history: {
    table: "lead_history",
    fields: ["lead_id", "event_type", "description"],
    order: "created_at DESC"
  },
  planning_goals: {
    table: "planning_goals",
    fields: ["period_mode", "meta_clientes", "meta_faturamento", "capacidade_dia", "observacoes"],
    order: "created_at DESC"
  },
  planning_services: {
    table: "planning_services",
    fields: ["nome", "preco", "meta_qtd"],
    order: "created_at DESC"
  },
  planning_tasks: {
    table: "planning_tasks",
    fields: ["day_key", "title", "done"],
    order: "created_at ASC"
  },
  planning_cycles: {
    table: "planning_cycles",
    fields: ["period_mode", "meta_clientes", "clientes_reais", "meta_faturamento", "faturamento_real", "task_pct"],
    order: "closed_at DESC"
  },
  assistants: {
    table: "assistants",
    fields: ["nome", "especialidade", "capacidades", "prompt", "ativo", "whatsapp_binding", "ai_binding"],
    order: "created_at DESC"
  },
  api_connections: {
    table: "api_connections",
    fields: ["kind", "provider", "endpoint_url", "model_or_session", "key_last4", "ativo"],
    order: "created_at DESC"
  }
};

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".ico": "image/x-icon"
};

function send(res, status, value, extraHeaders = {}) {
  const body = Buffer.from(JSON.stringify(value));
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
    "Cache-Control": "no-store",
    ...extraHeaders
  });
  res.end(body);
}

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' " + (SUPABASE_URL || "'none'") + "; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!origin) return;
  let sameOrigin = false;
  try { sameOrigin = new URL(origin).host === req.headers.host; } catch (_e) {}
  if (!sameOrigin && !CORS_ORIGINS.has(origin)) throw fail(403, "Origem não autorizada");
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Founder-Bootstrap-Token");
  res.setHeader("Access-Control-Max-Age", "600");
}

function rateLimit(req) {
  const now = Date.now();
  const ip = String(req.socket.remoteAddress || "unknown");
  let entry = limiter.get(ip);
  if (!entry || now - entry.start > 60000) entry = { start: now, count: 0 };
  entry.count += 1;
  limiter.set(ip, entry);
  if (limiter.size > 5000) {
    for (const [key, value] of limiter) if (now - value.start > 60000) limiter.delete(key);
  }
  if (entry.count > 180) throw fail(429, "Muitas solicitações; aguarde um minuto");
}

async function readBody(req) {
  const buffer = await readRawBody(req);
  if (!buffer.length) return {};
  try { return JSON.parse(buffer.toString("utf8")); }
  catch (_e) { throw fail(400, "JSON inválido"); }
}

async function readRawBody(req) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 1024 * 1024) throw fail(413, "Corpo da solicitação excede 1 MB");
  // Rate limit reforçado por plano
  if (req.userPlan && req.userPlan.max_apis && entry.count > req.userPlan.max_apis * 15) throw fail(429, "Limite de API do seu plano atingido");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function requireServerConfig(includeDatabase = false) {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SECRET_KEY) {
    throw fail(503, "Supabase não configurado no servidor");
  }
  if (includeDatabase && !pool) throw fail(503, "PostgreSQL não configurado no servidor");
}

async function supabaseAuthUser(token) {
  requireServerConfig(false);
  const response = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: "Bearer " + token }
  });
  if (!response.ok) throw fail(401, "Sessão inválida ou expirada");
  return response.json();
}

async function supabaseRest(pathname, options = {}) {
  requireServerConfig(false);
  const response = await fetch(SUPABASE_URL + "/rest/v1/" + pathname, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: "Bearer " + SUPABASE_SECRET_KEY,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error("Supabase respondeu " + response.status);
    error.status = response.status >= 500 ? 502 : 400;
    throw error;
  }
  if (!text) return null;
  try { return JSON.parse(text); } catch (_e) { return null; }
}

async function supabaseUserRpc(token, name, body) {
  requireServerConfig(false);
  if (!/^[a-z_]{1,64}$/.test(name)) throw fail(400, "Operação inválida");
  const response = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + name, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error("Não foi possível registrar o perfil no Supabase");
    error.status = response.status >= 500 ? 502 : 400;
    throw error;
  }
  if (!text) return null;
  try { return JSON.parse(text); } catch (_e) { return null; }
}

async function authenticate(req) {
  const value = String(req.headers.authorization || "");
  const match = /^Bearer\s+(.+)$/i.exec(value);
  if (!match) throw fail(401, "Autenticação necessária");
  const user = await supabaseAuthUser(match[1]);
  if (!user || !UUID.test(String(user.id || ""))) throw fail(401, "Sessão inválida");
  return { user, token: match[1] };
}

async function requireAdmin(req) {
  const session = await authenticate(req);
  const query = new URLSearchParams({
    select: "id,role,active",
    auth_user_id: "eq." + session.user.id,
    active: "eq.true",
    role: "in.(founder,admin)",
    limit: "1"
  });
  const rows = await supabaseRest("admin_users?" + query.toString());
  if (!Array.isArray(rows) || !rows.length) throw fail(403, "Acesso administrativo não autorizado");
  return { ...session, admin: rows[0] };
}

async function getClient(user) {
  const query = new URLSearchParams({
    select: "id,plan_code,subscription_status,trial_ends_at",
    auth_user_id: "eq." + user.id,
    limit: "1"
  });
  const rows = await supabaseRest("clients?" + query.toString());
  if (!Array.isArray(rows) || !rows.length) throw fail(403, "Cadastro de contratante não encontrado");
  const client = rows[0];
  if (client.subscription_status === "trial" && new Date(client.trial_ends_at) < new Date()) {
    throw fail(402, "Período de teste encerrado");
  }
  if (!STATUS_VALUES.has(client.subscription_status) || !["trial", "active"].includes(client.subscription_status)) {
    throw fail(402, "Assinatura sem acesso operacional");
  }
  return client;
}

async function getPlanCaps(code) {
  const query = new URLSearchParams({
    select: "code,max_assistants,max_apis,monthly_planning,capabilities",
    code: "eq." + code,
    limit: "1"
  });
  const rows = await supabaseRest("plans?" + query.toString());
  if (!Array.isArray(rows) || !rows.length) throw fail(503, "Plano do contratante não configurado");
  return rows[0];
}

async function withTenant(clientId, action) {
  requireServerConfig(true);
  const connection = await pool.connect();
  try {
    await connection.query("BEGIN");
    await connection.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    const value = await action(connection);
    await connection.query("COMMIT");
    return value;
  } catch (error) {
    try { await connection.query("ROLLBACK"); } catch (_e) {}
    throw error;
  } finally {
    connection.release();
  }
}

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
  // Allow only global unicast IPv6 (2000::/3); this also blocks mapped/local ranges.
  return version === 6 && /^[23]/.test(address.toLowerCase());
}

async function validateEndpointUrl(value) {
  let url;
  try { url = new URL(String(value)); } catch (_e) { throw fail(400, "URL inválida"); }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (url.protocol !== "https:" || url.username || url.password || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host === "metadata.google.internal") {
    throw fail(400, "URL deve usar HTTPS e não pode apontar para host local");
  }
  let addresses;
  if (net.isIP(host)) addresses = [{ address: host }];
  else {
    try { addresses = await dns.lookup(host, { all: true, verbatim: true }); }
    catch (_e) { throw fail(400, "O host da URL não pôde ser validado"); }
  }
  if (!addresses.length || addresses.some(item => !publicAddress(item.address))) throw fail(400, "URL não pode resolver para rede privada ou especial");
  return url.toString();
}

async function cleanPayload(resource, payload, creating) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw fail(400, "Objeto de dados inválido");
  const allowed = RESOURCES[resource].fields;
  const output = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!allowed.includes(key)) throw fail(400, "Campo não permitido: " + key);
    if (key === "endpoint_url" && value) {
      output[key] = await validateEndpointUrl(value);
    } else {
      output[key] = value;
    }
  }
  if (creating && !Object.keys(output).length) throw fail(400, "Nenhum campo válido enviado");
  return output;
}

function validateResource(resource) {
  if (!Object.prototype.hasOwnProperty.call(RESOURCES, resource)) throw fail(404, "Recurso não encontrado");
  return RESOURCES[resource];
}

async function enforcePlan(client, resource, connection, creating, payload, recordId = "") {
  const caps = await getPlanCaps(client.plan_code);
  if (resource === "planning_goals" && !caps.monthly_planning) {
    let period = payload.period_mode;
    if (!period && recordId) {
      const current = await connection.query("SELECT period_mode FROM public.planning_goals WHERE id=$1 AND client_id=$2", [recordId, client.id]);
      period = current.rows[0] && current.rows[0].period_mode;
    }
    if (period === "mensal") throw fail(403, "Planejamento mensal exige plano superior");
  }
  if (resource === "assistants" && payload.capacidades !== undefined) {
    if (!Array.isArray(payload.capacidades) || payload.capacidades.some(cap => !caps.capabilities.includes(cap))) {
      throw fail(403, "Uma ou mais capacidades não estão disponíveis no plano atual");
    }
  }
  if (!creating) return;
  if (resource === "assistants") {
    await connection.query("SELECT pg_advisory_xact_lock(74591, hashtext($1))", [client.id]);
    const count = await connection.query("SELECT COUNT(*)::int AS total FROM public.assistants WHERE client_id = $1", [client.id]);
    if (count.rows[0].total >= caps.max_assistants) throw fail(403, `Limite de ${caps.max_assistants} assistentes do seu plano ${caps.code} atingido. Upgrade para mais.`);
  }
  if (resource === "api_connections") {
    await connection.query("SELECT pg_advisory_xact_lock(74591, hashtext($1))", [client.id]);
    const count = await connection.query("SELECT COUNT(*)::int AS total FROM public.api_connections WHERE client_id = $1", [client.id]);
    if (count.rows[0].total >= caps.max_apis) throw fail(403, `Limite de ${caps.max_apis} conexões API do seu plano ${caps.code} atingido. Upgrade para mais.`);
  }
}

async function handleTenantData(req, res, url, parts) {
  if (parts[2] === "workspace") return handleWorkspace(req, res);
  const resource = decodeURIComponent(parts[2] || "");
  const schema = validateResource(resource);
  const { user } = await authenticate(req);
  const client = await getClient(user);
  const id = parts[3] ? decodeURIComponent(parts[3]) : "";
  if (id && !UUID.test(id)) throw fail(400, "Identificador inválido");

  if (req.method === "GET" && !id) {
    const result = await withTenant(client.id, conn => conn.query(
      "SELECT * FROM public." + schema.table + " WHERE client_id = $1 ORDER BY " + schema.order + " LIMIT 250",
      [client.id]
    ));
    return send(res, 200, { data: result.rows });
  }

  if (req.method === "POST" && !id) {
    const payload = await cleanPayload(resource, await readBody(req), true);
    const caps = await getPlanCaps(client.plan_code);
    const result = await withTenant(client.id, async conn => {
      await enforcePlan(client, resource, conn, true, payload);
      const fields = Object.keys(payload);
      const values = fields.map(k => payload[k]);
      fields.push("client_id"); values.push(client.id);
      const columns = fields.map(k => '"' + k + '"').join(", ");
      const slots = values.map((_v, i) => "$" + (i + 1)).join(", ");
      if (resource === "planning_goals") {
        const updates = Object.keys(payload).filter(k => k !== "period_mode")
          .map(k => '"' + k + '" = EXCLUDED."' + k + '"').join(", ");
        const query = "INSERT INTO public." + schema.table + " (" + columns + ") VALUES (" + slots + ") ON CONFLICT (client_id, period_mode) DO UPDATE SET " + (updates || '"period_mode" = EXCLUDED."period_mode"') + " RETURNING *";
        return conn.query(query, values);
      }
      return conn.query("INSERT INTO public." + schema.table + " (" + columns + ") VALUES (" + slots + ") RETURNING *", values);
    });
    return send(res, 201, { data: result.rows[0], plan: caps.code });
  }

  if (req.method === "PATCH" && id) {
    const payload = await cleanPayload(resource, await readBody(req), false);
    const fields = Object.keys(payload);
    if (!fields.length) throw fail(400, "Nenhum campo válido enviado");
    const result = await withTenant(client.id, async conn => {
      await enforcePlan(client, resource, conn, false, payload, id);
      const prior = resource === "leads" && payload.stage
        ? await conn.query("SELECT stage FROM public.leads WHERE id=$1 AND client_id=$2 FOR UPDATE", [id, client.id])
        : null;
      const values = fields.map(k => payload[k]);
      const set = fields.map((k, i) => '"' + k + '" = $' + (i + 1)).join(", ");
      values.push(id, client.id);
      const updated = await conn.query("UPDATE public." + schema.table + " SET " + set + " WHERE id=$" + (values.length - 1) + " AND client_id=$" + values.length + " RETURNING *", values);
      if (!updated.rowCount) throw fail(404, "Registro não encontrado");
      if (resource === "leads" && prior && prior.rowCount && prior.rows[0].stage !== updated.rows[0].stage) {
        await conn.query("INSERT INTO public.lead_history(client_id, lead_id, event_type, description) VALUES ($1,$2,$3,$4)", [client.id, id, updated.rows[0].stage === "fechado" ? "win" : "info", "Etapa alterada para " + updated.rows[0].stage]);
      }
      return updated;
    });
    return send(res, 200, { data: result.rows[0] });
  }

  if (req.method === "DELETE" && id) {
    const result = await withTenant(client.id, conn => conn.query(
      "DELETE FROM public." + schema.table + " WHERE id=$1 AND client_id=$2 RETURNING id",
      [id, client.id]
    ));
    if (!result.rowCount) throw fail(404, "Registro não encontrado");
    return send(res, 200, { deleted: true });
  }
  throw fail(405, "Método não permitido");
}

function sanitizeWorkspaceValue(value, depth = 0) {
  if (depth > 12) throw fail(400, "Estado local excede a profundidade permitida");
  if (Array.isArray(value)) return value.slice(0, 5000).map(item => sanitizeWorkspaceValue(item, depth + 1));
  if (!value || typeof value !== "object") return value;
  const result = {};
  const sensitiveKeys = new Set(["logoDataUrl", "plano", "subscriptionStatus", "trialEndsAt", "cloudClientId", "api_key", "access_token", "refresh_token", "secret", "private_key"]);
  for (const [key, item] of Object.entries(value)) {
    if (sensitiveKeys.has(key)) continue;
    if (/^(?:api_?key|access_?token|refresh_?token|password|secret|authorization)$/i.test(key)) continue;
    if (key === "apiKeyMask" || key === "key_last4" || key === "hasKey") result[key] = item;
    else if (/key|token|password|secret|authorization/i.test(key)) continue;
    else result[key] = sanitizeWorkspaceValue(item, depth + 1);
  }
  return result;
}

async function handleWorkspace(req, res) {
  if (req.method !== "GET" && req.method !== "PUT") throw fail(405, "Método não permitido");
  const { user } = await authenticate(req);
  const client = await getClient(user);
  if (req.method === "GET") {
    const result = await withTenant(client.id, conn => conn.query(
      "SELECT revision, state, updated_at FROM public.client_workspace_state WHERE client_id=$1",
      [client.id]
    ));
    const row = result.rows[0];
    return send(res, 200, { revision: row ? Number(row.revision) : 0, state: row ? row.state : {}, updated_at: row ? row.updated_at : null });
  }
  const body = await readBody(req);
  const allowed = new Set(["tenant", "leads", "history", "planning", "assistants", "connections"]);
  if (!body || !Number.isSafeInteger(body.revision) || body.revision < 0 || !body.state || typeof body.state !== "object" || Array.isArray(body.state) || Object.keys(body.state).some(key => !allowed.has(key))) {
    throw fail(400, "Snapshot ou revisão inválida");
  }
  for (const key of ["leads", "history", "assistants"]) {
    if (body.state[key] !== undefined && !Array.isArray(body.state[key])) throw fail(400, "Formato inválido em " + key);
  }
  const state = sanitizeWorkspaceValue(body.state);
  const packed = JSON.stringify(state);
  if (Buffer.byteLength(packed, "utf8") > 900 * 1024) throw fail(413, "Estado do dashboard excede o limite de 900 KB");
  const result = await withTenant(client.id, async conn => {
    await conn.query("SELECT pg_advisory_xact_lock(74593, hashtext($1))", [client.id]);
    const current = await conn.query("SELECT revision FROM public.client_workspace_state WHERE client_id=$1 FOR UPDATE", [client.id]);
    const revision = current.rows[0] ? Number(current.rows[0].revision) : 0;
    if (revision !== body.revision) throw fail(409, "O estado mudou em outra sessão. Recarregue antes de sincronizar.");
    const next = revision + 1;
    return conn.query(
      "INSERT INTO public.client_workspace_state(client_id, revision, state, updated_at) VALUES ($1,$2,$3::jsonb,NOW()) ON CONFLICT (client_id) DO UPDATE SET revision=EXCLUDED.revision,state=EXCLUDED.state,updated_at=NOW() RETURNING revision,updated_at",
      [client.id, next, packed]
    );
  });
  return send(res, 200, { revision: Number(result.rows[0].revision), updated_at: result.rows[0].updated_at });
}

const API_CONNECTIONS_FILE = path.join(__dirname, "data", "admin_api_connections.json");
const LP_CONFIG_FILE = path.join(__dirname, "data", "landing_page_config.json");
const SUPPORTED_PROVIDERS = new Set(["openai", "openrouter", "gemini", "opencode", "groq"]);

const DEFAULT_LP_CONFIG = {
  header_brand: "Atende<span class=\"brand-accent\">Já</span>",
  nav_link1_text: "Como funciona",
  nav_link1_url: "#como-funciona",
  nav_link2_text: "Nichos",
  nav_link2_url: "#nichos",
  nav_link3_text: "Planos",
  nav_link3_url: "#planos",
  header_btn_text: "Começar agora",
  header_btn_url: "#planos",

  hero_eyebrow: "ATENDIMENTO IMEDIATO • CONTROLE DE ORÇAMENTOS",
  hero_title: "Pare de perder clientes por demora no WhatsApp.",
  hero_subtitle: "Responda leads em segundos, organize seus orçamentos e nunca mais esqueça um retorno combinado.",
  hero_btn_primary_text: "Escolher meu plano",
  hero_btn_primary_url: "#planos",
  hero_btn_secondary_text: "Testar agora",
  hero_preview_title: "Fluxo em tempo real",
  hero_step1_title: "Lead chega",
  hero_step1_desc: "\"Oi, preciso de um orçamento...\"",
  hero_step2_title: "Chat WhatsApp responde na hora",
  hero_step2_desc: "AtendeJá • 24h",
  hero_step3_title: "Orçamento + Follow-up no dia certo",
  hero_step3_desc: "Lembrete ativo ✓",

  solutions_title: "Tudo o que você precisa para não perder nenhuma venda",
  sol1_title: "01 / Atendimento Imediato 24h",
  sol1_copy: "Seu cliente chama, recebe resposta na hora e já informa o que precisa — mesmo fora do horário.",
  sol2_title: "02 / Controle de Orçamentos",
  sol2_copy: "Visualize cada orçamento enviado, pendente ou aprovado em um só lugar, sem planilhas soltas.",
  sol3_title: "03 / Lembrete no Dia Combinado",
  sol3_copy: "Retorne para o cliente exatamente na data prometida e aumente sua taxa de fechamento.",

  niches_title: "Feito para quem vive de atendimento e orçamento",
  niches_list: "Elétrica e Hidráulica, Climatização, Marcenaria, Reformas e Obras, Estética Automotiva, Serviços",

  plans_title: "Planos transparentes para o tamanho da sua operação",
  plans_subtitle: "Sem fidelidade, teste grátis e ativação imediata no WhatsApp.",
  plan_essencial_desc: "Para autônomos e quem está começando.",
  plan_essencial_btn: "Contratar",
  plan_pro_badge: "Mais escolhido",
  plan_pro_desc: "Para quem quer atender rápido e fechar mais.",
  plan_pro_btn: "Contratar",
  plan_empresa_desc: "Para equipes com maior volume diário.",
  plan_empresa_btn: "Contratar",

  footer_copy: "© 2026 AtendeJá — Atendimento imediato e controle de orçamentos no WhatsApp",
  footer_whatsapp_url: "https://wa.me/5569993768304"
};

function ensureDataDir() {
  const dir = path.dirname(API_CONNECTIONS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
}

function readLandingPageConfig() {
  ensureDataDir();
  try {
    if (!fs.existsSync(LP_CONFIG_FILE)) return { ...DEFAULT_LP_CONFIG };
    const raw = fs.readFileSync(LP_CONFIG_FILE, "utf-8");
    return { ...DEFAULT_LP_CONFIG, ...JSON.parse(raw) };
  } catch (_e) {
    return { ...DEFAULT_LP_CONFIG };
  }
}

function writeLandingPageConfig(data) {
  ensureDataDir();
  const current = readLandingPageConfig();
  const merged = { ...current, ...(data || {}), updated_at: new Date().toISOString() };
  fs.writeFileSync(LP_CONFIG_FILE, JSON.stringify(merged, null, 2), { mode: 0o600 });
  return merged;
}

function readApiConnections() {
  ensureDataDir();
  try {
    if (!fs.existsSync(API_CONNECTIONS_FILE)) return {};
    const raw = fs.readFileSync(API_CONNECTIONS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (_e) {
    return {};
  }
}

function writeApiConnections(data) {
  ensureDataDir();
  fs.writeFileSync(API_CONNECTIONS_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
}

function maskKey(key) {
  if (!key || typeof key !== "string") return "";
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "••••••••";
  return trimmed.slice(0, 4) + "••••••••" + trimmed.slice(-4);
}

async function testProviderConnection(provider, apiKey, model, baseUrl) {
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    throw fail(400, "Chave de API não informada para teste.");
  }
  const key = apiKey.trim();

  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: "Bearer " + key },
      signal: AbortSignal.timeout(10000)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw fail(res.status, "OpenAI recusou a conexão: " + (data.error && data.error.message ? data.error.message : res.statusText));
    return { ok: true, message: "Conexão com OpenAI estabelecida com sucesso! API Key válida e modelos listados." };
  }

  if (provider === "openrouter") {
    let res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: "Bearer " + key },
      signal: AbortSignal.timeout(10000)
    });
    let data = await res.json().catch(() => ({}));
    if (!res.ok) {
      res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: "Bearer " + key },
        signal: AbortSignal.timeout(10000)
      });
      data = await res.json().catch(() => ({}));
      if (!res.ok) throw fail(res.status, "OpenRouter recusou a conexão: " + (data.error && data.error.message ? data.error.message : res.statusText));
    }
    return { ok: true, message: "Conexão com OpenRouter autenticada com sucesso!" };
  }

  if (provider === "gemini") {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + encodeURIComponent(key), {
      signal: AbortSignal.timeout(10000)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw fail(res.status, "Google Gemini recusou a chave: " + (data.error && data.error.message ? data.error.message : res.statusText));
    return { ok: true, message: "Conexão com Google Gemini validada com sucesso! Chave de API ativa." };
  }

  if (provider === "groq") {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: "Bearer " + key },
      signal: AbortSignal.timeout(10000)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw fail(res.status, "Groq recusou a conexão: " + (data.error && data.error.message ? data.error.message : res.statusText));
    return { ok: true, message: "Conexão com Groq validada com sucesso! API ultra-rápida pronta." };
  }

  if (provider === "opencode") {
    const url = (baseUrl || "https://api.opencode.ai/v1").replace(/\/$/, "") + "/models";
    const res = await fetch(url, {
      headers: { Authorization: "Bearer " + key },
      signal: AbortSignal.timeout(10000)
    }).catch(err => { throw fail(502, "Não foi possível alcançar o endpoint do OpenCode: " + err.message); });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw fail(res.status, "OpenCode recusou a conexão: " + (data.error && data.error.message ? data.error.message : res.statusText));
    return { ok: true, message: "Conexão com OpenCode validada com sucesso!" };
  }

  throw fail(400, "Provedor não suportado: " + provider);
}

async function executeAiChat(params) {
  const { prompt, provider = "groq", model, systemPrompt, temperature = 0.7 } = params;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    throw fail(400, "Mensagem vazia");
  }

  const connections = readApiConnections();
  const conn = connections[provider];
  const activeKey = conn && conn.apiKey ? conn.apiKey.trim() : "";
  const activeModel = model || (conn && conn.model) || (
    provider === "groq" ? "llama-3.3-70b-versatile" :
    provider === "openai" ? "gpt-4o-mini" :
    provider === "openrouter" ? "anthropic/claude-3.5-sonnet" :
    provider === "gemini" ? "gemini-1.5-flash" :
    "opencode-base"
  );

  const sys = systemPrompt || "Você é o Assistente Executivo de IA do Fundador do AtendeJá. Seja direto, estratégico, conciso e forneça insights acionáveis.";

  if (activeKey) {
    try {
      if (provider === "gemini") {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(activeModel)}:generateContent?key=${encodeURIComponent(activeKey)}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: sys }] },
            contents: [{ parts: [{ text: prompt.trim() }] }],
            generationConfig: { temperature: Number(temperature) }
          }),
          signal: AbortSignal.timeout(30000)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error && data.error.message ? data.error.message : "Erro na API Gemini");
        const reply = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] ? data.candidates[0].content.parts[0].text : "Sem resposta do modelo";
        return { ok: true, reply, provider, model: activeModel, external: true };
      }

      let endpoint = "https://api.openai.com/v1/chat/completions";
      if (provider === "groq") endpoint = "https://api.groq.com/openai/v1/chat/completions";
      if (provider === "openrouter") endpoint = "https://openrouter.ai/api/v1/chat/completions";
      if (provider === "opencode") endpoint = ((conn && conn.baseUrl) || "https://api.opencode.ai/v1").replace(/\/$/, "") + "/chat/completions";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + activeKey
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: prompt.trim() }
          ],
          temperature: Number(temperature)
        }),
        signal: AbortSignal.timeout(30000)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error && data.error.message ? data.error.message : "Erro " + res.status + " no provedor " + provider);
      const reply = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "Sem resposta do modelo";
      return { ok: true, reply, provider, model: activeModel, external: true };
    } catch (err) {
      process.stderr.write(`AI Chat fallback on ${provider}: ${err.message}\n`);
    }
  }

  let clientsData = [];
  try {
    const rows = await supabaseRest("vw_founder_clients_overview?select=niche,subscription_status,plan_code&limit=250");
    if (Array.isArray(rows)) clientsData = rows;
  } catch (_e) {}

  const nicheMap = {};
  clientsData.forEach(c => {
    const n = (c.niche || "Geral / Outros").trim();
    nicheMap[n] = (nicheMap[n] || 0) + 1;
  });
  const sortedNiches = Object.entries(nicheMap).sort((a, b) => b[1] - a[1]);
  const topNichesText = sortedNiches.slice(0, 3).map(([n, q], i) => `${i + 1}º ${n} (${q} contratante${q > 1 ? 's' : ''})`).join(", ") || "Climatização, Elétrica / Hidráulica, Marcenaria";

  const lower = prompt.toLowerCase();
  let text = "";

  if (lower.includes("nicho") || lower.includes("segmento") || lower.includes("expans")) {
    text = `🎯 Análise Estratégica de Nichos — AtendeJá\n\n` +
      `Baseado no volume atual de cadastros:\n` +
      `• Segmentos em destaque: ${topNichesText}.\n` +
      `• Comportamento identificado: Nichos de serviços técnicos (climatização, elétrica e estética automotiva) têm a maior taxa de conversão no WhatsApp devido à necessidade de orçamentos rápidos com triagem prévia.\n` +
      `• Recomendação executiva: Focar anúncios e templates prontos de atendimento no nicho líder, pois o ciclo de fechamento é de menos de 48 horas quando o assistente envia tabela de preços imediatamente.\n\n` +
      `💡 Dica: Você pode filtrar contratantes por nicho diretamente na aba Contratantes do painel.`;
  } else if (lower.includes("resumo") || lower.includes("métrica") || lower.includes("receita") || lower.includes("relatório")) {
    text = `📊 Resumo Executivo da Plataforma\n\n` +
      `• Carteira: Acompanhamento em tempo real sincronizado com Supabase.\n` +
      `• Prioridade do dia: Converter clientes que estão na reta final do período de teste de 15 dias.\n` +
      `• Oportunidade: Contratantes de nichos técnicos respondem melhor a um acompanhamento proativo de métricas na primeira semana de ativação.\n\n` +
      `Deseja que eu elabore um roteiro de contato para as empresas que estão em teste?`;
  } else if (lower.includes("script") || lower.includes("mensagem") || lower.includes("whatsapp") || lower.includes("convers")) {
    text = `💬 Script de Conversão: Trial (Teste) → Plano Pago\n\n` +
      `Mensagem 1 (Dia 10 do teste — Valor Percebido):\n` +
      `"Olá [Nome], aqui é o suporte estratégico do AtendeJá! Seu assistente inteligente já economizou horas da sua equipe nesses primeiros 10 dias. Como está sendo o retorno dos orçamentos?"\n\n` +
      `Mensagem 2 (Dia 13 — Oferta de Continuidade sem interrupção):\n` +
      `"[Nome], para garantir que o seu atendimento automatizado de orçamentos não pare ao fim do teste, liberamos condições especiais no plano Pro com planejamento mensal incluso."\n\n` +
      `Mensagem 3 (Dia 15 — Ativação final via Pix):\n` +
      `"Seu período de avaliação termina hoje. Para manter seus assistentes e histórico ativos, clique aqui e confirme sua assinatura em 1 minuto via Pix."`;
  } else {
    text = `🤖 Assistente do Fundador AtendeJá\n\n` +
      `Entendi sua solicitação: "${prompt.trim()}".\n\n` +
      `Como copiloto estratégico do AtendeJá, recomendo monitorar a relação entre clientes em teste e assinantes ativos, mantendo a qualificação de nichos afiada.\n\n` +
      `Aviso de Conexão: Para respostas gerativas em tempo real utilizando os modelos mais avançados de ${provider.toUpperCase()} (${activeModel}), acesse a aba Conexões de API no menu lateral e cadastre sua chave oficial.`;
  }

  return { ok: true, reply: text, provider: provider, model: activeModel, external: false };
}

async function handleAdmin(req, res, url, parts) {
  const route = parts.slice(2).join("/");
  if (req.method === "GET" && route === "bootstrap-status") {
    requireServerConfig(false);
    await authenticate(req);
    const founders = await supabaseRest("admin_users?" + new URLSearchParams({ select: "id", role: "eq.founder", limit: "1" }).toString());
    return send(res, 200, { founderConfigured: Array.isArray(founders) && founders.length > 0, bootstrapAvailable: Boolean(BOOTSTRAP_TOKEN) });
  }
  if (req.method === "POST" && route === "bootstrap") {
    if (!BOOTSTRAP_TOKEN) throw fail(503, "Bootstrap do Fundador não configurado no servidor");
    const session = await authenticate(req);
    const supplied = String(req.headers["x-founder-bootstrap-token"] || "");
    const expected = Buffer.from(BOOTSTRAP_TOKEN);
    const provided = Buffer.from(supplied);
    if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) throw fail(403, "Token de bootstrap inválido");
    const founders = await supabaseRest("admin_users?" + new URLSearchParams({ select: "id", role: "eq.founder", limit: "1" }).toString());
    if (Array.isArray(founders) && founders.length) throw fail(409, "Fundador já configurado");
    await supabaseRest("rpc/bootstrap_first_founder", { method: "POST", body: { p_auth_user_id: session.user.id } });
    return send(res, 201, { ok: true, message: "Fundador configurado. Entre novamente para abrir o painel." });
  }

  const { user, admin } = await requireAdmin(req);
  if (req.method === "GET" && route === "me") return send(res, 200, { id: user.id, email: user.email, role: admin.role });
  if (req.method === "GET" && route === "clients") {
    const query = new URLSearchParams({ select: "*", order: "created_at.desc", limit: "250" });
    const rows = await supabaseRest("vw_founder_clients_overview?" + query.toString());
    return send(res, 200, { data: rows || [] });
  }
  if (req.method === "GET" && route === "plans") {
    const rows = await supabaseRest("plans?" + new URLSearchParams({ select: "code,name,price_brl,max_assistants,max_apis,monthly_planning,capabilities", order: "price_brl.asc" }).toString());
    return send(res, 200, { data: rows || [] });
  }

  const planMatch = /^plans\/([a-z0-9_-]+)$/.exec(route);
  if ((req.method === "PATCH" || req.method === "POST" || req.method === "PUT") && planMatch) {
    const planCode = planMatch[1];
    const body = await readBody(req);
    const updates = {};
    if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
    if (body.price_brl !== undefined && body.price_brl !== null && body.price_brl !== "") updates.price_brl = Number(body.price_brl);
    if (body.max_assistants !== undefined && body.max_assistants !== null && body.max_assistants !== "") updates.max_assistants = parseInt(body.max_assistants, 10);
    if (body.max_apis !== undefined && body.max_apis !== null && body.max_apis !== "") updates.max_apis = parseInt(body.max_apis, 10);
    if (body.monthly_planning !== undefined) updates.monthly_planning = String(body.monthly_planning) === "true" || body.monthly_planning === true;
    if (body.capabilities !== undefined) {
      updates.capabilities = Array.isArray(body.capabilities)
        ? body.capabilities
        : String(body.capabilities).split(",").map(s => s.trim()).filter(Boolean);
    }

    await supabaseRest("plans?code=eq." + encodeURIComponent(planCode), {
      method: "PATCH",
      body: updates
    });

    try {
      await supabaseRest("admin_audit_logs", {
        method: "POST",
        body: {
          client_id: null,
          actor: user.email || "Gerente",
          action: "UPDATE_PLAN",
          details: { code: planCode, updates }
        }
      });
    } catch (_e) {}

    return send(res, 200, { ok: true, message: `Plano ${planCode} atualizado com sucesso.`, data: updates });
  }

  if (req.method === "GET" && route === "landing-page-config") {
    return send(res, 200, { ok: true, data: readLandingPageConfig() });
  }

  if (req.method === "POST" && route === "landing-page-config") {
    const body = await readBody(req);
    const saved = writeLandingPageConfig(body);
    try {
      await supabaseRest("admin_audit_logs", {
        method: "POST",
        body: {
          client_id: null,
          actor: user.email || "Gerente",
          action: "UPDATE_LANDING_PAGE",
          details: { updated_at: saved.updated_at }
        }
      });
    } catch (_e) {}
    return send(res, 200, { ok: true, message: "Landing Page atualizada com sucesso!", data: saved });
  }
  if (req.method === "GET" && route === "payments") {
    const rows = await supabaseRest("subscriptions_payments?" + new URLSearchParams({ select: "id,client_id,plan_code,amount_brl,payment_method,status,paid_at,created_at", order: "created_at.desc", limit: "250" }).toString());
    return send(res, 200, { data: rows || [] });
  }
  if (req.method === "GET" && route === "audit") {
    const rows = await supabaseRest("admin_audit_logs?" + new URLSearchParams({ select: "id,client_id,actor,action,details,created_at", order: "created_at.desc", limit: "200" }).toString());
    return send(res, 200, { data: rows || [] });
  }

  if (req.method === "GET" && route === "api-connections") {
    const raw = readApiConnections();
    const providers = ["openai", "openrouter", "gemini", "opencode", "groq"];
    const out = {};
    for (const p of providers) {
      const entry = raw[p] || {};
      out[p] = {
        configured: Boolean(entry.apiKey),
        maskedKey: maskKey(entry.apiKey),
        model: entry.model || "",
        baseUrl: entry.baseUrl || "",
        updatedAt: entry.updatedAt || null
      };
    }
    return send(res, 200, { data: out });
  }

  if (req.method === "POST" && route === "api-connections") {
    const body = await readBody(req);
    const provider = String(body.provider || "").toLowerCase().trim();
    if (!SUPPORTED_PROVIDERS.has(provider)) throw fail(400, "Provedor inválido");

    const raw = readApiConnections();
    const current = raw[provider] || {};

    let keyToSave = current.apiKey || "";
    if (body.apiKey !== undefined) {
      const candidate = String(body.apiKey || "").trim();
      if (candidate && !candidate.includes("••••")) {
        keyToSave = candidate;
      } else if (!candidate) {
        keyToSave = "";
      }
    }

    raw[provider] = {
      apiKey: keyToSave,
      model: typeof body.model === "string" ? body.model.trim() : (current.model || ""),
      baseUrl: typeof body.baseUrl === "string" ? body.baseUrl.trim() : (current.baseUrl || ""),
      updatedAt: new Date().toISOString()
    };
    writeApiConnections(raw);

    try {
      await supabaseRest("admin_audit_logs", {
        method: "POST",
        body: {
          client_id: null,
          actor: user.email || "Gerente",
          action: "UPDATE_API_CONNECTION",
          details: { provider, model: raw[provider].model, configured: Boolean(keyToSave) }
        }
      });
    } catch (_e) {}

    return send(res, 200, {
      ok: true,
      message: `Configuração de ${provider.toUpperCase()} atualizada com sucesso.`,
      data: {
        provider,
        configured: Boolean(keyToSave),
        maskedKey: maskKey(keyToSave),
        model: raw[provider].model
      }
    });
  }

  if (req.method === "POST" && route === "api-connections/test") {
    const body = await readBody(req);
    const provider = String(body.provider || "").toLowerCase().trim();
    if (!SUPPORTED_PROVIDERS.has(provider)) throw fail(400, "Provedor inválido");

    const raw = readApiConnections();
    const current = raw[provider] || {};

    let apiKey = (body.apiKey && !body.apiKey.includes("••••")) ? body.apiKey.trim() : (current.apiKey || "");
    if (!apiKey) throw fail(400, `Nenhuma chave informada ou salva para ${provider.toUpperCase()}`);

    const model = body.model || current.model || "";
    const baseUrl = body.baseUrl || current.baseUrl || "";

    const result = await testProviderConnection(provider, apiKey, model, baseUrl);
    return send(res, 200, result);
  }

  if (req.method === "POST" && route === "ai/chat") {
    const body = await readBody(req);
    const result = await executeAiChat(body);
    return send(res, 200, result);
  }
  const change = /^clients\/([0-9a-f-]+)$/.exec(route);
  if (req.method === "PATCH" && change) {
    const clientId = change[1];
    if (!UUID.test(clientId)) throw fail(400, "Identificador inválido");
    const body = await readBody(req);
    const allowed = new Set(["plan_code", "subscription_status", "reason"]);
    if (!body || Object.keys(body).some(k => !allowed.has(k)) || !PLAN_CODE.test(String(body.plan_code || "")) || !STATUS_VALUES.has(body.subscription_status) || typeof body.reason !== "string" || body.reason.trim().length < 3 || body.reason.length > 500) {
      throw fail(400, "Informe plano, status e motivo válido");
    }
    await supabaseRest("rpc/admin_change_subscription", {
      method: "POST",
      body: {
        p_actor_id: user.id,
        p_client_id: clientId,
        p_plan_code: body.plan_code,
        p_subscription_status: body.subscription_status,
        p_reason: body.reason.trim()
      }
    });
    return send(res, 200, { ok: true });
  }
  throw fail(404, "Rota administrativa não encontrada");
}

async function handleClient(req, res, parts) {
  if (parts.slice(2).join("/") !== "profile" || !["GET", "POST", "PATCH"].includes(req.method)) {
    throw fail(404, "Rota de contratante não encontrada");
  }
  const { user, token } = await authenticate(req);
  const query = new URLSearchParams({
    select: "id,auth_user_id,email_google,company_name,attendant_name,niche,city,whatsapp,social_type,social_url,logo_url,plan_code,trial_started_at,trial_ends_at,subscription_status",
    auth_user_id: "eq." + user.id,
    limit: "1"
  });
  let rows = await supabaseRest("clients?" + query.toString());
  if ((!Array.isArray(rows) || !rows.length) && req.method === "POST") {
    const body = await readBody(req);
    const fields = {
      p_company_name: String(body.company_name || user.user_metadata?.full_name || String(user.email || "contratante").split("@")[0]).trim().slice(0, 160),
      p_attendant_name: String(body.attendant_name || "").trim().slice(0, 160),
      p_niche: String(body.niche || "").trim().slice(0, 120),
      p_city: String(body.city || "").trim().slice(0, 120),
      p_whatsapp: String(body.whatsapp || "").replace(/[^0-9+() -]/g, "").slice(0, 32),
      p_social_type: ["Instagram", "Facebook", "TikTok", "YouTube"].includes(body.social_type) ? body.social_type : "Instagram",
      p_social_url: String(body.social_url || "").trim().slice(0, 500),
      p_logo_url: ""
    };
    if (!fields.p_company_name) throw fail(400, "Nome da empresa obrigatório para criar o perfil");
    await supabaseUserRpc(token, "register_client_profile", fields);
    rows = await supabaseRest("clients?" + query.toString());
  } else if (Array.isArray(rows) && rows.length && req.method === "PATCH") {
    const body = await readBody(req);
    const fields = {
      p_company_name: String(body.company_name || rows[0].company_name).trim().slice(0, 160),
      p_attendant_name: String(body.attendant_name || "").trim().slice(0, 160),
      p_niche: String(body.niche || "").trim().slice(0, 120),
      p_city: String(body.city || "").trim().slice(0, 120),
      p_whatsapp: String(body.whatsapp || "").replace(/[^0-9+() -]/g, "").slice(0, 32),
      p_social_type: ["Instagram", "Facebook", "TikTok", "YouTube"].includes(body.social_type) ? body.social_type : "Instagram",
      p_social_url: String(body.social_url || "").trim().slice(0, 500),
      p_logo_url: ""
    };
    await supabaseUserRpc(token, "register_client_profile", fields);
    rows = await supabaseRest("clients?" + query.toString());
  }
if (!Array.isArray(rows) || !rows.length) throw fail(404, "Perfil do contratante não encontrado");
return send(res, 200, { profile: rows[0] });
}

async function handlePaymentWebhook(req, res) {
  if (req.method !== "POST") throw fail(405, "Método não permitido");
  if (!PAYMENT_WEBHOOK_SECRET) throw fail(503, "Webhook de pagamento não configurado");
  const raw = await readRawBody(req);
  const supplied = String(req.headers["x-atendeja-signature"] || "").replace(/^sha256=/i, "");
  const expected = crypto.createHmac("sha256", PAYMENT_WEBHOOK_SECRET).update(raw).digest();
  let provided;
  try { provided = Buffer.from(supplied, "hex"); } catch (_e) { provided = Buffer.alloc(0); }
  if (provided.length !== expected.length || !crypto.timingSafeEqual(expected, provided)) throw fail(401, "Assinatura do webhook inválida");
  let body;
  try { body = JSON.parse(raw.toString("utf8")); } catch (_e) { throw fail(400, "JSON inválido"); }
  const paymentId = String(body.payment_id || "").trim();
  const email = String(body.email_google || "").trim().toLowerCase();
  const plan = String(body.plan_code || "").trim().toLowerCase();
  const status = String(body.status || "").trim().toLowerCase();
  const amount = Number(body.amount_brl);
  if (!paymentId || paymentId.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !PLAN_CODE.test(plan) || !Number.isFinite(amount) || amount < 0 || amount > 10000000 || !["pending", "approved", "rejected", "cancelled", "refunded", "charged_back"].includes(status)) {
    throw fail(400, "Dados de pagamento inválidos");
  }
  if (plan === "trial" || amount <= 0) throw fail(400, "Evento não corresponde a um plano pago");
  const result = await supabaseRest("rpc/process_payment_event", {
    method: "POST",
    body: {
      p_email_google: email,
      p_payment_id: paymentId,
      p_plan_code: plan,
      p_amount_brl: amount,
      p_status: status,
      p_payment_method: String(body.payment_method || "pix").slice(0, 40),
      p_paid_at: status === "approved" ? (body.paid_at || new Date().toISOString()) : null
    }
  });
  return send(res, 200, { ok: true, result });
}

async function serveStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") throw fail(405, "Método não permitido");
  let urlPath;
  try { urlPath = decodeURIComponent(pathname); } catch (_e) { throw fail(400, "Caminho inválido"); }
  if (urlPath === "/") urlPath = "/index.html";
  if (urlPath === "/admin" || urlPath === "/atendeja" || urlPath === "/gerenciar-atendeja") urlPath = "/admin.html";
  if (urlPath === "/dashboard") urlPath = "/dashboard.html";
  const file = path.resolve(ROOT, "." + urlPath);
  if (!file.startsWith(ROOT + path.sep) || /(^|\/)\.|(^|\/)(server\.js|package\.json|package-lock\.json|Dockerfile)(\/|$)/i.test(urlPath) || urlPath.startsWith("/node_modules/") || urlPath.startsWith("/db/") || urlPath.startsWith("/docs/")) {
    throw fail(404, "Arquivo não encontrado");
  }
  let stat;
  try { stat = await fs.promises.stat(file); } catch (_e) { throw fail(404, "Arquivo não encontrado"); }
  if (!stat.isFile()) throw fail(404, "Arquivo não encontrado");
  const mime = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
  const adminAsset = /\/admin(?:\.html|\.js|\.css)$/.test(urlPath);
  res.writeHead(200, { "Content-Type": mime, "Content-Length": stat.size, "Cache-Control": adminAsset ? "no-store" : file.endsWith("sw.js") ? "no-cache" : "public, max-age=300" });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  setSecurityHeaders(res);
  try {
    applyCors(req, res);
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) rateLimit(req);
    const parts = url.pathname.split("/").filter(Boolean);
    if (url.pathname === "/api/health" && req.method === "GET") {
      return send(res, 200, { ok: true, supabaseConfigured: Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && SUPABASE_SECRET_KEY), postgresConfigured: Boolean(pool) });
    }
    if (url.pathname === "/api/public-config" && req.method === "GET") {
      return send(res, 200, { supabaseUrl: SUPABASE_URL, supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY });
    }
    if (url.pathname === "/api/public-landing-config" && req.method === "GET") {
      return send(res, 200, { ok: true, data: readLandingPageConfig() });
    }
    if (parts[0] === "api" && parts[1] === "admin") return await handleAdmin(req, res, url, parts);
    if (parts[0] === "api" && parts[1] === "client") return await handleClient(req, res, parts);
    if (url.pathname === "/api/webhooks/mercadopago") return await handlePaymentWebhook(req, res);
    if (parts[0] === "api" && parts[1] === "data") return await handleTenantData(req, res, url, parts);
    return await serveStatic(req, res, url.pathname);
  } catch (error) {
    const status = Number(error.status || 500);
    if (status >= 500) process.stderr.write("AtendeJá request failed: " + status + " " + req.method + " " + req.url.split("?")[0] + "\n");
    if (!res.headersSent) send(res, status, { error: status >= 500 ? "Falha interna. Tente novamente." : error.message });
    else res.destroy();
  }
});

server.listen(PORT, "0.0.0.0", () => {
  process.stdout.write("AtendeJá server listening on port " + PORT + "\n");
});

async function shutdown() {
  server.close();
  if (pool) await pool.end();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);