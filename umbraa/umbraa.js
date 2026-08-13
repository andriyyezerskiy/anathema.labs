/* ============================================================
   UMBRAA landing interactions
   Each control affects only the MacBook screen inside its own
   section. No whole-page effects.
   ============================================================ */
(function () {
  "use strict";

  function screenOf(el) {
    var sec = el.closest(".feat");
    return sec ? sec.querySelector("[data-screen]") : null;
  }
  function part(screen, sel) { return screen ? screen.querySelector(sel) : null; }

  /* ---------- Screen Dimming: slider → screen dim ---------- */
  var slider = document.querySelector("[data-dim-slider]");
  if (slider) {
    var dimScreen = screenOf(slider);
    var dimVal = slider.closest(".feat").querySelector("[data-dim-val]");
    var apply = function () {
      var v = parseInt(slider.value, 10);
      var dim = part(dimScreen, "[data-dim]");
      if (dim) dim.style.opacity = (v / 100 * 0.92).toFixed(3);
      if (dimVal) dimVal.textContent = v + "%";
      slider.style.setProperty("--fill", v + "%");
    };
    slider.addEventListener("input", apply);
    apply();
  }

  /* ---------- Color Comfort: picker → screen tint ---------- */
  var TINTS = {
    neutral: { rgb: "0,0,0", a: 0 },
    warm:    { rgb: "255,150,44", a: 0.5 },
    red:     { rgb: "255,34,0", a: 0.62 }
  };
  var colorGroup = document.querySelector("[data-color-group]");
  if (colorGroup) {
    var colorScreen = screenOf(colorGroup);
    var tint = part(colorScreen, "[data-tint]");
    var btns = Array.prototype.slice.call(colorGroup.querySelectorAll("[data-tint-mode]"));
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var mode = b.getAttribute("data-tint-mode");
        btns.forEach(function (x) { x.classList.toggle("is-on", x === b); });
        var t = TINTS[mode] || TINTS.neutral;
        if (tint) { tint.style.background = "rgb(" + t.rgb + ")"; tint.style.opacity = t.a; }
      });
    });
  }

  /* ---------- Sleep Timer: start → fade screen to black ---------- */
  var timerBtn = document.querySelector("[data-timer-start]");
  if (timerBtn) {
    var tScreen = screenOf(timerBtn);
    var tBlack = part(tScreen, "[data-black]");
    var tLabel = timerBtn.closest(".feat").querySelector("[data-timer-label]");
    var FADE = 5000;
    var tState = "idle"; // idle | fading | asleep
    var toIdle = function () {
      tState = "idle";
      tBlack.classList.remove("is-on", "is-arming");
      timerBtn.textContent = "Start timer";
      if (tLabel) tLabel.textContent = "Sets a 45-minute timer";
    };
    timerBtn.addEventListener("click", function () {
      if (tState !== "idle") { toIdle(); return; }
      tState = "fading";
      tBlack.style.setProperty("--fade", FADE + "ms");
      tBlack.classList.add("is-arming", "is-on");
      timerBtn.textContent = "Cancel";
      if (tLabel) tLabel.textContent = "Fading to black…";
      clearTimeout(timerBtn._t);
      timerBtn._t = setTimeout(function () {
        tState = "asleep";
        if (tLabel) tLabel.textContent = "Asleep · tap the screen to wake";
      }, FADE);
    });
    if (tBlack) tBlack.addEventListener("click", function () { if (tState !== "idle") toIdle(); });
  }

  /* ---------- Sleep Now: button → instant blackout ---------- */
  var nowBtn = document.querySelector("[data-now-toggle]");
  if (nowBtn) {
    var nScreen = screenOf(nowBtn);
    var nBlack = part(nScreen, "[data-black]");
    var asleep = false;
    var setNow = function (on) {
      asleep = on;
      nBlack.classList.toggle("is-on", on);
      nBlack.classList.remove("is-arming");
      nowBtn.textContent = on ? "Wake" : "Sleep now";
    };
    nowBtn.addEventListener("click", function () { setNow(!asleep); });
    if (nBlack) nBlack.addEventListener("click", function () { if (asleep) setNow(false); });
  }
})();
