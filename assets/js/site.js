/* ==========================================================================
   StackDev Studio — site behaviour
   --------------------------------------------------------------------------
   Vanilla ES5-compatible JS, no build step and no dependencies, so the page
   keeps working from a plain GitHub Pages checkout.

   Every feature below is progressive enhancement: with JS disabled the page
   still renders, every link still works and the lead form posts straight to
   the studio inbox instead of being handed off to a script.
   ========================================================================== */
(function () {
  "use strict";

  var d = document;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------- scroll reveal */
  var reveals = d.querySelectorAll(".reveal");
  Array.prototype.forEach.call(reveals, function (el) {
    var delay = el.getAttribute("data-delay");
    if (delay) el.style.setProperty("--d", delay);
  });

  if (reduce || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add("is-in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    Array.prototype.forEach.call(reveals, function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------- header, progress, to-top */
  var header = d.querySelector(".site-header");
  var progress = d.querySelector(".scroll-progress span");
  var toTop = d.querySelector(".to-top");

  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset || d.documentElement.scrollTop;
    var max = d.documentElement.scrollHeight - window.innerHeight;

    if (header) header.classList.toggle("is-stuck", y > 24);
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    if (toTop) {
      var show = y > 700;
      toTop.classList.toggle("is-visible", show);
      /* Keep the hidden attribute in sync: it also carries display:none,
         so a stale value would either trap clicks or hide the button. */
      toTop.hidden = !show;
    }
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(onScroll);
  }, { passive: true });

  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  /* -------------------------------------------------------- mobile menu */
  var burger = d.querySelector(".burger");
  var nav = d.getElementById("nav");
  var FOCUSABLE = "a[href], button:not([disabled]), input, textarea, select, [tabindex]";

  if (burger && nav) {
    var setMenu = function (open) {
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Закрыть меню" : "Меню");
      nav.classList.toggle("is-open", open);
      d.body.classList.toggle("menu-open", open);
    };

    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });

    d.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || burger.getAttribute("aria-expanded") !== "true") return;
      setMenu(false);
      burger.focus();
    });

    /* The drawer overlays the page on small screens: keep Tab inside it. */
    d.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || burger.getAttribute("aria-expanded") !== "true") return;
      var items = nav.querySelectorAll(FOCUSABLE);
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && (d.activeElement === first || d.activeElement === burger)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && d.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    /* Leaving the mobile breakpoint while the drawer is open would otherwise
       strand body.menu-open and trap scrolling. */
    var wide = window.matchMedia("(min-width: 861px)");
    var onBreakpoint = function (e) { if (e.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener("change", onBreakpoint);
    else if (wide.addListener) wide.addListener(onBreakpoint);
  }

  /* -------------------------------------------------- header contact */
  var contact = d.getElementById("contact-menu");
  if (contact) {
    d.addEventListener("click", function (e) {
      if (contact.open && !e.target.closest("#contact-menu")) contact.open = false;
    });
    d.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && contact.open) {
        contact.open = false;
        var t = contact.querySelector("summary");
        if (t) t.focus();
      }
    });
  }

  /* ------------------------------------------------------- scroll-spy */
  /* Highlight the last section whose top crossed the header line. Geometry
     is read each frame, so it never lags or mispicks where sections touch. */
  var navLinks = Array.prototype.slice.call(d.querySelectorAll(".nav a[href^='#']"));
  var spySections = [];

  navLinks.forEach(function (link) {
    var target = d.getElementById(link.getAttribute("href").slice(1));
    if (target && spySections.indexOf(target) === -1) spySections.push(target);
  });

  if (navLinks.length && spySections.length) {
    var activeHash = "";
    /* Keep the clicked item pinned until scrolling stops, instead of
       guessing the smooth-scroll duration. */
    var clickLock = false;
    var settleTimer = 0;
    var unlockWhenIdle = function () {
      if (!clickLock) return;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(function () {
        clickLock = false;
        computeActive();
      }, 150);
    };

    var setActive = function (id) {
      var hash = id ? "#" + id : "";
      if (hash === activeHash) return;
      activeHash = hash;
      navLinks.forEach(function (link) {
        var on = link.getAttribute("href") === hash;
        link.classList.toggle("is-active", on);
        if (on) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };

    var activationLine = function () {
      var h = header ? header.offsetHeight : 0;
      /* Flip just below the sticky header, not mid-heading. */
      return h + Math.min(window.innerHeight * 0.08, 72);
    };

    var computeActive = function () {
      var line = activationLine();
      var y = window.pageYOffset || d.documentElement.scrollTop;
      var max = d.documentElement.scrollHeight - window.innerHeight;

      /* At the very bottom keep the last section highlighted. */
      if (max > 0 && y >= max - 2) {
        setActive(spySections[spySections.length - 1].id);
        return;
      }

      var current = "";
      for (var i = 0; i < spySections.length; i++) {
        if (spySections[i].getBoundingClientRect().top <= line) {
          current = spySections[i].id;
        }
      }
      setActive(current);
    };

    var spyTicking = false;
    var requestSpy = function () {
      /* While a click-flight runs, just wait for the page to go idle. */
      if (clickLock) { unlockWhenIdle(); return; }
      if (spyTicking) return;
      spyTicking = true;
      window.requestAnimationFrame(function () {
        spyTicking = false;
        if (clickLock) return;
        computeActive();
      });
    };

    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        var id = link.getAttribute("href").slice(1);
        setActive(id);
        if (reduce) return;
        clickLock = true;
        unlockWhenIdle();
      });
    });

    window.addEventListener("scroll", requestSpy, { passive: true });
    window.addEventListener("resize", requestSpy, { passive: true });
    window.addEventListener("hashchange", requestSpy);

    /* Fonts and the async grid shift offsets — re-sync once they settle. */
    if (d.fonts && d.fonts.ready && typeof d.fonts.ready.then === "function") {
      d.fonts.ready.then(computeActive);
    }
    window.addEventListener("load", computeActive);

    computeActive();
  }

  /* ------------------------------------------------------------- year */
  var year = d.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* -------------------------------------------------------- lead form */
  /* The markup posts straight to FormSubmit (a static-host friendly relay),
     which forwards the brief to the studio inbox. With JS enabled the same
     POST is sent over fetch, so the visitor stays on the page and receives
     inline feedback instead of the relay's own thank-you screen. If fetch
     is unavailable or the relay is unreachable, the browser falls back to a
     plain form submit -- the visitor never loses the lead. */
  var form = d.getElementById("lead-form");
  var status = d.getElementById("form-status");
  var submitBtn = d.getElementById("lead-submit");
  var submitLabel = submitBtn ? submitBtn.querySelector(".btn-label") : null;

  /* Contact is a phone, a Telegram handle or an e-mail address. */
  var PHONE_RE = /^\+?[\d\s\-()]{10,18}$/;
  var TG_RE = /^(@[a-zA-Z0-9_]{4,32}|https?:\/\/t\.me\/[a-zA-Z0-9_]{4,32}|t\.me\/[a-zA-Z0-9_]{4,32})$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Zа-яА-Я]{2,}$/;

  function contactError(contact) {
    if (PHONE_RE.test(contact) || TG_RE.test(contact) || EMAIL_RE.test(contact)) return "";
    if (/^\+?\d+$/.test(contact.replace(/[\s\-()]/g, ""))) {
      return "Телефон выглядит неполным — нужен формат +7 900 000-00-00.";
    }
    if (contact.indexOf("@") !== -1) {
      return "Проверьте e-mail: похоже, в адресе опечатка.";
    }
    return "Укажите телефон +7..., Telegram @username или e-mail.";
  }

  function setFieldError(input, message) {
    if (!input) return;
    var field = input.closest(".field") || input.closest(".consent");
    if (!field) return;
    var note = field.querySelector(".field-error");
    if (!note) {
      note = d.createElement("span");
      note.className = "field-error";
      field.appendChild(note);
    }
    note.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function setStatus(message, tone) {
    if (!status) return;
    status.textContent = message || "";
    status.className = "form-status" + (tone ? " is-" + tone : "");
    status.hidden = !message;
  }

  function setBusy(busy) {
    if (!submitBtn) return;
    submitBtn.disabled = busy;
    submitBtn.classList.toggle("is-busy", busy);
    if (submitLabel) submitLabel.textContent = busy ? "Отправляю…" : "Отправить заявку";
    submitBtn.setAttribute("aria-busy", busy ? "true" : "false");
  }

  function clearErrors() {
    Array.prototype.forEach.call(form.querySelectorAll(".field-error"), function (n) {
      n.textContent = "";
    });
    Array.prototype.forEach.call(form.querySelectorAll("[aria-invalid]"), function (i) {
      i.removeAttribute("aria-invalid");
    });
  }

  function validate() {
    clearErrors();
    var contactInput = form.elements.contact;
    var nameInput = form.elements.name;
    var firstBad = null;

    if (String(nameInput.value).trim().length < 2) {
      setFieldError(nameInput, "Как к вам обращаться? Минимум 2 символа.");
      firstBad = nameInput;
    }

    var contact = String(contactInput.value).trim();
    if (!contact) {
      setFieldError(contactInput, "Оставьте телефон, Telegram или e-mail — иначе не ответить.");
      firstBad = firstBad || contactInput;
    } else {
      var cerr = contactError(contact);
      if (cerr) {
        setFieldError(contactInput, cerr);
        firstBad = firstBad || contactInput;
      }
    }

    var consent = form.elements.consent;
    if (consent && !consent.checked) {
      setFieldError(consent, "Нужно согласие на обработку данных.");
      firstBad = firstBad || consent;
    }

    return firstBad;
  }

  if (form) {
    /* Take over validation: native bubbles become inline notes instead. */
    form.setAttribute("novalidate", "novalidate");

    /* Validate on blur so mistakes surface early, not only on submit. */
    var contactInput = form.elements.contact;
    if (contactInput) {
      contactInput.addEventListener("blur", function () {
        var v = contactInput.value.trim();
        if (v) setFieldError(contactInput, contactError(v));
      });
      contactInput.addEventListener("input", function () {
        if (contactInput.getAttribute("aria-invalid") === "true") {
          setFieldError(contactInput, contactError(contactInput.value.trim()));
        }
      });
    }

    form.addEventListener("submit", function (e) {
      var firstBad = validate();
      if (firstBad) {
        e.preventDefault();
        setStatus("Проверьте выделенные поля — заявка не отправлена.", "error");
        firstBad.focus();
        return;
      }

      /* No fetch support: let the browser POST to the relay natively. */
      if (!window.fetch || !window.FormData) return;

      e.preventDefault();
      setStatus("Отправляю заявку…", "pending");
      setBusy(true);

      /* FormSubmit answers JSON on its /ajax/ endpoint, which keeps the
         visitor on the page instead of the relay's own "thank you" screen. */
      var endpoint = form.getAttribute("action").indexOf("/ajax/") === -1
        ? form.getAttribute("action").replace("formsubmit.co/", "formsubmit.co/ajax/")
        : form.getAttribute("action");

      fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json().catch(function () { return {}; });
        })
        .then(function (data) {
          /* success === "false" means the relay rejected it (spam, or the
             inbox has not been confirmed yet) — fall back rather than lie. */
          if (data && String(data.success) === "false") throw new Error("relay");
          setBusy(false);
          form.reset();
          setStatus("Заявка отправлена. Отвечу по указанному контакту в течение пары часов.", "success");
          if (submitBtn) submitBtn.focus({ preventScroll: true });
        })
        .catch(function () {
          setBusy(false);
          /* Hand the lead back to the native POST rather than dropping it. */
          form.submit();
        });
    });
  }

  /* ---------------------------------------------------- GitHub projects */
  /* Studio org repos only, cached in sessionStorage (degrades offline).
     Forks and the site repo itself are filtered out. */
  var ORG = "StackDev-Studio";
  var SITE_REPO = "stackdev-studio.github.io";
  var CACHE_KEY = "sd_gh_repos_v2";
  var CACHE_TTL = 30 * 60 * 1000; /* 30 minutes */

  var grid = d.getElementById("repo-grid");
  var repoError = d.getElementById("repo-error");
  var repoEmpty = d.getElementById("repo-empty");

  function showError() {
    if (repoError) repoError.hidden = false;
  }

  function showEmpty() {
    if (repoEmpty) repoEmpty.hidden = false;
  }

  function isPortfolioRepo(repo) {
    return !repo.fork && repo.name !== SITE_REPO;
  }

  /* Built via DOM + textContent: API strings must render as text, not markup. */
  function repoCard(repo) {
    var updated = repo.updated_at
      ? new Date(repo.updated_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
      : "";

    var card = d.createElement("article");
    card.className = "repo reveal is-in";

    var top = d.createElement("div");
    top.className = "repo-top";

    var name = d.createElement("a");
    name.className = "repo-name";
    name.href = String(repo.html_url || "");
    name.target = "_blank";
    name.rel = "noopener";
    name.textContent = repo.name || "";
    top.appendChild(name);

    var desc = d.createElement("p");
    desc.className = "repo-desc";
    desc.textContent = repo.description || "Проект без описания.";

    var meta = d.createElement("div");
    meta.className = "repo-meta";
    [
      "★ " + (repo.stargazers_count == null ? 0 : repo.stargazers_count),
      repo.language || "—",
      "обновлён " + updated
    ].forEach(function (text) {
      var span = d.createElement("span");
      span.textContent = text;
      meta.appendChild(span);
    });

    card.appendChild(top);
    card.appendChild(desc);
    card.appendChild(meta);
    return card;
  }

  if (grid) {
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null"); } catch (e) { /* private mode */ }

    var paint = function (repos) {
      var list = repos.filter(isPortfolioRepo);
      if (!list.length) { showEmpty(); return; }

      var fragment = d.createDocumentFragment();
      list.forEach(function (repo) { fragment.appendChild(repoCard(repo)); });
      grid.textContent = "";
      grid.appendChild(fragment);
    };

    if (cached && Date.now() - cached.at < CACHE_TTL) {
      paint(cached.repos);
    } else {
      fetch("https://api.github.com/orgs/" + ORG + "/repos?per_page=12&sort=updated")
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function (repos) {
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos: repos })); } catch (e) { /* ignore quota */ }
          paint(repos);
        })
        .catch(showError);
    }
  }
})();
