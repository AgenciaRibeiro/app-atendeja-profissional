(function () {
  "use strict";
  var client = null;
  var enabled = false;
  var pending = false;
  var $ = function (id) { return document.getElementById(id); };
  var AUTH_KEY = "atendeja_cloud_auth_checked_user";

  function setGate(authenticated) {
    var app = $("app-layout");
    var gate = $("auth-gate");
    if (app) {
      app.hidden = !authenticated;
      app.style.display = authenticated ? "flex" : "none";
    }
    if (gate) {
      gate.hidden = authenticated;
      gate.style.display = authenticated ? "none" : "flex";
    }
  }
  function setMessage(text, isError) {
    var el = $("auth-note");
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("error", Boolean(isError));
  }
  function currentTenant() {
    try { return JSON.parse(localStorage.getItem("atendeja_tenant_v1") || "{}"); }
    catch (_e) { return {}; }
  }
  function saveProfile(profile) {
    var old = currentTenant();
    var tenant = Object.assign({}, old, {
      empresa: profile.company_name || old.empresa || "",
      atendente: profile.attendant_name || old.atendente || "",
      nicho: profile.niche || old.nicho || "",
      cidade: profile.city || old.cidade || "",
      whatsapp: profile.whatsapp || old.whatsapp || "",
      emailGoogle: profile.email_google || "",
      redeSocialTipo: profile.social_type || old.redeSocialTipo || "Instagram",
      redeSocialUrl: profile.social_url || old.redeSocialUrl || "",
      plano: profile.plan_code || "trial",
      cloudClientId: profile.id,
      subscriptionStatus: profile.subscription_status,
      trialEndsAt: profile.trial_ends_at
    });
    try { localStorage.setItem("atendeja_tenant_v1", JSON.stringify(tenant)); } catch (_e) {}
    document.dispatchEvent(new CustomEvent("atendeja:cloud-profile", { detail: tenant }));
    try { localStorage.setItem("atendeja_session_active", "true"); } catch (_e) {}
  }
  async function apiProfile(session) {
    var local = currentTenant();
    var response = await fetch("/api/client/profile", {
      method: "POST",
      headers: { Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name: local.empresa || session.user.user_metadata?.full_name || "",
        attendant_name: local.atendente || "",
        niche: local.nicho || "",
        city: local.cidade || "",
        whatsapp: local.whatsapp || "",
        social_type: local.redeSocialTipo || "Instagram",
        social_url: local.redeSocialUrl || ""
      }),
      cache: "no-store"
    });
    var result = {};
    try { result = await response.json(); } catch (_e) {}
    if (!response.ok) throw new Error(result.error || "Não foi possível carregar seu perfil.");
    return result.profile;
  }
  async function applySession(session) {
    if (!enabled || pending) return;
    pending = true;
    if (!session) {
      setGate(false);
      setMessage("Entre com a conta Google vinculada ao seu cadastro.", false);
      pending = false;
      return;
    }
    setGate(false);
    setMessage("Validando sua conta e carregando seu perfil…", false);
    try {
      var profile = await apiProfile(session);
      saveProfile(profile);
      if (window.ATENDEJA_STATE) await window.ATENDEJA_STATE.initialize(session);
      try { localStorage.setItem(AUTH_KEY, session.user.id); } catch (_e) {}
      setGate(true);
      setMessage("", false);
    } catch (error) {
      setGate(false);
      setMessage(error.message, true);
    } finally { pending = false; }
  }
  async function initialize() {
    try {
      var response = await fetch("/api/public-config", { cache: "no-store" });
      var config = await response.json();
      if (!response.ok || !config.supabaseUrl || !config.supabasePublishableKey || !window.supabase) return;
      client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      enabled = true;
      setGate(false);
      var result = await client.auth.getSession();
      await applySession(result.data && result.data.session);
      client.auth.onAuthStateChange(function (_event, session) {
        window.setTimeout(function () { applySession(session); }, 0);
      });
    } catch (_e) {
      // O modo local continua disponível quando a API/Supabase não está configurado.
    }
  }
  window.ATENDEJA_AUTH = {
    get enabled() { return enabled; },
    async signIn() {
      if (!enabled || !client) throw new Error("Login Google ainda não está configurado no servidor.");
      var result = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/dashboard.html" }
      });
      if (result.error) throw result.error;
    },
    async signOut() {
      if (!client) return;
      var result = await client.auth.signOut();
      if (result.error) throw result.error;
      try { localStorage.removeItem(AUTH_KEY); localStorage.setItem("atendeja_session_active", "false"); } catch (_e) {}
      setGate(false);
    },
    async updateProfile(tenant) {
      if (!enabled || !client) return;
      var current = await client.auth.getSession();
      var session = current.data && current.data.session;
      if (!session) throw new Error("Entre novamente para salvar o perfil na nuvem.");
      var response = await fetch("/api/client/profile", {
        method: "PATCH",
        headers: { Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: tenant.empresa, attendant_name: tenant.atendente, niche: tenant.nicho, city: tenant.cidade, whatsapp: tenant.whatsapp, social_type: tenant.redeSocialTipo, social_url: tenant.redeSocialUrl }),
        cache: "no-store"
      });
      var result = {};
      try { result = await response.json(); } catch (_e) {}
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar o perfil na nuvem.");
      saveProfile(result.profile);
    }
  };
  document.addEventListener("DOMContentLoaded", initialize);
})();
