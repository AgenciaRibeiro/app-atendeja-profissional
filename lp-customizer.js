(function () {
  "use strict";

  function applyConfig(data) {
    if (!data) return;

    // 01. TOPO & HEADER
    if (data.header_brand) {
      var brandWordmark = document.querySelector(".brand-wordmark");
      if (brandWordmark) brandWordmark.innerHTML = data.header_brand;
    }
    if (data.nav_link1_text) {
      var nav1 = document.querySelector(".header-nav a:nth-child(1)");
      if (nav1) {
        nav1.textContent = data.nav_link1_text;
        if (data.nav_link1_url) nav1.href = data.nav_link1_url;
      }
    }
    if (data.nav_link2_text) {
      var nav2 = document.querySelector(".header-nav a:nth-child(2)");
      if (nav2) {
        nav2.textContent = data.nav_link2_text;
        if (data.nav_link2_url) nav2.href = data.nav_link2_url;
      }
    }
    if (data.nav_link3_text) {
      var nav3 = document.querySelector(".header-nav a:nth-child(3)");
      if (nav3) {
        nav3.textContent = data.nav_link3_text;
        if (data.nav_link3_url) nav3.href = data.nav_link3_url;
      }
    }
    if (data.header_btn_text) {
      var btnHeader = document.querySelector(".btn-header");
      if (btnHeader) {
        btnHeader.textContent = data.header_btn_text;
        if (data.header_btn_url) btnHeader.href = data.header_btn_url;
      }
    }

    // 02. HERO SECTION
    if (data.hero_eyebrow) {
      var eyebrow = document.querySelector(".hero-copy .eyebrow");
      if (eyebrow) eyebrow.textContent = data.hero_eyebrow;
    }
    if (data.hero_title) {
      var heroTitle = document.querySelector(".hero-title");
      if (heroTitle) heroTitle.textContent = data.hero_title;
    }
    if (data.hero_subtitle) {
      var heroSub = document.querySelector(".hero-subtitle");
      if (heroSub) heroSub.textContent = data.hero_subtitle;
    }
    if (data.hero_btn_primary_text) {
      var heroBtnPri = document.querySelector(".hero-actions .btn-primary");
      if (heroBtnPri) {
        heroBtnPri.textContent = data.hero_btn_primary_text;
        if (data.hero_btn_primary_url) heroBtnPri.href = data.hero_btn_primary_url;
      }
    }
    if (data.hero_btn_secondary_text) {
      var heroBtnSec = document.querySelector(".hero-actions .btn-outline");
      if (heroBtnSec) heroBtnSec.textContent = data.hero_btn_secondary_text;
    }

    // Card de Fluxo do Hero
    if (data.hero_preview_title) {
      var cap = document.querySelector(".preview-caption");
      if (cap) cap.textContent = data.hero_preview_title;
    }
    if (data.hero_step1_title) {
      var s1Title = document.querySelector(".flow-nodes .flow-node:nth-child(1) strong");
      if (s1Title) s1Title.textContent = data.hero_step1_title;
    }
    if (data.hero_step1_desc) {
      var s1Desc = document.querySelector(".flow-nodes .flow-node:nth-child(1) span:not(.flow-step-num)");
      if (s1Desc) s1Desc.textContent = data.hero_step1_desc;
    }
    if (data.hero_step2_title) {
      var s2Title = document.querySelector(".flow-nodes .flow-node:nth-child(2) strong");
      if (s2Title) s2Title.textContent = data.hero_step2_title;
    }
    if (data.hero_step2_desc) {
      var s2Desc = document.querySelector(".flow-nodes .flow-node:nth-child(2) span:not(.flow-step-num)");
      if (s2Desc) s2Desc.textContent = data.hero_step2_desc;
    }
    if (data.hero_step3_title) {
      var s3Title = document.querySelector(".flow-nodes .flow-node:nth-child(3) strong");
      if (s3Title) s3Title.textContent = data.hero_step3_title;
    }
    if (data.hero_step3_desc) {
      var s3Desc = document.querySelector(".flow-nodes .flow-node:nth-child(3) .flow-badge");
      if (s3Desc) s3Desc.textContent = data.hero_step3_desc;
    }

    // 03. COMO FUNCIONA / SOLUÇÕES
    if (data.solutions_title) {
      var solTitle = document.querySelector("#solutions-title");
      if (solTitle) solTitle.textContent = data.solutions_title;
    }
    if (data.sol1_title) {
      var c1Title = document.querySelector(".solutions-grid article:nth-child(1) .card-index");
      if (c1Title) c1Title.textContent = data.sol1_title;
    }
    if (data.sol1_copy) {
      var c1Copy = document.querySelector(".solutions-grid article:nth-child(1) .card-copy");
      if (c1Copy) c1Copy.textContent = data.sol1_copy;
    }
    if (data.sol2_title) {
      var c2Title = document.querySelector(".solutions-grid article:nth-child(2) .card-index");
      if (c2Title) c2Title.textContent = data.sol2_title;
    }
    if (data.sol2_copy) {
      var c2Copy = document.querySelector(".solutions-grid article:nth-child(2) .card-copy");
      if (c2Copy) c2Copy.textContent = data.sol2_copy;
    }
    if (data.sol3_title) {
      var c3Title = document.querySelector(".solutions-grid article:nth-child(3) .card-index");
      if (c3Title) c3Title.textContent = data.sol3_title;
    }
    if (data.sol3_copy) {
      var c3Copy = document.querySelector(".solutions-grid article:nth-child(3) .card-copy");
      if (c3Copy) c3Copy.textContent = data.sol3_copy;
    }

    // 04. NICHOS ATENDIDOS
    if (data.niches_title) {
      var nTitle = document.querySelector("#niches-title");
      if (nTitle) nTitle.textContent = data.niches_title;
    }
    if (data.niches_list) {
      var strip = document.querySelector(".niches-strip");
      if (strip) {
        var items = data.niches_list.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
        if (items.length > 0) {
          strip.replaceChildren();
          items.forEach(function (nicheName) {
            var chip = document.createElement("span");
            chip.className = "niche-chip";
            chip.textContent = nicheName;
            strip.appendChild(chip);
          });
        }
      }
    }

    // 05. SEÇÃO DE PLANOS NA LP
    if (data.plans_title) {
      var pTitle = document.querySelector("#plans-title");
      if (pTitle) pTitle.textContent = data.plans_title;
    }
    if (data.plan_essencial_desc) {
      var el = document.querySelector(".plans-grid article:nth-child(1) .plan-desc");
      if (el) el.textContent = data.plan_essencial_desc;
    }
    if (data.plan_essencial_btn) {
      var el = document.querySelector(".plans-grid article:nth-child(1) .btn-full");
      if (el) el.textContent = data.plan_essencial_btn;
    }
    if (data.plan_pro_badge) {
      var el = document.querySelector(".plans-grid article:nth-child(2) .plan-badge-gold");
      if (el) el.textContent = data.plan_pro_badge;
    }
    if (data.plan_pro_desc) {
      var el = document.querySelector(".plans-grid article:nth-child(2) .plan-desc");
      if (el) el.textContent = data.plan_pro_desc;
    }
    if (data.plan_pro_btn) {
      var el = document.querySelector(".plans-grid article:nth-child(2) .btn-full");
      if (el) el.textContent = data.plan_pro_btn;
    }
    if (data.plan_empresa_desc) {
      var el = document.querySelector(".plans-grid article:nth-child(3) .plan-desc");
      if (el) el.textContent = data.plan_empresa_desc;
    }
    if (data.plan_empresa_btn) {
      var el = document.querySelector(".plans-grid article:nth-child(3) .btn-full");
      if (el) el.textContent = data.plan_empresa_btn;
    }

    // 06. RODAPÉ (FOOTER)
    if (data.footer_copy) {
      var footP = document.querySelector(".site-footer p");
      if (footP) footP.textContent = data.footer_copy;
    }
  }

  fetch("/api/public-landing-config", { cache: "no-store" })
    .then(function (res) { return res.json(); })
    .then(function (payload) {
      if (payload && payload.data) {
        applyConfig(payload.data);
      }
    })
    .catch(function () {});
})();
