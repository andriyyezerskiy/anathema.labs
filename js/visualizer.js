/* ============================================================
   Anathema Labs — Spectra: a generative visualizer.

   A standalone visual piece (independent of the music player). It runs
   a set of self-contained "scenes" (states); switch between them with
   the control in the readout bar. New scenes just get pushed onto the
   SCENES array below.

     Scene 1 — "Classical": animated geometric shapes & colour, a slow
               Bauhaus-ish composition.

   Public surface (used by app.js):
     AnathemaViz.mount(container)  build the canvas + start the loop
     AnathemaViz.unmount()         stop the loop + tear the UI down

   Classic script (no modules) to match the rest of the site.
   ============================================================ */
(function () {
  "use strict";

  var host = null, canvas = null, ctx = null, modeEl = null;
  var raf = 0, dpr = 1, cw = 0, ch = 0, cur = 0;

  /* ---- small drawing helpers (work in CSS pixels) ---- */
  function disc(cx, cy, r, color) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  }
  function ring(cx, cy, r, lw, color) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.stroke();
  }
  function rect(cx, cy, w, h, rot, color) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.fillStyle = color; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.restore();
  }
  function triangle(cx, cy, size, rot, color) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.beginPath();
    for (var i = 0; i < 3; i++) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / 3;
      ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
    }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }
  function line(x1, y1, x2, y2, lw, color) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.strokeStyle = color; ctx.stroke();
  }

  /* ============================================================
     SCENES — each { name, draw(t, W, H) }. t is seconds (continuous).
     ============================================================ */
  var SCENES = [
    {
      name: "Classical",
      draw: function (t, W, H) {
        var s = Math.min(W, H);
        /* warm off-white canvas */
        ctx.fillStyle = "#ece3d2";
        ctx.fillRect(0, 0, W, H);

        /* black vertical bar, behind everything, breathing a touch */
        rect(W * 0.52, H * 0.5, s * 0.055, s * 0.78, Math.sin(t * 0.25) * 0.12, "#17150f");

        /* ultramarine circle — the anchor, drifting + pulsing */
        disc(
          W * 0.35 + Math.sin(t * 0.4) * s * 0.02,
          H * 0.46 + Math.cos(t * 0.5) * s * 0.03,
          s * 0.185 * (1 + 0.035 * Math.sin(t * 0.7)),
          "#1f2c9c"
        );

        /* orange triangle, rotating slowly */
        triangle(W * 0.71, H * 0.33 + Math.sin(t * 0.6) * s * 0.02, s * 0.16, t * 0.3, "#ff5b04");

        /* red square, counter-rotating */
        rect(W * 0.60, H * 0.68, s * 0.15, s * 0.15, -t * 0.35, "#d0392a");

        /* mustard circle, orbiting */
        disc(
          W * 0.30 + Math.cos(t * 0.7) * s * 0.07,
          H * 0.71 + Math.sin(t * 0.7) * s * 0.07,
          s * 0.055, "#f0b21f"
        );

        /* black ring, gently pulsing */
        ring(W * 0.80, H * 0.70, s * (0.11 + 0.012 * Math.sin(t * 0.9)), s * 0.017, "#17150f");

        /* a thin ink line sweeping across the composition */
        line(
          W * 0.08, H * 0.22 + Math.sin(t * 0.45) * s * 0.05,
          W * 0.92, H * 0.82 + Math.cos(t * 0.4) * s * 0.05,
          s * 0.006, "#17150f"
        );
      }
    }
  ];

  function sizeCanvas() {
    if (!canvas) return;
    var r = canvas.getBoundingClientRect();
    cw = Math.max(1, r.width); ch = Math.max(1, r.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
  }
  var onResize = function () { sizeCanvas(); };

  function frame(ts) {
    if (!canvas || !document.contains(canvas)) { stop(); return; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);  /* draw in CSS pixels */
    SCENES[cur].draw(ts * 0.001, cw, ch);
    raf = requestAnimationFrame(frame);
  }

  function setScene(i) {
    cur = ((i % SCENES.length) + SCENES.length) % SCENES.length;
    if (modeEl) {
      modeEl.textContent = SCENES.length > 1
        ? SCENES[cur].name + "  " + (cur + 1) + "/" + SCENES.length
        : SCENES[cur].name;
    }
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    window.removeEventListener("resize", onResize);
  }

  window.AnathemaViz = {
    mount: function (container) {
      this.unmount();
      host = container;
      host.innerHTML =
        '<div class="viz">' +
          '<canvas class="viz__canvas"></canvas>' +
          '<div class="viz__readout">' +
            '<span class="viz__mode"></span>' +
            '<button class="viz__next" type="button" aria-label="Next state">state ›</button>' +
          "</div>" +
        "</div>";
      canvas = host.querySelector(".viz__canvas");
      ctx = canvas.getContext("2d");
      modeEl = host.querySelector(".viz__mode");
      host.querySelector(".viz__next").addEventListener("click", function () { setScene(cur + 1); });
      cur = 0; setScene(0);
      sizeCanvas();
      window.addEventListener("resize", onResize);
      raf = requestAnimationFrame(frame);
    },
    unmount: function () {
      stop();
      if (host) host.innerHTML = "";
      host = canvas = ctx = modeEl = null;
    }
  };
})();
