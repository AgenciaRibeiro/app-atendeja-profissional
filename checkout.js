    (function () {
      "use strict";

      // TEMPORÁRIO: R$ 1,00 para teste em produção (originais: Essencial 49, Pro 97, Empresa 197)
      var PLAN_PRICES = { "Essencial": 1, "Pro": 1, "Empresa": 1 };
      var orderSummaryEl = document.getElementById("order-summary");
      var orderTotalEl = document.getElementById("order-total");
      var formEl = document.getElementById("checkout-form");
      var submitBtnEl = document.getElementById("btn-generate-payment");
      var noticeEl = document.getElementById("checkout-notice");
      var pixBoxEl = document.getElementById("pix-box");
      var pixQrImgEl = document.getElementById("pix-qr-img");
      var pixCodeEl = document.getElementById("pix-code-text");
      var copyPixBtnEl = document.getElementById("btn-copy-pix");
      var copyFeedbackEl = document.getElementById("pix-copy-feedback");
      var statusPollingEl = document.getElementById("pix-status-polling");
      var statusPollTimer = null;

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

      function resolveEndpoint() {
        var params = new URLSearchParams(window.location.search);
        var override = params.get("webhook") || "";
        if (isValidHttpUrl(override)) {
          return override.trim();
        }
        var cfg = window.ATENDEJA_CONFIG || {};
        if (isValidHttpUrl(cfg.checkoutWebhookUrl)) {
          return cfg.checkoutWebhookUrl.trim();
        }
        if (isValidHttpUrl(cfg.webhookUrl)) {
          return cfg.webhookUrl.trim();
        }
        return "";
      }

      function loadOrder() {
        var order = null;
        try {
          var raw = sessionStorage.getItem("atendeja_checkout_order");
          if (raw) {
            order = JSON.parse(raw);
          }
        } catch (_err) {
          order = null;
        }

        var params = new URLSearchParams(window.location.search);
        if (!order || typeof order !== "object") {
          order = {};
        }

        var plano = order.plano || params.get("plano") || "Pro";
        if (!PLAN_PRICES[plano]) {
          plano = "Pro";
        }
        var valorMensal = PLAN_PRICES[plano] || 1;

        return {
          plano: plano,
          valorMensal: valorMensal,
          nicho: order.nicho || params.get("nicho") || "Serviços gerais",
          empresa: order.empresa || params.get("empresa") || "Sua empresa",
          atendente: order.atendente || params.get("atendente") || "Atendimento",
          whatsapp: order.whatsapp || params.get("whatsapp") || "",
          cidade: order.cidade || params.get("cidade") || "",
          emailGoogle: order.emailGoogle || order.email || params.get("emailGoogle") || ""
        };
      }

      function formatBrl(value) {
        return "R$ " + Number(value).toFixed(2).replace(".", ",") + "/mês";
      }

      function renderOrder(order) {
        orderSummaryEl.innerHTML = "";
        var rows = [
          ["Plano escolhido", order.plano],
          ["Nicho", order.nicho],
          ["Empresa", order.empresa],
          ["Atendente", order.atendente]
        ];
        rows.forEach(function (pair) {
          var item = document.createElement("div");
          item.className = "summary-item";
          var strong = document.createElement("strong");
          strong.textContent = pair[0];
          var span = document.createElement("span");
          span.textContent = pair[1];
          item.appendChild(strong);
          item.appendChild(span);
          orderSummaryEl.appendChild(item);
        });
        orderTotalEl.textContent = formatBrl(order.valorMensal);
      }

      var currentOrder = loadOrder();
      renderOrder(currentOrder);

      formEl.querySelectorAll('input[name="metodoPagamento"]').forEach(function (radio) {
        radio.addEventListener("change", function () {
          formEl.querySelectorAll(".payment-option").forEach(function (opt) {
            opt.classList.remove("is-selected");
          });
          var parent = radio.closest(".payment-option");
          if (parent && radio.checked) {
            parent.classList.add("is-selected");
          }
        });
      });

      function showCopyFeedback(ok) {
        if (ok) {
          copyPixBtnEl.textContent = "✓ Código Pix copiado!";
          copyPixBtnEl.style.borderColor = "#25D366";
          copyPixBtnEl.style.color = "#25D366";
          copyFeedbackEl.textContent = "Código Pix copiado para a área de transferência! Cole no app do seu banco.";
          copyFeedbackEl.style.color = "#25D366";
          copyFeedbackEl.hidden = false;
        } else {
          copyFeedbackEl.textContent = "Não foi possível copiar automaticamente. Selecione o código acima e copie manualmente.";
          copyFeedbackEl.style.color = "#F87171";
          copyFeedbackEl.hidden = false;
        }
        clearTimeout(copyPixBtnEl._resetTimer);
        copyPixBtnEl._resetTimer = setTimeout(function () {
          copyPixBtnEl.textContent = "Copiar código Pix";
          copyPixBtnEl.style.borderColor = "";
          copyPixBtnEl.style.color = "";
        }, 3000);
      }

      function fallbackCopyText(text) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.top = "0";
        ta.style.left = "0";
        ta.style.width = "2px";
        ta.style.height = "2px";
        ta.style.padding = "0";
        ta.style.border = "0";
        ta.style.opacity = "0.01";
        document.body.appendChild(ta);
        ta.focus({ preventScroll: true });
        ta.select();
        ta.setSelectionRange(0, text.length);
        var copied = false;
        try {
          copied = document.execCommand("copy");
        } catch (_err) {
          copied = false;
        }
        document.body.removeChild(ta);
        return copied;
      }

      function selectPixCodeText() {
        try {
          var range = document.createRange();
          range.selectNodeContents(pixCodeEl);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (_err) {}
      }

      copyPixBtnEl.addEventListener("click", function () {
        var code = (pixCodeEl.textContent || "").trim();
        if (!code) {
          showCopyFeedback(false);
          return;
        }
        // Tenta cópia síncrona primeiro (funciona em file://, http:// e localhost sem perder o gesto do clique)
        if (fallbackCopyText(code)) {
          showCopyFeedback(true);
          return;
        }
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          navigator.clipboard.writeText(code).then(function () {
            showCopyFeedback(true);
          }).catch(function () {
            selectPixCodeText();
            showCopyFeedback(false);
          });
          return;
        }
        selectPixCodeText();
        showCopyFeedback(false);
      });

      formEl.addEventListener("submit", async function (event) {
        event.preventDefault();
        noticeEl.hidden = true;
        pixBoxEl.hidden = true;

        var selectedMethod = formEl.querySelector('input[name="metodoPagamento"]:checked');
        var metodoPagamento = selectedMethod ? selectedMethod.value : "pix";
        var endpoint = resolveEndpoint();

        if (!endpoint) {
          noticeEl.textContent = "Endpoint de checkout n8n ainda não conectado em config.js (configure checkoutWebhookUrl ou webhookUrl para gerar o Pix ou link de pagamento real).";
          noticeEl.hidden = false;
          return;
        }

        submitBtnEl.disabled = true;
        submitBtnEl.textContent = "Gerando pagamento...";

        var cfg = window.ATENDEJA_CONFIG || {};
        var timeoutMs = typeof cfg.timeoutMs === "number" && cfg.timeoutMs > 0 ? cfg.timeoutMs : 10000;
        var controller = new AbortController();
        var timerId = setTimeout(function () {
          controller.abort();
        }, timeoutMs);

        try {
          var response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              origem: "atendeja-checkout",
              plano: currentOrder.plano,
              valorMensal: currentOrder.valorMensal,
              nicho: currentOrder.nicho,
              empresa: currentOrder.empresa,
              atendente: currentOrder.atendente,
              whatsapp: currentOrder.whatsapp,
              cidade: currentOrder.cidade,
              email: currentOrder.emailGoogle || "",
              metodoPagamento: metodoPagamento,
              submittedAt: new Date().toISOString()
            }),
            signal: controller.signal
          });
          clearTimeout(timerId);

          if (!response.ok) {
            throw new Error("HTTP " + response.status);
          }

          var data = await response.json();
          if (data && isValidHttpUrl(data.checkoutUrl)) {
            window.location.href = data.checkoutUrl.trim();
            return;
          }

          var pixCode = data && (data.pixCopiaECola || data.pixCode || data.qrCode);
          if (pixCode) {
            pixCodeEl.textContent = String(pixCode);
            if (data.qrCodeBase64) {
              var rawQr = String(data.qrCodeBase64).trim();
              pixQrImgEl.src = rawQr.indexOf("data:image/") === 0 ? rawQr : ("data:image/png;base64," + rawQr);
              pixQrImgEl.hidden = false;
            } else {
              pixQrImgEl.hidden = true;
            }
            pixBoxEl.hidden = false;

            if (data.paymentId) {
              clearInterval(statusPollTimer);
              statusPollingEl.textContent = "Aguardando confirmação do pagamento Pix...";
              statusPollingEl.style.color = "#9CA3AF";
              statusPollingEl.hidden = false;
              var statusUrl = endpoint.replace(/\/criar-checkout.*$/, "/status-pagamento") + "?paymentId=" + encodeURIComponent(String(data.paymentId));
              statusPollTimer = setInterval(async function () {
                try {
                  var stRes = await fetch(statusUrl, { headers: { "Accept": "application/json" } });
                  if (!stRes.ok) return;
                  var stData = await stRes.json();
                  if (stData && (stData.approved === true || stData.status === "approved")) {
                    clearInterval(statusPollTimer);
                    statusPollingEl.textContent = "✓ Pagamento aprovado! Abrindo seu Dashboard...";
                    statusPollingEl.style.color = "#25D366";
                    setTimeout(function () {
                      try { localStorage.setItem("atendeja_session_active", "true"); } catch (_e) {}
                      var q = new URLSearchParams({
                        empresa: currentOrder.empresa || "",
                        atendente: currentOrder.atendente || "",
                        nicho: currentOrder.nicho || "",
                        pedidoId: data.pedidoId || ""
                      });
                      window.location.href = "./dashboard.html?" + q.toString();
                    }, 1200);
                  }
                } catch (_pollErr) {}
              }, 3000);
            }
            return;
          }

          noticeEl.textContent = "Resposta recebida do servidor, mas sem checkoutUrl ou código Pix. Verifique o retorno do workflow n8n.";
          noticeEl.hidden = false;
        } catch (_err) {
          clearTimeout(timerId);
          noticeEl.textContent = "Não foi possível comunicar com o endpoint de checkout n8n agora. Tente novamente em instantes.";
          noticeEl.hidden = false;
        } finally {
          submitBtnEl.disabled = false;
          submitBtnEl.textContent = "Gerar Pix para Pagamento";
        }
      });
    })();
