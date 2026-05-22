/* =========================================================
   Portfolio — Shared client JS
   Handles: i18n, theme, cursor, scroll-reveal, tweaks panel
   ========================================================= */
(function () {
  "use strict";

  /* ------- Defaults persisted via __edit_mode_set_keys ------- */
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "dark",
    "accent": "purple",
    "font": "geist"
  }/*EDITMODE-END*/;

  const ACCENTS = {
    green:  { c: "#22c55e", soft: "rgba(34, 197, 94, 0.12)",  fg: "#052e16", swatch: "#22c55e" },
    orange: { c: "#f97316", soft: "rgba(249, 115, 22, 0.14)", fg: "#3a1607", swatch: "#f97316" },
    blue:   { c: "#3b82f6", soft: "rgba(59, 130, 246, 0.16)", fg: "#0a1a3a", swatch: "#3b82f6" },
    mono:   { c: "#fafafa", soft: "rgba(250, 250, 250, 0.12)", fg: "#0a0a0a", swatch: "#fafafa" },
    purple: { c: "#a855f7", soft: "rgba(168, 85, 247, 0.16)", fg: "#1a0533", swatch: "#a855f7" },
    violet: { c: "#8b5cf6", soft: "rgba(139, 92, 246, 0.16)", fg: "#15042e", swatch: "#8b5cf6" },
    plum:   { c: "#c084fc", soft: "rgba(192, 132, 252, 0.16)", fg: "#1a0533", swatch: "#c084fc" }
  };

  const FONTS = {
    geist: {
      label: "Geist",
      sans: '"Geist", "Inter Tight", system-ui, sans-serif',
      mono: '"Geist Mono", ui-monospace, monospace'
    },
    plex: {
      label: "IBM Plex",
      sans: '"IBM Plex Sans", system-ui, sans-serif',
      mono: '"IBM Plex Mono", ui-monospace, monospace'
    },
    jetbrains: {
      label: "JB Mono",
      sans: '"Inter Tight", system-ui, sans-serif',
      mono: '"JetBrains Mono", ui-monospace, monospace'
    }
  };

  /* ------- State ------- */
  const state = Object.assign({}, TWEAK_DEFAULTS, readLocal());

  function readLocal() {
    try { return JSON.parse(localStorage.getItem("portfolio-tweaks") || "{}"); }
    catch (e) { return {}; }
  }
  function writeLocal() {
    try { localStorage.setItem("portfolio-tweaks", JSON.stringify(state)); } catch (e) {}
  }
  function postParent(edits) {
    try {
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits }, "*");
    } catch (e) {}
  }

  /* ------- Language ------- */
  function detectLang() {
    let stored = null;
    try { stored = localStorage.getItem("portfolio-lang"); } catch (e) {}
    if (stored === "pt" || stored === "en") return stored;
    const nav = (navigator.language || navigator.userLanguage || "pt").toLowerCase();
    return nav.startsWith("pt") ? "pt" : "en";
  }
  let currentLang = detectLang();

  function t(key) {
    const dict = (window.__I18N || {})[currentLang] || {};
    if (dict[key] !== undefined) return dict[key];
    // Fallback to PT
    const fb = (window.__I18N || {}).pt || {};
    return fb[key] !== undefined ? fb[key] : "";
  }

  function applyI18n() {
    const html = document.documentElement;
    html.setAttribute("lang", currentLang === "en" ? "en" : "pt-BR");

    // textContent
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      const v = t(k);
      if (v !== "") el.textContent = v;
    });
    // innerHTML
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const k = el.getAttribute("data-i18n-html");
      const v = t(k);
      if (v !== "") el.innerHTML = v;
    });
    // attributes: data-i18n-attr="title:key,placeholder:key2"
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const spec = el.getAttribute("data-i18n-attr");
      spec.split(",").forEach((pair) => {
        const [attr, k] = pair.split(":").map((s) => s.trim());
        if (attr && k) {
          const v = t(k);
          if (v !== "") el.setAttribute(attr, v);
        }
      });
    });
    // document title / meta description via data-i18n-doc on root <html>
    const titleKey = document.documentElement.getAttribute("data-i18n-title");
    if (titleKey) document.title = t(titleKey) || document.title;
    const descKey = document.documentElement.getAttribute("data-i18n-desc");
    if (descKey) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", t(descKey) || meta.getAttribute("content"));
    }

    // toggle active state
    document.querySelectorAll(".lang-toggle [data-lang]").forEach((el) => {
      el.classList.toggle("active", el.getAttribute("data-lang") === currentLang);
    });
  }

  function setLang(lang) {
    if (lang !== "pt" && lang !== "en") return;
    if (lang === currentLang) return;
    currentLang = lang;
    try { localStorage.setItem("portfolio-lang", lang); } catch (e) {}
    applyI18n();
  }

  function setupLangToggle() {
    document.querySelectorAll(".lang-toggle").forEach((wrap) => {
      wrap.querySelectorAll("[data-lang]").forEach((el) => {
        el.addEventListener("click", () => setLang(el.getAttribute("data-lang")));
      });
    });
  }

  /* ------- Apply tweak state ------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }
  function applyAccent(a) {
    const cfg = ACCENTS[a] || ACCENTS.green;
    const root = document.documentElement.style;
    root.setProperty("--accent", cfg.c);
    root.setProperty("--accent-soft", cfg.soft);
    root.setProperty("--accent-fg", cfg.fg);
  }
  function applyFont(f) {
    const cfg = FONTS[f] || FONTS.geist;
    const root = document.documentElement.style;
    root.setProperty("--font-sans", cfg.sans);
    root.setProperty("--font-mono", cfg.mono);
  }
  function applyAll() {
    applyTheme(state.theme);
    applyAccent(state.accent);
    applyFont(state.font);
  }
  applyAll();

  /* ------- Nav active state ------- */
  function markActiveNav() {
    const here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach((a) => {
      const tgt = (a.getAttribute("href") || "").split("/").pop();
      if (tgt === here) a.classList.add("active");
    });
  }

  /* ------- Theme toggle button ------- */
  function setupThemeToggle() {
    const btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    function render() {
      btn.innerHTML = state.theme === "dark"
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
    }
    render();
    btn.addEventListener("click", () => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      applyTheme(state.theme);
      writeLocal();
      postParent({ theme: state.theme });
      render();
    });
  }

  /* ------- Scroll reveal ------- */
  function setupReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((e) => io.observe(e));
  }

  /* ------- Cursor dot + ring ------- */
  function setupCursor() {
    if (matchMedia("(hover: none)").matches) return;
    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    document.body.append(ring, dot);

    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let rx = x, ry = y;
    let visible = false;

    window.addEventListener("mousemove", (e) => {
      x = e.clientX; y = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = ring.style.opacity = 1;
      }
      dot.style.left = x + "px";
      dot.style.top = y + "px";
    });
    window.addEventListener("mouseleave", () => {
      visible = false;
      dot.style.opacity = ring.style.opacity = 0;
    });

    (function loop() {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    })();

    // grow on interactive
    const interactive = "a, button, [data-cursor='hover'], summary, .project-card, .case-summary, .post";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest && e.target.closest(interactive)) {
        ring.style.width = "56px";
        ring.style.height = "56px";
        dot.style.width = "6px";
        dot.style.height = "6px";
      }
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest && e.target.closest(interactive)) {
        ring.style.width = "36px";
        ring.style.height = "36px";
        dot.style.width = "8px";
        dot.style.height = "8px";
      }
    });
  }

  /* ------- Tweaks panel ------- */
  function setupTweaks() {
    const panel = document.createElement("aside");
    panel.className = "tweaks";
    panel.innerHTML = `
      <div class="tweaks-head">
        <div class="title">tweaks</div>
        <button data-tw-close aria-label="Close">×</button>
      </div>
      <div class="tweak-row">
        <div class="label">tema / theme</div>
        <div class="tweak-options" data-tw-group="theme">
          <button class="tweak-opt" data-tw-val="dark">dark</button>
          <button class="tweak-opt" data-tw-val="light">light</button>
        </div>
      </div>
      <div class="tweak-row">
        <div class="label">acento / accent</div>
        <div class="tweak-options four" data-tw-group="accent">
          <button class="tweak-opt" data-tw-val="green" title="green"><span class="tweak-swatch" style="background:#22c55e"></span></button>
          <button class="tweak-opt" data-tw-val="orange" title="orange"><span class="tweak-swatch" style="background:#f97316"></span></button>
          <button class="tweak-opt" data-tw-val="blue" title="blue"><span class="tweak-swatch" style="background:#3b82f6"></span></button>
          <button class="tweak-opt" data-tw-val="mono" title="mono"><span class="tweak-swatch" style="background:#fafafa;border:1px solid #444"></span></button>
          <button class="tweak-opt" data-tw-val="purple" title="purple"><span class="tweak-swatch" style="background:#a855f7"></span></button>
          <button class="tweak-opt" data-tw-val="violet" title="violet"><span class="tweak-swatch" style="background:#8b5cf6"></span></button>
          <button class="tweak-opt" data-tw-val="plum" title="plum"><span class="tweak-swatch" style="background:#c084fc"></span></button>
        </div>
      </div>
      <div class="tweak-row">
        <div class="label">fonte / font</div>
        <div class="tweak-options three" data-tw-group="font">
          <button class="tweak-opt" data-tw-val="geist">Geist</button>
          <button class="tweak-opt" data-tw-val="plex">Plex</button>
          <button class="tweak-opt" data-tw-val="jetbrains">JB</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    function refreshPressed() {
      panel.querySelectorAll("[data-tw-group]").forEach((g) => {
        const key = g.getAttribute("data-tw-group");
        g.querySelectorAll(".tweak-opt").forEach((b) => {
          b.setAttribute("aria-pressed", b.dataset.twVal === state[key] ? "true" : "false");
        });
      });
    }
    refreshPressed();

    panel.addEventListener("click", (e) => {
      const t = e.target.closest("[data-tw-val]");
      if (t) {
        const group = t.closest("[data-tw-group]").getAttribute("data-tw-group");
        const val = t.dataset.twVal;
        state[group] = val;
        applyAll();
        writeLocal();
        postParent({ [group]: val });
        refreshPressed();
        return;
      }
      if (e.target.closest("[data-tw-close]")) hide();
    });

    function show() { panel.classList.add("open"); }
    function hide() {
      panel.classList.remove("open");
      try { window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*"); } catch (e) {}
    }

    window.addEventListener("message", (ev) => {
      const d = ev.data || {};
      if (d.type === "__activate_edit_mode") show();
      else if (d.type === "__deactivate_edit_mode") hide();
    });
    try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch (e) {}
  }

  /* ------- Init ------- */
  document.addEventListener("DOMContentLoaded", () => {
    applyI18n();
    document.body.classList.add("i18n-ready");
    markActiveNav();
    setupThemeToggle();
    setupLangToggle();
    setupReveal();
    setupCursor();
    setupTweaks();
  });

  /* expose */
  window.toggleCase = function (el) {
    const open = el.hasAttribute("open");
    if (open) el.removeAttribute("open");
    else el.setAttribute("open", "");
  };
  window.__setLang = setLang;
})();
