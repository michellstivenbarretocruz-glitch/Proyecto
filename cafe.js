/* =====================================================
   CAFETERÍA — imagen de fondo + objetos interactivos
   📅 calendario · 🎵 rocola · 🌙 luna · ✉️ carta
   Los textos se editan directamente en index.html
===================================================== */
(() => {
  "use strict";

  const $ = sel => document.querySelector(sel);

  const cafe = $("#cafe");
  const stage = $("#cafeStage");
  const overlay = $("#overlay");
  const layerClose = $("#layerClose");
  const hint = $("#cafeHint");
  const hotspots = document.querySelectorAll(".hotspot");

  const layers = {
    calendar: $("#panel-calendar"),
    music: $("#panel-music"),
    moon: $("#panel-moon"),
    letter: $("#panel-letter")
  };

  const seen = new Set();
  let current = null;
  let hideTimer = null;

  /* ---------- abrir / cerrar capas ---------- */

  function openLayer(key) {
    clearTimeout(hideTimer);
    Object.values(layers).forEach(l => (l.hidden = true));

    current = key;
    layers[key].hidden = false;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("open"));

    cafe.classList.toggle("moon-on", key === "moon");

    if (key === "calendar") loadSky();
    if (key === "music") startSongOnce();
    if (key === "letter") resetLetter();
  }

  function closeLayer() {
    if (!current) return;
    current = null;
    overlay.classList.remove("open");
    cafe.classList.remove("moon-on");
    resetLetter();
    hideTimer = setTimeout(() => {
      overlay.hidden = true;
      Object.values(layers).forEach(l => (l.hidden = true));
    }, 400);
  }

  hotspots.forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      btn.classList.add("seen");
      hint.classList.add("gone");

      const before = seen.size;
      seen.add(key);
      openLayer(key);

      if (before < 4 && seen.size === 4) {
        // Punto de enganche para el final de la historia
        document.dispatchEvent(new CustomEvent("cafe:complete"));
      }
    });
  });

  layerClose.addEventListener("click", closeLayer);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeLayer(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeLayer(); });

  /* ---------- 📅 cielo del calendario ---------- */

  const skyImg = $("#skyImg");
  const skyCanvas = $("#skyFallback");
  let skyLoaded = false;

  function drawPlaceholderSky() {
    const g = skyCanvas.getContext("2d");
    const w = skyCanvas.width, h = skyCanvas.height;
    let seed = 42;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#050716");
    grad.addColorStop(1, "#1a1436");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    for (let i = 0; i < 110; i++) {
      const s = rnd() > 0.9 ? 2 : 1;
      g.fillStyle = `rgba(255,248,224,${0.35 + rnd() * 0.65})`;
      g.fillRect(Math.floor(rnd() * w), Math.floor(rnd() * h), s, s);
    }
    // una constelación de ejemplo
    const pts = [[60, 60], [95, 45], [130, 70], [160, 55], [185, 95]];
    g.strokeStyle = "rgba(255,233,168,0.35)";
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
    g.fillStyle = "#ffe9a8";
    pts.forEach(([x, y]) => g.fillRect(x - 1, y - 1, 3, 3));

    g.fillStyle = "rgba(245,233,213,0.75)";
    g.font = "italic 11px Georgia, serif";
    g.textAlign = "center";
    g.fillText("Aquí va el cielo de esa noche", w / 2, h - 52);
    g.font = "10px Georgia, serif";
    g.fillStyle = "rgba(245,233,213,0.5)";
    g.fillText("(assets/estrellas.jpg)", w / 2, h - 38);
  }

  function loadSky() {
    if (skyLoaded) return;
    skyLoaded = true;
    drawPlaceholderSky();
    skyImg.addEventListener("load", () => {
      skyImg.hidden = false;
      skyCanvas.hidden = true;
    });
    skyImg.src = "assets/estrellas.jpg";
  }

  /* ---------- 🎵 rocola ---------- */

  const song = $("#song");
  const playBtn = $("#playBtn");
  const songBar = $("#songBar");
  const songFill = $("#songFill");
  const songTime = $("#songTime");
  const songMissing = $("#songMissing");
  let firstPlayTried = false;
  let noteTimer = null;

  const fmt = s => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  function setPlaying(p) {
    cafe.classList.toggle("playing", p);
    playBtn.textContent = p ? "❚❚" : "▶";
    playBtn.setAttribute("aria-label", p ? "Pausar" : "Reproducir");
    clearInterval(noteTimer);
    if (p) {
      spawnNote();
      noteTimer = setInterval(spawnNote, 1000);
    }
  }

  // notas musicales que suben desde la rocola
  function spawnNote() {
    const n = document.createElement("span");
    n.className = "float-note";
    n.textContent = Math.random() > 0.5 ? "♪" : "♫";
    n.style.left = `${(270 + Math.random() * 50) / 1024 * 100}%`;
    n.style.top = `${(185 / 572) * 100}%`;
    n.style.setProperty("--dx", `${Math.round(Math.random() * 36 - 8)}px`);
    stage.appendChild(n);
    setTimeout(() => n.remove(), 3500);
  }

  function togglePlay() {
    if (song.paused) song.play().catch(() => { songMissing.hidden = false; });
    else song.pause();
  }

  function startSongOnce() {
    if (firstPlayTried) return;
    firstPlayTried = true;
    song.play().catch(() => { /* si falla, queda el botón de play */ });
  }

  song.addEventListener("play", () => { songMissing.hidden = true; setPlaying(true); });
  song.addEventListener("pause", () => setPlaying(false));
  song.addEventListener("error", () => { songMissing.hidden = false; setPlaying(false); });
  song.addEventListener("timeupdate", () => {
    const pct = song.duration ? (song.currentTime / song.duration) * 100 : 0;
    songFill.style.width = `${pct}%`;
    songTime.textContent = fmt(song.currentTime);
  });
  playBtn.addEventListener("click", togglePlay);
  songBar.addEventListener("click", e => {
    if (!song.duration) return;
    const r = songBar.getBoundingClientRect();
    song.currentTime = ((e.clientX - r.left) / r.width) * song.duration;
  });

  /* ---------- ✉️ carta ---------- */

  const envelope = $("#envelope");
  const letterHint = $("#letterHint");
  let letterStage = 0;
  let letterTimers = [];

  function resetLetter() {
    letterTimers.forEach(clearTimeout);
    letterTimers = [];
    letterStage = 0;
    envelope.classList.remove("opened", "out", "reading");
    letterHint.hidden = false;
    envelope.setAttribute("tabindex", "0");
    envelope.setAttribute("aria-label", "Abrir la carta");
  }

  function openLetter() {
    if (letterStage !== 0) return;
    letterStage = 1;
    letterHint.hidden = true;

    // 1) se abre la solapa
    envelope.classList.add("opened");
    // 2) la carta sale del sobre
    letterTimers.push(setTimeout(() => envelope.classList.add("out"), 900));
    // 3) la carta crece para leerse
    letterTimers.push(setTimeout(() => {
      envelope.classList.add("reading");
      envelope.removeAttribute("tabindex");
      envelope.setAttribute("aria-label", "Carta abierta");
      letterStage = 2;
    }, 2300));
  }

  envelope.addEventListener("click", openLetter);
  envelope.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLetter(); }
  });

  /* ---------- API pública ---------- */
  window.Cafe = { start() {}, stop() {} };
})();