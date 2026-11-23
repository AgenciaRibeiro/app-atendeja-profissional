(function () {
  "use strict";
  var config, supabaseClient, session, clients = [], plans = [], payments = [], audit = [];
  var $ = function (id) { return document.getElementById(id); };
  var statusLabels = { trial: "Em teste", active: "Ativo", past_due: "Em atraso", canceled: "Cancelado", suspended: "Suspenso" };
  var money = function (v) { return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };
  var date = function (v) { return v ? new Date(v).toLocaleDateString("pt-BR") : "—"; };
  var dateTime = function (v) { return v ? new Date(v).toLocaleString("pt-BR") : "—"; };

  function message(text, error, target) {
    var el = $(target || "login-message");
    if (!el) return;
    el.textContent = text || "";
    el.className = "message" + (error ? " error" : text ? " success" : "");
  }

  function esc(value) { return String(value == null ? "" : value); }

  function resolveEmail(identifier) {
    var raw = String(identifier || "").trim();
    if (!raw) return "";
    if (raw.toLowerCase() === "gerente") {
      return "gerente@minhaempresaautonoma.online";
    }
    return raw.toLowerCase();
  }

  async function api(path, options) {
    options = options || {};
    var headers = { "Content-Type": "application/json" };
    if (session && session.access_token) headers.Authorization = "Bearer " + session.access_token;
    Object.assign(headers, options.headers || {});
    var response = await fetch("/api/" + path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    var payload = {};
    try { payload = await response.json(); } catch (_e) {}
    if (!response.ok) throw new Error(payload.error || "Não foi possível concluir a solicitação.");
    return payload;
  }

  function setAuthenticated(show) {
    $("login-card").hidden = show;
    $("admin-app").hidden = !show;
    $("btn-signout").hidden = !session;
    var displayEmail = session && session.user ? session.user.email || "" : "";
    var displayName = (session && session.user && session.user.user_metadata && session.user.user_metadata.full_name) || "";
    if (!displayName && displayEmail.startsWith("gerente@")) displayName = "Gerente";
    $("admin-identity").textContent = displayName ? displayName + (displayEmail ? " · " + displayEmail : "") : displayEmail;
    if (show) {
      window.history.replaceState(null, "", "/gerenciar-atendeja");
    }
  }

  async function loadBootstrapStatus() {
    try {
      var state = await api("admin/bootstrap-status");
      $("bootstrap-form").hidden = state.founderConfigured || !state.bootstrapAvailable || !session;
    } catch (_e) { $("bootstrap-form").hidden = true; }
  }

  async function signInGoogle() {
    if (!supabaseClient) throw new Error("Supabase não configurado. Configure a URL e a chave pública no servidor.");
    var result = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/gerenciar-atendeja" }
    });
    if (result.error) throw result.error;
  }

  async function signInWithPassword(event) {
    event.preventDefault();
    message("Autenticando…", false);
    var identifier = $("login-identifier").value;
    var password = $("login-password").value;
    var email = resolveEmail(identifier);
    if (!email || !password) {
      message("Informe usuário/e-mail e senha.", true);
      return;
    }
    try {
      if (!supabaseClient) throw new Error("Supabase não configurado.");
      var res = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
      if (res.error) throw res.error;
      session = res.data && res.data.session;
      message("Acesso autorizado. Carregando painel…", false);
      setAuthenticated(true);
      await checkSession();
    } catch (err) {
      message(err.message || "Credenciais inválidas. Verifique seu usuário e senha.", true);
    }
  }

  async function handlePasswordRecovery(event) {
    event.preventDefault();
    message("Enviando solicitação de recuperação…", false);
    var identifier = $("recovery-identifier").value;
    var email = resolveEmail(identifier);
    if (!email) {
      message("Informe um usuário ou e-mail válido.", true);
      return;
    }
    try {
      if (!supabaseClient) throw new Error("Supabase não configurado.");
      var redirectUrl = window.location.origin + "/atendeja";
      var res = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
      if (res.error) throw res.error;
      message("Link de recuperação enviado para " + email + ". Verifique sua caixa de entrada.", false);
      $("recovery-form").hidden = true;
      $("password-login-form").hidden = false;
      $("btn-google").hidden = false;
    } catch (err) {
      message(err.message || "Não foi possível enviar o link de recuperação.", true);
    }
  }

  async function handleNewPassword(event) {
    event.preventDefault();
    var p1 = $("new-password-val").value;
    var p2 = $("confirm-password-val").value;
    if (p1.length < 6) {
      message("A nova senha deve ter no mínimo 6 caracteres.", true);
      return;
    }
    if (p1 !== p2) {
      message("As senhas não coincidem.", true);
      return;
    }
    try {
      message("Atualizando senha…", false);
      var res = await supabaseClient.auth.updateUser({ password: p1 });
      if (res.error) throw res.error;
      message("Senha atualizada com sucesso! Redirecionando para o painel…", false);
      $("new-password-form").hidden = true;
      setAuthenticated(true);
      await checkSession();
    } catch (err) {
      message(err.message || "Erro ao atualizar senha.", true);
    }
  }

  async function bootstrap(event) {
    event.preventDefault();
    var token = $("bootstrap-token").value;
    try {
      await api("admin/bootstrap", { method: "POST", headers: { "X-Founder-Bootstrap-Token": token } });
      $("bootstrap-token").value = "";
      message("Conta de Fundador vinculada. Abrindo o painel…", false);
      $("bootstrap-form").hidden = true;
      window.history.replaceState(null, "", "/gerenciar-atendeja");
      await checkSession();
    } catch (error) { message(error.message, true); }
  }

  function cell(text, className) {
    var td = document.createElement("td");
    td.textContent = esc(text);
    if (className) td.className = className;
    return td;
  }

  function option(select, value, label, selected) {
    var item = document.createElement("option");
    item.value = value; item.textContent = label; item.selected = Boolean(selected);
    select.appendChild(item);
  }

  function renderClients(filter) {
    var body = $("clients-body"); body.replaceChildren();
    var needle = String(filter || "").trim().toLowerCase();
    var statusFilter = $("client-status-filter").value;
    var planFilter = $("client-plan-filter").value;
    var list = clients.filter(function (c) {
      var matchesText = !needle || (String(c.company_name || "") + " " + String(c.email_google || "")).toLowerCase().includes(needle);
      return matchesText && (!statusFilter || c.subscription_status === statusFilter) && (!planFilter || c.plan_code === planFilter);
    });
    $("clients-empty").hidden = list.length > 0;
    list.forEach(function (client) {
      var row = document.createElement("tr");
      var company = document.createElement("td");
      var name = document.createElement("span"); name.className = "company-name"; name.textContent = esc(client.company_name); company.appendChild(name);
      var email = document.createElement("span"); email.className = "subline"; email.textContent = esc(client.email_google); company.appendChild(email);
      var status = document.createElement("span"); status.className = "badge " + (client.subscription_status === "active" ? "active" : client.subscription_status === "trial" ? "trial" : ""); status.textContent = statusLabels[client.subscription_status] || client.subscription_status; company.appendChild(status);
      row.appendChild(company);
      var plan = document.createElement("td"); plan.textContent = (client.plan_name || client.plan_code || "—") + " · " + money(client.plan_price_brl); row.appendChild(plan);
      row.appendChild(cell(client.subscription_status === "trial" ? String(client.trial_days_left || 0) + " dias restantes" : "Termina em " + date(client.trial_ends_at)));
      row.appendChild(cell(money(client.total_paid_brl)));
      var action = document.createElement("td"); action.className = "action-cell";
      var planSelect = document.createElement("select"); planSelect.setAttribute("aria-label", "Novo plano de " + esc(client.company_name));
      plans.forEach(function (p) { option(planSelect, p.code, p.name + " · " + money(p.price_brl), p.code === client.plan_code); });
      var statusSelect = document.createElement("select"); statusSelect.setAttribute("aria-label", "Novo status de " + esc(client.company_name));
      Object.keys(statusLabels).forEach(function (key) { option(statusSelect, key, statusLabels[key], key === client.subscription_status); });
      var reason = document.createElement("input"); reason.placeholder = "Motivo obrigatório"; reason.setAttribute("aria-label", "Motivo para a alteração");
      var save = document.createElement("button"); save.type = "button"; save.className = "button quiet"; save.textContent = "Salvar alteração";
      save.addEventListener("click", async function () {
        save.disabled = true;
        try {
          await api("admin/clients/" + encodeURIComponent(client.client_id), { method: "PATCH", body: { plan_code: planSelect.value, subscription_status: statusSelect.value, reason: reason.value } });
          message("Plano/status atualizados e auditados.", false, "app-message");
          reason.value = ""; await loadData();
        } catch (error) { message(error.message, true, "app-message"); }
        finally { save.disabled = false; }
      });
      action.append(planSelect, statusSelect, reason, save); row.appendChild(action); body.appendChild(row);
    });
  }

  function renderPayments() {
    var body = $("payments-body"); body.replaceChildren();
    var names = {}; clients.forEach(function (c) { names[c.client_id] = c.company_name; });
    var needle = String($("payment-search").value || "").trim().toLowerCase();
    var list = payments.filter(function (p) { return !needle || [names[p.client_id], p.plan_code, p.status, p.payment_method].join(" ").toLowerCase().includes(needle); });
    $("payments-empty").hidden = list.length > 0;
    list.forEach(function (p) {
      var row = document.createElement("tr"); row.appendChild(cell(dateTime(p.created_at)));
      row.appendChild(cell(names[p.client_id] || p.client_id)); row.appendChild(cell(p.plan_code));
      row.appendChild(cell(money(p.amount_brl))); row.appendChild(cell(p.status)); body.appendChild(row);
    });
  }

  function renderPlans() {
    var body = $("plans-body"); body.replaceChildren();
    plans.forEach(function (p) {
      var row = document.createElement("tr"); row.appendChild(cell(p.name)); row.appendChild(cell(money(p.price_brl)));
      row.appendChild(cell(p.max_assistants)); row.appendChild(cell(Number(p.max_apis) >= 99 ? "Ilimitadas" : p.max_apis));
      row.appendChild(cell(p.monthly_planning ? "Sim" : "Não")); body.appendChild(row);
    });
  }

  function renderAudit() {
    var body = $("audit-body"); body.replaceChildren();
    audit.forEach(function (a) {
      var row = document.createElement("tr"); row.appendChild(cell(dateTime(a.created_at))); row.appendChild(cell(a.action));
      row.appendChild(cell(a.actor)); row.appendChild(cell(JSON.stringify(a.details || {}))); body.appendChild(row);
    });
  }

  function renderMetrics() {
    $("metric-total").textContent = String(clients.length);
    $("metric-active").textContent = String(clients.filter(function (c) { return c.subscription_status === "active"; }).length);
    $("metric-trial").textContent = String(clients.filter(function (c) { return c.subscription_status === "trial"; }).length);
    $("metric-revenue").textContent = money(clients.reduce(function (sum, c) { return sum + Number(c.total_paid_brl || 0); }, 0));
  }

  function renderOverview() {
    var statusBox = $("status-breakdown"); statusBox.replaceChildren();
    Object.keys(statusLabels).forEach(function (key) {
      var row = document.createElement("div"); row.className = "breakdown-row";
      var label = document.createElement("span"); label.textContent = statusLabels[key];
      var value = document.createElement("strong"); value.textContent = String(clients.filter(function (c) { return c.subscription_status === key; }).length);
      row.append(label, value); statusBox.appendChild(row);
    });
    var planBox = $("plan-breakdown"); planBox.replaceChildren();
    plans.forEach(function (plan) {
      var row = document.createElement("div"); row.className = "breakdown-row";
      var label = document.createElement("span"); label.textContent = plan.name;
      var value = document.createElement("strong"); value.textContent = String(clients.filter(function (c) { return c.plan_code === plan.code; }).length);
      row.append(label, value); planBox.appendChild(row);
    });
    var recent = $("recent-payments-body"); recent.replaceChildren();
    var names = {}; clients.forEach(function (c) { names[c.client_id] = c.company_name; });
    payments.slice(0, 6).forEach(function (p) {
      var row = document.createElement("tr"); row.appendChild(cell(dateTime(p.created_at)));
      row.appendChild(cell(names[p.client_id] || "Cadastro sem nome")); row.appendChild(cell(p.plan_code));
      row.appendChild(cell(money(p.amount_brl))); row.appendChild(cell(p.status)); recent.appendChild(row);
    });
    $("last-updated").textContent = "Atualizado " + dateTime(new Date().toISOString());
  }

  function exportClients() {
    var columns = ["company_name", "email_google", "plan_code", "subscription_status", "total_paid_brl", "trial_ends_at", "created_at"];
    var lines = [columns.join(";")].concat(clients.map(function (client) {
      return columns.map(function (key) { return '"' + String(client[key] == null ? "" : client[key]).replace(/"/g, '""') + '"'; }).join(";");
    }));
    var blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "atendeja-contratantes.csv"; link.click();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
  }

  async function loadData() {
    message("Carregando dados administrativos…", false, "app-message");
    var results = await Promise.all([api("admin/clients"), api("admin/plans"), api("admin/payments"), api("admin/audit")]);
    clients = results[0].data || []; plans = results[1].data || []; payments = results[2].data || []; audit = results[3].data || [];
    var planSelect = $("client-plan-filter");
    var selectedPlan = planSelect.value;
    planSelect.replaceChildren(); option(planSelect, "", "Todos os planos", !selectedPlan);
    plans.forEach(function (p) { option(planSelect, p.code, p.name, p.code === selectedPlan); });
    renderMetrics(); renderOverview(); renderClients($("client-search").value); renderPayments(); renderPlans(); renderAudit();
    message("Dados atualizados.", false, "app-message");
  }

  async function checkSession() {
    if (!supabaseClient) return;
    var result = await supabaseClient.auth.getSession();
    session = result.data && result.data.session;
    $("btn-signout").hidden = !session;
    if (!session) {
      setAuthenticated(false);
      return;
    }
    try {
      await api("admin/me");
      setAuthenticated(true);
      await loadData();
    } catch (error) {
      setAuthenticated(false);
      message(error.message, true);
      await loadBootstrapStatus();
    }
  }

  function handleRouting() {
    var path = window.location.pathname;
    var hash = window.location.hash || "";
    var search = window.location.search || "";
    if (hash.includes("type=recovery") || search.includes("type=recovery")) {
      $("password-login-form").hidden = true;
      $("recovery-form").hidden = true;
      $("new-password-form").hidden = false;
      $("btn-google").hidden = true;
      message("Digite sua nova senha abaixo para redefinir o acesso.", false);
      return;
    }
  }

  async function init() {
    $("password-login-form").addEventListener("submit", signInWithPassword);
    $("recovery-form").addEventListener("submit", handlePasswordRecovery);
    $("new-password-form").addEventListener("submit", handleNewPassword);

    $("btn-show-recovery").addEventListener("click", function () {
      $("password-login-form").hidden = true;
      $("btn-google").hidden = true;
      $("recovery-form").hidden = false;
      message("", false);
      var currentId = $("login-identifier").value;
      if (currentId) $("recovery-identifier").value = currentId;
    });

    $("btn-cancel-recovery").addEventListener("click", function () {
      $("recovery-form").hidden = true;
      $("password-login-form").hidden = false;
      $("btn-google").hidden = false;
      message("", false);
    });

    $("btn-google").addEventListener("click", function () {
      signInGoogle().catch(function (e) { message(e.message, true); });
    });

    $("bootstrap-form").addEventListener("submit", bootstrap);
    $("btn-refresh").addEventListener("click", function () {
      loadData().catch(function (e) { message(e.message, true, "app-message"); });
    });
    $("client-search").addEventListener("input", function () { renderClients(this.value); });
    $("client-status-filter").addEventListener("change", function () { renderClients($("client-search").value); });
    $("client-plan-filter").addEventListener("change", function () { renderClients($("client-search").value); });
    $("payment-search").addEventListener("input", renderPayments);
    $("btn-export-clients").addEventListener("click", exportClients);

    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(function (item) { item.classList.toggle("active", item === tab); });
        document.querySelectorAll(".data-section").forEach(function (section) { section.hidden = section.id !== "section-" + tab.dataset.section; });
      });
    });

    $("btn-signout").addEventListener("click", async function () {
      if (supabaseClient) await supabaseClient.auth.signOut();
      session = null; clients = [];
      setAuthenticated(false);
      $("password-login-form").hidden = false;
      $("recovery-form").hidden = true;
      $("new-password-form").hidden = true;
      $("btn-google").hidden = false;
      message("Sessão encerrada com sucesso.", false);
      window.history.replaceState(null, "", "/atendeja");
    });

    try {
      var response = await fetch("/api/public-config", { cache: "no-store" });
      config = await response.json();
      if (!response.ok || !config.supabaseUrl || !config.supabasePublishableKey || !window.supabase) {
        throw new Error("Configuração do Supabase pendente no servidor.");
      }
      supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });

      handleRouting();
      await checkSession();
    } catch (error) {
      message(error.message, true);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();