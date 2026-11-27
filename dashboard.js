(function () {
  "use strict";

  var KEYS = {
    LEADS: "atendeja_leads_v2",
    LEADS_LEGACY: "atendeja_leads_v1",
    HISTORY: "atendeja_history_v1",
    TENANT: "atendeja_tenant_v1",
    PLANNING: "atendeja_planning_v1",
    ASSISTANTS: "atendeja_assistants_v1",
    PLAN_STATE: "atendeja_plan_state_v1",
    CONNECTIONS: "atendeja_connections_v1",
    SESSION: "atendeja_session_active"
  };

  // Garante acesso direto imediato em modo preview/demo sem bloqueio de pagamento
  if (window.location.search.indexOf("demo") !== -1 || window.location.search.indexOf("preview") !== -1 || !localStorage.getItem(KEYS.SESSION)) {
    try { localStorage.setItem(KEYS.SESSION, "true"); } catch (_e) {}
  }

  var STAGES = [
    { id: "novo", label: "Novo Lead" },
    { id: "atendimento", label: "Em Atendimento" },
    { id: "orcamento", label: "Orçamento Enviado" },
    { id: "retorno", label: "Aguardando Retorno" },
    { id: "fechado", label: "Fechado" },
    { id: "perdido", label: "Perdido" }
  ];
  var STAGE_MAP = {};
  STAGES.forEach(function (s, idx) { STAGE_MAP[s.id] = { label: s.label, order: idx }; });

  var CAPABILITIES = [
    { id: "atendimento", label: "Atendimento Inicial 24h" },
    { id: "cotacao", label: "Cotação & Orçamentos" },
    { id: "vendas", label: "Vendas & Follow-up" },
    { id: "crm_auto", label: "Movimentação Automática CRM" },
    { id: "marketing", label: "Marketing & Campanhas" },
    { id: "agendamento", label: "Agendamento" },
    { id: "pos_venda", label: "Pós-Venda & Cobrança" }
  ];

  var PLAN_CATALOG = {
    trial: {
      id: "trial",
      label: "Teste Grátis (15 dias)",
      shortLabel: "Trial 15d",
      price: 0,
      maxAssistants: 1,
      capabilities: ["atendimento"],
      monthlyPlanning: false,
      maxApis: 1
    },
    essencial: {
      id: "essencial",
      label: "Essencial",
      shortLabel: "Essencial",
      price: 49,
      maxAssistants: 1,
      capabilities: ["atendimento", "cotacao"],
      monthlyPlanning: false,
      maxApis: 2
    },
    pro: {
      id: "pro",
      label: "Pro",
      shortLabel: "Pro",
      price: 97,
      maxAssistants: 3,
      capabilities: ["atendimento", "cotacao", "vendas", "crm_auto"],
      monthlyPlanning: true,
      maxApis: 4
    },
    empresa: {
      id: "empresa",
      label: "Empresa",
      shortLabel: "Empresa",
      price: 197,
      maxAssistants: 6,
      capabilities: ["atendimento", "cotacao", "vendas", "crm_auto", "marketing", "agendamento", "pos_venda"],
      monthlyPlanning: true,
      maxApis: 99
    }
  };

  var WEEK_DAYS = [
    { id: "seg", label: "Segunda" },
    { id: "ter", label: "Terça" },
    { id: "qua", label: "Quarta" },
    { id: "qui", label: "Quinta" },
    { id: "sex", label: "Sexta" },
    { id: "sab", label: "Sábado" },
    { id: "dom", label: "Domingo" }
  ];

  var STAGE_RULES = [
    { stage: "fechado", label: "Fechado", words: ["fechado", "fechou", "aprovado", "pode agendar", "paguei", "pix enviado", "comprovante", "contrato", "vamos fechar"] },
    { stage: "perdido", label: "Perdido", words: ["nao quero", "desisti", "muito caro", "cancelar", "fechei com outro", "sem interesse", "agora nao"] },
    { stage: "retorno", label: "Aguardando Retorno", words: ["vou pensar", "semana que vem", "amanha", "me chama", "retorno", "combinar depois", "ver com"] },
    { stage: "orcamento", label: "Orçamento Enviado", words: ["orcamento", "valor", "preco", "quanto custa", "proposta", "cotacao", "enviei o valor"] },
    { stage: "atendimento", label: "Em Atendimento", words: ["oi", "ola", "bom dia", "boa tarde", "boa noite", "visita", "disponivel", "atendimento"], onlyFrom: "novo" }
  ];

  function $(id) { return document.getElementById(id); }
  function todayIso() { return new Date().toISOString().slice(0, 10); }
  function nowTime() { return new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  function formatBrl(v) { return "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function normalizeText(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function cleanPhone(raw) {
    var d = String(raw || "").replace(/\D/g, "");
    if (d && d.indexOf("55") !== 0 && (d.length === 10 || d.length === 11)) return "55" + d;
    return d;
  }
  function initials(name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "A";
    return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  }
  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (_e) {}
    return fallback;
  }
  function writeJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      if (window.ATENDEJA_STATE) window.ATENDEJA_STATE.schedule();
      return true;
    } catch (_e) { return false; }
  }
  function isDueOrOverdue(dateStr, status) {
    if (!dateStr || status === "fechado" || status === "perdido") return false;
    return dateStr <= todayIso();
  }
  function socialHref(tipo, url) {
    if (!url) return "#";
    if (/^https?:\/\//i.test(url)) return url;
    var h = url.replace(/^@/, "");
    if (tipo === "Instagram") return "https://instagram.com/" + h;
    if (tipo === "Facebook") return "https://facebook.com/" + h;
    if (tipo === "TikTok") return "https://tiktok.com/@" + h;
    if (tipo === "YouTube") return "https://youtube.com/@" + h;
    return "#";
  }
  function showToast(msg) {
    var el = $("toast-banner");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.hidden = true; }, 4200);
  }

  /* ================= STATE INIT & MIGRATION ================= */
  var params = new URLSearchParams(window.location.search);

  function loadTenant() {
    var t = readJson(KEYS.TENANT, {}) || {};
    t.empresa = t.empresa || params.get("empresa") || "";
    t.atendente = t.atendente || params.get("atendente") || "";
    t.nicho = t.nicho || params.get("nicho") || "";
    t.plano = t.plano || "trial";
    t.redeSocialTipo = t.redeSocialTipo || "Instagram";
    return t;
  }

  function defaultExamples() {
    var today = todayIso();
    return [
      {
        id: "demo-1", nome: "Marcos Oliveira (Exemplo)", whatsapp: "69993768304",
        servico: "Troca de quadro elétrico residencial", nicho: "Elétrica e Hidráulica",
        valor: 850, retorno: today, status: "retorno", obs: "Combinado retorno hoje às 14h",
        autoStage: true, lastAutoReason: 'IA: detectado "combinar depois" → Aguardando Retorno',
        updatedAt: today,
        messages: [
          { from: "lead", text: "Olá, preciso trocar meu quadro elétrico.", at: "09:10" },
          { from: "agent", text: "Orçamento de R$ 850,00 enviado.", at: "09:14" },
          { from: "lead", text: "Vou combinar depois da tarde com minha esposa.", at: "09:22" }
        ]
      },
      {
        id: "demo-2", nome: "Juliana Costa (Exemplo)", whatsapp: "69992114455",
        servico: "Limpeza e recarga de gás 2 splits", nicho: "Climatização",
        valor: 540, retorno: today, status: "orcamento", obs: "Orçamento enviado via WhatsApp",
        autoStage: true, lastAutoReason: "", updatedAt: today,
        messages: [{ from: "lead", text: "Quanto custa limpeza de 2 splits?", at: "10:05" }]
      },
      {
        id: "demo-3", nome: "Oficina Auto Center (Exemplo)", whatsapp: "69991887766",
        servico: "Vitrificação completa SUV", nicho: "Estética Automotiva",
        valor: 1200, retorno: "", status: "fechado", obs: "Agendado para sexta-feira",
        autoStage: true, lastAutoReason: 'IA: detectado "fechado" → Fechado', updatedAt: today,
        messages: [{ from: "lead", text: "Fechado! Pode agendar para sexta.", at: "Ontem" }]
      },
      {
        id: "demo-4", nome: "Ricardo Almeida (Exemplo)", whatsapp: "69994553322",
        servico: "Armário planejado cozinha", nicho: "Marcenaria",
        valor: 4800, retorno: "", status: "novo", obs: "Pediu visita técnica",
        autoStage: true, lastAutoReason: "", updatedAt: today,
        messages: []
      },
      {
        id: "demo-5", nome: "Clinica Vida (Exemplo)", whatsapp: "69995112233",
        servico: "Manutenção elétrica preventiva", nicho: "Elétrica e Hidráulica",
        valor: 650, retorno: "", status: "fechado", obs: "Pix confirmado",
        autoStage: true, lastAutoReason: "", updatedAt: today,
        messages: []
      }
    ];
  }

  function loadLeads() {
    var current = readJson(KEYS.LEADS, null);
    if (Array.isArray(current)) return current;
    var legacy = readJson(KEYS.LEADS_LEGACY, null);
    var migrated = Array.isArray(legacy) ? legacy.map(function (l) {
      return Object.assign({ messages: [], autoStage: true, lastAutoReason: "", updatedAt: todayIso() }, l);
    }) : defaultExamples();
    writeJson(KEYS.LEADS, migrated);
    return migrated;
  }

  function loadHistory() {
    var h = readJson(KEYS.HISTORY, null);
    if (Array.isArray(h)) return h;
    var seed = [
      { id: "h-1", type: "win", text: "Venda fechada: Oficina Auto Center — Vitrificação completa SUV (R$ 1.200,00)", time: nowTime() },
      { id: "h-2", type: "ia", text: 'IA moveu Marcos Oliveira para "Aguardando Retorno" após mensagem no chat', time: nowTime() }
    ];
    writeJson(KEYS.HISTORY, seed);
    return seed;
  }

  function loadPlanState(t) {
    var st = readJson(KEYS.PLAN_STATE, null);
    if (st && PLAN_CATALOG[st.currentPlan]) return st;
    var normalized = String(t.plano || "trial").toLowerCase();
    var initialPlan = PLAN_CATALOG[normalized] && normalized !== "trial" ? normalized : "trial";
    var fresh = {
      currentPlan: initialPlan,
      trialStartedAt: new Date().toISOString(),
      trialDays: 15
    };
    writeJson(KEYS.PLAN_STATE, fresh);
    return fresh;
  }

  function loadPlanning(t) {
    var p = readJson(KEYS.PLANNING, null);
    if (p && p.days) return p;
    var fresh = {
      periodMode: "semanal",
      metaClientes: 8,
      metaFaturamento: 4500,
      capacidadeDia: 3,
      observacoes: "",
      servicesToOffer: [
        { id: "srv-1", nome: t.nicho ? ("Serviço principal — " + t.nicho) : "Atendimento / Instalação padrão", preco: 450, metaQtd: 5 },
        { id: "srv-2", nome: "Manutenção preventiva", preco: 250, metaQtd: 3 }
      ],
      days: {
        seg: [{ id: "t-1", text: "Responder novos leads pela manhã", done: true }],
        ter: [{ id: "t-2", text: "Fazer follow-up de orçamentos abertos", done: false }],
        qua: [],
        qui: [{ id: "t-3", text: "Revisar lembretes de retorno", done: false }],
        sex: [{ id: "t-4", text: "Fechar meta semanal e conferir caixa", done: false }],
        sab: [],
        dom: []
      },
      closedCycles: []
    };
    writeJson(KEYS.PLANNING, fresh);
    return fresh;
  }

  function loadAssistants(t) {
    var list = readJson(KEYS.ASSISTANTS, null);
    if (Array.isArray(list) && list.length > 0) return list;
    var nicheNote = t.nicho ? (" especialista em " + t.nicho) : "";
    var seed = [
      {
        id: "ast-inicial",
        nome: "Assistente de Atendimento Inicial",
        especialidade: "Atendimento",
        capacidades: ["atendimento"],
        prompt: "Atender novos clientes" + nicheNote + ", responder dúvidas básicas e encaminhar pedido de orçamento.",
        ativo: true,
        trialTag: true,
        whatsappBinding: "WAHA Principal",
        aiBinding: "Padrão (OpenAI)"
      }
    ];
    writeJson(KEYS.ASSISTANTS, seed);
    return seed;
  }

  function loadConnections() {
    var cfg = window.ATENDEJA_CONFIG || {};
    var c = readJson(KEYS.CONNECTIONS, null);
    if (c && c.whatsapp && c.ai && c.webhooks) return c;
    var fresh = {
      whatsapp: {
        provider: "WAHA (Self-Hosted)",
        url: "https://waha.minhaempresaautonoma.online",
        session: "default",
        apiKeyMask: "",
        hasKey: false,
        verified: false
      },
      ai: {
        provider: "OpenAI",
        model: "gpt-4o-mini",
        apiKeyMask: "",
        hasKey: false
      },
      webhooks: {
        checkoutUrl: cfg.checkoutWebhookUrl || "https://n8nweb.minhaempresaautonoma.online/webhook/atendeja/criar-checkout",
        crmInboundUrl: ""
      }
    };
    writeJson(KEYS.CONNECTIONS, fresh);
    return fresh;
  }

  var tenant = loadTenant();
  var leads = loadLeads();
  var historyLog = loadHistory();
  var planState = loadPlanState(tenant);
  var planning = loadPlanning(tenant);
  var assistants = loadAssistants(tenant);
  var connections = loadConnections();

  var activeView = "painel";
  var historyFilter = "all";
  var crmMode = "kanban";
  var crmOnlyToday = false;
  var crmSearch = "";
  var iaAutoEnabled = true;

  function addHistory(type, text) {
    historyLog.unshift({ id: "h-" + Date.now(), type: type, text: text, time: nowTime() });
    if (historyLog.length > 40) historyLog.length = 40;
    writeJson(KEYS.HISTORY, historyLog);
  }

  function currentPlan() {
    if (window.ATENDEJA_AUTH && window.ATENDEJA_AUTH.enabled && tenant.plano) return PLAN_CATALOG[tenant.plano] || PLAN_CATALOG.trial;
    return PLAN_CATALOG[planState.currentPlan] || PLAN_CATALOG.trial;
  }
  function trialDaysLeft() {
    if (window.ATENDEJA_AUTH && window.ATENDEJA_AUTH.enabled && tenant.trialEndsAt) {
      var remaining = Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / 86400000);
      return Math.max(0, Number.isFinite(remaining) ? remaining : 0);
    }
    var start = new Date(planState.trialStartedAt || Date.now()).getTime();
    var elapsed = Math.floor((Date.now() - start) / 86400000);
    return Math.max(0, (planState.trialDays || 15) - elapsed);
  }

  /* ================= BRANDING & NAVEGAÇÃO ================= */
  function renderBranding() {
    var empresa = tenant.empresa || "";
    var hasLogo = !!tenant.logoDataUrl;

    document.querySelectorAll(".js-brand-name").forEach(function (el) {
      if (empresa) el.textContent = empresa;
      else el.innerHTML = 'Atende<span class="brand-accent">Já</span>';
    });
    document.querySelectorAll(".js-tenant-logo").forEach(function (img) {
      if (hasLogo) { img.src = tenant.logoDataUrl; img.hidden = false; }
      else { img.removeAttribute("src"); img.hidden = true; }
    });
    document.querySelectorAll(".js-default-logo").forEach(function (svg) {
      svg.style.display = hasLogo ? "none" : "";
    });

    var p = currentPlan();
    $("nav-plan-badge").textContent = p.id === "trial" ? (trialDaysLeft() + "d") : p.shortLabel;

    var parts = [];
    if (tenant.atendente) parts.push("Atendente: " + tenant.atendente);
    if (tenant.nicho) parts.push(tenant.nicho);
    if (tenant.cidade) parts.push(tenant.cidade);
    $("painel-context").textContent = parts.length ? parts.join(" • ") : "Controle geral de vendas, ticket médio e histórico de leads.";

    var chip = $("tenant-social-chip");
    if (tenant.redeSocialUrl) {
      chip.textContent = tenant.redeSocialTipo + ": " + tenant.redeSocialUrl;
      chip.href = socialHref(tenant.redeSocialTipo, tenant.redeSocialUrl);
      chip.hidden = false;
    } else {
      chip.hidden = true;
    }

    // Preview Perfil
    $("profile-preview-name").textContent = empresa || "Sua empresa";
    $("profile-preview-meta").textContent = [tenant.nicho, tenant.cidade].filter(Boolean).join(" • ") || "—";
    $("profile-plan-badge").textContent = p.label;
    if (hasLogo) {
      $("profile-logo-big").src = tenant.logoDataUrl;
      $("profile-logo-big").hidden = false;
      $("profile-logo-fallback").style.display = "none";
    } else {
      $("profile-logo-big").hidden = true;
      $("profile-logo-fallback").style.display = "";
      $("profile-logo-fallback").textContent = initials(empresa);
    }

    // Tela Google
    $("auth-company-title").textContent = empresa ? (empresa + " • AtendeJá") : "Acessar Painel AtendeJá";
    $("auth-email-sub").textContent = tenant.emailGoogle ? ("Conta vinculada: " + tenant.emailGoogle) : "Entre com sua conta Google cadastrada para acessar seu painel.";
    if (hasLogo) {
      $("auth-logo-img").src = tenant.logoDataUrl;
      $("auth-logo-img").hidden = false;
      $("auth-default-svg").style.display = "none";
    } else {
      $("auth-logo-img").hidden = true;
      $("auth-default-svg").style.display = "";
    }
  }

  var sidebar = $("sidebar");
  var overlay = $("sidebar-overlay");
  function openSidebar() { sidebar.classList.add("is-open"); overlay.classList.add("is-open"); }
  function closeSidebar() { sidebar.classList.remove("is-open"); overlay.classList.remove("is-open"); }
  $("btn-open-sidebar").addEventListener("click", openSidebar);
  overlay.addEventListener("click", closeSidebar);

  function navigate(viewName) {
    var valid = { painel: 1, crm: 1, planejamento: 1, assistentes: 1, conexoes: 1, perfil: 1 };
    if (!valid[viewName]) viewName = "painel";
    activeView = viewName;

    document.querySelectorAll(".view").forEach(function (sec) {
      sec.hidden = sec.id !== ("view-" + viewName);
    });
    document.querySelectorAll(".nav-item[data-nav]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-nav") === viewName);
    });

    if (viewName === "painel") renderPainel();
    else if (viewName === "crm") renderCrm();
    else if (viewName === "planejamento") renderPlanning();
    else if (viewName === "assistentes") renderAssistants();
    else if (viewName === "conexoes") renderConnections();
    else if (viewName === "perfil") fillProfileForm();

    closeSidebar();
    window.scrollTo(0, 0);
    try { history.replaceState(null, "", "#" + viewName); } catch (_e) {}
  }

  document.querySelectorAll("[data-nav]").forEach(function (btn) {
    btn.addEventListener("click", function () { navigate(btn.getAttribute("data-nav")); });
  });

  function updateSidebarCounts() {
    var due = leads.filter(function (l) { return isDueOrOverdue(l.retorno, l.status); }).length;
    var el = $("nav-count-retornos");
    el.textContent = String(due);
    el.hidden = due === 0;
  }

  /* ================= ABA 1: PAINEL DE LEADS ================= */
  function renderPainel() {
    var closed = leads.filter(function (l) { return l.status === "fechado"; });
    var openPipe = leads.filter(function (l) { return l.status === "novo" || l.status === "atendimento" || l.status === "orcamento" || l.status === "retorno"; });
    var due = leads.filter(function (l) { return isDueOrOverdue(l.retorno, l.status); });

    var closedSum = closed.reduce(function (s, l) { return s + Number(l.valor || 0); }, 0);
    var pipeSum = openPipe.reduce(function (s, l) { return s + Number(l.valor || 0); }, 0);
    var ticketMedio = closed.length ? (closedSum / closed.length) : 0;
    var conv = leads.length ? Math.round((closed.length / leads.length) * 100) : 0;

    $("p-kpi-total").textContent = String(leads.length);
    $("p-kpi-total-meta").textContent = leads.filter(function (l) { return l.status === "novo"; }).length + " novo(s)";
    $("p-kpi-ticket").textContent = formatBrl(ticketMedio);
    $("p-kpi-fechado").textContent = formatBrl(closedSum);
    $("p-kpi-fechado-meta").textContent = closed.length + " venda(s) • " + conv + "% conversão";
    $("p-kpi-pipe").textContent = formatBrl(pipeSum);
    $("p-kpi-pipe-meta").textContent = openPipe.length + " em negociação";
    $("p-kpi-retornos").textContent = String(due.length);

    // Serviços vendidos
    var srvMap = {};
    var sourceForServices = closed.length ? closed : leads;
    sourceForServices.forEach(function (l) {
      var key = (l.nicho || l.servico || "Outros").trim();
      if (!srvMap[key]) srvMap[key] = { name: key, qty: 0, total: 0 };
      srvMap[key].qty += 1;
      srvMap[key].total += Number(l.valor || 0);
    });
    var srvList = Object.keys(srvMap).map(function (k) { return srvMap[k]; }).sort(function (a, b) { return b.total - a.total; });
    var maxSrv = srvList.length ? Math.max(1, srvList[0].total) : 1;

    var srvEl = $("painel-services-bars");
    srvEl.innerHTML = "";
    $("painel-services-mode").textContent = closed.length ? "Baseado em vendas fechadas" : "Sem vendas fechadas (mostrando todos os leads)";
    if (!srvList.length) {
      srvEl.innerHTML = '<div class="empty-state">Nenhum serviço registrado ainda.</div>';
    } else {
      srvList.slice(0, 6).forEach(function (item) {
        var row = document.createElement("div");
        var top = document.createElement("div"); top.className = "bar-row-top";
        var nm = document.createElement("span"); nm.className = "bar-name"; nm.textContent = item.name;
        var vl = document.createElement("span"); vl.className = "bar-val"; vl.textContent = item.qty + "x • " + formatBrl(item.total);
        top.appendChild(nm); top.appendChild(vl);
        var tr = document.createElement("div"); tr.className = "bar-track";
        var fl = document.createElement("div"); fl.className = "bar-fill";
        fl.style.width = Math.max(6, Math.round((item.total / maxSrv) * 100)) + "%";
        tr.appendChild(fl);
        row.appendChild(top); row.appendChild(tr);
        srvEl.appendChild(row);
      });
    }

    // Funil por etapa
    var funnelEl = $("painel-funnel-bars");
    funnelEl.innerHTML = "";
    var maxCount = Math.max(1, leads.length);
    STAGES.forEach(function (st) {
      var list = leads.filter(function (l) { return l.status === st.id; });
      var sum = list.reduce(function (s, l) { return s + Number(l.valor || 0); }, 0);
      var row = document.createElement("div");
      var top = document.createElement("div"); top.className = "bar-row-top";
      var nm = document.createElement("span"); nm.className = "bar-name"; nm.textContent = st.label;
      var vl = document.createElement("span"); vl.className = "bar-val"; vl.textContent = list.length + " (" + formatBrl(sum) + ")";
      top.appendChild(nm); top.appendChild(vl);
      var tr = document.createElement("div"); tr.className = "bar-track";
      var fl = document.createElement("div"); fl.className = "bar-fill" + (st.id === "orcamento" || st.id === "retorno" ? " is-gold" : "");
      fl.style.width = (list.length ? Math.max(6, Math.round((list.length / maxCount) * 100)) : 0) + "%";
      tr.appendChild(fl);
      row.appendChild(top); row.appendChild(tr);
      funnelEl.appendChild(row);
    });

    renderHistory();
  }

  function renderHistory() {
    var ul = $("painel-history-list");
    var filtered = historyLog.filter(function (h) {
      if (historyFilter === "all") return true;
      return h.type === historyFilter;
    });
    ul.innerHTML = "";
    $("painel-history-empty").hidden = filtered.length > 0;
    filtered.slice(0, 15).forEach(function (item) {
      var li = document.createElement("li"); li.className = "history-item";
      var left = document.createElement("div");
      var badge = document.createElement("span");
      badge.className = "history-badge" + (item.type === "ia" ? " is-ia" : item.type === "win" ? " is-win" : "");
      badge.textContent = item.type === "ia" ? "⚡ IA" : item.type === "win" ? "Venda" : "Registro";
      var txt = document.createElement("span"); txt.textContent = item.text;
      left.appendChild(badge); left.appendChild(txt);
      var tm = document.createElement("span"); tm.className = "history-time"; tm.textContent = item.time;
      li.appendChild(left); li.appendChild(tm);
      ul.appendChild(li);
    });
  }

  document.querySelectorAll("[data-hfilter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("[data-hfilter]").forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      historyFilter = btn.getAttribute("data-hfilter") || "all";
      renderHistory();
    });
  });

  /* ================= ABA 2: CRM - LEADS (KANBAN + MOTOR IA) ================= */
  function analyzeMessageAndAdvanceStage(text, currentStage) {
    if (!iaAutoEnabled) return null;
    var norm = normalizeText(text);
    if (!norm) return null;
    for (var i = 0; i < STAGE_RULES.length; i++) {
      var r = STAGE_RULES[i];
      if (r.onlyFrom && r.onlyFrom !== currentStage) continue;
      for (var j = 0; j < r.words.length; j++) {
        if (norm.indexOf(r.words[j]) !== -1) {
          if (r.stage === currentStage) return null;
          return { stage: r.stage, label: r.label, trigger: r.words[j] };
        }
      }
    }
    return null;
  }

  function moveLeadStage(leadId, nextStage, reasonText, isAuto) {
    var target = leads.find(function (l) { return l.id === leadId; });
    if (!target || target.status === nextStage) return false;
    var fromLabel = (STAGE_MAP[target.status] || {}).label || target.status;
    var toLabel = (STAGE_MAP[nextStage] || {}).label || nextStage;
    target.status = nextStage;
    target.updatedAt = todayIso();
    if (reasonText) target.lastAutoReason = reasonText;
    writeJson(KEYS.LEADS, leads);

    if (nextStage === "fechado") {
      addHistory("win", "Fechado: " + target.nome + " — " + target.servico + " (" + formatBrl(target.valor) + ")");
    } else if (isAuto) {
      addHistory("ia", "IA moveu " + target.nome + ' de "' + fromLabel + '" para "' + toLabel + '" (' + reasonText + ")");
    } else {
      addHistory("info", target.nome + ' movido de "' + fromLabel + '" para "' + toLabel + '"');
    }
    updateSidebarCounts();
    return true;
  }

  function getFilteredCrmLeads() {
    var q = normalizeText(crmSearch.trim());
    return leads.filter(function (l) {
      if (crmOnlyToday && !isDueOrOverdue(l.retorno, l.status)) return false;
      if (!q) return true;
      return normalizeText([l.nome, l.whatsapp, l.servico, l.nicho, l.obs].join(" ")).indexOf(q) !== -1;
    });
  }

  function renderCrm() {
    var list = getFilteredCrmLeads();
    var board = $("kanban-board");
    var listWrap = $("crm-list-wrap");
    board.hidden = crmMode !== "kanban";
    listWrap.hidden = crmMode !== "lista";

    if (crmMode === "kanban") renderKanban(list);
    else renderCrmTable(list);
  }

  var draggedLeadId = null;

  function renderKanban(list) {
    var board = $("kanban-board");
    board.innerHTML = "";

    STAGES.forEach(function (st) {
      var colItems = list.filter(function (l) { return l.status === st.id; });
      var colSum = colItems.reduce(function (s, l) { return s + Number(l.valor || 0); }, 0);

      var col = document.createElement("div");
      col.className = "kanban-col";
      col.setAttribute("data-stage", st.id);

      var head = document.createElement("div"); head.className = "kanban-col-head";
      var title = document.createElement("div"); title.className = "kanban-col-title";
      var dot = document.createElement("span"); dot.className = "stage-dot";
      var lbl = document.createElement("span"); lbl.textContent = st.label;
      title.appendChild(dot); title.appendChild(lbl);
      var meta = document.createElement("span"); meta.className = "kanban-col-meta";
      meta.textContent = colItems.length + " • " + formatBrl(colSum);
      head.appendChild(title); head.appendChild(meta);

      var body = document.createElement("div");
      body.className = "kanban-col-body";

      col.addEventListener("dragover", function (e) {
        e.preventDefault();
        col.classList.add("is-drag-over");
      });
      col.addEventListener("dragleave", function () {
        col.classList.remove("is-drag-over");
      });
      col.addEventListener("drop", function (e) {
        e.preventDefault();
        col.classList.remove("is-drag-over");
        var id = e.dataTransfer ? e.dataTransfer.getData("text/plain") : draggedLeadId;
        id = id || draggedLeadId;
        if (id && moveLeadStage(id, st.id, "", false)) {
          showToast('Lead movido para "' + st.label + '".');
          renderCrm();
        }
      });

      if (!colItems.length) {
        var emptyCol = document.createElement("div");
        emptyCol.className = "empty-state";
        emptyCol.style.padding = "22px 10px";
        emptyCol.style.fontSize = "12px";
        emptyCol.textContent = "Arraste um lead para cá";
        body.appendChild(emptyCol);
      } else {
        colItems.forEach(function (lead) {
          var card = document.createElement("article");
          card.className = "kanban-card";
          card.setAttribute("draggable", "true");
          card.setAttribute("data-lead-id", lead.id);

          card.addEventListener("dragstart", function (e) {
            draggedLeadId = lead.id;
            card.classList.add("is-dragging");
            if (e.dataTransfer) {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", lead.id);
            }
          });
          card.addEventListener("dragend", function () {
            draggedLeadId = null;
            card.classList.remove("is-dragging");
            document.querySelectorAll(".kanban-col.is-drag-over").forEach(function (c) { c.classList.remove("is-drag-over"); });
          });

          var top = document.createElement("div"); top.className = "kc-top";
          var nm = document.createElement("span"); nm.className = "kc-name"; nm.textContent = lead.nome;
          var vl = document.createElement("span"); vl.className = "kc-val"; vl.textContent = formatBrl(lead.valor);
          top.appendChild(nm); top.appendChild(vl);

          var sv = document.createElement("div"); sv.className = "kc-service";
          sv.textContent = lead.servico + (lead.nicho ? " • " + lead.nicho : "");

          var tags = document.createElement("div"); tags.className = "kc-tags";
          if (lead.retorno) {
            var due = isDueOrOverdue(lead.retorno, lead.status);
            var rt = document.createElement("span");
            rt.className = "reminder-tag" + (due ? " is-due" : "");
            rt.textContent = lead.retorno.split("-").reverse().join("/") + (due ? " • Hoje/Atrasado" : "");
            tags.appendChild(rt);
          }
          if (lead.lastAutoReason) {
            var iaBadge = document.createElement("span");
            iaBadge.className = "badge-ia";
            iaBadge.title = lead.lastAutoReason;
            iaBadge.textContent = "⚡ IA";
            tags.appendChild(iaBadge);
          }

          var acts = document.createElement("div"); acts.className = "kc-actions";
          var btnChat = document.createElement("button");
          btnChat.type = "button"; btnChat.className = "btn-mini is-wa"; btnChat.textContent = "Conversa & IA";
          btnChat.addEventListener("click", function () { openChatModal(lead.id); });

          var waLink = document.createElement("a");
          waLink.className = "btn-mini"; waLink.textContent = "WhatsApp";
          waLink.href = "https://wa.me/" + cleanPhone(lead.whatsapp) + "?text=" + encodeURIComponent("Olá, " + lead.nome.replace(" (Exemplo)", "") + "! Sobre o orçamento de " + lead.servico + ":");
          waLink.target = "_blank"; waLink.rel = "noopener";

          var btnEd = document.createElement("button");
          btnEd.type = "button"; btnEd.className = "btn-mini"; btnEd.textContent = "Editar";
          btnEd.addEventListener("click", function () { openLeadModal(lead); });

          acts.appendChild(btnChat); acts.appendChild(waLink); acts.appendChild(btnEd);

          var sel = document.createElement("select");
          sel.className = "kc-move-select";
          sel.setAttribute("aria-label", "Mover etapa de " + lead.nome);
          STAGES.forEach(function (optSt) {
            var o = document.createElement("option");
            o.value = optSt.id; o.textContent = "Etapa: " + optSt.label;
            if (optSt.id === lead.status) o.selected = true;
            sel.appendChild(o);
          });
          sel.addEventListener("change", function () {
            moveLeadStage(lead.id, sel.value, "", false);
            renderCrm();
          });

          card.appendChild(top); card.appendChild(sv); card.appendChild(tags); card.appendChild(acts); card.appendChild(sel);
          body.appendChild(card);
        });
      }

      col.appendChild(head); col.appendChild(body);
      board.appendChild(col);
    });
  }

  function renderCrmTable(list) {
    var tbody = $("crm-tbody");
    tbody.innerHTML = "";
    $("crm-empty").hidden = list.length > 0;
    list.forEach(function (lead) {
      var tr = document.createElement("tr");

      var tdName = document.createElement("td");
      var n = document.createElement("span"); n.className = "lead-name"; n.textContent = lead.nome;
      var s = document.createElement("span"); s.className = "lead-sub"; s.textContent = lead.whatsapp + (lead.obs ? " • " + lead.obs : "");
      tdName.appendChild(n); tdName.appendChild(s);

      var tdServ = document.createElement("td");
      var sv = document.createElement("span"); sv.className = "lead-name"; sv.textContent = lead.servico;
      var ni = document.createElement("span"); ni.className = "lead-sub"; ni.textContent = lead.nicho || "Geral";
      tdServ.appendChild(sv); tdServ.appendChild(ni);

      var tdVal = document.createElement("td"); tdVal.textContent = formatBrl(lead.valor);

      var tdRet = document.createElement("td");
      var due = isDueOrOverdue(lead.retorno, lead.status);
      var rt = document.createElement("span");
      rt.className = "reminder-tag" + (due ? " is-due" : "");
      rt.textContent = lead.retorno ? lead.retorno.split("-").reverse().join("/") + (due ? " (Hoje/Atrasado)" : "") : "Sem data";
      tdRet.appendChild(rt);

      var tdStatus = document.createElement("td");
      var sel = document.createElement("select");
      sel.className = "status-select";
      sel.setAttribute("data-status", lead.status);
      STAGES.forEach(function (st) {
        var o = document.createElement("option");
        o.value = st.id; o.textContent = st.label;
        if (st.id === lead.status) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener("change", function () {
        moveLeadStage(lead.id, sel.value, "", false);
        renderCrm();
      });
      tdStatus.appendChild(sel);

      var tdAct = document.createElement("td");
      var act = document.createElement("div"); act.className = "row-actions";
      var btnChat = document.createElement("button");
      btnChat.type = "button"; btnChat.className = "btn-mini is-wa"; btnChat.textContent = "Conversa & IA";
      btnChat.addEventListener("click", function () { openChatModal(lead.id); });
      var ed = document.createElement("button");
      ed.type = "button"; ed.className = "btn-mini"; ed.textContent = "Editar";
      ed.addEventListener("click", function () { openLeadModal(lead); });
      var del = document.createElement("button");
      del.type = "button"; del.className = "btn-mini is-del"; del.textContent = "Excluir";
      del.addEventListener("click", function () {
        if (!confirm('Excluir o lead "' + lead.nome + '"?')) return;
        leads = leads.filter(function (x) { return x.id !== lead.id; });
        writeJson(KEYS.LEADS, leads);
        updateSidebarCounts();
        renderCrm();
      });
      act.appendChild(btnChat); act.appendChild(ed); act.appendChild(del);
      tdAct.appendChild(act);

      [tdName, tdServ, tdVal, tdRet, tdStatus, tdAct].forEach(function (td) { tr.appendChild(td); });
      tbody.appendChild(tr);
    });
  }

  $("crm-search").addEventListener("input", function (e) { crmSearch = e.target.value || ""; renderCrm(); });
  $("btn-crm-today").addEventListener("click", function () {
    crmOnlyToday = !crmOnlyToday;
    $("btn-crm-today").classList.toggle("is-active", crmOnlyToday);
    renderCrm();
  });
  document.querySelectorAll("[data-crm-mode]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      crmMode = btn.getAttribute("data-crm-mode") || "kanban";
      document.querySelectorAll("[data-crm-mode]").forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      renderCrm();
    });
  });
  $("chk-ia-auto").addEventListener("change", function () {
    iaAutoEnabled = this.checked;
    showToast(iaAutoEnabled ? "⚡ Movimentação inteligente ativada." : "Movimentação automática pausada.");
  });
  $("btn-ia-rules").addEventListener("click", function () { $("rules-modal").hidden = false; });
  $("btn-close-rules").addEventListener("click", function () { $("rules-modal").hidden = true; });

  /* Modal Conversa & IA */
  var activeChatLeadId = null;
  function openChatModal(leadId) {
    var lead = leads.find(function (l) { return l.id === leadId; });
    if (!lead) return;
    activeChatLeadId = leadId;
    $("chat-modal-title").textContent = lead.nome + " • " + (STAGE_MAP[lead.status] || {}).label;
    $("chat-auto-hint").textContent = lead.lastAutoReason || "Registre mensagens da conversa. Se a IA detectar intenção (ex.: orçamento, retorno ou fechado), o card pula de etapa sozinho.";
    renderChatMessages(lead);
    $("chat-msg-text").value = "";
    $("chat-modal").hidden = false;
  }
  function renderChatMessages(lead) {
    var logEl = $("chat-log");
    logEl.innerHTML = "";
    var msgs = lead.messages || [];
    if (!msgs.length) {
      logEl.innerHTML = '<div class="empty-state" style="padding:18px;">Nenhuma mensagem registrada ainda.</div>';
      return;
    }
    msgs.forEach(function (m) {
      var box = document.createElement("div");
      box.className = "chat-msg " + (m.from === "lead" ? "is-lead" : "is-agent");
      var sm = document.createElement("small");
      sm.textContent = (m.from === "lead" ? lead.nome : "Atendente / Assistente") + " • " + (m.at || "");
      var tx = document.createElement("div"); tx.textContent = m.text;
      box.appendChild(sm); box.appendChild(tx);
      logEl.appendChild(box);
    });
    logEl.scrollTop = logEl.scrollHeight;
  }
  $("btn-close-chat").addEventListener("click", function () { $("chat-modal").hidden = true; });
  $("chat-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var lead = leads.find(function (l) { return l.id === activeChatLeadId; });
    var text = $("chat-msg-text").value.trim();
    if (!lead || !text) return;
    lead.messages = lead.messages || [];
    lead.messages.push({ from: $("chat-msg-from").value, text: text, at: nowTime() });

    var res = analyzeMessageAndAdvanceStage(text, lead.status);
    if (res) {
      var reason = 'IA: detectado "' + res.trigger + '" → ' + res.label;
      moveLeadStage(lead.id, res.stage, reason, true);
      $("chat-modal-title").textContent = lead.nome + " • " + res.label;
      $("chat-auto-hint").textContent = "⚡ " + reason;
      showToast("⚡ " + lead.nome + ' movido automaticamente para "' + res.label + '"!');
    } else {
      writeJson(KEYS.LEADS, leads);
    }
    renderChatMessages(lead);
    $("chat-msg-text").value = "";
    if (activeView === "crm") renderCrm();
  });

  /* Modal Novo / Editar Lead */
  function openLeadModal(lead) {
    $("modal-title").textContent = lead ? "Editar Lead" : "Novo Lead";
    $("lead-id").value = lead ? lead.id : "";
    $("lead-nome").value = lead ? lead.nome : "";
    $("lead-whatsapp").value = lead ? lead.whatsapp : "";
    $("lead-servico").value = lead ? lead.servico : "";
    $("lead-nicho").value = lead ? (lead.nicho || "") : (tenant.nicho || "");
    $("lead-valor").value = lead ? (lead.valor || "") : "";
    $("lead-retorno").value = lead ? (lead.retorno || "") : "";
    $("lead-status").value = lead ? lead.status : "novo";
    $("lead-obs").value = lead ? (lead.obs || "") : "";
    $("btn-delete-lead-modal").hidden = !lead;
    $("lead-modal").hidden = false;
  }
  function closeLeadModal() { $("lead-modal").hidden = true; }
  $("btn-new-lead").addEventListener("click", function () { openLeadModal(null); });
  $("btn-close-modal").addEventListener("click", closeLeadModal);
  $("btn-cancel-modal").addEventListener("click", closeLeadModal);
  $("btn-delete-lead-modal").addEventListener("click", function () {
    var id = $("lead-id").value;
    if (!id || !confirm("Excluir este lead?")) return;
    leads = leads.filter(function (x) { return x.id !== id; });
    writeJson(KEYS.LEADS, leads);
    closeLeadModal();
    updateSidebarCounts();
    renderCrm();
  });
  $("lead-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var id = $("lead-id").value;
    var nome = $("lead-nome").value.trim();
    var whatsapp = $("lead-whatsapp").value.trim();
    var servico = $("lead-servico").value.trim();
    if (!nome || !whatsapp || !servico) { alert("Preencha nome, WhatsApp e serviço."); return; }

    var existing = id ? leads.find(function (x) { return x.id === id; }) : null;
    var payload = {
      id: id || ("lead-" + Date.now()),
      nome: nome,
      whatsapp: whatsapp,
      servico: servico,
      nicho: $("lead-nicho").value.trim(),
      valor: Number($("lead-valor").value || 0),
      retorno: $("lead-retorno").value,
      status: $("lead-status").value,
      obs: $("lead-obs").value.trim(),
      autoStage: existing ? existing.autoStage : true,
      lastAutoReason: existing ? existing.lastAutoReason : "",
      messages: existing ? (existing.messages || []) : [],
      updatedAt: todayIso()
    };
    if (existing) {
      leads = leads.map(function (l) { return l.id === id ? payload : l; });
    } else {
      leads.unshift(payload);
      addHistory("info", "Novo lead cadastrado: " + nome + " (" + servico + ")");
    }
    writeJson(KEYS.LEADS, leads);
    closeLeadModal();
    updateSidebarCounts();
    renderCrm();
  });

  $("btn-export-csv").addEventListener("click", function () {
    var header = ["Nome", "WhatsApp", "Servico", "Nicho", "Valor", "Retorno", "Etapa", "Observacoes"];
    var rows = leads.map(function (l) {
      return [l.nome, l.whatsapp, l.servico, l.nicho, l.valor, l.retorno, (STAGE_MAP[l.status] || {}).label || l.status, l.obs]
        .map(function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }).join(",");
    });
    var blob = new Blob(["\ufeff" + [header.join(",")].concat(rows).join("\n")], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url; a.download = "atendeja-leads.csv"; a.click();
    URL.revokeObjectURL(url);
  });

  $("btn-reset-demo").addEventListener("click", function () {
    if (!confirm("Restaurar os leads de exemplo? Os leads atuais serão substituídos.")) return;
    leads = defaultExamples();
    writeJson(KEYS.LEADS, leads);
    updateSidebarCounts();
    renderCrm();
  });

  /* ================= ABA 3: PLANEJAMENTO ================= */
  function renderPlanning() {
    var p = currentPlan();
    var isMonthly = planning.periodMode === "mensal" && p.monthlyPlanning;
    if (planning.periodMode === "mensal" && !p.monthlyPlanning) planning.periodMode = "semanal";

    document.querySelectorAll("[data-period]").forEach(function (btn) {
      var mode = btn.getAttribute("data-period");
      btn.classList.toggle("is-active", mode === planning.periodMode);
      if (mode === "mensal") {
        btn.textContent = p.monthlyPlanning ? "Mensal" : "🔒 Mensal (Pro+)";
      }
    });

    $("pl-meta-clientes").value = planning.metaClientes || 0;
    $("pl-meta-faturamento").value = planning.metaFaturamento || 0;
    $("pl-capacidade").value = planning.capacidadeDia || 1;
    $("pl-obs").value = planning.observacoes || "";

    // Serviços ofertados
    var srvWrap = $("pl-services-list");
    srvWrap.innerHTML = "";
    var plannedPotential = 0;
    planning.servicesToOffer.forEach(function (srv) {
      plannedPotential += Number(srv.preco || 0) * Number(srv.metaQtd || 0);
      var item = document.createElement("div"); item.className = "service-offer-item";
      var txt = document.createElement("span");
      txt.textContent = srv.nome + " • " + srv.metaQtd + "x de " + formatBrl(srv.preco);
      var del = document.createElement("button");
      del.type = "button"; del.className = "btn-mini is-del"; del.textContent = "Remover";
      del.addEventListener("click", function () {
        planning.servicesToOffer = planning.servicesToOffer.filter(function (x) { return x.id !== srv.id; });
        writeJson(KEYS.PLANNING, planning);
        renderPlanning();
      });
      item.appendChild(txt); item.appendChild(del);
      srvWrap.appendChild(item);
    });
    $("pl-potencial").textContent = "Potencial dos serviços planejados: " + formatBrl(plannedPotential);

    // Métricas Previsto vs Realizado (cruzando com leads fechados)
    var closed = leads.filter(function (l) { return l.status === "fechado"; });
    var realFat = closed.reduce(function (s, l) { return s + Number(l.valor || 0); }, 0);
    var realTicket = closed.length ? (realFat / closed.length) : 0;
    var mult = isMonthly ? 4 : 1;
    var metaCli = Math.max(1, Number(planning.metaClientes || 1) * mult);
    var metaFat = Math.max(1, Number(planning.metaFaturamento || 1) * mult);
    var cliPct = Math.min(100, Math.round((closed.length / metaCli) * 100));
    var fatPct = Math.min(100, Math.round((realFat / metaFat) * 100));

    var totalTasks = 0, doneTasks = 0;
    WEEK_DAYS.forEach(function (d) {
      (planning.days[d.id] || []).forEach(function (t) { totalTasks++; if (t.done) doneTasks++; });
    });
    var taskPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

    $("pl-metric-clientes").textContent = closed.length + " / " + metaCli + " (" + cliPct + "%)";
    $("pl-bar-clientes").style.width = cliPct + "%";
    $("pl-metric-fat").textContent = formatBrl(realFat) + " / " + formatBrl(metaFat) + " (" + fatPct + "%)";
    $("pl-bar-fat").style.width = fatPct + "%";
    $("pl-metric-tasks").textContent = doneTasks + " / " + totalTasks + " concluídas (" + taskPct + "%)";
    $("pl-bar-tasks").style.width = taskPct + "%";
    $("pl-metric-ticket").textContent = formatBrl(realTicket);

    // Grade semanal Seg-Dom
    var wg = $("week-grid");
    wg.innerHTML = "";
    WEEK_DAYS.forEach(function (d) {
      var col = document.createElement("div"); col.className = "day-card";
      var hd = document.createElement("div"); hd.className = "day-head"; hd.textContent = d.label;
      var tasks = document.createElement("div"); tasks.className = "day-tasks";
      (planning.days[d.id] || []).forEach(function (task) {
        var row = document.createElement("div");
        row.className = "day-task-row" + (task.done ? " is-done" : "");
        var chk = document.createElement("input");
        chk.type = "checkbox"; chk.checked = !!task.done;
        chk.addEventListener("change", function () {
          task.done = chk.checked;
          writeJson(KEYS.PLANNING, planning);
          renderPlanning();
        });
        var sp = document.createElement("span"); sp.textContent = task.text;
        var rm = document.createElement("button"); rm.type = "button"; rm.textContent = "×"; rm.title = "Remover";
        rm.addEventListener("click", function () {
          planning.days[d.id] = (planning.days[d.id] || []).filter(function (x) { return x.id !== task.id; });
          writeJson(KEYS.PLANNING, planning);
          renderPlanning();
        });
        row.appendChild(chk); row.appendChild(sp); row.appendChild(rm);
        tasks.appendChild(row);
      });

      var form = document.createElement("form"); form.className = "day-add-form";
      var inp = document.createElement("input"); inp.type = "text"; inp.placeholder = "Adicionar ação...";
      var addB = document.createElement("button"); addB.type = "submit"; addB.className = "btn-mini"; addB.textContent = "+";
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var tx = inp.value.trim();
        if (!tx) return;
        planning.days[d.id] = planning.days[d.id] || [];
        planning.days[d.id].push({ id: "t-" + Date.now() + "-" + Math.random().toString(36).slice(2, 5), text: tx, done: false });
        writeJson(KEYS.PLANNING, planning);
        renderPlanning();
      });
      form.appendChild(inp); form.appendChild(addB);
      col.appendChild(hd); col.appendChild(tasks); col.appendChild(form);
      wg.appendChild(col);
    });

    // Ciclos encerrados
    var cyclesEl = $("pl-cycles-list");
    cyclesEl.innerHTML = "";
    var cycles = planning.closedCycles || [];
    $("pl-cycles-empty").hidden = cycles.length > 0;
    cycles.forEach(function (c) {
      var li = document.createElement("li"); li.className = "history-item";
      var left = document.createElement("div");
      left.textContent = (c.mode === "mensal" ? "Ciclo Mensal" : "Semana") + " • " + c.clientesReais + "/" + c.metaClientes + " clientes • " + formatBrl(c.faturamentoReal) + " de " + formatBrl(c.metaFaturamento) + " • Tarefas: " + c.taskPct + "%";
      var tm = document.createElement("span"); tm.className = "history-time"; tm.textContent = c.closedAt;
      li.appendChild(left); li.appendChild(tm);
      cyclesEl.appendChild(li);
    });
  }

  document.querySelectorAll("[data-period]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var mode = btn.getAttribute("data-period");
      var p = currentPlan();
      if (mode === "mensal" && !p.monthlyPlanning) {
        openUpgradeModal("O planejamento mensal é exclusivo dos planos Pro e Empresa.");
        return;
      }
      planning.periodMode = mode;
      writeJson(KEYS.PLANNING, planning);
      renderPlanning();
    });
  });

  $("pl-meta-form").addEventListener("submit", function (e) {
    e.preventDefault();
    planning.metaClientes = Number($("pl-meta-clientes").value || 0);
    planning.metaFaturamento = Number($("pl-meta-faturamento").value || 0);
    planning.capacidadeDia = Number($("pl-capacidade").value || 1);
    planning.observacoes = $("pl-obs").value.trim();
    writeJson(KEYS.PLANNING, planning);
    renderPlanning();
    showToast("✓ Metas do planejamento salvas!");
  });

  $("pl-add-srv-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var nome = $("pl-srv-nome").value.trim();
    var preco = Number($("pl-srv-preco").value || 0);
    var qtd = Number($("pl-srv-qtd").value || 1);
    if (!nome) return;
    planning.servicesToOffer.push({ id: "srv-" + Date.now(), nome: nome, preco: preco, metaQtd: qtd });
    writeJson(KEYS.PLANNING, planning);
    $("pl-srv-nome").value = ""; $("pl-srv-preco").value = ""; $("pl-srv-qtd").value = "1";
    renderPlanning();
  });

  $("btn-close-cycle").addEventListener("click", function () {
    var closed = leads.filter(function (l) { return l.status === "fechado"; });
    var realFat = closed.reduce(function (s, l) { return s + Number(l.valor || 0); }, 0);
    var mult = planning.periodMode === "mensal" ? 4 : 1;
    var totalTasks = 0, doneTasks = 0;
    WEEK_DAYS.forEach(function (d) { (planning.days[d.id] || []).forEach(function (t) { totalTasks++; if (t.done) doneTasks++; }); });
    var taskPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

    planning.closedCycles = planning.closedCycles || [];
    planning.closedCycles.unshift({
      id: "cyc-" + Date.now(),
      mode: planning.periodMode,
      metaClientes: Number(planning.metaClientes || 1) * mult,
      clientesReais: closed.length,
      metaFaturamento: Number(planning.metaFaturamento || 1) * mult,
      faturamentoReal: realFat,
      taskPct: taskPct,
      closedAt: nowTime()
    });
    writeJson(KEYS.PLANNING, planning);
    addHistory("info", "Métrica de planejamento encerrada: " + formatBrl(realFat) + " (" + closed.length + " clientes)");
    renderPlanning();
    showToast("✓ Métrica do ciclo salva no histórico!");
  });

  /* ================= ABA 4: MEUS ASSISTENTES + CONTROLE POR PLANO ================= */
  function renderAssistants() {
    var p = currentPlan();
    var used = assistants.length;
    var max = p.maxAssistants;
    var pct = Math.min(100, Math.round((used / max) * 100));

    $("ast-plan-title").textContent = p.label + (p.id === "trial" ? (" • Restam " + trialDaysLeft() + " dia(s)") : "");
    $("ast-plan-sub").textContent = p.id === "trial"
      ? "Você tem 1 assistente simples liberado para testar por 15 dias. Faça upgrade para criar assistentes de cotação, vendas, marketing e mais."
      : ("Plano ativo com até " + max + " assistente(s) e " + p.capabilities.length + " capacidades liberadas.");
    $("ast-quota-text").textContent = used + " / " + max + " assistentes";
    $("ast-quota-bar").style.width = pct + "%";

    var grid = $("assistants-grid");
    grid.innerHTML = "";
    assistants.forEach(function (ast) {
      var card = document.createElement("article"); card.className = "assistant-card";

      var head = document.createElement("div"); head.className = "assistant-head";
      var left = document.createElement("div");
      var nm = document.createElement("h3"); nm.className = "assistant-name"; nm.textContent = ast.nome;
      var rl = document.createElement("div"); rl.className = "assistant-role";
      rl.textContent = ast.especialidade + (ast.ativo ? " • Ativo" : " • Pausado");
      left.appendChild(nm); left.appendChild(rl);
      var chk = document.createElement("input"); chk.type = "checkbox"; chk.checked = !!ast.ativo;
      chk.title = "Ativar / pausar assistente"; chk.style.accentColor = "#25D366";
      chk.addEventListener("change", function () {
        ast.ativo = chk.checked;
        writeJson(KEYS.ASSISTANTS, assistants);
        renderAssistants();
      });
      head.appendChild(left); head.appendChild(chk);

      var promptEl = document.createElement("p");
      promptEl.style.fontSize = "13px"; promptEl.style.color = "var(--text-secondary)"; promptEl.style.margin = "0";
      promptEl.textContent = ast.prompt;

      var capsWrap = document.createElement("div"); capsWrap.className = "cap-chips";
      CAPABILITIES.forEach(function (c) {
        var has = (ast.capacidades || []).indexOf(c.id) !== -1;
        var allowed = p.capabilities.indexOf(c.id) !== -1;
        if (!has && allowed) return;
        var chip = document.createElement("span");
        chip.className = "cap-chip" + (!allowed ? " is-locked" : "");
        chip.textContent = (!allowed ? "🔒 " : "✓ ") + c.label;
        capsWrap.appendChild(chip);
      });

      var bindEl = document.createElement("div");
      bindEl.style.fontSize = "11px"; bindEl.style.color = "var(--text-secondary)";
      bindEl.textContent = "Canal: " + (ast.whatsappBinding || "Padrão") + " • IA: " + (ast.aiBinding || "Padrão");

      var acts = document.createElement("div"); acts.className = "row-actions";
      var simB = document.createElement("button"); simB.type = "button"; simB.className = "btn-mini is-wa"; simB.textContent = "Simular";
      simB.addEventListener("click", function () { openSimModal(ast); });
      var edB = document.createElement("button"); edB.type = "button"; edB.className = "btn-mini"; edB.textContent = "Editar";
      edB.addEventListener("click", function () { openAssistantModal(ast); });
      var delB = document.createElement("button"); delB.type = "button"; delB.className = "btn-mini is-del"; delB.textContent = "Excluir";
      delB.disabled = assistants.length <= 1;
      delB.addEventListener("click", function () {
        if (assistants.length <= 1) return;
        if (!confirm('Excluir o assistente "' + ast.nome + '"?')) return;
        assistants = assistants.filter(function (x) { return x.id !== ast.id; });
        writeJson(KEYS.ASSISTANTS, assistants);
        renderAssistants();
      });
      acts.appendChild(simB); acts.appendChild(edB); if (assistants.length > 1) acts.appendChild(delB);

      card.appendChild(head); card.appendChild(promptEl); card.appendChild(capsWrap); card.appendChild(bindEl); card.appendChild(acts);
      grid.appendChild(card);
    });
  }

  function openAssistantModal(ast) {
    var p = currentPlan();
    if (!ast && assistants.length >= p.maxAssistants) {
      openUpgradeModal("Seu plano atual (" + p.label + ") permite no máximo " + p.maxAssistants + " assistente(s). Faça upgrade para liberar mais assistentes especializados.");
      return;
    }
    $("ast-modal-title").textContent = ast ? "Editar Assistente" : "Criar Novo Assistente";
    $("ast-id").value = ast ? ast.id : "";
    $("ast-nome").value = ast ? ast.nome : "";
    $("ast-espec").value = ast ? ast.especialidade : "Cotação";
    $("ast-prompt").value = ast ? ast.prompt : ("Atender clientes de " + (tenant.nicho || "serviços") + " gerando orçamentos claros e qualificando o pedido.");

    var capsBox = $("ast-caps-grid");
    capsBox.innerHTML = "";
    CAPABILITIES.forEach(function (c) {
      var allowed = p.capabilities.indexOf(c.id) !== -1;
      var checked = ast ? (ast.capacidades || []).indexOf(c.id) !== -1 : (c.id === "atendimento");
      var row = document.createElement("label");
      row.className = "cap-check-item" + (!allowed ? " is-disabled" : "");
      var left = document.createElement("span");
      left.textContent = (!allowed ? "🔒 " : "") + c.label;
      var inp = document.createElement("input");
      inp.type = "checkbox"; inp.value = c.id; inp.checked = checked && allowed;
      inp.disabled = !allowed; inp.style.accentColor = "#25D366";
      row.addEventListener("click", function (ev) {
        if (!allowed) {
          ev.preventDefault();
          openUpgradeModal('A capacidade "' + c.label + '" exige um plano superior.');
        }
      });
      row.appendChild(left); row.appendChild(inp);
      capsBox.appendChild(row);
    });
    $("assistant-modal").hidden = false;
  }

  $("btn-new-assistant").addEventListener("click", function () { openAssistantModal(null); });
  $("btn-close-ast").addEventListener("click", function () { $("assistant-modal").hidden = true; });
  $("btn-cancel-ast").addEventListener("click", function () { $("assistant-modal").hidden = true; });
  $("assistant-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var p = currentPlan();
    var id = $("ast-id").value;
    if (!id && assistants.length >= p.maxAssistants) {
      $("assistant-modal").hidden = true;
      openUpgradeModal("Limite de " + p.maxAssistants + " assistente(s) atingido.");
      return;
    }
    var caps = [];
    $("ast-caps-grid").querySelectorAll("input:checked").forEach(function (chk) { caps.push(chk.value); });
    if (!caps.length) caps = ["atendimento"];

    var payload = {
      id: id || ("ast-" + Date.now()),
      nome: $("ast-nome").value.trim() || "Assistente Especializado",
      especialidade: $("ast-espec").value,
      capacidades: caps,
      prompt: $("ast-prompt").value.trim(),
      ativo: true,
      whatsappBinding: connections.whatsapp.provider,
      aiBinding: connections.ai.provider + " (" + connections.ai.model + ")"
    };
    if (id) assistants = assistants.map(function (a) { return a.id === id ? Object.assign({}, a, payload) : a; });
    else assistants.push(payload);

    writeJson(KEYS.ASSISTANTS, assistants);
    addHistory("info", (id ? "Assistente atualizado: " : "Novo assistente criado: ") + payload.nome);
    $("assistant-modal").hidden = true;
    renderAssistants();
    showToast("✓ Assistente salvo!");
  });

  /* Simulador de assistente */
  function openSimModal(ast) {
    $("sim-title").textContent = "Testar " + ast.nome;
    $("sim-input").value = "Oi, quero um orçamento para " + (tenant.nicho || "serviço") + ".";
    $("sim-output").textContent = "Digite uma mensagem e clique em Simular resposta.";
    $("sim-modal").setAttribute("data-ast-id", ast.id);
    $("sim-modal").hidden = false;
  }
  $("btn-close-sim").addEventListener("click", function () { $("sim-modal").hidden = true; });
  $("sim-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var id = $("sim-modal").getAttribute("data-ast-id");
    var ast = assistants.find(function (a) { return a.id === id; }) || assistants[0];
    var msg = $("sim-input").value.trim();
    var company = tenant.empresa || "nossa empresa";
    $("sim-output").textContent = "[" + ast.nome + " • " + ast.especialidade + "]: Olá! Aqui é da " + company + ". Recebi sua mensagem (\"" + msg + "\"). Como meu foco é " + ast.especialidade.toLowerCase() + ", já vou registrar seu atendimento e verificar os detalhes com você!";
  });

  /* Upgrade de Contratação */
  function openUpgradeModal(reason) {
    $("upgrade-reason").textContent = reason || "Escolha o plano ideal para desbloquear mais assistentes especializados e capacidades avançadas.";
    $("upgrade-current-label").textContent = "Plano atual em uso: " + currentPlan().label;
    $("upgrade-preview-select").value = planState.currentPlan;
    $("upgrade-modal").hidden = false;
  }
  $("btn-open-upgrade").addEventListener("click", function () { openUpgradeModal(""); });
  $("btn-close-upgrade").addEventListener("click", function () { $("upgrade-modal").hidden = true; });
  document.querySelectorAll("[data-hire-plan]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var plano = btn.getAttribute("data-hire-plan");
      window.location.href = "./checkout.html?plano=" + encodeURIComponent(plano);
    });
  });
  $("btn-apply-preview-plan").addEventListener("click", function () {
    var nextPlan = $("upgrade-preview-select").value;
    if (!PLAN_CATALOG[nextPlan]) return;
    planState.currentPlan = nextPlan;
    tenant.plano = nextPlan;
    writeJson(KEYS.PLAN_STATE, planState);
    writeJson(KEYS.TENANT, tenant);
    $("upgrade-modal").hidden = true;
    renderBranding();
    navigate(activeView);
    showToast("Preview local alterado para plano " + PLAN_CATALOG[nextPlan].label + ".");
  });

  /* ================= ABA 5: CONEXÕES - APIS ================= */
  function maskKey(raw) {
    var v = String(raw || "").trim();
    if (!v) return "";
    return "••••••••" + v.slice(-4);
  }

  /* ================= CONEXÃO FACILITADA WHATSAPP (QR CODE) ================= */
  var waPollTimer = null;

  async function getClientAuthToken() {
    if (window.supabase) {
      try {
        var sess = await window.supabase.auth.getSession();
        if (sess && sess.data && sess.data.session) return sess.data.session.access_token;
      } catch (_e) {}
    }
    return "";
  }

  function setWaUIState(state, info) {
    var discEl = $("wa-state-disconnected");
    var qrEl = $("wa-state-qr");
    var connEl = $("wa-state-connected");
    var statusEl = $("wa-card-status");

    if (discEl) discEl.hidden = state !== "disconnected";
    if (qrEl) qrEl.hidden = state !== "qr";
    if (connEl) connEl.hidden = state !== "connected";

    if (statusEl) {
      if (state === "connected") {
        statusEl.textContent = "Conectado";
        statusEl.className = "conn-status is-ok";
      } else if (state === "qr") {
        statusEl.textContent = "Aguardando leitura";
        statusEl.className = "conn-status";
      } else {
        statusEl.textContent = "Desconectado";
        statusEl.className = "conn-status";
      }
    }

    if (state === "connected" && info && info.phone) {
      var phoneEl = $("wa-connected-phone");
      if (phoneEl) {
        var p = String(info.phone);
        var fmt = p.length >= 12 ? "+" + p.slice(0, 2) + " (" + p.slice(2, 4) + ") " + p.slice(4, 9) + "-" + p.slice(9) : p;
        phoneEl.textContent = fmt + (info.pushName ? " (" + info.pushName + ")" : "");
      }
    }
  }

  async function fetchWaQrCode() {
    var token = await getClientAuthToken();
    if (!token) return;
    try {
      var res = await fetch("/api/client/whatsapp/qr", {
        headers: { Authorization: "Bearer " + token },
        cache: "no-store"
      });
      var data = await res.json();
      var qrImg = $("wa-qr-img");
      var qrLoading = $("wa-qr-loading");
      if (data.ok && data.qrDataUrl) {
        if (qrImg) {
          qrImg.src = data.qrDataUrl;
          qrImg.style.display = "block";
        }
        if (qrLoading) qrLoading.style.display = "none";
      }
    } catch (_e) {}
  }

  async function pollWaStatus() {
    var token = await getClientAuthToken();
    if (!token) return;
    try {
      var res = await fetch("/api/client/whatsapp/status", {
        headers: { Authorization: "Bearer " + token },
        cache: "no-store"
      });
      var data = await res.json();
      if (data && data.ok) {
        if (data.connected && data.status === "WORKING") {
          setWaUIState("connected", { phone: data.phone, pushName: data.pushName });
          if (waPollTimer) { clearInterval(waPollTimer); waPollTimer = null; }
        } else if (data.status === "SCAN_QR_CODE") {
          setWaUIState("qr");
          fetchWaQrCode();
        } else if (data.status === "STARTING") {
          setWaUIState("qr");
        } else {
          setWaUIState("disconnected");
        }
      }
    } catch (_e) {}
  }

  async function startWaConnect() {
    var token = await getClientAuthToken();
    if (!token) {
      showToast("Entre no painel com sua conta para conectar o WhatsApp.");
      return;
    }
    setWaUIState("qr");
    var qrImg = $("wa-qr-img");
    var qrLoading = $("wa-qr-loading");
    if (qrImg) qrImg.style.display = "none";
    if (qrLoading) qrLoading.style.display = "flex";

    try {
      var res = await fetch("/api/client/whatsapp/connect", {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao iniciar WhatsApp");
      
      if (waPollTimer) clearInterval(waPollTimer);
      waPollTimer = setInterval(pollWaStatus, 3000);
      pollWaStatus();
      showToast("Iniciando WhatsApp... O QR Code aparecerá em instantes.");
    } catch (err) {
      setWaUIState("disconnected");
      showToast("Erro: " + err.message);
    }
  }

  async function disconnectWa() {
    var token = await getClientAuthToken();
    if (!token) return;
    if (waPollTimer) { clearInterval(waPollTimer); waPollTimer = null; }
    try {
      await fetch("/api/client/whatsapp/disconnect", {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
      });
      setWaUIState("disconnected");
      showToast("WhatsApp desconectado.");
    } catch (err) {
      showToast("Erro ao desconectar: " + err.message);
    }
  }

  function initWhatsAppCard() {
    var btnConnect = $("btn-wa-start-connect");
    var btnCancel = $("btn-wa-cancel-connect");
    var btnRefresh = $("btn-wa-refresh-qr");
    var btnDisconnect = $("btn-wa-disconnect");

    if (btnConnect) btnConnect.addEventListener("click", startWaConnect);
    if (btnCancel) btnCancel.addEventListener("click", function () {
      if (waPollTimer) { clearInterval(waPollTimer); waPollTimer = null; }
      setWaUIState("disconnected");
    });
    if (btnRefresh) btnRefresh.addEventListener("click", function () {
      fetchWaQrCode();
      showToast("Atualizando QR Code...");
    });
    if (btnDisconnect) btnDisconnect.addEventListener("click", disconnectWa);
  }

  function renderConnections() {
    pollWaStatus();
    $("cn-wa-provider").value = connections.whatsapp.provider || "WAHA (Self-Hosted)";
    $("cn-wa-url").value = connections.whatsapp.url || "";
    $("cn-wa-session").value = connections.whatsapp.session || "default";
    $("cn-wa-key").value = "";
    $("cn-wa-mask").textContent = connections.whatsapp.hasKey ? ("Chave salva (mascarada): " + connections.whatsapp.apiKeyMask) : "Nenhuma chave configurada localmente.";
    $("cn-wa-status").textContent = connections.whatsapp.url && connections.whatsapp.hasKey ? "Configurado" : "Pendente";
    $("cn-wa-status").className = "conn-status" + (connections.whatsapp.url && connections.whatsapp.hasKey ? " is-ok" : "");

    $("cn-ai-provider").value = connections.ai.provider || "OpenAI";
    $("cn-ai-model").value = connections.ai.model || "gpt-4o-mini";
    $("cn-ai-key").value = "";
    $("cn-ai-mask").textContent = connections.ai.hasKey ? ("Chave salva (mascarada): " + connections.ai.apiKeyMask) : "Nenhuma API key salva localmente.";
    $("cn-ai-status").textContent = connections.ai.hasKey ? "Configurado" : "Pendente";
    $("cn-ai-status").className = "conn-status" + (connections.ai.hasKey ? " is-ok" : "");

    $("cn-wh-checkout").value = connections.webhooks.checkoutUrl || "";
    $("cn-wh-inbound").value = connections.webhooks.crmInboundUrl || "";
    $("cn-wh-status").textContent = connections.webhooks.checkoutUrl ? "Ativo" : "Pendente";
    $("cn-wh-status").className = "conn-status" + (connections.webhooks.checkoutUrl ? " is-ok" : "");

    // Tabela vínculo Assistentes <-> APIs
    var tbody = $("conn-bindings-tbody");
    tbody.innerHTML = "";
    assistants.forEach(function (ast) {
      var tr = document.createElement("tr");
      var td1 = document.createElement("td"); td1.textContent = ast.nome;
      var td2 = document.createElement("td"); td2.textContent = ast.especialidade;

      var td3 = document.createElement("td");
      var selWa = document.createElement("select"); selWa.className = "status-select";
      ["WAHA Principal", "WhatsApp Cloud API", "Sem canal"].forEach(function (opt) {
        var o = document.createElement("option"); o.value = opt; o.textContent = opt;
        if ((ast.whatsappBinding || "WAHA Principal") === opt) o.selected = true;
        selWa.appendChild(o);
      });
      selWa.addEventListener("change", function () {
        ast.whatsappBinding = selWa.value;
        writeJson(KEYS.ASSISTANTS, assistants);
        showToast("Canal atualizado para " + ast.nome + ".");
      });
      td3.appendChild(selWa);

      var td4 = document.createElement("td");
      var selAi = document.createElement("select"); selAi.className = "status-select";
      [connections.ai.provider + " (" + connections.ai.model + ")", "OpenAI (gpt-4o-mini)", "Gemini (2.5 Flash)", "Claude (Sonnet)"].forEach(function (opt) {
        var o = document.createElement("option"); o.value = opt; o.textContent = opt;
        if ((ast.aiBinding || "") === opt) o.selected = true;
        selAi.appendChild(o);
      });
      selAi.addEventListener("change", function () {
        ast.aiBinding = selAi.value;
        writeJson(KEYS.ASSISTANTS, assistants);
        showToast("IA vinculada para " + ast.nome + ".");
      });
      td4.appendChild(selAi);

      [td1, td2, td3, td4].forEach(function (td) { tr.appendChild(td); });
      tbody.appendChild(tr);
    });
  }

  $("cn-wa-form").addEventListener("submit", function (e) {
    e.preventDefault();
    connections.whatsapp.provider = $("cn-wa-provider").value;
    connections.whatsapp.url = $("cn-wa-url").value.trim();
    connections.whatsapp.session = $("cn-wa-session").value.trim() || "default";
    var rawKey = $("cn-wa-key").value.trim();
    if (rawKey) {
      connections.whatsapp.apiKeyMask = maskKey(rawKey);
      connections.whatsapp.hasKey = true;
    }
    writeJson(KEYS.CONNECTIONS, connections);
    renderConnections();
    showToast("✓ Conexão WhatsApp salva (chave mascarada)!");
  });

  $("cn-ai-form").addEventListener("submit", function (e) {
    e.preventDefault();
    connections.ai.provider = $("cn-ai-provider").value;
    connections.ai.model = $("cn-ai-model").value.trim() || "gpt-4o-mini";
    var rawKey = $("cn-ai-key").value.trim();
    if (rawKey) {
      connections.ai.apiKeyMask = maskKey(rawKey);
      connections.ai.hasKey = true;
    }
    writeJson(KEYS.CONNECTIONS, connections);
    renderConnections();
    showToast("✓ Provedor de IA salvo (chave mascarada)!");
  });

  $("cn-wh-form").addEventListener("submit", function (e) {
    e.preventDefault();
    connections.webhooks.checkoutUrl = $("cn-wh-checkout").value.trim();
    connections.webhooks.crmInboundUrl = $("cn-wh-inbound").value.trim();
    writeJson(KEYS.CONNECTIONS, connections);
    renderConnections();
    showToast("✓ Webhooks salvos!");
  });

  /* ================= ABA 6: MEU PERFIL ================= */
  function fillProfileForm() {
    $("pf-empresa").value = tenant.empresa || "";
    $("pf-atendente").value = tenant.atendente || "";
    $("pf-nicho").value = tenant.nicho || "";
    $("pf-cidade").value = tenant.cidade || "";
    $("pf-whatsapp").value = tenant.whatsapp || "";
    $("pf-email").value = tenant.emailGoogle || "";
    $("pf-rede-tipo").value = tenant.redeSocialTipo || "Instagram";
    $("pf-rede-url").value = tenant.redeSocialUrl || "";
    $("profile-feedback").textContent = "";
    $("profile-feedback").className = "save-feedback";
  }
  function showProfileFeedback(msg, ok) {
    var el = $("profile-feedback");
    el.textContent = msg;
    el.className = "save-feedback " + (ok ? "is-ok" : "is-err");
    clearTimeout(el._t);
    if (ok) el._t = setTimeout(function () { el.textContent = ""; }, 3500);
  }
  $("profile-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var empresa = $("pf-empresa").value.trim();
    var atendente = $("pf-atendente").value.trim();
    var whatsapp = $("pf-whatsapp").value.trim();
    var email = $("pf-email").value.trim();

    if (empresa.length < 2) { showProfileFeedback("Informe o nome da empresa.", false); $("pf-empresa").focus(); return; }
    if (atendente.length < 2) { showProfileFeedback("Informe o nome do atendente.", false); $("pf-atendente").focus(); return; }
    if (whatsapp.replace(/\D/g, "").length < 10) { showProfileFeedback("Informe um WhatsApp válido com DDD.", false); $("pf-whatsapp").focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showProfileFeedback("Informe um e-mail Google válido.", false); $("pf-email").focus(); return; }

    tenant.empresa = empresa;
    tenant.atendente = atendente;
    tenant.nicho = $("pf-nicho").value.trim();
    tenant.cidade = $("pf-cidade").value.trim();
    tenant.whatsapp = whatsapp;
    tenant.emailGoogle = email;
    tenant.redeSocialTipo = $("pf-rede-tipo").value;
    tenant.redeSocialUrl = $("pf-rede-url").value.trim();

    if (writeJson(KEYS.TENANT, tenant)) {
      if (window.ATENDEJA_AUTH && window.ATENDEJA_AUTH.enabled) window.ATENDEJA_AUTH.updateProfile(tenant).catch(function (error) { showProfileFeedback(error.message, false); });
      renderBranding();
      showProfileFeedback("✓ Perfil salvo com sucesso!", true);
    } else {
      showProfileFeedback("Não foi possível salvar no navegador.", false);
    }
  });
  $("btn-profile-cancel").addEventListener("click", function () {
    tenant = loadTenant();
    fillProfileForm();
    renderBranding();
  });

  // Modal Alterar Conta Google
  var changeGoogleModal = $("change-google-modal");
  function closeChangeGoogleModal() {
    if (changeGoogleModal) changeGoogleModal.hidden = true;
    $("new-google-email").value = "";
    $("confirm-new-google-email").value = "";
    $("change-google-feedback").textContent = "";
    $("change-google-feedback").className = "save-feedback";
  }
  if ($("btn-open-change-google")) {
    $("btn-open-change-google").addEventListener("click", function () {
      if (changeGoogleModal) changeGoogleModal.hidden = false;
      $("new-google-email").focus();
    });
  }
  if ($("btn-close-change-google")) $("btn-close-change-google").addEventListener("click", closeChangeGoogleModal);
  if ($("btn-cancel-change-google")) $("btn-cancel-change-google").addEventListener("click", closeChangeGoogleModal);

  var changeGoogleForm = $("change-google-form");
  if (changeGoogleForm) {
    changeGoogleForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var feedback = $("change-google-feedback");
      var btnSubmit = $("btn-submit-change-google");
      var newEmail = $("new-google-email").value.trim().toLowerCase();
      var confirmEmail = $("confirm-new-google-email").value.trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        feedback.textContent = "Informe um e-mail Google válido.";
        feedback.className = "save-feedback is-err";
        $("new-google-email").focus();
        return;
      }
      if (newEmail !== confirmEmail) {
        feedback.textContent = "Os e-mails informados não coincidem.";
        feedback.className = "save-feedback is-err";
        $("confirm-new-google-email").focus();
        return;
      }
      if (newEmail === (tenant.emailGoogle || "").toLowerCase()) {
        feedback.textContent = "O novo e-mail deve ser diferente do e-mail atual.";
        feedback.className = "save-feedback is-err";
        return;
      }

      feedback.textContent = "Transferindo titularidade e revogando acesso anterior…";
      feedback.className = "save-feedback";
      btnSubmit.disabled = true;

      try {
        if (!window.ATENDEJA_AUTH || !window.ATENDEJA_AUTH.changeGoogleAccount) {
          throw new Error("Módulo de autenticação não inicializado.");
        }
        await window.ATENDEJA_AUTH.changeGoogleAccount(newEmail);
        feedback.textContent = "✓ Conta transferida com sucesso! Redirecionando…";
        feedback.className = "save-feedback is-ok";
        setTimeout(function () {
          closeChangeGoogleModal();
        }, 2000);
      } catch (err) {
        feedback.textContent = err.message || "Erro ao transferir conta Google.";
        feedback.className = "save-feedback is-err";
        btnSubmit.disabled = false;
      }
    });
  }
  $("profile-logo-file").addEventListener("change", function () {
    var file = this.files && this.files[0];
    if (!file || !/^image\//.test(file.type)) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var max = 200;
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        tenant.logoDataUrl = canvas.toDataURL("image/png");
        if (writeJson(KEYS.TENANT, tenant)) {
          renderBranding();
          showProfileFeedback("✓ Logo atualizada!", true);
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    this.value = "";
  });
  $("btn-remove-logo").addEventListener("click", function () {
    tenant.logoDataUrl = "";
    writeJson(KEYS.TENANT, tenant);
    renderBranding();
    showProfileFeedback("Logo removida.", true);
  });

  /* ================= SESSÃO, TECLADO & PWA ================= */
  function getClientSlug() {
    var path = window.location.pathname;
    var match = path.match(/^\/(?:login|gerenciar)-([a-z0-9_-]+)/i);
    if (match) {
      try { sessionStorage.setItem("atendeja:client_slug", match[1].toLowerCase()); } catch (_e) {}
      return match[1].toLowerCase();
    }
    var stored = "";
    try { stored = sessionStorage.getItem("atendeja:client_slug"); } catch (_e) {}
    if (stored) return stored;
    if (tenant && tenant.empresa) {
      var slug = tenant.empresa.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (slug) {
        try { sessionStorage.setItem("atendeja:client_slug", slug); } catch (_e) {}
        return slug;
      }
    }
    return "cliente";
  }

  function formatSlugName(slug) {
    if (!slug || slug === "cliente") return "AtendeJá";
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  }

  function applySessionState() {
    var loggedOut = false;
    try { loggedOut = localStorage.getItem(KEYS.SESSION) === "false"; } catch (_e) {}
    $("app-layout").hidden = loggedOut;
    $("auth-gate").hidden = !loggedOut;

    var slug = getClientSlug();
    var displayName = (tenant && tenant.empresa) ? tenant.empresa : formatSlugName(slug);

    if (loggedOut) {
      window.history.replaceState(null, "", "/login-" + slug);
      if ($("auth-company-title")) {
        $("auth-company-title").textContent = "Acesso Exclusivo · " + displayName;
      }
      if ($("auth-email-sub")) {
        $("auth-email-sub").textContent = "Entre com sua conta autorizada para acessar o painel de " + displayName + ".";
      }
    } else {
      window.history.replaceState(null, "", "/gerenciar-" + slug);
    }
  }
  $("btn-logout").addEventListener("click", function () {
    if (window.ATENDEJA_AUTH && window.ATENDEJA_AUTH.enabled) {
      window.ATENDEJA_AUTH.signOut().catch(function (error) { showToast(error.message); });
      closeSidebar();
      return;
    }
    try { localStorage.setItem(KEYS.SESSION, "false"); } catch (_e) {}
    closeSidebar();
    applySessionState();
  });
  $("btn-google-login").addEventListener("click", function () {
    if (window.ATENDEJA_AUTH && window.ATENDEJA_AUTH.enabled) {
      window.ATENDEJA_AUTH.signIn().catch(function (error) {
        var note = $("auth-note");
        if (note) { note.textContent = error.message; note.classList.add("error"); }
      });
      return;
    }
    try { localStorage.setItem(KEYS.SESSION, "true"); } catch (_e) {}
    applySessionState();
  });

  var clientLoginForm = $("client-password-login-form");
  if (clientLoginForm) {
    clientLoginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var email = ($("client-login-email") ? $("client-login-email").value : "").trim();
      var password = ($("client-login-password") ? $("client-login-password").value : "").trim();
      var note = $("auth-note");
      if (!email || !password) {
        if (note) { note.textContent = "Informe e-mail e senha para acessar."; note.classList.add("error"); }
        return;
      }
      if (window.ATENDEJA_AUTH && window.ATENDEJA_AUTH.signInPassword) {
        if (note) { note.textContent = "Autenticando…"; note.classList.remove("error"); }
        try {
          await window.ATENDEJA_AUTH.signInPassword(email, password);
        } catch (err) {
          if (note) { note.textContent = err.message || "Credenciais inválidas. Verifique seu e-mail e senha."; note.classList.add("error"); }
        }
        return;
      }
      try { localStorage.setItem(KEYS.SESSION, "true"); } catch (_e) {}
      applySessionState();
    });
  }

  document.addEventListener("atendeja:cloud-profile", function (event) {
    if (!event.detail) return;
    tenant = Object.assign({}, tenant, event.detail);
    renderBranding();
    fillProfileForm();
  });
  document.addEventListener("atendeja:cloud-state-loaded", function () {
    tenant = loadTenant();
    leads = loadLeads();
    historyLog = loadHistory();
    planning = loadPlanning(tenant);
    assistants = loadAssistants(tenant);
    connections = loadConnections();
    renderBranding();
    navigate(activeView);
    updateSidebarCounts();
  });
  document.addEventListener("atendeja:cloud-sync-error", function (event) { showToast(String(event.detail || "Sincronização pendente")); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      $("lead-modal").hidden = true;
      $("chat-modal").hidden = true;
      $("rules-modal").hidden = true;
      $("assistant-modal").hidden = true;
      $("sim-modal").hidden = true;
      $("upgrade-modal").hidden = true;
      closeSidebar();
    }
  });

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    navigator.serviceWorker.register("./sw.js").catch(function () {});
  }
  var deferredPrompt = null;
  var installBtn = $("btn-install-pwa");
  var isStandalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  if (!isStandalone) installBtn.hidden = false;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); deferredPrompt = e; if (!isStandalone) installBtn.hidden = false;
  });
  window.addEventListener("appinstalled", function () { installBtn.hidden = true; });
  installBtn.addEventListener("click", async function () {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch (_e) {}
      deferredPrompt = null; return;
    }
    alert("Para instalar o App AtendeJá:\n\n• Android/Chrome: menu (⋮) → 'Instalar aplicativo'.\n• iPhone/Safari: Compartilhar → 'Adicionar à Tela de Início'.\n• PC (Chrome/Edge): ícone de instalar na barra de endereço.");
  });

  /* ================= INIT ================= */
  initWhatsAppCard();
  renderBranding();
  updateSidebarCounts();
  applySessionState();
  var initTab = (location.hash || "").replace("#", "");
  navigate(initTab || "painel");
})();
