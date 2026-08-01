/* ============================================================
   Anathema Labs — interaction layer
   (classic scripts, no modules — works over file:// too)
   ============================================================ */
(function () {
  "use strict";

  /* Dark mode follows the system setting (prefers-color-scheme).
     Set the class before rendering so icons pick the right variant. */
  var darkMQ = window.matchMedia("(prefers-color-scheme: dark)");
  if (darkMQ.matches) document.documentElement.classList.add("theme-dark");

  /* ---------- Clocks ---------- */
  function tick() {
    var now = new Date();
    var h = now.getHours();
    var m = String(now.getMinutes()).padStart(2, "0");
    var ampm = h >= 12 ? "PM" : "AM";
    var h12 = h % 12 || 12;
    var menu = document.getElementById("menuClock");
    var ios = document.getElementById("iosClock");
    if (menu) menu.textContent = h12 + ":" + m + " " + ampm;
    if (ios) ios.textContent = h12 + ":" + m;
  }
  tick();
  setInterval(tick, 15000);

  /* ---------- Helpers ---------- */
  function byId(id) { return document.getElementById(id); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function findApp(id) {
    for (var i = 0; i < ANATHEMA_APPS.length; i++) {
      if (ANATHEMA_APPS[i].id === id) return ANATHEMA_APPS[i];
    }
    return null;
  }

  /* Adaptive icons: dark variant by default, light variant in dark mode.
     Dark mode is toggled by adding class "theme-dark" to <html>. Call
     AnathemaTheme.refresh() after flipping it (see bottom of file). */
  function isDark() {
    return document.documentElement.classList.contains("theme-dark");
  }

  /* Icon markup: real image if provided, else the inline SVG glyph.
     `icon` = light-mode art, `iconDark` = dark-mode art. */
  function iconInner(app) {
    if (!app.icon) return app.glyph;
    var darkIcon = app.iconDark || app.icon;
    var src = isDark() ? darkIcon : app.icon;
    return '<img class="ic" src="' + src + '" data-light="' + app.icon +
           '" data-dark="' + darkIcon + '" alt="" draggable="false" />';
  }
  function tileClass(app, base) {
    return base + (app.icon ? " " + base + "--img" : "");
  }

  /* Optional feature bullets + contact line, shared by window and sheet. */
  function featuresHtml(app) {
    if (!app.features || !app.features.length) return "";
    var items = app.features.map(function (f) {
      return '<li><span class="feat__t">' + f[0] + "</span> " + f[1] + "</li>";
    }).join("");
    return '<ul class="proj-features">' + items + "</ul>";
  }
  function contactHtml(app) {
    return app.email
      ? '<a class="proj-contact" href="mailto:' + app.email + '">' + app.email + "</a>"
      : "";
  }

  /* ============================================================
     DESKTOP — dock
     ============================================================ */
  var dock = byId("dock");
  if (dock) {
    // Studio "home" icon — opens the About window
    var home = el("button", "dock__item dock__item--home");
    home.setAttribute("aria-label", "Anathema Labs — About the studio");
    home.innerHTML =
      '<span class="dock__tile dock__tile--img"><img class="ic" src="assets/icons/anathema.svg" alt="" draggable="false" /></span>' +
      '<span class="dock__label">Anathema Labs — About the studio</span>';
    home.addEventListener("click", function () {
      bounceTile(home.querySelector(".dock__tile"));
      openAbout();
    });
    dock.appendChild(home);
    dock.appendChild(el("span", "dock__divider"));

    ANATHEMA_APPS.forEach(function (app) {
      var item = el("button", "dock__item" + (app.accent ? "" : " dock__item--mono"));
      item.setAttribute("aria-label", app.name);
      var tile = tileClass(app, "dock__tile");
      item.innerHTML =
        '<span class="' + tile + '">' + iconInner(app) + "</span>" +
        '<span class="dock__reflect" aria-hidden="true"><span class="' + tile + '">' + iconInner(app) + "</span></span>" +
        '<span class="dock__label">' + app.name + " — " + app.tagline + "</span>";
      item.addEventListener("click", function () {
        bounceTile(item.querySelector(".dock__tile"));
        openWindow(app);
      });
      dock.appendChild(item);
    });
  }

  /* Classic dock bounce on launch. */
  function bounceTile(tile) {
    if (!tile) return;
    tile.classList.remove("is-bouncing");
    void tile.offsetWidth; /* restart animation */
    tile.classList.add("is-bouncing");
  }

  /* ---------- Windows: open + drag + close ---------- */
  var surface = byId("desktopSurface");
  var zTop = 10;
  var openIds = {};
  var spawnOffset = 0;

  function openWindow(app) {
    if (openIds[app.id]) { bringFront(openIds[app.id]); return; }

    var win = el("section", "win");
    win.style.width = "380px";
    win.style.top = (110 + spawnOffset) + "px";
    win.style.left = (Math.min(520, 300) + spawnOffset) + "px";
    spawnOffset = (spawnOffset + 28) % 140;

    win.innerHTML =
      '<header class="win__bar" data-drag>' +
        '<button class="win__close" aria-label="Close"></button>' +
        '<div class="win__title">' + app.name + "</div>" +
        '<div class="win__lines"></div>' +
      "</header>" +
      '<div class="win__body">' +
        '<div class="' + tileClass(app, "win__icon") + (app.accent && !app.icon ? " chip--accent" : "") + '">' + iconInner(app) + "</div>" +
        '<h1 class="brand" style="font-size:34px">' + app.name + "</h1>" +
        '<p class="proj-tagline">' + app.tagline + "</p>" +
        '<p class="copy">' + app.about + "</p>" +
        featuresHtml(app) +
        '<div class="win__meta">' +
          (app.appStore ? '<a class="chip chip--accent" href="' + app.appStore + '" target="_blank" rel="noopener">App&nbsp;Store ↗</a>' : "") +
          (app.status && !app.appStore ? '<span class="chip">' + app.status.toUpperCase() + "</span>" : "") +
          (app.url ? '<a class="chip" href="' + app.url + '" target="_blank" rel="noopener">Visit ↗</a>' : "") +
        "</div>" +
        contactHtml(app) +
      "</div>";

    surface.appendChild(win);
    openIds[app.id] = win;
    win.dataset.appid = app.id;
    makeDraggable(win);
    wireClose(win, app.id);
    bringFront(win);
  }

  function bringFront(win) { win.style.zIndex = ++zTop; }

  function wireClose(win, id) {
    var close = win.querySelector(".win__close");
    close.addEventListener("click", function (e) {
      e.stopPropagation();
      win.remove();
      delete openIds[id];
    });
  }

  /* Drag any .win by its [data-drag] bar (also the pre-rendered About window). */
  function makeDraggable(win) {
    var bar = win.querySelector("[data-drag]");
    if (!bar) return;
    var sx, sy, ox, oy, dragging = false;
    bar.addEventListener("mousedown", function (e) {
      if (e.target.classList.contains("win__close")) return;
      e.preventDefault(); /* stop the browser starting a text selection on drag */
      dragging = true;
      bringFront(win);
      sx = e.clientX; sy = e.clientY;
      ox = win.offsetLeft; oy = win.offsetTop;
      document.body.style.userSelect = "none";
    });
    document.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      var nx = ox + (e.clientX - sx);
      var ny = oy + (e.clientY - sy);
      ny = Math.max(0, ny); /* don't drag under the menu bar */
      win.style.left = nx + "px";
      win.style.top = ny + "px";
    });
    document.addEventListener("mouseup", function () {
      dragging = false;
      document.body.style.userSelect = "";
    });
  }

  /* Wire the pre-rendered About window. */
  var about = byId("win-about");
  if (about) {
    makeDraggable(about);
    about.addEventListener("mousedown", function () { bringFront(about); });
    var aClose = about.querySelector(".win__close");
    if (aClose) aClose.addEventListener("click", function () { about.style.display = "none"; });
  }

  /* ============================================================
     Menu bar — functional dropdown menus + window commands
     ============================================================ */
  function openAbout() {
    if (!about) return;
    about.style.display = "";
    bringFront(about);
  }
  function visibleWindows() {
    return Array.prototype.slice.call(document.querySelectorAll(".win"))
      .filter(function (w) { return w.offsetParent !== null; });
  }
  function closeFront() {
    var wins = visibleWindows();
    if (!wins.length) return;
    wins.sort(function (a, b) { return (+a.style.zIndex || 0) - (+b.style.zIndex || 0); });
    var top = wins[wins.length - 1];
    if (top.id === "win-about") top.style.display = "none";
    else { var id = top.dataset.appid; top.remove(); if (id) delete openIds[id]; }
  }
  function closeAll() {
    if (about) about.style.display = "none";
    Object.keys(openIds).forEach(function (id) {
      if (openIds[id]) { openIds[id].remove(); delete openIds[id]; }
    });
  }

  var STUDIO_EMAIL = "contact.andriy@icloud.com";
  var MENU_CONFIG = [
    { label: "File", items: [
      { label: "Open About Window", action: openAbout },
      { sep: true },
      { label: "Close Front Window", action: closeFront },
      { label: "Close All Windows", action: closeAll }
    ]},
    { label: "Projects", items: ANATHEMA_APPS.map(function (app) {
      return { label: app.name, sub: app.tagline, action: function () { openWindow(app); } };
    })}
  ];
  var APP_MENU_ITEMS = [
    { label: "About Anathema Labs", action: openAbout },
    { sep: true },
    { label: "Get in Touch…", action: function () { location.href = "mailto:" + STUDIO_EMAIL; } }
  ];

  function closeAllMenus() {
    Array.prototype.forEach.call(document.querySelectorAll(".menu.open"), function (m) {
      m.classList.remove("open");
    });
  }
  function buildDropdown(items) {
    var dd = el("div", "menu-dropdown");
    items.forEach(function (it) {
      if (it.sep) { dd.appendChild(el("div", "menu-sep")); return; }
      var opt = el("button", "menu-opt");
      opt.innerHTML =
        '<span class="menu-opt__label">' + it.label + "</span>" +
        (it.sub ? '<span class="menu-opt__sub">' + it.sub + "</span>" : "") +
        (it.note ? '<span class="menu-opt__note">' + it.note + "</span>" : "");
      opt.addEventListener("click", function (e) {
        e.stopPropagation();
        closeAllMenus();
        if (it.action) it.action();
      });
      dd.appendChild(opt);
    });
    return dd;
  }
  function wireMenu(menu, trigger) {
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      var wasOpen = menu.classList.contains("open");
      closeAllMenus();
      if (!wasOpen) menu.classList.add("open");
    });
    trigger.addEventListener("mouseenter", function () {
      if (document.querySelector(".menu.open") && !menu.classList.contains("open")) {
        closeAllMenus();
        menu.classList.add("open");
      }
    });
  }
  function buildMenus() {
    var nav = document.querySelector(".menubar__menus");
    if (nav) {
      nav.innerHTML = "";
      MENU_CONFIG.forEach(function (cfg) {
        var menu = el("div", "menu");
        var btn = el("button", "menu-item menu-trigger", cfg.label);
        menu.appendChild(btn);
        menu.appendChild(buildDropdown(cfg.items));
        wireMenu(menu, btn);
        nav.appendChild(menu);
      });
    }
    var appMenu = document.querySelector(".menu--app");
    if (appMenu) {
      appMenu.appendChild(buildDropdown(APP_MENU_ITEMS));
      wireMenu(appMenu, appMenu.querySelector(".menu-trigger"));
    }
  }
  buildMenus();
  document.addEventListener("click", closeAllMenus);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAllMenus(); });


  /* ============================================================
     MOBILE — grid, dock, sheet
     ============================================================ */
  function iosIcon(app) {
    var b = el("button", "ios-app");
    b.innerHTML =
      '<span class="' + tileClass(app, "ios-app__icon") + (app.accent && !app.icon ? " ios-app__icon--accent" : "") + '">' + iconInner(app) + "</span>" +
      '<span class="ios-app__label">' + app.name + "</span>";
    b.addEventListener("click", function () { openSheet(app); });
    return b;
  }

  var grid = byId("iosGrid");
  var iosDock = byId("iosDock");
  if (grid && iosDock) {
    ANATHEMA_APPS.forEach(function (app) {
      if (IOS_DOCK_IDS.indexOf(app.id) === -1) grid.appendChild(iosIcon(app));
    });
    // Studio "home" icon first in the iOS dock — opens the About sheet
    var iosHome = el("button", "ios-app ios-app--home");
    iosHome.innerHTML =
      '<span class="ios-app__icon ios-app__icon--img"><img src="assets/icons/anathema.svg" alt="" draggable="false" /></span>' +
      '<span class="ios-app__label">Anathema</span>';
    iosHome.addEventListener("click", openStudioSheet);
    iosDock.appendChild(iosHome);
    IOS_DOCK_IDS.forEach(function (id) {
      var app = findApp(id);
      if (app) iosDock.appendChild(iosIcon(app));
    });
    if (!grid.children.length) {
      var home = document.querySelector(".ios-home");
      if (home) home.classList.add("is-empty");
    }
  }

  /* ---------- Sheet ---------- */
  var sheet = byId("sheet");
  var sheetContent = byId("sheetContent");

  function openSheet(app) {
    sheetContent.innerHTML =
      '<div class="' + tileClass(app, "sheet__icon") + (app.accent && !app.icon ? " sheet__icon--accent" : "") + '">' + iconInner(app) + "</div>" +
      '<div class="sheet__name">' + app.name + "</div>" +
      '<div class="sheet__tagline">' + app.tagline + "</div>" +
      '<p class="sheet__about">' + app.about + "</p>" +
      featuresHtml(app) +
      '<div class="sheet__meta">' +
        (app.appStore ? '<a class="sheet__status sheet__status--accent" href="' + app.appStore + '" target="_blank" rel="noopener">App Store ↗</a>' : "") +
        (app.status && !app.appStore ? '<span class="sheet__status">' + app.status.toUpperCase() + "</span>" : "") +
        (app.url ? '<a class="sheet__status" href="' + app.url + '" target="_blank" rel="noopener">Visit ↗</a>' : "") +
      "</div>" +
      contactHtml(app);
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
  }
  /* Studio About sheet (the Anathema home icon). */
  function openStudioSheet() {
    sheetContent.innerHTML =
      '<div class="sheet__icon sheet__icon--img"><img src="assets/icons/anathema.svg" alt="" draggable="false" /></div>' +
      '<h2 class="brand" style="font-size:32px;margin-bottom:6px">Anathema<span class="brand__thin">Labs</span></h2>' +
      '<div class="sheet__tagline">A collision of physical &amp; digital</div>' +
      '<p class="sheet__about">We design where the physical and the digital collide — software made with unusual care, and objects built to last.</p>' +
      '<div class="sheet__meta">' +
        '<a class="btn-contact" href="mailto:' + STUDIO_EMAIL + '?subject=Hello%20Anathema%20Labs">Reach out ↗</a>' +
      "</div>";
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
  }
  function closeSheet() {
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
  }
  if (sheet) {
    Array.prototype.forEach.call(sheet.querySelectorAll("[data-sheet-close]"), function (n) {
      n.addEventListener("click", closeSheet);
    });
  }

  /* ============================================================
     Theme (adaptive icons) — ready for a future dark mode.
     Usage later:
       document.documentElement.classList.toggle("theme-dark");
       AnathemaTheme.refresh();
     ============================================================ */
  function refreshIcons() {
    var dark = isDark();
    Array.prototype.forEach.call(document.querySelectorAll("img.ic"), function (im) {
      im.src = dark ? im.dataset.dark : im.dataset.light;
    });
  }
  window.AnathemaTheme = {
    refresh: refreshIcons,
    toggle: function () {
      document.documentElement.classList.toggle("theme-dark");
      refreshIcons();
    }
  };

  /* React to live system light/dark changes. */
  darkMQ.addEventListener("change", function (e) {
    document.documentElement.classList.toggle("theme-dark", e.matches);
    refreshIcons();
  });
})();
