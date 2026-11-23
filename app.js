(function () {
  "use strict";

  var PLAN_PRICES = {
    "Essencial": 49,
    "Pro": 97,
    "Empresa": 197
  };

  var DEFAULT_WHATSAPP = "5569993768304";
  var DEFAULT_TIMEOUT_MS = 10000;

  var modal = document.getElementById("onboarding-modal");
  var modalClose = document.getElementById("modal-close");
  var form = document.getElementById("onboarding-form");
  var stepLabel = document.getElementById("modal-step-label");
  var modalTitle = document.getElementById("modal-heading");
  var progressFill = document.getElementById("modal-progress-fill");
  var planSelect = document.getElementById("plan-select");
  var customNicheWrap = document.getElementById("custom-niche-wrap");
  var customNicheInput = document.getElementById("nicho-outro");
  var errStep1 = document.getElementById("err-step-1");
  var errStep2 = document.getElementById("err-step-2");
  var empresaInput = document.getElementById("empresa");
  var atendenteInput = document.getElementById("atendente");
  var whatsappInput = document.getElementById("whatsapp");
  var cidadeInput = document.getElementById("cidade");
  var emailGoogleInput = document.getElementById("email-google");
  var redeTipoSelect = document.getElementById("rede-social-tipo");
  var redeUrlInput = document.getElementById("rede-social-url");
  var logoFileInput = document.getElementById("logo-file");
  var logoPreviewImg = document.getElementById("logo-preview");
  var logoDataUrl = "";
  var setupSummary = document.getElementById("setup-summary");
  var setupFeatures = document.getElementById("setup-features");
  var webhookFeedback = document.getElementById("webhook-feedback");
  var btnActivate = document.getElementById("btn-activate");

  var stepTitles = {
    1: "Confirmar plano e escolher nicho",
    2: "Configurar seu App",
    3: "Setup Pronto!"
  };

  var currentStep = 1;

  function resolveWebhookOverride() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get("webhook");
    if (!raw) {
      return "";
    }
    try {
      var parsed = new URL(raw.trim());
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return parsed.toString();
      }
    } catch (_err) {
      return "";
    }
    return "";
  }

  function getConfig() {
    var cfg = window.ATENDEJA_CONFIG || {};
    var overrideUrl = resolveWebhookOverride();
    var configUrl = typeof cfg.webhookUrl === "string" ? cfg.webhookUrl.trim() : "";
    var waNum = typeof cfg.whatsappNumber === "string" && cfg.whatsappNumber.trim()
      ? cfg.whatsappNumber.replace(/\D/g, "")
      : DEFAULT_WHATSAPP;
    var timeoutMs = typeof cfg.timeoutMs === "number" && cfg.timeoutMs > 0
      ? cfg.timeoutMs
      : DEFAULT_TIMEOUT_MS;

    return {
      webhookUrl: overrideUrl || configUrl,
      whatsappNumber: waNum || DEFAULT_WHATSAPP,
      timeoutMs: timeoutMs
    };
  }

  function formatPhoneMask(value) {
    var digits = value.replace(/\D/g, "").slice(0, 11);
    if (!digits.length) {
      return "";
    }
    if (digits.length <= 2) {
      return "(" + digits;
    }
    if (digits.length <= 6) {
      return "(" + digits.slice(0, 2) + ") " + digits.slice(2);
    }
    if (digits.length <= 10) {
      return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 6) + "-" + digits.slice(6);
    }
    return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 7) + "-" + digits.slice(7);
  }

  function getSelectedNiche() {
    var checked = form.querySelector('input[name="nicho"]:checked');
    if (!checked) {
      return "";
    }
    if (checked.value === "Outro nicho") {
      return customNicheInput.value.trim();
    }
    return checked.value;
  }

  function setStep(step) {
    currentStep = step;
    form.querySelectorAll(".onboarding-step").forEach(function (el) {
      var s = Number(el.getAttribute("data-step"));
      el.hidden = s !== step;
    });
    stepLabel.textContent = "Passo " + step + " de 3";
    modalTitle.textContent = stepTitles[step] || "";
    progressFill.style.width = ((step / 3) * 100).toFixed(2) + "%";
  }

  function openOnboarding(planName) {
    if (planName && PLAN_PRICES[planName]) {
      planSelect.value = planName;
    }
    webhookFeedback.textContent = "";
    errStep1.textContent = "";
    errStep2.textContent = "";
    setStep(1);
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeOnboarding() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  function renderSummary() {
    var plano = planSelect.value;
    var valor = PLAN_PRICES[plano] || 97;
    var nicho = getSelectedNiche();
    var empresa = empresaInput.value.trim();
    var atendente = atendenteInput.value.trim();
    var whatsapp = whatsappInput.value.trim();
    var cidade = cidadeInput.value.trim();
    var emailGoogle = emailGoogleInput ? emailGoogleInput.value.trim() : "";
    var redeSocial = redeUrlInput && redeUrlInput.value.trim()
      ? (redeTipoSelect.value + ": " + redeUrlInput.value.trim())
      : "Não informada";

    setupSummary.innerHTML = "";
    var rows = [
      ["Plano", plano + " — R$ " + valor + "/mês"],
      ["Nicho", nicho],
      ["Empresa", empresa],
      ["Atendente", atendente],
      ["WhatsApp", whatsapp],
      ["Cidade", cidade],
      ["E-mail Google", emailGoogle || "Não informado"],
      ["Rede social", redeSocial]
    ];

    rows.forEach(function (pair) {
      var item = document.createElement("div");
      item.className = "summary-item";
      var label = document.createElement("strong");
      label.textContent = pair[0];
      var val = document.createElement("span");
      val.textContent = pair[1];
      item.appendChild(label);
      item.appendChild(val);
      setupSummary.appendChild(item);
    });

    setupFeatures.innerHTML = "";
    var feats = [
      "Fluxo de qualificação personalizado para " + nicho,
      "Saudação automática com \"" + atendente + "\"",
      "Controle de orçamentos e lembretes de follow-up"
    ];
    feats.forEach(function (text) {
      var li = document.createElement("li");
      li.textContent = text;
      setupFeatures.appendChild(li);
    });
  }

  function isValidHttpUrl(rawUrl) {
    if (typeof rawUrl !== "string" || !rawUrl.trim()) {
      return false;
    }
    try {
      var parsed = new URL(rawUrl.trim());
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch (_err) {
      return false;
    }
  }

  function collectPayload() {
    var plano = planSelect.value;
    var valor = PLAN_PRICES[plano] || 97;
    var emailGoogle = emailGoogleInput ? emailGoogleInput.value.trim() : "";
    var redeTipo = redeTipoSelect ? redeTipoSelect.value : "Instagram";
    var redeUrl = redeUrlInput ? redeUrlInput.value.trim() : "";
    return {
      origem: "atendeja-lp-onboarding",
      plano: plano,
      valorMensal: valor,
      valor_mensal: valor,
      nicho: getSelectedNiche(),
      empresa: empresaInput.value.trim(),
      atendente: atendenteInput.value.trim(),
      whatsapp: whatsappInput.value.trim(),
      cidade: cidadeInput.value.trim(),
      email: emailGoogle,
      emailGoogle: emailGoogle,
      redeSocialTipo: redeTipo,
      redeSocialUrl: redeUrl,
      submittedAt: new Date().toISOString()
    };
  }

  function saveTenantLocally(order) {
    try {
      localStorage.setItem("atendeja_tenant_v1", JSON.stringify({
        empresa: order.empresa,
        atendente: order.atendente,
        nicho: order.nicho,
        whatsapp: order.whatsapp,
        cidade: order.cidade,
        plano: order.plano,
        emailGoogle: order.emailGoogle || "",
        redeSocialTipo: order.redeSocialTipo || "Instagram",
        redeSocialUrl: order.redeSocialUrl || "",
        logoDataUrl: logoDataUrl || ""
      }));
      localStorage.setItem("atendeja_session_active", "true");
    } catch (_err) {}
  }

  function goToLocalCheckout(order) {
    saveTenantLocally(order);
    try {
      sessionStorage.setItem("atendeja_checkout_order", JSON.stringify(order));
      window.location.href = "./checkout.html";
    } catch (_err) {
      var params = new URLSearchParams({
        plano: order.plano,
        valorMensal: String(order.valorMensal),
        nicho: order.nicho,
        empresa: order.empresa,
        atendente: order.atendente,
        whatsapp: order.whatsapp,
        cidade: order.cidade,
        emailGoogle: order.emailGoogle || ""
      });
      window.location.href = "./checkout.html?" + params.toString();
    }
  }

  async function submitOnboarding() {
    var cfg = getConfig();
    var payload = collectPayload();
    var hasValidUrl = isValidHttpUrl(cfg.webhookUrl);

    if (!hasValidUrl) {
      goToLocalCheckout(payload);
      return;
    }

    btnActivate.disabled = true;
    btnActivate.textContent = "Ativando...";
    webhookFeedback.textContent = "";

    var controller = new AbortController();
    var timerId = setTimeout(function () {
      controller.abort();
    }, cfg.timeoutMs);

    try {
      var response = await fetch(cfg.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timerId);

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      var data = null;
      try {
        data = await response.json();
      } catch (_parseErr) {
        data = null;
      }

      if (data && isValidHttpUrl(data.checkoutUrl)) {
        window.location.href = data.checkoutUrl.trim();
        return;
      }

      goToLocalCheckout(payload);
    } catch (_err) {
      clearTimeout(timerId);
      goToLocalCheckout(payload);
    } finally {
      btnActivate.disabled = false;
      btnActivate.textContent = "Ativar minha conta agora";
    }
  }

  function initGlowCards() {
    var hasFinePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
    if (!hasFinePointer) {
      return;
    }
    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll("[data-glow-card]").forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) {
          return;
        }
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        card.style.setProperty("--mouse-x", x + "px");
        card.style.setProperty("--mouse-y", y + "px");

        if (!prefersReduced) {
          var nx = x / rect.width - 0.5;
          var ny = y / rect.height - 0.5;
          card.style.setProperty("--tilt-x", (-ny * 4).toFixed(2) + "deg");
          card.style.setProperty("--tilt-y", (nx * 4).toFixed(2) + "deg");
        }
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  function initAnimations() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    var mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", function () {
      gsap.from(".hero-copy > *, .hero-preview", {
        y: 20,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power3.out",
        clearProps: "transform"
      });

      gsap.from(".solution-card", {
        y: 24,
        opacity: 0,
        duration: 0.65,
        stagger: 0.12,
        ease: "power3.out",
        clearProps: "transform",
        scrollTrigger: {
          trigger: ".solutions-grid",
          start: "top 84%",
          once: true
        }
      });

      gsap.from(".niche-chip", {
        y: 16,
        opacity: 0,
        duration: 0.55,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".niches-strip",
          start: "top 86%",
          once: true
        }
      });

      gsap.from(".plan-card", {
        y: 24,
        opacity: 0,
        duration: 0.65,
        stagger: 0.12,
        ease: "power3.out",
        clearProps: "transform",
        scrollTrigger: {
          trigger: ".plans-grid",
          start: "top 84%",
          once: true
        }
      });
    });
  }

  document.querySelectorAll("[data-open-onboarding]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openOnboarding(btn.getAttribute("data-plan") || "Pro");
    });
  });

  modalClose.addEventListener("click", closeOnboarding);
  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeOnboarding();
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) {
      closeOnboarding();
    }
  });

  form.querySelectorAll('input[name="nicho"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      errStep1.textContent = "";
      form.querySelectorAll(".niche-option").forEach(function (label) {
        label.classList.remove("is-selected");
      });
      var parent = radio.closest(".niche-option");
      if (parent && radio.checked) {
        parent.classList.add("is-selected");
      }
      var isOther = radio.value === "Outro nicho";
      customNicheWrap.hidden = !isOther;
      if (isOther) {
        customNicheInput.focus();
      }
    });
  });

  if (logoFileInput) {
    logoFileInput.addEventListener("change", function () {
      var file = logoFileInput.files && logoFileInput.files[0];
      if (!file) {
        logoDataUrl = "";
        if (logoPreviewImg) logoPreviewImg.hidden = true;
        return;
      }
      var reader = new FileReader();
      reader.onload = function (ev) {
        var img = new Image();
        img.onload = function () {
          var max = 160;
          var scale = Math.min(1, max / Math.max(img.width, img.height));
          var canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          logoDataUrl = canvas.toDataURL("image/png");
          if (logoPreviewImg) {
            logoPreviewImg.src = logoDataUrl;
            logoPreviewImg.hidden = false;
          }
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  whatsappInput.addEventListener("input", function () {
    whatsappInput.value = formatPhoneMask(whatsappInput.value);
    errStep2.textContent = "";
  });

  document.getElementById("btn-step-1-next").addEventListener("click", function () {
    var checked = form.querySelector('input[name="nicho"]:checked');
    if (!checked) {
      errStep1.textContent = "Selecione o segmento da sua empresa.";
      return;
    }
    if (checked.value === "Outro nicho" && customNicheInput.value.trim().length < 2) {
      errStep1.textContent = "Informe qual é o seu nicho.";
      customNicheInput.focus();
      return;
    }
    errStep1.textContent = "";
    setStep(2);
    empresaInput.focus();
  });

  document.getElementById("btn-step-2-back").addEventListener("click", function () {
    setStep(1);
  });

  document.getElementById("btn-step-2-next").addEventListener("click", function () {
    errStep2.textContent = "";
    if (empresaInput.value.trim().length < 2) {
      errStep2.textContent = "Informe o nome da empresa.";
      empresaInput.focus();
      return;
    }
    if (atendenteInput.value.trim().length < 2) {
      errStep2.textContent = "Informe o nome do atendente no chat.";
      atendenteInput.focus();
      return;
    }
    if (whatsappInput.value.replace(/\D/g, "").length < 10) {
      errStep2.textContent = "Informe um WhatsApp válido com DDD.";
      whatsappInput.focus();
      return;
    }
    if (cidadeInput.value.trim().length < 2) {
      errStep2.textContent = "Informe sua cidade / região.";
      cidadeInput.focus();
      return;
    }
    if (emailGoogleInput) {
      var em = emailGoogleInput.value.trim();
      if (!em || em.indexOf("@") === -1 || em.indexOf(".") === -1) {
        errStep2.textContent = "Informe um e-mail Google válido para acessar seu painel.";
        emailGoogleInput.focus();
        return;
      }
    }
    renderSummary();
    setStep(3);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (currentStep === 3) {
      submitOnboarding();
    }
  });

  initGlowCards();
  initAnimations();
})();
