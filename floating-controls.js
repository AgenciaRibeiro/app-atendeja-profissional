/**
 * AtendeJá - Controles Flutuantes & Chat Estilo WhatsApp Real
 * Gerencia o botão 'Voltar ao Topo' e a janela interativa do WhatsApp Oficial
 */
(function () {
  "use strict";

  var WHATSAPP_NUMBER = "5569993768304";
  var WHATSAPP_DEFAULT_TEXT = "Olá! Vim pelo site do AtendeJá e gostaria de mais informações.";

  var btnBackToTop = document.getElementById("btn-back-to-top");
  var btnWaFloat = document.getElementById("btn-whatsapp-float");
  var waWidget = document.getElementById("whatsapp-popup-widget");
  var waCloseBtn = document.getElementById("wa-popup-close");
  var waBody = document.getElementById("wa-popup-body");
  var waForm = document.getElementById("wa-popup-form");
  var waInput = document.getElementById("wa-popup-input");
  var waStatusText = document.getElementById("wa-popup-status-text");
  var waInitTime = document.getElementById("wa-popup-init-time");
  var waBadge = document.querySelector(".whatsapp-unread-badge");

  function getCurrentTime() {
    var now = new Date();
    var hours = String(now.getHours()).padStart(2, "0");
    var minutes = String(now.getMinutes()).padStart(2, "0");
    return hours + ":" + minutes;
  }

  // Inicializar horário da primeira mensagem
  if (waInitTime) {
    waInitTime.textContent = getCurrentTime();
  }

  // 1. Controle do Botão Voltar ao Topo
  if (btnBackToTop) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 300) {
        btnBackToTop.classList.add("is-visible");
      } else {
        btnBackToTop.classList.remove("is-visible");
      }
    }, { passive: true });

    btnBackToTop.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  // 2. Controle do Chat Flutuante WhatsApp
  function openWhatsAppWidget() {
    if (!waWidget) return;
    waWidget.removeAttribute("hidden");
    // Pequeno delay para acionar a transição CSS
    requestAnimationFrame(function () {
      waWidget.classList.add("is-open");
    });
    if (waBadge) {
      waBadge.style.display = "none";
    }
    if (waInput) {
      setTimeout(function () {
        waInput.focus();
      }, 300);
    }
    scrollChatToBottom();
  }

  function closeWhatsAppWidget() {
    if (!waWidget) return;
    waWidget.classList.remove("is-open");
    setTimeout(function () {
      if (!waWidget.classList.contains("is-open")) {
        waWidget.setAttribute("hidden", "true");
      }
    }, 300);
  }

  function toggleWhatsAppWidget() {
    if (!waWidget) return;
    if (waWidget.classList.contains("is-open")) {
      closeWhatsAppWidget();
    } else {
      openWhatsAppWidget();
    }
  }

  if (btnWaFloat) {
    btnWaFloat.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleWhatsAppWidget();
    });
  }

  if (waCloseBtn) {
    waCloseBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      closeWhatsAppWidget();
    });
  }

  // Fechar ao clicar fora do widget
  document.addEventListener("click", function (e) {
    if (!waWidget || !waWidget.classList.contains("is-open")) return;
    if (!waWidget.contains(e.target) && !btnWaFloat.contains(e.target)) {
      closeWhatsAppWidget();
    }
  });

  // Fechar com tecla ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && waWidget && waWidget.classList.contains("is-open")) {
      closeWhatsAppWidget();
    }
  });

  function scrollChatToBottom() {
    if (!waBody) return;
    setTimeout(function () {
      waBody.scrollTop = waBody.scrollHeight;
    }, 50);
  }

  // 3. Adicionar mensagens simuladas no chat
  function appendChatMessage(type, text) {
    if (!waBody) return;
    var row = document.createElement("div");
    row.className = "wa-popup-msg-row " + type;

    var bubble = document.createElement("div");
    bubble.className = "wa-popup-bubble";

    var p = document.createElement("p");
    p.className = "wa-popup-bubble-text";
    p.textContent = text;
    bubble.appendChild(p);

    var meta = document.createElement("span");
    meta.className = "wa-popup-bubble-time";
    meta.textContent = getCurrentTime();

    if (type === "sent") {
      var check = document.createElement("span");
      check.className = "wa-double-check";
      check.innerHTML = " ✓✓";
      meta.appendChild(check);
    }

    bubble.appendChild(meta);
    row.appendChild(bubble);
    waBody.appendChild(row);
    scrollChatToBottom();
  }

  function showDirectWhatsAppButton(textToFollow) {
    if (!waBody) return;
    var ctaWrap = document.createElement("div");
    ctaWrap.className = "wa-popup-direct-cta";

    var link = document.createElement("a");
    var encoded = encodeURIComponent(textToFollow || WHATSAPP_DEFAULT_TEXT);
    link.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encoded;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "wa-direct-btn";
    link.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg> Abrir WhatsApp Oficial Agora';

    ctaWrap.appendChild(link);
    waBody.appendChild(ctaWrap);
    scrollChatToBottom();
  }

  function handleUserMessage(msgText) {
    if (!msgText || !msgText.trim()) return;
    var text = msgText.trim();
    appendChatMessage("sent", text);

    // Ocultar os botões de atalho rápido após a primeira mensagem
    var quickWrap = document.getElementById("wa-popup-quick-options");
    if (quickWrap) {
      quickWrap.style.display = "none";
    }

    // Status: digitando...
    if (waStatusText) {
      waStatusText.textContent = "digitando...";
      waStatusText.style.color = "#25d366";
    }

    setTimeout(function () {
      if (waStatusText) {
        waStatusText.textContent = "Online agora • WhatsApp Oficial";
        waStatusText.style.color = "";
      }

      var lower = text.toLowerCase();
      var reply = "";

      if (lower.indexOf("preço") !== -1 || lower.indexOf("plano") !== -1 || lower.indexOf("valor") !== -1) {
        reply = "Nossos planos começam a partir de R$ 49/mês! O investimento se paga já no primeiro orçamento fechado. Quer falar direto com a gente?";
      } else if (lower.indexOf("funciona") !== -1 || lower.indexOf("demonstra") !== -1) {
        reply = "O AtendeJá responde seus leads no WhatsApp em menos de 10 segundos, coleta os dados e organiza os orçamentos no seu Kanban 24 horas por dia!";
      } else if (lower.indexOf("especialista") !== -1 || lower.indexOf("atendente") !== -1 || lower.indexOf("falar") !== -1) {
        reply = "Perfeito! Vou te conectar imediatamente com o nosso especialista pelo WhatsApp oficial.";
      } else {
        reply = "Recebi sua mensagem! Para continuar esse atendimento em tempo real pelo seu WhatsApp e configurar seu teste ou plano, clique no botão abaixo:";
      }

      appendChatMessage("received", reply);
      showDirectWhatsAppButton(text);
    }, 1000);
  }

  // Interação dos botões rápidos
  var quickButtons = document.querySelectorAll(".wa-quick-btn");
  quickButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var msg = btn.getAttribute("data-msg") || btn.textContent;
      handleUserMessage(msg);
    });
  });

  // Formulário de envio
  if (waForm && waInput) {
    waForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = waInput.value;
      waInput.value = "";
      handleUserMessage(val);
    });
  }
})();
