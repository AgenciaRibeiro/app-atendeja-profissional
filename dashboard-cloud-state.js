(function () {
  "use strict";
  var KEYS = [
    ["tenant", "atendeja_tenant_v1"], ["leads", "atendeja_leads_v2"],
    ["history", "atendeja_history_v1"], ["planning", "atendeja_planning_v1"],
    ["assistants", "atendeja_assistants_v1"], ["connections", "atendeja_connections_v1"]
  ];
  var revision = null;
  var session = null;
  var ready = false;
  var blocked = false;
  var localDirty = false;
  var timer = 0;
  var pushing = false;
  function parse(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch (_e) { return fallback; }
  }
  function sanitize(value) {
    if (Array.isArray(value)) return value.map(sanitize);
    if (!value || typeof value !== "object") return value;
    var out = {};
    Object.keys(value).forEach(function (key) {
      if (["logoDataUrl", "plano", "subscriptionStatus", "trialEndsAt", "cloudClientId"].includes(key)) return;
      if (/^(?:api_?key|access_?token|refresh_?token|password|secret|authorization)$/i.test(key)) return;
      if (/key|token|password|secret|authorization/i.test(key) && !["apiKeyMask", "key_last4", "hasKey"].includes(key)) return;
      out[key] = sanitize(value[key]);
    });
    return out;
  }
  function localState() {
    var state = {};
    KEYS.forEach(function (pair) { state[pair[0]] = sanitize(parse(pair[1], pair[0] === "tenant" || pair[0] === "planning" || pair[0] === "connections" ? {} : [])); });
    state.leads = (Array.isArray(state.leads) ? state.leads : []).filter(function (lead) { return !/^demo-/.test(String(lead.id || "")); });
    state.history = (Array.isArray(state.history) ? state.history : []).filter(function (item) { return !/^h-[12]$/.test(String(item.id || "")); });
    return state;
  }
  function saveLocal(state) {
    KEYS.forEach(function (pair) {
      if (state[pair[0]] !== undefined) {
        var value = state[pair[0]];
        if (pair[0] === "tenant") {
          var prior = parse(pair[1], {});
          value = Object.assign({}, value, {
            logoDataUrl: prior.logoDataUrl || "",
            plano: prior.plano || "trial",
            subscriptionStatus: prior.subscriptionStatus || "trial",
            trialEndsAt: prior.trialEndsAt || "",
            cloudClientId: prior.cloudClientId || ""
          });
        }
        localStorage.setItem(pair[1], JSON.stringify(value));
      }
    });
    document.dispatchEvent(new CustomEvent("atendeja:cloud-state-loaded"));
  }
  function request(method, body) {
    if (!session) return Promise.reject(new Error("Sessão Google indisponível"));
    return fetch("/api/data/workspace", {
      method: method,
      headers: { Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store"
    }).then(async function (response) {
      var result = {};
      try { result = await response.json(); } catch (_e) {}
      if (!response.ok) {
        var error = new Error(result.error || "Falha na sincronização do dashboard");
        error.status = response.status;
        throw error;
      }
      return result;
    });
  }
  function notify(message) {
    document.dispatchEvent(new CustomEvent("atendeja:cloud-sync-error", { detail: message }));
  }
  async function initialize(authSession) {
    session = authSession;
    if (!session) return;
    var remote = await request("GET");
    revision = Number(remote.revision || 0);
    var cachedRevision = Number(localStorage.getItem("atendeja_cloud_revision") || 0);
    localDirty = localStorage.getItem("atendeja_cloud_dirty") === "true";
    if (localDirty && revision > cachedRevision) {
      blocked = true;
      notify("Há dados locais pendentes e uma versão mais recente na nuvem. As duas versões foram preservadas; a sincronização foi pausada para evitar sobrescrita.");
      return;
    }
    if (revision > 0) {
      // Preserve a local recovery copy before switching to the cloud version.
      try { localStorage.setItem("atendeja_precloud_backup_v1", JSON.stringify(localState())); } catch (_e) {}
      saveLocal(remote.state || {});
    } else {
      var initial = localState();
      try { localStorage.setItem("atendeja_precloud_backup_v1", JSON.stringify(initial)); } catch (_e) {}
      var saved = await request("PUT", { revision: 0, state: initial });
      revision = Number(saved.revision);
    }
    try { localStorage.setItem("atendeja_cloud_revision", String(revision)); localStorage.removeItem("atendeja_cloud_dirty"); } catch (_e) {}
    ready = true;
    if (remote.state && Object.keys(remote.state).length) window.setTimeout(push, 50);
  }
  async function push() {
    if (!ready || blocked || pushing || !session) return;
    pushing = true;
    try {
      var saved = await request("PUT", { revision: revision, state: localState() });
      revision = Number(saved.revision);
      try { localStorage.setItem("atendeja_cloud_revision", String(revision)); localStorage.removeItem("atendeja_cloud_dirty"); } catch (_e) {}
    } catch (error) {
      if (error.status === 409) {
        blocked = true;
        notify("Há alterações em outra sessão. Seus dados locais foram preservados; recarregue antes de continuar a sincronização.");
      } else {
        notify("Sem sincronização agora; suas alterações continuam salvas neste dispositivo.");
      }
    } finally { pushing = false; }
  }
  window.ATENDEJA_STATE = {
    initialize: initialize,
    schedule: function () {
      if (!ready || blocked) return;
      try { localStorage.setItem("atendeja_cloud_dirty", "true"); } catch (_e) {}
      clearTimeout(timer);
      timer = setTimeout(push, 900);
    }
  };
  window.addEventListener("online", function () { if (ready && !blocked) push(); });
})();
