/* ==========================================================================
   StackDev Studio — site behaviour
   Vanilla ES5, no build step, no dependencies.
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
  /* Forminit blocks: fi-sender-* for the submitter, fi-{type}-{name} for the
     rest. The endpoint replies with JSON, so the page stays put. */
  var form = d.getElementById("lead-form");
  var status = d.getElementById("form-status");
  var submitBtn = d.getElementById("lead-submit");
  var submitLabel = submitBtn ? submitBtn.querySelector(".btn-label") : null;
  var contactNote = d.getElementById("contact-note");

  /* Contact is a phone, a Telegram handle or an e-mail address. The field
     adapts to whichever one the visitor starts typing: it formats the value,
     switches the keyboard hint and the placeholder, and validates by type. */
  var PHONE_RE = /^\+?[\d\s\-()]{10,18}$/;
  var TG_RE = /^(@[a-zA-Z0-9_]{4,32}|https?:\/\/t\.me\/[a-zA-Z0-9_]{4,32}|t\.me\/[a-zA-Z0-9_]{4,32})$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Zа-яА-Я]{2,}$/;

  /* Only digits, spaces and phone punctuation count as a phone -- letters
     must not be swallowed while an e-mail is being typed. */
  var PHONE_ONLY_RE = /^\+?[\d\s\-()]+$/;

  /* Shape of the value, used to pick formatting and hints while typing. */
  function contactKind(value) {
    var v = String(value || "").trim();
    if (!v) return "";
    if (v.charAt(0) === "@") return "telegram";
    if (/^(https?:\/\/)?(t\.me|telegram\.me)\//i.test(v)) return "telegram";
    if (v.indexOf("@") !== -1) return "email";
    if (PHONE_ONLY_RE.test(v)) return "phone";
    return "text";
  }

  /* Digits only, capped at E.164's 15 digits. */
  function phoneDigits(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 15);
  }

  /* +7 (900) 000-00-00 for Russian numbers, +NN … grouped for the rest. */
  function formatPhone(value) {
    var digits = phoneDigits(value);
    if (!digits) return "";
    var plus = String(value).trim().charAt(0) === "+";

    /* Russian numbers arrive as +7…, 8…, or a bare 10-digit 9xx… number. */
    var ru = digits.charAt(0) === "7" || digits.charAt(0) === "8" ||
             (digits.length === 10 && digits.charAt(0) === "9");
    if (ru) {
      var rest = (digits.charAt(0) === "7" || digits.charAt(0) === "8") ? digits.slice(1) : digits;
      var out = "+7";
      if (rest.length) out += " (" + rest.slice(0, 3);
      if (rest.length > 3) out += ") " + rest.slice(3, 6);
      if (rest.length > 6) out += "-" + rest.slice(6, 8);
      if (rest.length > 8) out += "-" + rest.slice(8, 10);
      /* Never end on a punctuation character: Backspace then always removes a
         digit instead of a bracket the formatter would immediately restore. */
      return out.replace(/[^\d]+$/, "");
    }

    /* Non-Russian numbers: the country-code split is unknown, so leave the
       digits untouched instead of inventing a misleading grouping. */
    return (plus ? "+" : "") + digits;
  }

  var CONTACT_HINTS = {
    phone: { placeholder: "+7 900 000-00-00", note: "Формат телефона" },
    telegram: { placeholder: "@username", note: "Логин Telegram" },
    email: { placeholder: "you@example.ru", note: "Адрес e-mail" }
  };

  /* Reformat while keeping the caret on the same digit, so editing anywhere
     in the number stays predictable and the value never turns malformed. */
  function applyContactFormat(input) {
    var kind = contactKind(input.value);
    var formatted = kind === "phone" ? formatPhone(input.value) : input.value;

    if (kind === "phone" && formatted !== input.value) {
      var digitsBefore = phoneDigits(String(input.value).slice(0, input.selectionStart)).length;
      input.value = formatted;
      var pos = 0;
      var seen = 0;
      while (pos < formatted.length && seen < digitsBefore) {
        if (/\d/.test(formatted.charAt(pos))) seen++;
        pos++;
      }
      input.setSelectionRange(pos, pos);
    }

    var hint = CONTACT_HINTS[kind];
    var filled = input.value.length > 0;

    input.setAttribute("placeholder", hint ? hint.placeholder : CONTACT_HINTS.phone.placeholder);
    if (filled) input.setAttribute("inputmode", kind === "phone" ? "tel" : kind === "email" ? "email" : "text");
    else input.removeAttribute("inputmode");

    if (contactNote) {
      contactNote.textContent = hint ? hint.note : "Начните вводить — подскажу формат";
      contactNote.classList.toggle("is-detected", !!hint);
    }

    if (filled) input.dataset.kind = kind;
    else delete input.dataset.kind;
  }

  function contactError(contact) {
    var value = String(contact || "").trim();
    if (!value) return "";
    var kind = contactKind(value);
    if (kind === "telegram") {
      return TG_RE.test(value) ? "" : "Telegram-логин пишется как @username (4+ символа).";
    }
    if (kind === "phone") {
      var digits = phoneDigits(value);
      if (digits.length < 10) return "Телефон выглядит неполным — нужен формат +7 900 000-00-00.";
      return PHONE_RE.test(formatPhone(value)) ? "" : "Проверьте номер телефона.";
    }
    if (kind === "email") {
      return EMAIL_RE.test(value) ? "" : "Проверьте e-mail: похоже, в адресе опечатка.";
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
    var contactInput = form.elements["fi-text-contact"];
    var nameInput = form.elements["fi-sender-fullName"];
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

    var consent = form.elements["fi-checkbox-consent"];
    if (consent && !consent.checked) {
      setFieldError(consent, "Нужно согласие на обработку данных.");
      firstBad = firstBad || consent;
    }

    return firstBad;
  }

  var fallback = d.getElementById("form-fallback");
  var fallbackLink = d.getElementById("form-fallback-link");

  function fieldValue(name) {
    var el = form.elements[name];
    return el ? String(el.value).trim() : "";
  }

  function showFallback() {
    if (!fallback) return;
    if (fallbackLink) {
      var data = [
        "Заявка с сайта " + location.host,
        "",
        "Имя: " + fieldValue("fi-sender-fullName"),
        "Связь: " + fieldValue("fi-text-contact"),
        "Задача: " + fieldValue("fi-radio-service")
      ];
      var msg = fieldValue("fi-text-message");
      if (msg) data.push("Описание: " + msg);
      fallbackLink.href = "mailto:stackdev.studio@yandex.ru"
        + "?subject=" + encodeURIComponent("Заявка с сайта stack-dev.ru")
        + "&body=" + encodeURIComponent(data.join("\n"));
    }
    fallback.hidden = false;
  }

  if (form) {
    /* Take over validation: native bubbles become inline notes instead. */
    form.setAttribute("novalidate", "novalidate");

    /* Validate on blur so mistakes surface early, not only on submit. */
    var contactInput = form.elements["fi-text-contact"];
    if (contactInput) {
      contactInput.addEventListener("input", function () {
        applyContactFormat(contactInput);
        if (contactInput.getAttribute("aria-invalid") === "true") {
          setFieldError(contactInput, contactError(contactInput.value.trim()));
        }
      });
      contactInput.addEventListener("blur", function () {
        var v = contactInput.value.trim();
        if (v) setFieldError(contactInput, contactError(v));
      });
      contactInput.addEventListener("paste", function () {
        /* Format the pasted value once the browser has inserted it. */
        window.setTimeout(function () { applyContactFormat(contactInput); }, 0);
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

      var honeypot = form.elements["fi-text-website"];
      if (honeypot && honeypot.value) {
        e.preventDefault();
        setStatus("Заявка отправлена. Отвечу по указанному контакту в течение пары часов.", "success");
        return;
      }

      if (!window.fetch || !window.FormData) {
        e.preventDefault();
        setStatus("Отправьте заявку письмом — кнопка ниже уже готова.", "error");
        showFallback();
        return;
      }

      e.preventDefault();
      setStatus("Отправляю заявку…", "pending");
      setBusy(true);
      if (fallback) fallback.hidden = true;

      var body = new FormData(form);
      body.append("fi-text-page", location.host);

      fetch(form.getAttribute("action"), {
        method: "POST",
        body: body,
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          return res.json().catch(function () {
            throw new Error("HTTP " + res.status);
          });
        })
        .then(function (data) {
          if (!data || data.success !== true) {
            throw new Error((data && (data.message || data.error)) || "rejected");
          }
          form.reset();
          setStatus("Заявка отправлена. Открываю подтверждение…", "success");
          /* Hand the visitor the confirmation page, the same one a no-JS
             submit lands on. */
          var next = form.getAttribute("data-thanks") || "thanks.html";
          window.location.assign(next);
        })
        .catch(function (err) {
          setBusy(false);
          var msg = String((err && err.message) || "");
          if (msg.indexOf("TOO_MANY_REQUESTS") !== -1 || msg.indexOf("5 seconds") !== -1) {
            setStatus("Слишком часто — подождите пару секунд и нажмите ещё раз.", "error");
            return;
          }
          setStatus("Сервис приёма заявок недоступен — отправьте письмо кнопкой ниже.", "error");
          showFallback();
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
