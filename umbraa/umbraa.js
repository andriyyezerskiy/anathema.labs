/* ============================================================
   UMBRAA landing interactions
   Each control affects only the MacBook screen inside its own
   section. When a section first scrolls into view it plays a
   one-time hint: the control is driven automatically so people
   can see it is interactive. Hints are skipped if the visitor
   has already touched that control, or prefers reduced motion.
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function screenOf(el) { var s = el.closest(".feat"); return s ? s.querySelector("[data-screen]") : null; }
  function part(screen, sel) { return screen ? screen.querySelector(sel) : null; }

  /* simple ease-out tween */
  function animate(from, to, ms, step, done) {
    if (reduce) { step(to); if (done) done(); return; }
    var t0 = performance.now();
    (function frame(now) {
      var p = Math.min((now - t0) / ms, 1);
      var e = 1 - Math.pow(1 - p, 3);
      step(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(frame); else if (done) done();
    })(performance.now());
  }

  /* hint registry, fired once each by the observer below */
  var hints = [];
  function registerHint(sectionEl, fn) { if (sectionEl) hints.push({ el: sectionEl, run: fn, done: false }); }

  /* ---------- Screen Dimming ---------- */
  (function () {
    var slider = document.querySelector("[data-dim-slider]");
    if (!slider) return;
    var screen = screenOf(slider);
    var dim = part(screen, "[data-dim]");
    var valEl = slider.closest(".feat").querySelector("[data-dim-val]");
    var touched = false;
    function apply() {
      var v = parseInt(slider.value, 10);
      if (dim) dim.style.opacity = (v / 100 * 0.8).toFixed(3);
      if (valEl) valEl.textContent = v + "%";
      slider.style.setProperty("--fill", v + "%");
    }
    slider.addEventListener("input", function () { touched = true; apply(); });
    apply();
    registerHint(slider.closest(".feat"), function () {
      if (touched || reduce) return;
      animate(35, 82, 1000, function (v) { slider.value = Math.round(v); apply(); }, function () {
        setTimeout(function () {
          if (touched) return;
          animate(82, 35, 900, function (v) { slider.value = Math.round(v); apply(); });
        }, 550);
      });
    });
  })();

  /* ---------- Color Comfort ---------- */
  (function () {
    var group = document.querySelector("[data-color-group]");
    if (!group) return;
    var TINTS = { neutral: { rgb: "0,0,0", a: 0 }, warm: { rgb: "255,150,44", a: 0.5 }, red: { rgb: "255,34,0", a: 0.62 } };
    var screen = screenOf(group);
    var tint = part(screen, "[data-tint]");
    var btns = Array.prototype.slice.call(group.querySelectorAll("[data-tint-mode]"));
    var touched = false;
    function setColor(mode) {
      btns.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-tint-mode") === mode); });
      var t = TINTS[mode] || TINTS.neutral;
      if (tint) { tint.style.background = "rgb(" + t.rgb + ")"; tint.style.opacity = t.a; }
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { touched = true; setColor(b.getAttribute("data-tint-mode")); }); });
    registerHint(group.closest(".feat"), function () {
      if (touched || reduce) return;
      var seq = ["warm", "red", "neutral"], i = 0;
      (function next() {
        if (touched) return;
        setColor(seq[i]); i++;
        if (i < seq.length) setTimeout(next, 850);
      })();
    });
  })();

  /* ---------- Sleep Timer: countdown clock, then fade to black ---------- */
  (function () {
    var btn = document.querySelector("[data-timer-start]");
    if (!btn) return;
    var screen = screenOf(btn);
    var black = part(screen, "[data-black]");
    var cd = part(screen, "[data-countdown]");
    var cdTime = part(screen, "[data-cd-time]");
    var cdRing = part(screen, "[data-cd-ring]");
    var C = cdRing ? 2 * Math.PI * parseFloat(cdRing.getAttribute("r")) : 0;
    if (cdRing) { cdRing.style.strokeDasharray = C; cdRing.style.strokeDashoffset = 0; }
    var COUNT_MS = 4200, FADE_MS = 1800, START_SEC = 30 * 60;
    var running = false, raf, touched = false;
    function fmt(sec) { var m = Math.floor(sec / 60), s = Math.floor(sec % 60); return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; }
    function reset() {
      running = false; cancelAnimationFrame(raf);
      cd.classList.remove("is-on");
      black.classList.remove("is-on", "is-arming");
      if (cdRing) cdRing.style.strokeDashoffset = 0;
      if (cdTime) cdTime.textContent = fmt(START_SEC);
      btn.textContent = "Start timer";
    }
    function start() {
      if (running) { reset(); return; }
      running = true;
      btn.textContent = "Cancel";
      cd.classList.add("is-on");
      if (reduce) {
        if (cdTime) cdTime.textContent = "00:00";
        cd.classList.remove("is-on");
        black.style.setProperty("--fade", "300ms");
        black.classList.add("is-arming", "is-on");
        btn.textContent = "Reset";
        return;
      }
      var t0 = performance.now();
      (function frame(now) {
        var p = Math.min((now - t0) / COUNT_MS, 1);
        if (cdTime) cdTime.textContent = fmt(START_SEC * (1 - p));
        if (cdRing) cdRing.style.strokeDashoffset = (C * p).toFixed(1);
        if (p < 1) { raf = requestAnimationFrame(frame); return; }
        if (cdTime) cdTime.textContent = "00:00";
        cd.classList.remove("is-on");
        black.style.setProperty("--fade", FADE_MS + "ms");
        black.classList.add("is-arming", "is-on");
        btn.textContent = "Reset";
      })(performance.now());
    }
    btn.addEventListener("click", function () { touched = true; start(); });
    if (black) black.addEventListener("click", function () { if (running) { touched = true; reset(); } });
    registerHint(btn.closest(".feat"), function () {
      if (touched || reduce) return;
      start();
      setTimeout(function () { if (!touched) reset(); }, COUNT_MS + FADE_MS + 1400);
    });
  })();

  /* ---------- Sleep Now: 5..1 countdown, fade to black, "Goodnight" ---------- */
  (function () {
    var btn = document.querySelector("[data-now-toggle]");
    if (!btn) return;
    var screen = screenOf(btn);
    var black = part(screen, "[data-black]");
    var count = part(screen, "[data-count]");
    var goodnight = part(screen, "[data-goodnight]");
    var wake = part(screen, "[data-wake]");
    /* promote each text overlay to its own compositing layer so it paints
       cleanly above the opacity-animated black screen */
    [count, goodnight, wake].forEach(function (el) { if (el) el.style.transform = "translateZ(0)"; });
    var STEP = 800;            // ms per countdown number
    var FADE = STEP * 5;       // black fades in over the countdown
    var GN_IN = 400, GN_HOLD = 1000, GN_OUT = 1500;
    var state = "idle", touched = false, timers = [];
    var T = function (fn, ms) { timers.push(setTimeout(fn, ms)); };

    function reset() {
      timers.forEach(clearTimeout); timers = [];
      state = "idle";
      black.classList.remove("is-on", "is-arming");
      count.classList.remove("is-on"); count.innerHTML = "";
      goodnight.classList.remove("is-in");
      wake.classList.remove("is-on");
      btn.textContent = "Sleep now";
    }
    function run() {
      if (state !== "idle") { reset(); return; }
      state = "running";
      btn.textContent = "Cancel";
      if (reduce) {
        black.classList.add("is-on");
        state = "asleep"; wake.classList.add("is-on"); btn.textContent = "Wake";
        return;
      }
      /* screen slowly fades to black across the countdown */
      black.style.setProperty("--fade", FADE + "ms");
      black.classList.add("is-arming", "is-on");
      /* centered 5 4 3 2 1 */
      count.classList.add("is-on");
      [5, 4, 3, 2, 1].forEach(function (n, i) {
        T(function () { count.innerHTML = "<span>" + n + "</span>"; }, i * STEP);
      });
      /* once it passes 1, big bold "Goodnight" that slowly fades out */
      T(function () { count.classList.remove("is-on"); count.innerHTML = ""; goodnight.classList.add("is-in"); }, FADE);
      T(function () { goodnight.classList.remove("is-in"); }, FADE + GN_IN + GN_HOLD);
      T(function () { state = "asleep"; wake.classList.add("is-on"); btn.textContent = "Wake"; }, FADE + GN_IN + GN_HOLD + GN_OUT);
    }
    btn.addEventListener("click", function () { touched = true; run(); });
    if (black) black.addEventListener("click", function () { if (state !== "idle") { touched = true; reset(); } });
    registerHint(btn.closest(".feat"), function () {
      if (touched || reduce) return;
      run();
      T(function () { if (!touched) reset(); }, FADE + GN_IN + GN_HOLD + GN_OUT + 1600);
    });
  })();

  /* ---------- fire each hint once, when its section is in view ---------- */
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && en.intersectionRatio >= 0.5) {
          for (var i = 0; i < hints.length; i++) {
            if (hints[i].el === en.target && !hints[i].done) {
              hints[i].done = true;
              io.unobserve(en.target);
              hints[i].run();
              break;
            }
          }
        }
      });
    }, { threshold: [0.5] });
    hints.forEach(function (h) { io.observe(h.el); });
  }
})();
