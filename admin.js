(function () {
  "use strict";
  var config, supabaseClient, session;
  var clients = [], plans = [], payments = [], audit = [], apiConnections = {};
  var $ = function (id) { return document.getElementById(id); };

  var statusLabels = {
    trial: "Em teste",
    active: "Ativo",
    past_due: "Em atraso",
    canceled: "Cancelado",
    suspended: "Suspenso"
  };

  var sectionMeta = {
    overview: { eyebrow: "Painel do Fundador", title: "Visão geral da operação" },
    clients: { eyebrow: "Gestão de Clientes", title: "Carteira de contratantes" },
    payments: { eyebrow: "Financeiro & Assinaturas", title: "Histórico de pagamentos" },
    plans: { eyebrow: "Catálogo de Produtos", title: "Planos cadastrados" },
    "ai-assistant": { eyebrow: "Inteligência Artificial", title: "IA Assistente do Fundador" },
    "api-connections": { eyebrow: "Integrações & Provedores", title: "Conexões de Provedores de IA" },
    audit: { eyebrow: "Segurança & Conformidade", title: "Auditoria administrativa" }
  };

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
    var loginShell = $("admin-shell-login");
    if (loginShell) loginShell.hidden = show;
    var adminApp = $("admin-app");
    if (adminApp) adminApp.hidden = !show;

    var displayEmail = session && session.user ? session.user.email || "" : "";
    var displayName = (session && session.user && session.user.user_metadata && session.user.user_metadata.full_name) || "";
    if (!displayName && displayEmail.startsWith("gerente@")) displayName = "Gerente";
    var userText = displayName ? displayName + (displayEmail ? " · " + displayEmail : "") : displayEmail;

    if ($("admin-identity")) $("admin-identity").textContent = userText;
    if ($("topbar-identity")) $("topbar-identity").textContent = displayName || userText || "Gerente";
    if ($("sidebar-user-name")) $("sidebar-user-name").textContent = displayName || "Gerente";

    if (show) {
      window.history.replaceState(null, "", "/gerenciar-atendeja");
    }
  }

  function switchSection(sectionId) {
    document.querySelectorAll(".sidebar-item.tab, .tab").forEach(function (item) {
      item.classList.toggle("active", item.dataset.section === sectionId);
    });
    document.querySelectorAll(".data-section").forEach(function (section) {
      section.hidden = section.id !== "section-" + sectionId;
    });

    var meta = sectionMeta[sectionId] || { eyebrow: "Painel do Fundador", title: "Administração" };
    if ($("section-eyebrow")) $("section-eyebrow").textContent = meta.eyebrow;
    if ($("section-header-title")) $("section-header-title").textContent = meta.title;

    closeSidebar();
  }

  function openSidebar() {
    var sidebar = $("admin-sidebar");
    var backdrop = $("sidebar-backdrop");
    if (sidebar) sidebar.classList.add("open");
    if (backdrop) backdrop.classList.add("active");
  }

  function closeSidebar() {
    var sidebar = $("admin-sidebar");
    var backdrop = $("sidebar-backdrop");
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("active");
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
    var body = $("clients-body");
    if (!body) return;
    body.replaceChildren();

    var needle = String(filter || "").trim().toLowerCase();
    var statusFilter = $("client-status-filter") ? $("client-status-filter").value : "";
    var planFilter = $("client-plan-filter") ? $("client-plan-filter").value : "";
    var nicheFilter = $("client-niche-filter") ? $("client-niche-filter").value : "";

    var list = clients.filter(function (c) {
      var matchesText = !needle || (
        String(c.company_name || "") + " " +
        String(c.email_google || "") + " " +
        String(c.niche || "")
      ).toLowerCase().includes(needle);

      var matchesStatus = !statusFilter || c.subscription_status === statusFilter;
      var matchesPlan = !planFilter || c.plan_code === planFilter;
      var matchesNiche = !nicheFilter || (c.niche || "Geral / Não especificado") === nicheFilter;

      return matchesText && matchesStatus && matchesPlan && matchesNiche;
    });

    if ($("clients-empty")) $("clients-empty").hidden = list.length > 0;
    if ($("badge-clients-count")) $("badge-clients-count").textContent = String(clients.length);

    list.forEach(function (client) {
      var row = document.createElement("tr");

      var company = document.createElement("td");
      var name = document.createElement("span");
      name.className = "company-name";
      name.textContent = esc(client.company_name);
      company.appendChild(name);

      var email = document.createElement("span");
      email.className = "subline";
      email.textContent = esc(client.email_google);
      company.appendChild(email);
      row.appendChild(company);

      var nicheTd = document.createElement("td");
      var nicheBadge = document.createElement("span");
      nicheBadge.className = "badge";
      nicheBadge.textContent = esc(client.niche || "Geral / Outros");
      nicheTd.appendChild(nicheBadge);
      row.appendChild(nicheTd);

      var planTd = document.createElement("td");
      var planTitle = document.createElement("div");
      planTitle.textContent = (client.plan_name || client.plan_code || "—") + " · " + money(client.plan_price_brl);
      planTd.appendChild(planTitle);

      var status = document.createElement("span");
      status.className = "badge " + (client.subscription_status === "active" ? "active" : client.subscription_status === "trial" ? "trial" : "");
      status.textContent = statusLabels[client.subscription_status] || client.subscription_status;
      planTd.appendChild(status);
      row.appendChild(planTd);

      row.appendChild(cell(client.subscription_status === "trial" ? String(client.trial_days_left || 0) + " dias restantes" : "Termina em " + date(client.trial_ends_at)));
      row.appendChild(cell(money(client.total_paid_brl)));

      var action = document.createElement("td");
      action.className = "action-cell";

      var planSelect = document.createElement("select");
      planSelect.setAttribute("aria-label", "Novo plano de " + esc(client.company_name));
      plans.forEach(function (p) { option(planSelect, p.code, p.name + " · " + money(p.price_brl), p.code === client.plan_code); });

      var statusSelect = document.createElement("select");
      statusSelect.setAttribute("aria-label", "Novo status de " + esc(client.company_name));
      Object.keys(statusLabels).forEach(function (key) { option(statusSelect, key, statusLabels[key], key === client.subscription_status); });

      var reason = document.createElement("input");
      reason.placeholder = "Motivo obrigatório";
      reason.setAttribute("aria-label", "Motivo para a alteração");

      var save = document.createElement("button");
      save.type = "button";
      save.className = "button quiet";
      save.textContent = "Salvar alteração";
      save.addEventListener("click", async function () {
        save.disabled = true;
        try {
          await api("admin/clients/" + encodeURIComponent(client.client_id), {
            method: "PATCH",
            body: { plan_code: planSelect.value, subscription_status: statusSelect.value, reason: reason.value }
          });
          message("Plano/status atualizados e auditados.", false, "app-message");
          reason.value = "";
          await loadData();
        } catch (error) {
          message(error.message, true, "app-message");
        } finally {
          save.disabled = false;
        }
      });

      action.append(planSelect, statusSelect, reason, save);
      row.appendChild(action);
      body.appendChild(row);
    });
  }

  function renderPayments() {
    var body = $("payments-body");
    if (!body) return;
    body.replaceChildren();

    var names = {};
    clients.forEach(function (c) { names[c.client_id] = c.company_name; });

    var needle = String($("payment-search") ? $("payment-search").value : "").trim().toLowerCase();
    var list = payments.filter(function (p) {
      return !needle || [names[p.client_id], p.plan_code, p.status, p.payment_method].join(" ").toLowerCase().includes(needle);
    });

    if ($("payments-empty")) $("payments-empty").hidden = list.length > 0;
    list.forEach(function (p) {
      var row = document.createElement("tr");
      row.appendChild(cell(dateTime(p.created_at)));
      row.appendChild(cell(names[p.client_id] || p.client_id));
      row.appendChild(cell(p.plan_code));
      row.appendChild(cell(money(p.amount_brl)));
      row.appendChild(cell(p.status));
      body.appendChild(row);
    });
  }

  function renderPlans() {
    var body = $("plans-body");
    if (!body) return;
    body.replaceChildren();

    plans.forEach(function (p) {
      var row = document.createElement("tr");
      row.appendChild(cell(p.name));
      row.appendChild(cell(money(p.price_brl)));
      row.appendChild(cell(p.max_assistants));
      row.appendChild(cell(Number(p.max_apis) >= 99 ? "Ilimitadas" : p.max_apis));
      row.appendChild(cell(p.monthly_planning ? "Sim" : "Não"));
      body.appendChild(row);
    });
  }

  function renderAudit() {
    var body = $("audit-body");
    if (!body) return;
    body.replaceChildren();

    audit.forEach(function (a) {
      var row = document.createElement("tr");
      row.appendChild(cell(dateTime(a.created_at)));
      row.appendChild(cell(a.action));
      row.appendChild(cell(a.actor));
      row.appendChild(cell(JSON.stringify(a.details || {})));
      body.appendChild(row);
    });
  }

  function renderMetrics(topNicheName) {
    if ($("metric-total")) $("metric-total").textContent = String(clients.length);
    if ($("metric-active")) $("metric-active").textContent = String(clients.filter(function (c) { return c.subscription_status === "active"; }).length);
    if ($("metric-trial")) $("metric-trial").textContent = String(clients.filter(function (c) { return c.subscription_status === "trial"; }).length);
    if ($("metric-revenue")) $("metric-revenue").textContent = money(clients.reduce(function (sum, c) { return sum + Number(c.total_paid_brl || 0); }, 0));
    if ($("metric-top-niche")) $("metric-top-niche").textContent = topNicheName || "—";
  }

  function renderNiches() {
    var box = $("niche-breakdown");
    if (!box) return "";

    box.replaceChildren();
    var nicheCounts = {};
    var totalClients = clients.length;

    clients.forEach(function (c) {
      var n = String(c.niche || "").trim() || "Geral / Não especificado";
      nicheCounts[n] = (nicheCounts[n] || 0) + 1;
    });

    var sorted = Object.keys(nicheCounts).map(function (k) {
      return { name: k, count: nicheCounts[k] };
    }).sort(function (a, b) { return b.count - a.count; });

    if ($("total-niches-badge")) {
      $("total-niches-badge").textContent = sorted.length + " nicho" + (sorted.length !== 1 ? "s mapeados" : " mapeado");
    }

    if (sorted.length === 0) {
      var empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Nenhum nicho registrado ainda na base de clientes.";
      box.appendChild(empty);
      return "—";
    }

    sorted.forEach(function (item, index) {
      var pct = totalClients > 0 ? Math.round((item.count / totalClients) * 100) : 0;
      var row = document.createElement("div");
      row.className = "niche-row";
      row.title = "Clique para filtrar contratantes deste nicho";

      var rankClass = index === 0 ? "top-1" : index === 1 ? "top-2" : index === 2 ? "top-3" : "";
      var rankBadge = document.createElement("span");
      rankBadge.className = "niche-rank-badge " + rankClass;
      rankBadge.textContent = "#" + (index + 1);

      var nameEl = document.createElement("span");
      nameEl.className = "niche-name";
      nameEl.textContent = item.name;

      var progressTrack = document.createElement("div");
      progressTrack.className = "niche-progress-track";
      var progressBar = document.createElement("div");
      progressBar.className = "niche-progress-fill";
      progressBar.style.width = Math.max(8, pct) + "%";
      progressTrack.appendChild(progressBar);

      var metaEl = document.createElement("div");
      metaEl.className = "niche-meta";
      metaEl.innerHTML = "<strong>" + item.count + "</strong> (" + pct + "%)";

      row.append(rankBadge, nameEl, progressTrack, metaEl);

      row.addEventListener("click", function () {
        var nicheFilterSelect = $("client-niche-filter");
        if (nicheFilterSelect) {
          nicheFilterSelect.value = item.name;
        }
        renderClients($("client-search") ? $("client-search").value : "");
        switchSection("clients");
      });

      box.appendChild(row);
    });

    return sorted[0] ? sorted[0].name + " (" + sorted[0].count + ")" : "—";
  }

  function renderOverview() {
    var topNiche = renderNiches();
    renderMetrics(topNiche);

    var statusBox = $("status-breakdown");
    if (statusBox) {
      statusBox.replaceChildren();
      Object.keys(statusLabels).forEach(function (key) {
        var row = document.createElement("div");
        row.className = "breakdown-row";
        var label = document.createElement("span");
        label.textContent = statusLabels[key];
        var value = document.createElement("strong");
        value.textContent = String(clients.filter(function (c) { return c.subscription_status === key; }).length);
        row.append(label, value);
        statusBox.appendChild(row);
      });
    }

    var planBox = $("plan-breakdown");
    if (planBox) {
      planBox.replaceChildren();
      plans.forEach(function (plan) {
        var row = document.createElement("div");
        row.className = "breakdown-row";
        var label = document.createElement("span");
        label.textContent = plan.name;
        var value = document.createElement("strong");
        value.textContent = String(clients.filter(function (c) { return c.plan_code === plan.code; }).length);
        row.append(label, value);
        planBox.appendChild(row);
      });
    }

    var recent = $("recent-payments-body");
    if (recent) {
      recent.replaceChildren();
      var names = {};
      clients.forEach(function (c) { names[c.client_id] = c.company_name; });
      payments.slice(0, 6).forEach(function (p) {
        var row = document.createElement("tr");
        row.appendChild(cell(dateTime(p.created_at)));
        row.appendChild(cell(names[p.client_id] || "Cadastro sem nome"));
        row.appendChild(cell(p.plan_code));
        row.appendChild(cell(money(p.amount_brl)));
        row.appendChild(cell(p.status));
        recent.appendChild(row);
      });
    }

    if ($("last-updated")) $("last-updated").textContent = "Atualizado " + dateTime(new Date().toISOString());
  }

  function exportClients() {
    var columns = ["company_name", "niche", "email_google", "plan_code", "subscription_status", "total_paid_brl", "trial_ends_at", "created_at"];
    var lines = [columns.join(";")].concat(clients.map(function (client) {
      return columns.map(function (key) {
        return '"' + String(client[key] == null ? "" : client[key]).replace(/"/g, '""') + '"';
      }).join(";");
    }));
    var blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "atendeja-contratantes.csv";
    link.click();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
  }

  /* ========================================================================
     GERENCIAMENTO DE CONEXÕES DE API (OPENAI, OPENROUTER, GEMINI, OPENCODE, GROQ)
     ======================================================================== */
  async function loadApiConnections() {
    try {
      var res = await api("admin/api-connections");
      apiConnections = res.data || {};

      var configuredCount = 0;
      var providerNames = {
        openai: "OpenAI",
        openrouter: "OpenRouter",
        gemini: "Google Gemini",
        opencode: "OpenCode",
        groq: "Groq"
      };

      var summaryList = $("ai-status-summary-list");
      if (summaryList) summaryList.replaceChildren();

      Object.keys(providerNames).forEach(function (p) {
        var info = apiConnections[p] || {};
        var badge = $("badge-" + p);
        if (badge) {
          if (info.configured) {
            badge.textContent = "Conectado";
            badge.className = "badge provider-badge active";
            configuredCount++;
          } else {
            badge.textContent = "Não configurado";
            badge.className = "badge provider-badge";
          }
        }

        var form = document.querySelector('form.api-provider-form[data-provider="' + p + '"]');
        if (form) {
          if (info.model && form.elements.model) form.elements.model.value = info.model;
          if (info.baseUrl && form.elements.baseUrl) form.elements.baseUrl.value = info.baseUrl;
          if (info.configured && form.elements.api_key && info.maskedKey) {
            form.elements.api_key.placeholder = "Chave salva: " + info.maskedKey;
          }
        }

        if (summaryList) {
          var li = document.createElement("li");
          li.innerHTML = "<span>" + providerNames[p] + "</span> <strong>" + (info.configured ? "✓ Ativo" : "—") + "</strong>";
          summaryList.appendChild(li);
        }
      });

      if ($("badge-api-count")) $("badge-api-count").textContent = String(configuredCount) + "/5";
      if ($("api-status-badge")) $("api-status-badge").textContent = configuredCount + " de 5 Provedores Conectados";
    } catch (_err) {
      // Ignora erro silencioso se endpoints ainda estiverem sendo implantados
    }
  }

  async function handleApiFormSubmit(event) {
    event.preventDefault();
    var form = event.target;
    var provider = form.dataset.provider;
    var statusMsg = form.querySelector(".api-status-msg");
    var submitBtn = form.querySelector('button[type="submit"]');

    var apiKey = form.elements.api_key ? form.elements.api_key.value.trim() : "";
    var model = form.elements.model ? form.elements.model.value.trim() : "";
    var baseUrl = form.elements.baseUrl ? form.elements.baseUrl.value.trim() : "";

    if (statusMsg) {
      statusMsg.textContent = "Salvando configuração…";
      statusMsg.className = "api-status-msg muted";
    }
    submitBtn.disabled = true;

    try {
      var res = await api("admin/api-connections", {
        method: "POST",
        body: { provider: provider, apiKey: apiKey, model: model, baseUrl: baseUrl }
      });
      if (statusMsg) {
        statusMsg.textContent = "✓ " + (res.message || "Conexão salva com sucesso!");
        statusMsg.className = "api-status-msg message success";
      }
      if (form.elements.api_key && apiKey) {
        form.elements.api_key.value = "";
      }
      await loadApiConnections();
    } catch (err) {
      if (statusMsg) {
        statusMsg.textContent = "Erro: " + (err.message || "Falha ao salvar");
        statusMsg.className = "api-status-msg message error";
      }
    } finally {
      submitBtn.disabled = false;
    }
  }

  async function handleApiTest(button) {
    var provider = button.dataset.provider;
    var form = document.querySelector('form.api-provider-form[data-provider="' + provider + '"]');
    if (!form) return;

    var statusMsg = form.querySelector(".api-status-msg");
    var apiKey = form.elements.api_key ? form.elements.api_key.value.trim() : "";
    var model = form.elements.model ? form.elements.model.value.trim() : "";
    var baseUrl = form.elements.baseUrl ? form.elements.baseUrl.value.trim() : "";

    if (statusMsg) {
      statusMsg.textContent = "Testando conexão com " + provider.toUpperCase() + "…";
      statusMsg.className = "api-status-msg muted";
    }
    button.disabled = true;

    try {
      var res = await api("admin/api-connections/test", {
        method: "POST",
        body: { provider: provider, apiKey: apiKey, model: model, baseUrl: baseUrl }
      });
      if (statusMsg) {
        statusMsg.textContent = "✓ " + (res.message || "Conexão validada com sucesso!");
        statusMsg.className = "api-status-msg message success";
      }
    } catch (err) {
      if (statusMsg) {
        statusMsg.textContent = "Falha no teste: " + (err.message || "Erro desconhecido");
        statusMsg.className = "api-status-msg message error";
      }
    } finally {
      button.disabled = false;
    }
  }

  /* ========================================================================
     IA ASSISTENTE DO FUNDADOR
     ======================================================================== */
  function appendChatMessage(role, text) {
    var box = $("ai-chat-messages");
    if (!box) return null;

    var msgDiv = document.createElement("div");
    msgDiv.className = "ai-message " + role;

    var bubble = document.createElement("div");
    bubble.className = "ai-bubble";

    // Formatação básica de markdown para parágrafos, negrito e bullets
    var paragraphs = text.split(/\n\n+/);
    paragraphs.forEach(function (pText) {
      var p = document.createElement("p");
      var formatted = pText
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\n• /g, "<br>• ");
      p.innerHTML = formatted;
      bubble.appendChild(p);
    });

    msgDiv.appendChild(bubble);
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight;
    return msgDiv;
  }

  async function handleAiChatSubmit(event) {
    if (event) event.preventDefault();
    var input = $("ai-user-input");
    var text = input ? input.value.trim() : "";
    if (!text) return;

    input.value = "";
    appendChatMessage("user", text);

    var statusEl = $("ai-chat-status");
    if (statusEl) statusEl.textContent = "● Processando com inteligência…";

    var thinkingMsg = appendChatMessage("assistant", "Pensando…");

    var provider = $("ai-active-provider") ? $("ai-active-provider").value : "groq";
    var systemPrompt = $("ai-system-prompt") ? $("ai-system-prompt").value : "";
    var temperature = $("ai-temperature") ? $("ai-temperature").value : "0.7";

    try {
      var res = await api("admin/ai/chat", {
        method: "POST",
        body: {
          prompt: text,
          provider: provider,
          systemPrompt: systemPrompt,
          temperature: temperature
        }
      });

      if (thinkingMsg && thinkingMsg.parentNode) {
        thinkingMsg.parentNode.removeChild(thinkingMsg);
      }

      var reply = res.reply || "Resposta recebida com sucesso.";
      appendChatMessage("assistant", reply);
    } catch (err) {
      if (thinkingMsg && thinkingMsg.parentNode) {
        thinkingMsg.parentNode.removeChild(thinkingMsg);
      }
      appendChatMessage("assistant", "Erro ao consultar a IA: " + (err.message || "Tente novamente."));
    } finally {
      if (statusEl) statusEl.textContent = "● Pronto para responder";
    }
  }

  /* ========================================================================
     CARREGAMENTO GERAL DE DADOS
     ======================================================================== */
  async function loadData() {
    message("Carregando dados administrativos…", false, "app-message");
    var results = await Promise.all([
      api("admin/clients"),
      api("admin/plans"),
      api("admin/payments"),
      api("admin/audit")
    ]);

    clients = results[0].data || [];
    plans = results[1].data || [];
    payments = results[2].data || [];
    audit = results[3].data || [];

    // Preenche select de filtro por plano
    var planSelect = $("client-plan-filter");
    if (planSelect) {
      var selectedPlan = planSelect.value;
      planSelect.replaceChildren();
      option(planSelect, "", "Todos os planos", !selectedPlan);
      plans.forEach(function (p) { option(planSelect, p.code, p.name, p.code === selectedPlan); });
    }

    // Preenche select de filtro por nicho
    var nicheSelect = $("client-niche-filter");
    if (nicheSelect) {
      var selectedNiche = nicheSelect.value;
      nicheSelect.replaceChildren();
      option(nicheSelect, "", "Todos os nichos", !selectedNiche);

      var uniqueNiches = [];
      clients.forEach(function (c) {
        var n = String(c.niche || "").trim() || "Geral / Não especificado";
        if (!uniqueNiches.includes(n)) uniqueNiches.push(n);
      });
      uniqueNiches.sort().forEach(function (n) {
        option(nicheSelect, n, n, n === selectedNiche);
      });
    }

    renderOverview();
    renderClients($("client-search") ? $("client-search").value : "");
    renderPayments();
    renderPlans();
    renderAudit();
    await loadApiConnections();

    message("Dados atualizados.", false, "app-message");
  }

  async function checkSession() {
    if (!supabaseClient) return;
    var result = await supabaseClient.auth.getSession();
    session = result.data && result.data.session;

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
    var hash = window.location.hash || "";
    var search = window.location.search || "";
    if (hash.includes("type=recovery") || search.includes("type=recovery")) {
      $("password-login-form").hidden = true;
      $("recovery-form").hidden = true;
      $("new-password-form").hidden = false;
      $("btn-google").hidden = true;
      message("Digite sua nova senha abaixo para redefinir o acesso.", false);
    }
  }

  async function signOut() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    session = null;
    clients = [];
    setAuthenticated(false);
    $("password-login-form").hidden = false;
    $("recovery-form").hidden = true;
    $("new-password-form").hidden = true;
    $("btn-google").hidden = false;
    message("Sessão encerrada com sucesso.", false);
    window.history.replaceState(null, "", "/atendeja");
  }

  /* ========================================================================
     INICIALIZAÇÃO DO APLICATIVO
     ======================================================================== */
  async function init() {
    // Autenticação
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

    // Botões de Saída
    if ($("btn-signout")) $("btn-signout").addEventListener("click", signOut);
    if ($("btn-topbar-signout")) $("btn-topbar-signout").addEventListener("click", signOut);
    if ($("btn-sidebar-signout")) $("btn-sidebar-signout").addEventListener("click", signOut);

    // Ações do Topbar
    if ($("btn-refresh")) {
      $("btn-refresh").addEventListener("click", function () {
        loadData().catch(function (e) { message(e.message, true, "app-message"); });
      });
    }

    // Filtros e busca de clientes
    if ($("client-search")) $("client-search").addEventListener("input", function () { renderClients(this.value); });
    if ($("client-status-filter")) $("client-status-filter").addEventListener("change", function () { renderClients($("client-search").value); });
    if ($("client-plan-filter")) $("client-plan-filter").addEventListener("change", function () { renderClients($("client-search").value); });
    if ($("client-niche-filter")) $("client-niche-filter").addEventListener("change", function () { renderClients($("client-search").value); });
    if ($("payment-search")) $("payment-search").addEventListener("input", renderPayments);
    if ($("btn-export-clients")) $("btn-export-clients").addEventListener("click", exportClients);

    // Navegação por Tabs / Sidebar
    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        switchSection(tab.dataset.section);
      });
    });

    // Mobile Sidebar Drawer
    if ($("btn-open-sidebar")) $("btn-open-sidebar").addEventListener("click", openSidebar);
    if ($("btn-close-sidebar")) $("btn-close-sidebar").addEventListener("click", closeSidebar);
    if ($("sidebar-backdrop")) $("sidebar-backdrop").addEventListener("click", closeSidebar);

    // IA Assistente
    if ($("ai-chat-form")) $("ai-chat-form").addEventListener("submit", handleAiChatSubmit);
    if ($("btn-clear-chat")) {
      $("btn-clear-chat").addEventListener("click", function () {
        var box = $("ai-chat-messages");
        if (box) {
          box.replaceChildren();
          appendChatMessage("assistant", "Conversa limpa. Em que mais posso te ajudar, Fundador?");
        }
      });
    }
    if ($("ai-temperature")) {
      $("ai-temperature").addEventListener("input", function () {
        if ($("ai-temp-val")) $("ai-temp-val").textContent = this.value;
      });
    }
    if ($("btn-goto-apis")) {
      $("btn-goto-apis").addEventListener("click", function () {
        switchSection("api-connections");
      });
    }

    // Chips de prompts rápidos
    document.querySelectorAll(".quick-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var p = chip.dataset.prompt;
        if (p && $("ai-user-input")) {
          $("ai-user-input").value = p;
          handleAiChatSubmit();
        }
      });
    });

    // Conexões de API (Forms, Testes, Visibilidade)
    document.querySelectorAll(".api-provider-form").forEach(function (form) {
      form.addEventListener("submit", handleApiFormSubmit);
    });

    document.querySelectorAll(".btn-test-api").forEach(function (btn) {
      btn.addEventListener("click", function () {
        handleApiTest(btn);
      });
    });

    document.querySelectorAll(".btn-toggle-visibility").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var input = btn.previousElementSibling;
        if (input && input.tagName === "INPUT") {
          input.type = input.type === "password" ? "text" : "password";
          btn.textContent = input.type === "password" ? "👁️" : "🔒";
        }
      });
    });

    // Inicializa Supabase
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
