/* ============================================================
   Anathema Labs — Ethereal: a monochrome-iPod music player.

   A classic click-wheel iPod UI (menu + now-playing views) skinned
   in the brand's mono + orange system. The audio engine underneath
   is a HIDDEN SoundCloud embed driven through SoundCloud's Widget
   API — so playback is real SoundCloud, but none of its chrome shows.

   Public surface (used by app.js):
     AnathemaIpod.mount(container, playlistUrl)  build UI + attach engine
     AnathemaIpod.unmount()                      pause + tear the UI down

   Only one player is ever visible at a time (a desktop window OR the
   mobile sheet — never both), so a single shared engine + single active
   view is all we track. Classic script (no modules) to match the site.
   ============================================================ */
(function () {
  "use strict";

  var API_SRC = "https://w.soundcloud.com/player/api.js";

  /* ---- SoundCloud Widget API loader (loaded once, lazily) ---- */
  var apiLoading = false, apiWaiters = [];
  function loadApi(cb) {
    if (window.SC && window.SC.Widget) { cb(); return; }
    apiWaiters.push(cb);
    if (apiLoading) return;
    apiLoading = true;
    var s = document.createElement("script");
    s.src = API_SRC;
    s.onload = function () {
      apiWaiters.forEach(function (f) { f(); });
      apiWaiters = [];
    };
    s.onerror = function () {
      apiWaiters.forEach(function (f) { f(new Error("api")); });
      apiWaiters = [];
    };
    document.head.appendChild(s);
  }

  /* ---- Shared engine (one hidden iframe + widget for the session) ---- */
  var iframe = null, widget = null, engineUrl = null;
  var state = { ready: false, error: false, sounds: [], index: 0, playing: false,
                position: 0, duration: 0 };
  var view = null; /* the currently-mounted UI, or null */

  function fmtTime(ms) {
    if (!ms || ms < 0 || isNaN(ms)) return "0:00";
    var t = Math.floor(ms / 1000);
    var m = Math.floor(t / 60);
    var s = t % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function titleOf(sound) {
    if (!sound) return "—";
    return sound.title || "Untitled";
  }
  function artistOf(sound) {
    if (!sound) return "";
    /* Prefer the track's real artist (publisher metadata) over the
       uploading account name, which is often just the label/playlist owner. */
    var pm = sound.publisher_metadata;
    if (pm && pm.artist) return pm.artist;
    return (sound.user && sound.user.username) || "";
  }
  /* Cover art URL, bumped from SoundCloud's default 100px to a crisper
     200px. Falls back to the artist's avatar, then to nothing (glyph). */
  function artOf(sound) {
    if (!sound) return "";
    var u = sound.artwork_url || (sound.user && sound.user.avatar_url) || "";
    return u ? u.replace("-large", "-t200x200") : "";
  }

  /* If the text overflows its box, scroll it back and forth like a real
     iPod marquee; otherwise leave it static. Driven by CSS (see .ipod__marq). */
  function marquee(box, inner) {
    box.classList.remove("is-scroll");
    box.style.removeProperty("--marq-shift");
    box.style.removeProperty("--marq-dur");
    requestAnimationFrame(function () {
      var over = inner.scrollWidth - box.clientWidth;
      if (over > 4) {
        box.style.setProperty("--marq-shift", (-over) + "px");
        box.style.setProperty("--marq-dur", Math.max(6, over / 22 + 4) + "s");
        box.classList.add("is-scroll");
      }
    });
  }

  function ensureEngine(url, done) {
    if (widget && engineUrl === url && state.ready) { done(); return; }
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.title = "SoundCloud audio engine";
      iframe.setAttribute("aria-hidden", "true");
      iframe.tabIndex = -1;
      iframe.allow = "autoplay";
      /* present + loadable, but never seen */
      iframe.style.cssText =
        "position:absolute;width:1px;height:1px;left:-9999px;top:-9999px;border:0;opacity:0;pointer-events:none;";
      document.body.appendChild(iframe);
    }
    engineUrl = url;
    state.ready = false; state.error = false;
    iframe.src =
      "https://w.soundcloud.com/player/?url=" + encodeURIComponent(url) +
      "&auto_play=false&hide_related=true&show_comments=false&show_user=false" +
      "&show_reposts=false&show_teaser=false&visual=false&buying=false" +
      "&sharing=false&download=false&single_active=false";

    var settled = false;
    var timer = setTimeout(function () {
      if (!settled && !state.ready) { state.error = true; render(); }
    }, 8000);

    loadApi(function (err) {
      if (err) { state.error = true; clearTimeout(timer); render(); return; }
      widget = SC.Widget(iframe);
      var E = SC.Widget.Events;

      widget.bind(E.READY, function () {
        settled = true; clearTimeout(timer);
        state.ready = true; state.error = false;
        widget.getSounds(function (list) {
          state.sounds = (list || []).filter(Boolean);
          syncCurrent(function () { render(); });
        });
        done();
      });
      widget.bind(E.PLAY, function () {
        state.playing = true;
        syncCurrent(function () { render(); });
      });
      widget.bind(E.PAUSE, function () { state.playing = false; render(); });
      widget.bind(E.FINISH, function () { state.playing = false; });
      widget.bind(E.PLAY_PROGRESS, function (e) {
        state.position = e ? e.currentPosition : 0;
        if (view) view.progress();
      });
      widget.bind(E.ERROR, function () { state.error = true; render(); });
    });
  }

  /* Pull the live current-track index + duration from the widget. */
  function syncCurrent(cb) {
    if (!widget) { if (cb) cb(); return; }
    widget.getCurrentSoundIndex(function (i) {
      if (typeof i === "number" && i >= 0) state.index = i;
      widget.getDuration(function (d) {
        state.duration = d || 0;
        if (cb) cb();
      });
    });
  }

  /* ---- Transport (guarded — no-ops before the engine is ready) ---- */
  function play() { if (widget) widget.play(); }
  function pause() { if (widget) widget.pause(); }
  function toggle() { if (widget) widget.toggle(); }
  /* Prev/next step to the adjacent track and (re)start it from 0:00. We
     drive this via skip() ourselves — the widget's own next()/prev() don't
     reliably advance this playlist and leave playback where it was. */
  function next() { step(1); }
  function prev() { step(-1); }
  function step(delta) {
    if (!widget || !state.sounds.length) return;
    var n = state.sounds.length;
    playIndex((state.index + delta + n) % n);
  }
  function playIndex(i) {
    if (!widget) return;
    state.index = i;
    state.position = 0;
    state.duration = (state.sounds[i] && state.sounds[i].duration) || 0;
    widget.skip(i); /* skip() restarts track i from 0:00 and plays it */
    render();
  }

  /* ---- View: builds the iPod DOM in `container` and drives it ---- */
  function buildView(container) {
    container.innerHTML =
      '<div class="ipod" data-mode="menu" tabindex="0">' +
        '<div class="ipod__screen">' +
          '<div class="ipod__bar">' +
            '<span class="ipod__bar-title">Ethereal</span>' +
            '<span class="ipod__batt" aria-hidden="true"></span>' +
          '</div>' +
          '<div class="ipod__stage">' +
            '<div class="ipod__menu"><ul class="ipod__list" role="listbox"></ul></div>' +
            '<div class="ipod__now">' +
              '<div class="ipod__now-count"></div>' +
              '<div class="ipod__art" aria-hidden="true">' +
                '<img class="ipod__art-img" alt="" draggable="false" />' +
                '<svg class="ipod__art-ph" viewBox="0 0 24 24" width="34" height="34"><path d="M9 18V5l10-2v13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="16.5" cy="16" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>' +
              '</div>' +
              '<div class="ipod__now-title"><span class="ipod__marq">—</span></div>' +
              '<div class="ipod__now-artist"><span class="ipod__marq"></span></div>' +
              '<div class="ipod__scrub">' +
                '<span class="ipod__t ipod__t--a">0:00</span>' +
                '<span class="ipod__track"><span class="ipod__fill"></span></span>' +
                '<span class="ipod__t ipod__t--b">0:00</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ipod__wheel">' +
          '<button class="ipod__key ipod__key--menu" type="button">MENU</button>' +
          '<button class="ipod__key ipod__key--prev" type="button" aria-label="Previous">' +
            '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M18 6v12M8 12l9-6v12z" fill="currentColor"/><path d="M8 6v12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>' +
          '<button class="ipod__key ipod__key--next" type="button" aria-label="Next">' +
            '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 6v12M16 12L7 6v12z" fill="currentColor"/><path d="M16 6v12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>' +
          '<button class="ipod__key ipod__key--play" type="button" aria-label="Play / pause">' +
            '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/><rect x="4" y="5" width="2.4" height="14" rx="0.6" fill="currentColor"/></svg></button>' +
          '<button class="ipod__center" type="button" aria-label="Select"></button>' +
        '</div>' +
      '</div>';

    var root = container.querySelector(".ipod");
    var listEl = container.querySelector(".ipod__list");
    var nowTitle = container.querySelector(".ipod__now-title");
    var nowArtist = container.querySelector(".ipod__now-artist");
    var nowTitleT = nowTitle.querySelector(".ipod__marq");
    var nowArtistT = nowArtist.querySelector(".ipod__marq");
    var artEl = container.querySelector(".ipod__art");
    var artImg = artEl.querySelector(".ipod__art-img");
    /* If the cover fails to load, drop back to the glyph placeholder. */
    artImg.addEventListener("error", function () { artEl.classList.remove("has-art"); });
    var nowCount = container.querySelector(".ipod__now-count");
    var fill = container.querySelector(".ipod__fill");
    var tA = container.querySelector(".ipod__t--a");
    var tB = container.querySelector(".ipod__t--b");
    var barTitle = container.querySelector(".ipod__bar-title");

    var sel = state.index || 0; /* menu cursor (may differ from playing track) */

    function mode() { return root.getAttribute("data-mode"); }
    function setMode(m) { root.setAttribute("data-mode", m); barTitle.textContent = m === "now" ? "Now Playing" : "Ethereal"; }

    function renderList() {
      if (state.error) {
        listEl.innerHTML = '<li class="ipod__msg">Can’t reach SoundCloud.<br>Check the connection.</li>';
        return;
      }
      if (!state.ready || !state.sounds.length) {
        listEl.innerHTML = '<li class="ipod__msg">Loading…</li>';
        return;
      }
      if (sel >= state.sounds.length) sel = state.sounds.length - 1;
      if (sel < 0) sel = 0;
      var html = "";
      for (var i = 0; i < state.sounds.length; i++) {
        var cls = "ipod__row" + (i === sel ? " is-sel" : "") +
                  (i === state.index ? " is-playing" : "");
        html += '<li class="' + cls + '" data-i="' + i + '">' +
                  '<span class="ipod__row-ic" aria-hidden="true"></span>' +
                  '<span class="ipod__row-t">' + escapeHtml(titleOf(state.sounds[i])) + '</span>' +
                  '<span class="ipod__row-caret" aria-hidden="true">›</span>' +
                '</li>';
      }
      listEl.innerHTML = html;
      var selRow = listEl.querySelector(".is-sel");
      if (selRow) selRow.scrollIntoView({ block: "nearest" });
    }

    function renderNow() {
      var s = state.sounds[state.index];
      nowTitleT.textContent = titleOf(s);
      nowArtistT.textContent = artistOf(s);
      var art = artOf(s);
      if (art) {
        if (artImg.getAttribute("src") !== art) artImg.src = art;
        artEl.classList.add("has-art");
      } else {
        artImg.removeAttribute("src");
        artEl.classList.remove("has-art");
      }
      marquee(nowTitle, nowTitleT);
      marquee(nowArtist, nowArtistT);
      nowCount.textContent = state.sounds.length
        ? (state.index + 1) + " of " + state.sounds.length : "";
      root.classList.toggle("is-playing", state.playing);
      progress();
    }

    function progress() {
      var dur = state.duration || (state.sounds[state.index] && state.sounds[state.index].duration) || 0;
      var pos = state.position || 0;
      var pct = dur ? Math.min(100, (pos / dur) * 100) : 0;
      fill.style.width = pct + "%";
      tA.textContent = fmtTime(pos);
      tB.textContent = "-" + fmtTime(Math.max(0, dur - pos));
    }

    function render() {
      renderList();
      renderNow();
    }

    /* ----- navigation ----- */
    function moveSel(delta) {
      if (mode() !== "menu" || !state.sounds.length) return;
      sel = Math.max(0, Math.min(state.sounds.length - 1, sel + delta));
      renderList();
    }
    function selectCurrent() {
      if (mode() === "menu") {
        playIndex(sel);
        setMode("now");
      } else {
        toggle();
      }
    }

    /* ----- wire the wheel keys ----- */
    root.querySelector(".ipod__key--menu").addEventListener("click", function () {
      if (mode() === "now") { setMode("menu"); sel = state.index; renderList(); }
      else moveSel(-1);
    });
    root.querySelector(".ipod__key--play").addEventListener("click", toggle);
    root.querySelector(".ipod__key--next").addEventListener("click", next);
    root.querySelector(".ipod__key--prev").addEventListener("click", prev);
    root.querySelector(".ipod__center").addEventListener("click", selectCurrent);

    /* click a track directly */
    listEl.addEventListener("click", function (e) {
      var row = e.target.closest ? e.target.closest(".ipod__row") : null;
      if (!row) return;
      sel = parseInt(row.getAttribute("data-i"), 10) || 0;
      playIndex(sel);
      setMode("now");
      render();
    });

    /* mouse-wheel over the device scrolls the menu selection */
    root.addEventListener("wheel", function (e) {
      if (mode() !== "menu") return;
      e.preventDefault();
      moveSel(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    /* rotary drag on the wheel — the signature iPod gesture */
    wireRotary(root.querySelector(".ipod__wheel"), function (steps) { moveSel(steps); });

    /* keyboard when focused */
    root.addEventListener("keydown", function (e) {
      switch (e.key) {
        case "ArrowDown": e.preventDefault(); moveSel(1); break;
        case "ArrowUp": e.preventDefault(); moveSel(-1); break;
        case "ArrowRight": next(); break;
        case "ArrowLeft": prev(); break;
        case "Enter": e.preventDefault(); selectCurrent(); break;
        case " ": e.preventDefault(); toggle(); break;
        case "Escape":
          if (mode() === "now") { setMode("menu"); sel = state.index; renderList(); }
          break;
      }
    });

    render();

    return {
      container: container,
      update: render,
      progress: progress,
      destroy: function () { container.innerHTML = ""; }
    };
  }

  /* Rotary: track pointer angle around the wheel centre; every ~28° of
     travel steps the selection by one, the way the click wheel does. */
  function wireRotary(wheel, onStep) {
    if (!wheel) return;
    var dragging = false, lastAngle = 0, acc = 0;
    var STEP = 28;
    function angle(e) {
      var r = wheel.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var p = e.touches ? e.touches[0] : e;
      return Math.atan2(p.clientY - cy, p.clientX - cx) * 180 / Math.PI;
    }
    function start(e) {
      /* ignore taps that land on the labelled keys / centre */
      if (e.target.closest(".ipod__key") || e.target.closest(".ipod__center")) return;
      dragging = true; acc = 0; lastAngle = angle(e);
    }
    function move(e) {
      if (!dragging) return;
      var a = angle(e);
      var d = a - lastAngle;
      if (d > 180) d -= 360; else if (d < -180) d += 360;
      lastAngle = a; acc += d;
      while (acc >= STEP) { acc -= STEP; onStep(1); }
      while (acc <= -STEP) { acc += STEP; onStep(-1); }
    }
    function end() { dragging = false; }
    wheel.addEventListener("mousedown", start);
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", end);
    wheel.addEventListener("touchstart", start, { passive: true });
    wheel.addEventListener("touchmove", move, { passive: true });
    wheel.addEventListener("touchend", end);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* Re-render whatever view is currently mounted. */
  function render() { if (view) view.update(); }

  /* ---- public API ---- */
  window.AnathemaIpod = {
    mount: function (container, playlistUrl) {
      if (view) view.destroy();
      view = buildView(container);
      ensureEngine(playlistUrl, function () { render(); });
    },
    unmount: function () {
      pause();
      if (view) { view.destroy(); view = null; }
    }
  };
})();
