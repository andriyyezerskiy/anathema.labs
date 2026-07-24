/* ============================================================
   Anathema Labs — logo draw-on / draw-off effect

   A MIX of two ideas:
     • the real wordmark ("Anathema" in Garamond/orange + "Labs" in
       Grotesk/ink) rendered crisply — the resting / hold state;
     • a fine grid of small ascii characters, masked to the exact
       letter shapes, used for the transitions.

   The ascii field is alive: every cell keeps twinkling to fresh
   characters on its own staggered rhythm, and a slow brightness wave
   drifts across the letters. One loop: the logo scrambles on (draw
   on), lingers as living ascii, resolves into the real fonts, holds,
   then dissolves back into ascii and clears (draw off). Autoloops,
   centered, behind the windows, non-interactive.

   Vanilla, no modules. Driven by a timer (not rAF, which the pane
   suspends when unfocused). Desktop layout only — the host lives
   inside #desktop, hidden below 900px.
   ============================================================ */
(function () {
  "use strict";

  var host = document.getElementById("logoFx");
  if (!host) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.createElement("canvas");
  canvas.className = "logo-fx__canvas";
  host.appendChild(canvas);
  var ctx = canvas.getContext("2d");

  /* Offscreen: the real wordmark. Doubles as the mask (shape + colour)
     and as the crisp image shown during the hold. */
  var mask = document.createElement("canvas");
  var mctx = mask.getContext("2d", { willReadFrequently: true });

  var CELL = 5;         /* grid spacing (css px) — smaller = finer ascii */
  var GLYPH = 7;        /* ascii font size */
  var POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\*+=<>#%&:.";
  function rnd() { return POOL.charAt((Math.random() * POOL.length) | 0); }
  function cssVar(n, f) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    return v || f;
  }

  /* ---------- Timeline (ms) ---------- */
  var SWEEP = 860;        /* draw sweeps across the width */
  var SCRAMBLE = 300;     /* per-cell churn before it settles */
  var TICK = 42;          /* fast character swap while scrambling */
  var SHIMMER_MIN = 150;  /* settled cells re-roll on a random */
  var SHIMMER_MAX = 780;  /* interval in this range (the twinkle) */
  var ASCII_HOLD = 780;   /* living-ascii dwell before/after resolving */
  var FADE = 220;         /* crossfade between ascii and the real fonts */
  var HOLD = 1700;        /* crisp logo dwell time */
  var PAUSE = 560;        /* blank beat before looping */

  var A, AH, B, C, D, DH, EE, LOOP;
  var cells = [], W = 0, H = 0, dpr = 1;

  function build() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    var vw = window.innerWidth;
    var anaSize = Math.max(46, Math.min(130, vw * 0.09));
    var labsSize = anaSize * 0.78;
    var orange = cssVar("--orange", "#ff5b04");
    var ink = cssVar("--black", "#0b0b0c");

    var anaFont = '500 ' + anaSize + 'px "EB Garamond", Garamond, serif';
    var labsFont = '600 ' + labsSize + 'px "Space Grotesk", system-ui, sans-serif';

    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.font = anaFont; mctx.letterSpacing = "0px";
    var anaW = mctx.measureText("Anathema").width;
    mctx.font = labsFont;
    var labsW = mctx.measureText("Labs").width;

    var gap = anaSize * 0.16;
    var pad = anaSize * 0.42;
    W = Math.ceil(anaW + gap + labsW + pad * 2);
    H = Math.ceil(anaSize * 1.3 + pad);
    var baseline = pad + anaSize * 0.92;

    mask.width = canvas.width = Math.round(W * dpr);
    mask.height = canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    mctx.clearRect(0, 0, W, H);
    mctx.textBaseline = "alphabetic";
    mctx.fillStyle = orange;
    mctx.font = anaFont;
    mctx.fillText("Anathema", pad, baseline);
    mctx.fillStyle = ink;
    mctx.font = labsFont;
    mctx.fillText("Labs", pad + anaW + gap, baseline);

    /* Sample the mask on a grid; keep cells that fall on the ink. */
    var pw = mask.width;
    var data;
    try { data = mctx.getImageData(0, 0, mask.width, mask.height).data; }
    catch (err) { data = null; }
    cells = [];
    if (data) {
      for (var y = CELL / 2; y < H; y += CELL) {
        for (var x = CELL / 2; x < W; x += CELL) {
          var px = Math.min(pw - 1, Math.floor(x * dpr));
          var py = Math.min(mask.height - 1, Math.floor(y * dpr));
          var i = (py * pw + px) * 4;
          if (data[i + 3] > 95) {
            cells.push({
              x: x, y: y,
              r: data[i], g: data[i + 1], b: data[i + 2],
              act: (x / W) * SWEEP,
              ch: rnd(),
              tick: 0,          /* last fast-scramble swap */
              next: 0           /* next twinkle swap (settled) */
            });
          }
        }
      }
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    A = SWEEP + SCRAMBLE;          /* draw-on complete -> full ascii   */
    AH = A + ASCII_HOLD;           /* living-ascii dwell               */
    B = AH + FADE;                 /* ascii -> real fonts              */
    C = B + HOLD;                  /* end of clean hold                */
    D = C + FADE;                  /* real fonts -> ascii              */
    DH = D + ASCII_HOLD;           /* living-ascii dwell               */
    EE = DH + SWEEP + SCRAMBLE;    /* draw-off complete                */
    LOOP = EE + PAUSE;
  }

  /* ---------- Painters ---------- */
  function setFont() {
    ctx.font = GLYPH + 'px "Space Mono", ui-monospace, monospace';
  }
  /* Keep a cell's character churning: fast during a scramble, a lazy
     staggered twinkle once it has settled. */
  function churn(c, now, fast) {
    if (fast) {
      if (now - c.tick >= TICK) { c.tick = now; c.ch = rnd(); c.next = 0; }
    } else if (now >= c.next) {
      c.ch = rnd();
      c.next = now + SHIMMER_MIN + Math.random() * (SHIMMER_MAX - SHIMMER_MIN);
    }
  }
  /* A soft brightness wave drifting left-to-right over the settled field. */
  function wave(c, now) {
    return 0.68 + 0.32 * (0.5 + 0.5 * Math.sin(c.x * 0.028 - now * 0.0045));
  }
  function put(c, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgb(" + c.r + "," + c.g + "," + c.b + ")";
    ctx.fillText(c.ch, c.x, c.y);
  }

  function clean(alpha) {                 /* crisp real-font wordmark */
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(mask, 0, 0);
    ctx.restore();
  }
  function asciiSweep(e, drawingOn, now) {  /* scramble in (or out) by column */
    setFont();
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      var start = c.act;
      var state; /* 0 blank, 1 scramble, 2 on */
      if (drawingOn) state = e < start ? 0 : (e < start + SCRAMBLE ? 1 : 2);
      else state = e < start ? 2 : (e < start + SCRAMBLE ? 1 : 0);
      if (state === 0) continue;
      if (state === 1) { churn(c, now, true); put(c, 0.72); }
      else { churn(c, now, false); put(c, wave(c, now)); }
    }
    ctx.globalAlpha = 1;
  }
  function asciiFull(mul, now) {           /* whole field alive, faded by mul */
    setFont();
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      churn(c, now, false);
      put(c, wave(c, now) * mul);
    }
    ctx.globalAlpha = 1;
  }

  function render(e, now) {
    ctx.clearRect(0, 0, W, H);
    if (!cells.length) { clean(1); return; }   /* graceful fallback */

    if (e < A) asciiSweep(e, true, now);
    else if (e < AH) asciiFull(1, now);
    else if (e < B) { var f = (e - AH) / FADE; asciiFull(1 - f, now); clean(f); }
    else if (e < C) clean(1);
    else if (e < D) { var g = (e - C) / FADE; clean(1 - g); asciiFull(g, now); }
    else if (e < DH) asciiFull(1, now);
    else if (e < EE) asciiSweep(e - DH, false, now);
    /* else: PAUSE — leave cleared */
  }

  /* ---------- Driver (timer, so it survives an unfocused pane) ---------- */
  var timer = null, t0 = 0;
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function start() {
    build();
    stop();
    if (reduce || !cells.length) { render(B + 1, Date.now()); return; } /* static */
    t0 = Date.now();
    timer = setInterval(function () {
      var now = Date.now();
      render((now - t0) % LOOP, now);
    }, 33);
  }

  var rebuildTimer = null;
  function scheduleRebuild() {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(start, 180);
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  else start();
  window.addEventListener("resize", scheduleRebuild);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", scheduleRebuild);
})();
