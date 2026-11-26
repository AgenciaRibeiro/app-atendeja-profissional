(function () {
  "use strict";

  var messagesContainer = document.getElementById("wa-messages-list");
  var chatBody = document.getElementById("wa-chat-body");
  var typingIndicator = document.getElementById("wa-typing-indicator");
  var contactStatus = document.getElementById("wa-contact-status");
  var chatForm = document.getElementById("wa-chat-form");
  var chatInput = document.getElementById("wa-chat-input");
  var sendBtn = document.getElementById("wa-send-btn");

  if (!messagesContainer || !chatForm || !chatInput) {
    return;
  }

  var doubleCheckSvg =
    '<svg class="wa-double-check" width="16" height="11" viewBox="0 0 16 11" fill="none" aria-hidden="true">' +
    '<path d="M11.05 1L4.85 7.2L2.05 4.4L1 5.45L4.85 9.3L12.1 2.05L11.05 1Z" fill="#53bdeb"/>' +
    '<path d="M15.05 1L8.85 7.2L7.85 6.2L6.8 7.25L8.85 9.3L16.1 2.05L15.05 1Z" fill="#53bdeb"/>' +
    '</svg>';

  function getCurrentTime() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, "0");
    var m = String(now.getMinutes()).padStart(2, "0");
    return h + ":" + m;
  }

  function scrollToBottom() {
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  function appendMessage(type, text, time, withCheck) {
    var msgDiv = document.createElement("div");
    msgDiv.className = "wa-message-row " + type;

    var bubble = document.createElement("div");
    bubble.className = "wa-bubble " + type;

    var p = document.createElement("p");
    p.className = "wa-message-text";
    p.textContent = text;
    bubble.appendChild(p);

    var meta = document.createElement("div");
    meta.className = "wa-message-meta";

    var timeSpan = document.createElement("span");
    timeSpan.className = "wa-message-time";
    timeSpan.textContent = time || getCurrentTime();
    meta.appendChild(timeSpan);

    if (withCheck && type === "sent") {
      var checkWrap = document.createElement("span");
      checkWrap.className = "wa-check-wrap";
      checkWrap.innerHTML = doubleCheckSvg;
      meta.appendChild(checkWrap);
    }

    bubble.appendChild(meta);
    msgDiv.appendChild(bubble);
    messagesContainer.appendChild(msgDiv);

    scrollToBottom();
    return msgDiv;
  }

  function appendCrmBadge(text) {
    var badgeWrap = document.createElement("div");
    badgeWrap.className = "wa-crm-badge-wrap";
    badgeWrap.innerHTML =
      '<div class="wa-crm-badge">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
      '<span>' + text + '</span>' +
      '</div>';
    messagesContainer.appendChild(badgeWrap);
    scrollToBottom();
  }

  function setTyping(isTyping, senderName) {
    if (isTyping) {
      if (typingIndicator) typingIndicator.style.display = "flex";
      if (contactStatus) {
        contactStatus.textContent = senderName ? senderName + " digitando..." : "digitando...";
        contactStatus.classList.add("is-typing");
      }
    } else {
      if (typingIndicator) typingIndicator.style.display = "none";
      if (contactStatus) {
        contactStatus.textContent = "online";
        contactStatus.classList.remove("is-typing");
      }
    }
    scrollToBottom();
  }

  // Sequência cinematográfica de demonstração
  var storyTimeouts = [];

  function clearStory() {
    storyTimeouts.forEach(function (t) {
      clearTimeout(t);
    });
    storyTimeouts = [];
  }

  function startDemoStory() {
    clearStory();
    messagesContainer.innerHTML = "";

    // 1. Mensagem inicial da cliente Mariana
    appendMessage(
      "received",
      "Oi, tudo bem? Preciso de um orçamento para reformar a cozinha.",
      "14:30",
      false
    );

    // 2. Resposta instantânea da empresa (AtendeJá)
    storyTimeouts.push(
      setTimeout(function () {
        setTyping(true, "");
      }, 1000)
    );

    storyTimeouts.push(
      setTimeout(function () {
        setTyping(false);
        appendMessage(
          "sent",
          "Olá Mariana! 👋 Respondendo na hora! Claro, conseguimos te atender agora mesmo.",
          "14:30",
          true
        );
      }, 2300)
    );

    // 3. Atendente pergunta os detalhes
    storyTimeouts.push(
      setTimeout(function () {
        setTyping(true, "");
      }, 3400)
    );

    storyTimeouts.push(
      setTimeout(function () {
        setTyping(false);
        appendMessage(
          "sent",
          "Qual o tamanho aproximado da sua cozinha e para quando você planeja iniciar a reforma?",
          "14:30",
          true
        );
      }, 4800)
    );

    // 4. Mariana responde
    storyTimeouts.push(
      setTimeout(function () {
        setTyping(true, "Mariana");
      }, 6200)
    );

    storyTimeouts.push(
      setTimeout(function () {
        setTyping(false);
        appendMessage(
          "received",
          "Tem cerca de 12m². Quero trocar pisos, bancada e armários planejados. Tem como mandar uma prévia?",
          "14:31",
          false
        );
      }, 8200)
    );

    // 5. Atendente fecha com proposta e registro
    storyTimeouts.push(
      setTimeout(function () {
        setTyping(true, "");
      }, 9500)
    );

    storyTimeouts.push(
      setTimeout(function () {
        setTyping(false);
        appendMessage(
          "sent",
          "Perfeito! 📋 Já registrei seu pedido no sistema. Para 12m², nossos pacotes variam de R$ 5.800 a R$ 9.200. Nosso consultor entra em contato hoje às 16:00!",
          "14:31",
          true
        );
      }, 11200)
    );

    // 6. Confirmação do CRM
    storyTimeouts.push(
      setTimeout(function () {
        appendCrmBadge("Lead cadastrado no CRM • Lembrete agendado para 16:00");
      }, 12400)
    );
  }

  // Interação do visitante no input
  chatForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = chatInput.value.trim();
    if (!text) return;

    clearStory();
    chatInput.value = "";

    // Mensagem enviada pelo visitante
    appendMessage("sent", text, getCurrentTime(), true);

    // Resposta automática simulada após 1s
    setTyping(true, "");
    setTimeout(function () {
      setTyping(false);

      var lower = text.toLowerCase();
      var reply = "";

      if (lower.indexOf("preço") !== -1 || lower.indexOf("plano") !== -1 || lower.indexOf("valor") !== -1 || lower.indexOf("custa") !== -1) {
        reply = "Nossos planos começam a partir de R$ 49/mês no Essencial! É um investimento que se paga já no primeiro orçamento fechado pelo sistema. Escolha o seu plano acima para garantir seu acesso!";
      } else if (lower.indexOf("como funciona") !== -1 || lower.indexOf("funciona") !== -1) {
        reply = "O AtendeJá se conecta ao seu WhatsApp oficial, responde seus clientes em segundos 24 horas por dia e organiza os orçamentos no painel!";
      } else if (lower.indexOf("teste") !== -1 || lower.indexOf("testar") !== -1 || lower.indexOf("gratis") !== -1 || lower.indexOf("grátis") !== -1) {
        reply = "Você ativa sua conta na hora escolhendo o melhor plano para sua empresa. A infraestrutura 24h entra no ar imediatamente e o investimento se paga logo no 1º cliente! 🚀";
      } else {
        reply = "Viu como a resposta é instantânea? Com o AtendeJá, você nunca mais deixa um cliente esperando no WhatsApp! 🚀";
      }

      appendMessage("received", reply, getCurrentTime(), false);
    }, 1200);
  });

  // Atualizar visual do botão quando há texto digitado
  chatInput.addEventListener("input", function () {
    if (chatInput.value.trim().length > 0) {
      sendBtn.classList.add("has-content");
    } else {
      sendBtn.classList.remove("has-content");
    }
  });

  // Iniciar demonstração inicial
  startDemoStory();

  // Reiniciar a demonstração se o usuário clicar no avatar ou status
  var avatarWrap = document.querySelector(".wa-avatar-wrap");
  if (avatarWrap) {
    avatarWrap.title = "Clique para reiniciar a conversa";
    avatarWrap.addEventListener("click", function () {
      startDemoStory();
    });
  }
})();
