/* ============================================================
   MH Electrical & Solar — Interactions
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Sticky header shadow ---------- */
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  const overlay = document.querySelector(".nav-overlay");

  function closeNav() {
    if (!links) return;
    links.classList.remove("open");
    toggle && toggle.classList.remove("open");
    overlay && overlay.classList.remove("show");
    document.body.style.overflow = "";
    toggle && toggle.setAttribute("aria-expanded", "false");
  }
  function openNav() {
    links.classList.add("open");
    toggle.classList.add("open");
    overlay && overlay.classList.add("show");
    document.body.style.overflow = "hidden";
    toggle.setAttribute("aria-expanded", "true");
  }
  if (toggle && links) {
    toggle.addEventListener("click", () =>
      links.classList.contains("open") ? closeNav() : openNav()
    );
    links.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
    overlay && overlay.addEventListener("click", closeNav);
    document.addEventListener("keydown", (e) => e.key === "Escape" && closeNav());
  }

  /* ---------- Services dropdown ---------- */
  const servicesDropdownModeMql = window.matchMedia("(max-width: 768px), (pointer: coarse)");
  let isServicesMobileMode = servicesDropdownModeMql.matches;

  const setServicesMobileMode = () => {
    const next = servicesDropdownModeMql.matches;
    if (isServicesMobileMode !== next) {
      isServicesMobileMode = next;
      if (!isServicesMobileMode) {
        document.querySelectorAll(".nav-dd.open").forEach((dd) => {
          const b = dd.querySelector("button");
          dd.classList.remove("open");
          b && b.setAttribute("aria-expanded", "false");
        });
      }
    }
  };
  if (servicesDropdownModeMql.addEventListener) {
    servicesDropdownModeMql.addEventListener("change", setServicesMobileMode);
  } else {
    servicesDropdownModeMql.addListener(setServicesMobileMode);
  }

  document.querySelectorAll(".nav-dd").forEach((dd) => {
    const btn = dd.querySelector("button");
    if (!btn) return;

    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-haspopup", "true");

    let closeTimer = null;
    const openDD = () => {
      clearTimeout(closeTimer);
      dd.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
    };
    const closeDD = () => {
      clearTimeout(closeTimer);
      dd.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    };

    dd.addEventListener("mouseenter", () => {
      if (!isServicesMobileMode) openDD();
    });
    dd.addEventListener("mouseleave", () => {
      if (!isServicesMobileMode) {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(closeDD, 140);
      }
    });
    dd.addEventListener("focusin", () => {
      if (!isServicesMobileMode) openDD();
    });
    dd.addEventListener("focusout", (e) => {
      if (!isServicesMobileMode && e.relatedTarget && !dd.contains(e.relatedTarget)) {
        closeDD();
      }
    });

    const menu = dd.querySelector(".nav-dd-menu");
    if (menu) {
      menu.addEventListener("mouseenter", () => {
        if (!isServicesMobileMode) openDD();
      });
      menu.addEventListener("mouseleave", () => {
        if (!isServicesMobileMode) {
          clearTimeout(closeTimer);
          closeTimer = setTimeout(closeDD, 140);
        }
      });
      menu.querySelectorAll("a").forEach((item) => {
        item.addEventListener("click", () => {
          if (isServicesMobileMode) {
            closeDD();
          } else {
            dd.classList.remove("open");
            btn.setAttribute("aria-expanded", "false");
          }
        });
      });
    }

    btn.addEventListener("click", (e) => {
      if (!isServicesMobileMode) return;
      e.preventDefault();
      if (dd.classList.contains("open")) {
        closeDD();
      } else {
        document
          .querySelectorAll(".nav-dd.open")
          .forEach((openDDItem) => {
            if (openDDItem !== dd) {
              const openBtn = openDDItem.querySelector("button");
              openDDItem.classList.remove("open");
              openBtn && openBtn.setAttribute("aria-expanded", "false");
            }
          });
        openDD();
      }
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-q").forEach((q) => {
    q.addEventListener("click", () => {
      const item = q.closest(".faq-item");
      const answer = item.querySelector(".faq-a");
      const isOpen = item.classList.contains("open");
      // close siblings
      const parent = item.parentElement;
      parent.querySelectorAll(".faq-item.open").forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove("open");
          openItem.querySelector(".faq-a").style.maxHeight = null;
          openItem.querySelector(".faq-q").setAttribute("aria-expanded", "false");
        }
      });
      if (isOpen) {
        item.classList.remove("open");
        answer.style.maxHeight = null;
        q.setAttribute("aria-expanded", "false");
      } else {
        item.classList.add("open");
        answer.style.maxHeight = answer.scrollHeight + "px";
        q.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Animated stat counters ---------- */
  const nums = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && nums.length) {
    const io2 = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseFloat(el.dataset.count);
          const suffix = el.dataset.suffix || "";
          const decimals = (el.dataset.count.split(".")[1] || "").length;
          const dur = 1400;
          const start = performance.now();
          const finalText = target.toFixed(decimals) + suffix;
          const tick = (now) => {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = (target * eased).toFixed(decimals) + suffix;
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = finalText;
          };
          requestAnimationFrame(tick);
          // Fallback: guarantee the final value even if rAF is throttled
          // (e.g. the page loads in a background tab).
          setTimeout(() => { el.textContent = finalText; }, dur + 250);
          io2.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );
    nums.forEach((el) => io2.observe(el));
  }

  /* ---------- Estimate / contact form ---------- */
  document.querySelectorAll("form[data-estimate]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const btn = form.querySelector('button[type="submit"]');
      const original = btn ? btn.innerHTML : "";
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = "Sending…";
      }
      // Simulated submit. Wire to your CRM / email endpoint here.
      setTimeout(() => {
        const success = form.parentElement.querySelector(".form-success");
        if (success) {
          form.style.display = "none";
          success.classList.add("show");
        } else {
          if (btn) {
            btn.innerHTML = "✓ Request sent";
          }
        }
        // Example analytics hook:
        // window.dataLayer && window.dataLayer.push({ event: "estimate_request" });
      }, 850);
    });
  });

  /* ---------- Set today's hours highlight ---------- */
  const hoursRows = document.querySelectorAll(".hours-table tr[data-day]");
  if (hoursRows.length) {
    const today = new Date().getDay(); // 0 = Sun
    hoursRows.forEach((row) => {
      if (parseInt(row.dataset.day, 10) === today) row.classList.add("today");
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Before/After slider ---------- */
  document.querySelectorAll("[data-baslider]").forEach((slider) => {
    const after = slider.querySelector(".ba-after");
    const handle = slider.querySelector(".ba-handle");
    const range = slider.querySelector(".ba-range");
    if (!after || !range) return;
    const set = (v) => {
      const p = Math.max(0, Math.min(100, v));
      after.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
      if (handle) handle.style.left = p + "%";
      range.setAttribute("aria-valuenow", Math.round(p));
    };
    range.addEventListener("input", () => set(parseFloat(range.value)));
    set(parseFloat(range.value || 50));
  });

  /* ---------- Gallery filter tabs ---------- */
  [
    { tabs: ".gallery-tabs button", tiles: ".gallery-tile" },
    { tabs: ".gal-tabs button", tiles: ".gal-tile" },
  ].forEach(({ tabs: tabSel, tiles: tileSel }) => {
    const tabs = document.querySelectorAll(tabSel);
    if (!tabs.length) return;
    const tiles = document.querySelectorAll(tileSel);
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const f = tab.dataset.filter;
        tiles.forEach((tile) => {
          const show = f === "all" || tile.dataset.cat === f;
          tile.classList.toggle("hide", !show);
        });
      });
    });
  });
})();
