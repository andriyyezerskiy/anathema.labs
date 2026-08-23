/* ============================================================
   Anathema Labs — Spectra: a generative visualizer.

   A standalone visual piece (independent of the music player). It runs
   a set of self-contained "scenes" (states); switch between them with
   the control in the readout bar. New scenes just get pushed onto the
   SCENES array below — each is { name, draw(t,W,H), init?(W,H) } and is
   called with `this` bound to the scene, so a scene can keep its own
   state (see "Flow Field").

     1 — "ASCII Flow"  : a colour-cycling ASCII plasma field.
     2 — "Roman Temple": a rotating 3D temple built from brand glyphs.
     3 — "Flow Field"  : particles chasing a noise field, leaving trails.

   Public surface (used by app.js):
     AnathemaViz.mount(container)  build the canvas + start the loop
     AnathemaViz.unmount()         stop the loop + tear the UI down

   Classic script (no modules) to match the rest of the site.
   ============================================================ */
(function () {
  "use strict";

  var host = null, canvas = null, ctx = null, modeEl = null;
  var raf = 0, dpr = 1, cw = 0, ch = 0, cur = 0;

  function disc(cx, cy, r, color) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (color) ctx.fillStyle = color; ctx.fill();
  }

  /* ============================================================
     SCENES
     ============================================================ */
  var SCENES = [
    {
      name: "ASCII Flow",
      draw: function (t, W, H) {
        ctx.fillStyle = "#0a0b0e"; ctx.fillRect(0, 0, W, H);
        var cell = 11, fs = 13;
        ctx.font = 'bold ' + fs + 'px "Share Tech Mono", ui-monospace, monospace';
        ctx.textBaseline = "top";
        var ramp = "anathemalabs";                        /* only these glyphs */
        var cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
        var mcx = cols / 2, mcy = rows / 2;
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            var nx = c * 0.20, ny = r * 0.30;
            var dx = c - mcx, dy = r - mcy;
            var v = Math.sin(nx + t * 1.2) + Math.sin(ny + t * 0.9)
                  + Math.sin((nx + ny) * 0.7 + t * 0.7)
                  + Math.sin(Math.sqrt(dx * dx + dy * dy) * 0.30 - t * 2.0);
            var n = (v + 4) / 8;                            /* 0..1 */
            var idx = Math.max(0, Math.min(ramp.length - 1, Math.floor(n * ramp.length)));
            var chr = ramp.charAt(idx);
            ctx.fillStyle = "hsl(" + ((n * 200 + t * 50) % 360) + ","
              + (60 + n * 30) + "%," + (34 + n * 42) + "%)";
            ctx.fillText(chr, c * cell, r * cell);
          }
        }
      }
    },
    {
      /* A Roman temple as a rotating cloud of "anathemalabs" glyphs — a
         stepped base, a peripteral colonnade, the entablature, and a gable
         roof with pediments front and back. */
      name: "Roman Temple",
      init: function () {
        var P = [];
        function seg(ax, ay, az, bx, by, bz, n) {
          for (var i = 0; i < n; i++) {
            var u = n > 1 ? i / (n - 1) : 0;
            P.push([ax + (bx - ax) * u, ay + (by - ay) * u, az + (bz - az) * u]);
          }
        }
        function rectXZ(y, hx, hz, n) {
          seg(-hx, y, -hz, hx, y, -hz, n); seg(hx, y, -hz, hx, y, hz, n);
          seg(hx, y, hz, -hx, y, hz, n);   seg(-hx, y, hz, -hx, y, -hz, n);
        }
        var baseY = -1.6, colTop = 1.2, entTop = 1.5, apexY = 2.6;
        rectXZ(baseY - 0.5, 3.6, 2.6, 9);            /* stepped stylobate */
        rectXZ(baseY - 0.25, 3.5, 2.5, 9);
        rectXZ(baseY, 3.4, 2.4, 9);
        var xs = [-3, -2, -1, 0, 1, 2, 3];            /* front + back columns */
        for (var a = 0; a < xs.length; a++) {
          seg(xs[a], baseY, -2, xs[a], colTop, -2, 8);
          seg(xs[a], baseY, 2, xs[a], colTop, 2, 8);
        }
        var zs = [-1, 0, 1];                           /* side columns */
        for (var b = 0; b < zs.length; b++) {
          seg(-3, baseY, zs[b], -3, colTop, zs[b], 8);
          seg(3, baseY, zs[b], 3, colTop, zs[b], 8);
        }
        rectXZ(colTop, 3.3, 2.3, 9);                  /* entablature */
        rectXZ(entTop, 3.3, 2.3, 9);
        seg(-3.3, entTop, -2.3, 0, apexY, -2.3, 8);   /* front pediment */
        seg(3.3, entTop, -2.3, 0, apexY, -2.3, 8);
        seg(-3.3, entTop, 2.3, 0, apexY, 2.3, 8);     /* back pediment */
        seg(3.3, entTop, 2.3, 0, apexY, 2.3, 8);
        seg(0, apexY, -2.3, 0, apexY, 2.3, 12);        /* roof ridge */
        seg(-3.3, entTop, -2.3, -3.3, entTop, 2.3, 10);/* eaves */
        seg(3.3, entTop, -2.3, 3.3, entTop, 2.3, 10);
        this.P = P;
      },
      draw: function (t, W, H) {
        if (!this.P) this.init();
        ctx.fillStyle = "#08090d"; ctx.fillRect(0, 0, W, H);
        var s = Math.min(W, H), scale = s * 0.15, focal = s * 1.6;
        var LETTERS = "anathemalabs";
        var aY = t * 0.4, cY = Math.cos(aY), sY = Math.sin(aY);
        var tX = -0.32, cX = Math.cos(tX), sX = Math.sin(tX);   /* fixed 3/4 view tilt */
        var pts = [];
        for (var i = 0; i < this.P.length; i++) {
          var x0 = this.P[i][0] * scale, y0 = (this.P[i][1] - 0.25) * scale, z0 = this.P[i][2] * scale;
          var x1 = x0 * cY + z0 * sY, z1 = -x0 * sY + z0 * cY;
          var y2 = y0 * cX - z1 * sX, z2 = y0 * sX + z1 * cX;
          var k = focal / (focal + z2);
          pts.push({ x: W / 2 + x1 * k, y: H * 0.54 - y2 * k, k: k, i: i });
        }
        pts.sort(function (p, q) { return q.k - p.k; });        /* far first */
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        for (var j = 0; j < pts.length; j++) {
          var p = pts[j];
          var near = Math.min(1, Math.max(0, (p.k - 0.82) / 0.38));
          var fs = Math.max(8, Math.round(13 * p.k));
          ctx.font = 'bold ' + fs + 'px "Share Tech Mono", ui-monospace, monospace';
          ctx.globalAlpha = 0.45 + 0.55 * near;
          ctx.fillStyle = "hsl(36,80%," + (42 + 34 * near) + "%)";
          ctx.fillText(LETTERS.charAt(p.i % LETTERS.length), p.x, p.y);
        }
        ctx.globalAlpha = 1;
      }
    },
    {
      name: "Flow Field",
      init: function (W, H) {
        this.p = [];
        var count = Math.min(460, Math.round(W * H / 560));
        for (var i = 0; i < count; i++) {
          this.p.push({ x: Math.random() * W, y: Math.random() * H, life: Math.random() * 200 });
        }
      },
      draw: function (t, W, H) {
        if (!this.p) this.init(W, H);
        ctx.fillStyle = "rgba(8,8,12,0.085)"; ctx.fillRect(0, 0, W, H);   /* trails */
        var ps = this.p;
        for (var i = 0; i < ps.length; i++) {
          var pt = ps[i];
          var a = (Math.sin(pt.x * 0.008 + t * 0.4)
                 + Math.cos(pt.y * 0.008 - t * 0.3)
                 + Math.sin((pt.x + pt.y) * 0.004 + t)) * Math.PI;
          var nx = pt.x + Math.cos(a) * 1.5, ny = pt.y + Math.sin(a) * 1.5;
          var hue = (a * 40 + t * 30) % 360; if (hue < 0) hue += 360;
          ctx.strokeStyle = "hsla(" + hue + ",85%,62%,0.9)";
          ctx.lineWidth = 1.3; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(nx, ny); ctx.stroke();
          pt.x = nx; pt.y = ny;
          if (--pt.life < 0 || nx < 0 || nx > W || ny < 0 || ny > H) {
            pt.x = Math.random() * W; pt.y = Math.random() * H; pt.life = 120 + Math.random() * 200;
          }
        }
      }
    },
    {
      /* True metaballs: a scalar field Σ r²/d² thresholded into solid liquid
         bodies. Rendered on a low-res buffer and upscaled with smoothing so
         the surfaces read as gooey merging blobs; colours blend where they
         meet, radii morph, and a bright rim gives a wet, glossy edge. */
      name: "Metaballs",
      init: function () {
        var cols = [[255, 60, 170], [70, 200, 255], [255, 140, 40],
                    [150, 240, 70], [180, 90, 255], [60, 150, 255]];
        this.b = [];
        for (var i = 0; i < cols.length; i++) {
          this.b.push({
            cr: cols[i][0], cg: cols[i][1], cb: cols[i][2],
            px: Math.random() * 6.28, py: Math.random() * 6.28,
            sx: 0.22 + Math.random() * 0.30, sy: 0.22 + Math.random() * 0.30,
            rs: 0.5 + Math.random() * 0.9,
            r0: 0.14 + Math.random() * 0.07
          });
        }
        this.off = null;                                 /* force buffer rebuild */
      },
      draw: function (t, W, H) {
        if (!this.b) this.init();
        var step = 3;
        var gw = Math.max(1, Math.ceil(W / step)), gh = Math.max(1, Math.ceil(H / step));
        if (!this.off || this.gw !== gw || this.gh !== gh) {
          this.off = document.createElement("canvas");
          this.off.width = gw; this.off.height = gh;
          this.octx = this.off.getContext("2d");
          this.img = this.octx.createImageData(gw, gh);
          this.gw = gw; this.gh = gh;
        }

        var s = Math.min(W, H), balls = this.b, k;
        for (k = 0; k < balls.length; k++) {
          var b = balls[k];
          b.x = W * 0.5 + Math.sin(t * b.sx + b.px) * W * 0.32 + Math.sin(t * b.sx * 1.7 + b.px) * W * 0.11;
          b.y = H * 0.5 + Math.cos(t * b.sy + b.py) * H * 0.34 + Math.cos(t * b.sy * 1.3 + b.py) * H * 0.11;
          var rad = s * (b.r0 + 0.045 * Math.sin(t * b.rs + k));   /* morphing radius */
          b.rr = rad * rad;
        }

        var T = 1.05, data = this.img.data, idx = 0;
        for (var gy = 0; gy < gh; gy++) {
          var py = gy * step;
          for (var gx = 0; gx < gw; gx++) {
            var pxp = gx * step, fx = 0, cr = 0, cg = 0, cb = 0;
            for (k = 0; k < balls.length; k++) {
              var bl = balls[k];
              var dx = pxp - bl.x, dy = py - bl.y;
              var c = bl.rr / (dx * dx + dy * dy + 1);
              fx += c; cr += c * bl.cr; cg += c * bl.cg; cb += c * bl.cb;
            }
            if (fx >= T) {
              var inv = 1 / fx, nr = cr * inv, ng = cg * inv, nb = cb * inv;
              var over = fx - T; if (over > 1) over = 1;
              var light = 0.72 + 0.28 * Math.min(1, over * 2.5);
              nr *= light; ng *= light; nb *= light;
              var edge = over < 0.08 ? 1 - over / 0.08 : 0;   /* wet rim */
              if (edge > 0) {
                nr += (255 - nr) * 0.55 * edge;
                ng += (255 - ng) * 0.55 * edge;
                nb += (255 - nb) * 0.55 * edge;
              }
              data[idx] = nr; data[idx + 1] = ng; data[idx + 2] = nb; data[idx + 3] = 255;
            } else {
              var halo = fx > T * 0.55 ? (fx - T * 0.55) / (T * 0.45) : 0;
              data[idx] = 7 + halo * 26; data[idx + 1] = 7 + halo * 12;
              data[idx + 2] = 12 + halo * 34; data[idx + 3] = 255;
            }
            idx += 4;
          }
        }
        this.octx.putImageData(this.img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(this.off, 0, 0, W, H);
      }
    },
    {
      name: "Starfield",
      init: function (W, H) {
        this.s = [];
        var n = Math.min(340, Math.round(W * H / 900));
        for (var i = 0; i < n; i++) {
          this.s.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 0.9 + 0.1 });
        }
      },
      draw: function (t, W, H) {
        if (!this.s) this.init(W, H);
        ctx.fillStyle = "#04040a"; ctx.fillRect(0, 0, W, H);
        var cx = W * 0.5, cy = H * 0.5, F = Math.min(W, H) * 0.9;
        var speed = 0.012 + 0.009 * (0.5 + 0.5 * Math.sin(t * 0.5));   /* warp pulse */
        ctx.lineCap = "round";
        for (var i = 0; i < this.s.length; i++) {
          var st = this.s[i], pz = st.z;
          st.z -= speed;
          if (st.z <= 0.02) { st.x = Math.random() * 2 - 1; st.y = Math.random() * 2 - 1; st.z = 1; pz = 1; }
          var k = F / st.z * 0.5, pk = F / pz * 0.5;
          var b = Math.min(1, (1 - st.z) * 1.2);
          ctx.strokeStyle = "rgba(" + (200 + 55 * b) + "," + (215 + 40 * b) + ",255," + (0.28 + 0.72 * b) + ")";
          ctx.lineWidth = Math.max(0.6, b * 2.2);
          ctx.beginPath();
          ctx.moveTo(cx + st.x * pk, cy + st.y * pk);
          ctx.lineTo(cx + st.x * k, cy + st.y * k);
          ctx.stroke();
        }
      }
    },
    {
      name: "Polyhedron",
      init: function () {
        var p = (1 + Math.sqrt(5)) / 2;
        this.V = [
          [0, 1, p], [0, -1, p], [0, 1, -p], [0, -1, -p],
          [1, p, 0], [-1, p, 0], [1, -p, 0], [-1, -p, 0],
          [p, 0, 1], [-p, 0, 1], [p, 0, -1], [-p, 0, -1]
        ];
        this.E = [];                                     /* edges = vertex pairs 2 apart */
        for (var i = 0; i < this.V.length; i++) {
          for (var j = i + 1; j < this.V.length; j++) {
            var dx = this.V[i][0] - this.V[j][0], dy = this.V[i][1] - this.V[j][1], dz = this.V[i][2] - this.V[j][2];
            if (Math.abs(dx * dx + dy * dy + dz * dz - 4) < 0.1) this.E.push([i, j]);
          }
        }
      },
      draw: function (t, W, H) {
        if (!this.V) this.init();
        ctx.fillStyle = "#08090d"; ctx.fillRect(0, 0, W, H);
        var cx = W / 2, cy = H / 2, s = Math.min(W, H);
        var scale = s * 0.22, focal = s * 1.3, range = scale * 1.7;
        var A = t * 0.5, B = t * 0.33;
        var cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
        var P = [];
        for (var i = 0; i < this.V.length; i++) {
          var x = this.V[i][0] * scale, y = this.V[i][1] * scale, z = this.V[i][2] * scale;
          var y1 = y * cA - z * sA, z1 = y * sA + z * cA;
          var x1 = x * cB + z1 * sB, z2 = -x * sB + z1 * cB;
          var k = focal / (focal + z2);
          P.push({ x: cx + x1 * k, y: cy + y1 * k, z: z2 });
        }
        var hueBase = (t * 30) % 360;
        for (var e = 0; e < this.E.length; e++) {
          var a = P[this.E[e][0]], bb = P[this.E[e][1]];
          var near = 1 - Math.min(1, Math.max(0, ((a.z + bb.z) / 2 + range) / (2 * range)));
          ctx.strokeStyle = "hsla(" + ((hueBase + e * 12) % 360) + ",85%,62%," + (0.35 + 0.6 * near) + ")";
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(bb.x, bb.y); ctx.stroke();
        }
        for (var q = 0; q < P.length; q++) disc(P[q].x, P[q].y, 2.2, "#fff");
      }
    },
    {
      /* GeoCities "under construction" globe — a rotating lat/long wireframe. */
      name: "Wireframe Globe",
      draw: function (t, W, H) {
        ctx.fillStyle = "#07080c"; ctx.fillRect(0, 0, W, H);
        var cx = W / 2, cy = H / 2, s = Math.min(W, H), R = s * 0.34, focal = s * 1.7;
        var aY = t * 0.35, cY = Math.cos(aY), sY = Math.sin(aY);
        var tX = -0.35, cX = Math.cos(tX), sX = Math.sin(tX);
        function proj(lat, lon) {
          var x = R * Math.cos(lat) * Math.cos(lon), y = R * Math.sin(lat), z = R * Math.cos(lat) * Math.sin(lon);
          var x1 = x * cY + z * sY, z1 = -x * sY + z * cY;
          var y2 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
          var k = focal / (focal + z2);
          return { x: cx + x1 * k, y: cy - y2 * k, z: z2 };
        }
        function polyline(get, n, close) {
          var prev = get(0), lim = close ? n : n - 1;
          for (var i = 1; i <= lim; i++) {
            var curP = get(i % n), az = (prev.z + curP.z) / 2;
            var a = Math.max(0.12, Math.min(0.9, 0.15 + 0.75 * ((R - az) / (2 * R))));
            ctx.strokeStyle = "rgba(255,120,40," + a + ")"; ctx.lineWidth = 1.1;
            ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(curP.x, curP.y); ctx.stroke();
            prev = curP;
          }
        }
        for (var li = 1; li < 7; li++) {
          (function (lat) { polyline(function (i) { return proj(lat, i / 48 * Math.PI * 2); }, 48, true); })(-Math.PI / 2 + li * Math.PI / 7);
        }
        for (var mi = 0; mi < 12; mi++) {
          (function (lon) { polyline(function (i) { return proj(-Math.PI / 2 + i / 24 * Math.PI, lon); }, 25, false); })(mi / 12 * Math.PI * 2);
        }
      }
    },
    {
      /* The Windows "3D Pipes" screensaver — a pipe grows through a lattice,
         turning at random, then resets in a new colour. */
      name: "3D Pipes",
      init: function () { this.N = 4; this.reset(); },
      reset: function () {
        this.path = [{ x: 0, y: 0, z: 0 }];
        this.dir = { x: 1, y: 0, z: 0 };
        this.hue = Math.floor(Math.random() * 360);
        this.next = 0;
      },
      step: function () {
        var N = this.N, dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
        var head = this.path[this.path.length - 1];
        for (var tries = 0; tries < 8; tries++) {
          var d;
          if (Math.random() < 0.6) { d = this.dir; }
          else { var e = dirs[Math.floor(Math.random() * 6)]; d = { x: e[0], y: e[1], z: e[2] }; }
          var nx = head.x + d.x, ny = head.y + d.y, nz = head.z + d.z;
          if (Math.abs(nx) <= N && Math.abs(ny) <= N && Math.abs(nz) <= N) {
            this.dir = d; this.path.push({ x: nx, y: ny, z: nz }); return true;
          }
        }
        return false;
      },
      draw: function (t, W, H) {
        if (!this.path) this.init();
        if (this.next === 0) this.next = t;
        while (t > this.next) {
          if (!this.step() || this.path.length > 70) { this.reset(); this.next = t; break; }
          this.next += 0.10;
        }
        ctx.fillStyle = "#08090d"; ctx.fillRect(0, 0, W, H);
        var cx = W / 2, cy = H / 2, s = Math.min(W, H), unit = s * 0.10, focal = s * 2.2;
        var aY = t * 0.25, cY = Math.cos(aY), sY = Math.sin(aY);
        var tX = -0.5, cX = Math.cos(tX), sX = Math.sin(tX);
        function P(p) {
          var x = p.x * unit, y = p.y * unit, z = p.z * unit;
          var x1 = x * cY + z * sY, z1 = -x * sY + z * cY;
          var y2 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
          var k = focal / (focal + z2);
          return { x: cx + x1 * k, y: cy - y2 * k, k: k };
        }
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.strokeStyle = "hsl(" + this.hue + ",70%,55%)";
        for (var i = 1; i < this.path.length; i++) {
          var a = P(this.path[i - 1]), b = P(this.path[i]);
          ctx.lineWidth = Math.max(3, 9 * ((a.k + b.k) / 2));
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        ctx.fillStyle = "hsl(" + this.hue + ",70%,64%)";
        for (var j = 0; j < this.path.length; j++) { var pp = P(this.path[j]); disc(pp.x, pp.y, Math.max(2, 5 * pp.k)); }
      }
    },
    {
      /* The Win95 "Mystify" screensaver — bouncing polygons trailing ribbons. */
      name: "Mystify",
      init: function (W, H) {
        this.TR = 16; this.shapes = [];
        for (var s = 0; s < 2; s++) {
          var pts = [];
          for (var i = 0; i < 5; i++) {
            pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() * 2 - 1) * 2.3, vy: (Math.random() * 2 - 1) * 2.3 });
          }
          this.shapes.push({ pts: pts, hue: s ? 190 : 32, hist: [] });
        }
      },
      draw: function (t, W, H) {
        if (!this.shapes) this.init(W, H);
        ctx.fillStyle = "#070709"; ctx.fillRect(0, 0, W, H);
        for (var s = 0; s < this.shapes.length; s++) {
          var sh = this.shapes[s];
          for (var i = 0; i < sh.pts.length; i++) {
            var p = sh.pts[i]; p.x += p.vx; p.y += p.vy;
            if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); } if (p.x > W) { p.x = W; p.vx = -Math.abs(p.vx); }
            if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); } if (p.y > H) { p.y = H; p.vy = -Math.abs(p.vy); }
          }
          sh.hue = (sh.hue + 0.3) % 360;
          sh.hist.push(sh.pts.map(function (p) { return { x: p.x, y: p.y }; }));
          if (sh.hist.length > this.TR) sh.hist.shift();
          for (var h = 0; h < sh.hist.length; h++) {
            var frac = (h + 1) / sh.hist.length, snap = sh.hist[h];
            ctx.strokeStyle = "hsla(" + ((sh.hue + h * 4) % 360) + ",90%,60%," + (0.12 + 0.78 * frac) + ")";
            ctx.lineWidth = 1.4; ctx.beginPath();
            for (var k = 0; k < snap.length; k++) { if (k === 0) ctx.moveTo(snap[k].x, snap[k].y); else ctx.lineTo(snap[k].x, snap[k].y); }
            ctx.closePath(); ctx.stroke();
          }
        }
      }
    },
    {
      /* Conway's Game of Life — cells coloured by age; reseeds when it dies out. */
      name: "Game of Life",
      init: function (W, H) {
        this.cell = 8;
        this.cols = Math.max(4, Math.ceil(W / this.cell));
        this.rows = Math.max(4, Math.ceil(H / this.cell));
        var n = this.cols * this.rows;
        this.g = new Uint8Array(n); this.age = new Uint16Array(n);
        for (var i = 0; i < n; i++) { this.g[i] = Math.random() < 0.28 ? 1 : 0; this.age[i] = this.g[i]; }
        this.next = 0; this.pop = n;
      },
      stepLife: function () {
        var cols = this.cols, rows = this.rows, g = this.g, age = this.age, ng = new Uint8Array(cols * rows), pop = 0;
        for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
          var sum = 0;
          for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            sum += g[((y + dy + rows) % rows) * cols + ((x + dx + cols) % cols)];
          }
          var i = y * cols + x, alive = g[i];
          var na = (alive && (sum === 2 || sum === 3)) || (!alive && sum === 3) ? 1 : 0;
          ng[i] = na;
          if (na) { pop++; age[i] = alive ? Math.min(65535, age[i] + 1) : 1; } else age[i] = 0;
        }
        this.g = ng; this.pop = pop;
      },
      draw: function (t, W, H) {
        if (!this.g || this.cols !== Math.ceil(W / this.cell)) this.init(W, H);
        if (this.next === 0) this.next = t;
        if (t > this.next) {
          this.stepLife(); this.next = t + 0.09;
          if (this.pop < this.cols * this.rows * 0.02) this.init(W, H);
        }
        ctx.fillStyle = "#07080b"; ctx.fillRect(0, 0, W, H);
        var cell = this.cell, cols = this.cols;
        for (var y = 0; y < this.rows; y++) for (var x = 0; x < cols; x++) {
          var i = y * cols + x; if (!this.g[i]) continue;
          var ag = Math.min(this.age[i], 120);
          ctx.fillStyle = "hsl(" + ((28 + ag * 2) % 360) + ",85%," + (46 + Math.min(28, ag * 0.5)) + "%)";
          ctx.fillRect(x * cell, y * cell, cell - 1, cell - 1);
        }
      }
    },
    {
      /* A drifting node graph with packets travelling the links — "the network". */
      name: "Network",
      init: function (W, H) {
        this.n = []; var count = Math.min(48, Math.round(W * H / 3500));
        for (var i = 0; i < count; i++) {
          this.n.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() * 2 - 1) * 0.4, vy: (Math.random() * 2 - 1) * 0.4 });
        }
        this.pk = []; for (var p = 0; p < 7; p++) this.pk.push(this.newPacket());
      },
      newPacket: function () {
        return { a: Math.floor(Math.random() * this.n.length), b: Math.floor(Math.random() * this.n.length), t: 0, sp: 0.01 + Math.random() * 0.02 };
      },
      draw: function (t, W, H) {
        if (!this.n) this.init(W, H);
        ctx.fillStyle = "#070a10"; ctx.fillRect(0, 0, W, H);
        var s = Math.min(W, H), R2 = (s * 0.28) * (s * 0.28), nodes = this.n, i, j;
        for (i = 0; i < nodes.length; i++) {
          var p = nodes[i]; p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        }
        for (i = 0; i < nodes.length; i++) for (j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            ctx.strokeStyle = "rgba(90,180,255," + ((1 - d2 / R2) * 0.5) + ")"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
          }
        }
        for (i = 0; i < nodes.length; i++) disc(nodes[i].x, nodes[i].y, 1.8, "#dfe9ff");
        for (var k = 0; k < this.pk.length; k++) {
          var pk = this.pk[k], A = nodes[pk.a], B = nodes[pk.b];
          pk.t += pk.sp; if (pk.t >= 1) { this.pk[k] = this.newPacket(); continue; }
          var x = A.x + (B.x - A.x) * pk.t, y = A.y + (B.y - A.y) * pk.t;
          ctx.fillStyle = "#ff7a2f"; disc(x, y, 2.6);
          ctx.globalAlpha = 0.4; disc(x, y, 5.5); ctx.globalAlpha = 1;
        }
      }
    },
    {
      /* Dead-channel CRT: analogue snow, scanlines, a rolling band, and the
         occasional flash of SMPTE colour bars. */
      name: "CRT Static",
      init: function () { this.off = null; },
      draw: function (t, W, H) {
        var stepPx = 3, gw = Math.max(1, Math.ceil(W / stepPx)), gh = Math.max(1, Math.ceil(H / stepPx));
        if (!this.off || this.gw !== gw || this.gh !== gh) {
          this.off = document.createElement("canvas"); this.off.width = gw; this.off.height = gh;
          this.octx = this.off.getContext("2d"); this.img = this.octx.createImageData(gw, gh);
          this.gw = gw; this.gh = gh;
        }
        var data = this.img.data, bars = (t % 6) > 4.8, idx = 0, x, y;
        if (bars) {
          var cols = [[236, 236, 236], [236, 236, 60], [60, 236, 236], [60, 236, 60], [236, 60, 236], [236, 60, 60], [60, 60, 236]];
          for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) {
            var c = cols[Math.min(cols.length - 1, Math.floor(x / gw * cols.length))], f = Math.random() * 20 - 10;
            data[idx] = c[0] + f; data[idx + 1] = c[1] + f; data[idx + 2] = c[2] + f; data[idx + 3] = 255; idx += 4;
          }
        } else {
          for (var i = 0; i < gw * gh; i++) { var v = Math.random() * 255; data[idx] = v; data[idx + 1] = v; data[idx + 2] = v; data[idx + 3] = 255; idx += 4; }
        }
        this.octx.putImageData(this.img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.off, 0, 0, W, H);
        ctx.globalAlpha = 0.12; ctx.fillStyle = "#000";
        for (var yy = 0; yy < H; yy += 3) ctx.fillRect(0, yy, W, 1);
        ctx.globalAlpha = 1;
        var by = (t * 120) % (H + 120) - 60;
        var grd = ctx.createLinearGradient(0, by - 40, 0, by + 40);
        grd.addColorStop(0, "rgba(0,0,0,0)"); grd.addColorStop(0.5, "rgba(0,0,0,0.35)"); grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd; ctx.fillRect(0, by - 40, W, 80);
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
  var onResize = function () {
    sizeCanvas();
    if (SCENES[cur].init) SCENES[cur].init(cw, ch);
  };

  function frame(ts) {
    if (!canvas || !document.contains(canvas)) { stop(); return; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);  /* draw in CSS pixels */
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    SCENES[cur].draw(ts * 0.001, cw, ch);
    raf = requestAnimationFrame(frame);
  }

  function setScene(i) {
    cur = ((i % SCENES.length) + SCENES.length) % SCENES.length;
    var sc = SCENES[cur];
    if (sc.init) sc.init(cw, ch);
    if (ctx) {                                /* clear so trail-scenes don't inherit */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#08090d"; ctx.fillRect(0, 0, cw, ch);
    }
    if (modeEl) {
      modeEl.textContent = SCENES.length > 1
        ? sc.name + "  " + (cur + 1) + "/" + SCENES.length
        : sc.name;
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
      sizeCanvas();
      cur = 0; setScene(0);
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
