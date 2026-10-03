/* ==========================================================================
   StackDev Studio — site behaviour
   --------------------------------------------------------------------------
   Vanilla ES5-compatible JS, no build step and no dependencies, so the page
   keeps working from a plain GitHub Pages checkout.

   Every feature below is progressive enhancement: with JS disabled the page
   still renders, every link still works and every FAQ still opens.
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
      toTop.hidden = false;
      toTop.classList.toggle("is-visible", y > 700);
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
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        burger.focus();
      }
    });

    /* Leaving the mobile breakpoint while the drawer is open would otherwise
       strand body.menu-open and trap scrolling. */
    var wide = window.matchMedia("(min-width: 861px)");
    var onBreakpoint = function (e) { if (e.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener("change", onBreakpoint);
    else if (wide.addListener) wide.addListener(onBreakpoint);
  }

  /* ------------------------------------------------------- scroll-spy */
  var navLinks = Array.prototype.slice.call(d.querySelectorAll(".nav a[href^='#']"));
  var sections = navLinks
    .map(function (link) { return d.getElementById(link.getAttribute("href").slice(1)); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ------------------------------------------------------------- year */
  var year = d.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* -------------------------------------------------------- lead form */
  /* There is no backend on a static host. The form composes the brief,
     copies it to the clipboard and opens the studio's direct chat, so the
     message always lands at @StackDevStudio -- never wherever the visitor
     happens to share it. */
  var form = d.getElementById("lead-form");
  var hint = d.getElementById("form-hint");
  var TG_CHAT = "https://t.me/StackDevStudio";

  function writeClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    /* Fallback for non-secure contexts / older browsers. */
    return new Promise(function (resolve, reject) {
      var ta = d.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      d.body.appendChild(ta);
      ta.select();
      try {
        d.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
      } catch (err) {
        reject(err);
      } finally {
        d.body.removeChild(ta);
      }
    });
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var data = new FormData(form);
      var name = String(data.get("name") || "").trim();
      var contact = String(data.get("contact") || "").trim();
      var service = String(data.get("service") || "").trim();
      var message = String(data.get("message") || "").trim();

      if (!name || !contact) {
        if (hint) {
          hint.textContent = "Заполните имя и способ связи — без них заявку не отправить.";
          hint.style.color = "#f87171";
        }
        var firstEmpty = form.querySelector(":invalid");
        if (firstEmpty) firstEmpty.focus();
        return;
      }

      var text = [
        "Заявка с сайта " + location.host,
        "",
        "Имя: " + name,
        "Связь: " + contact,
        "Задача: " + service
      ];
      if (message) text.push("Описание: " + message);

      function done(copied) {
        if (hint) {
          hint.textContent = copied
            ? "Текст заявки скопирован — вставьте его в открывшийся Telegram и отправьте."
            : "Открылся чат @StackDevStudio — вставьте текст заявки (Ctrl+V) и отправьте.";
          hint.style.color = "";
        }
      }

      writeClipboard(text.join("\n"))
        .then(function () { done(true); })
        .catch(function () { done(false); });

      window.open(TG_CHAT, "_blank", "noopener");
    });
  }

  /* ---------------------------------------------------- GitHub projects */
  /* Pulls ONLY the studio org (StackDev-Studio) and caches it in
     sessionStorage, so the section degrades gracefully offline. The site's
     own repo and forks are filtered out: they are infrastructure, not
     portfolio pieces. */
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

  /* Fallback markup lives in <noscript>; with JS on we replace it. */
  if (grid && !reduce) {
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null"); } catch (e) { /* private mode */ }

    var paint = function (repos) {
      if (!grid) return;
      var list = repos.filter(isPortfolioRepo);
      if (!list.length) { showEmpty(); return; }

      var html = "";
      list.forEach(function (repo) {
        var updated = repo.updated_at
          ? new Date(repo.updated_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
          : "";

        html += '<article class="repo reveal is-in">'
          + '<div class="repo-top">'
          + '<a class="repo-name" href="' + repo.html_url + '" target="_blank" rel="noopener">' + repo.name + "</a>"
          + "</div>"
          + '<p class="repo-desc">' + (repo.description || "Проект без описания.") + "</p>"
          + '<div class="repo-meta">'
          + "<span>★ " + repo.stargazers_count + "</span>"
          + "<span>" + (repo.language || "—") + "</span>"
          + "<span>обновлён " + updated + "</span>"
          + "</div>"
          + "</article>";
      });

      grid.innerHTML = html;
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