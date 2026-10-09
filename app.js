(function () {
  "use strict";

  const cfg = window.SPORTS_AUDIO_DJ_CONFIG || {};
  const STORAGE_KEY = cfg.playHistoryKey || "sports-audio-dj-plays";
  const HOUR_MS = cfg.recentPlayWindowMs ?? 60 * 60 * 1000;
  const YAML_URL = cfg.songsUrl || "songs.yaml";
  const MUSIC_WATCH_BASE =
    cfg.musicWatchBase || "https://music.youtube.com/watch";

  const board = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const titleEl = document.getElementById("title");
  const nowEl = document.getElementById("now-playing");
  let player = null;
  let apiReady = false;
  let songs = [];
  let currentSongId = null;

  function parseStart(value) {
    if (value == null || value === "") return 0;
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.floor(value));
    }
    const s = String(value).trim();
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    const parts = s.split(":").map((p) => parseInt(p, 10));
    if (parts.some((n) => Number.isNaN(n))) return 0;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }

  function formatCue(seconds) {
    if (!seconds) return "from start";
    const m = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return m ? `${m}:${String(sec).padStart(2, "0")}` : `${sec}s`;
  }

  function loadPlays() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function savePlays(plays) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plays));
  }

  function wasPlayedWithinHour(songId) {
    const t = loadPlays()[songId];
    return typeof t === "number" && Date.now() - t < HOUR_MS;
  }

  function recordPlay(songId) {
    const plays = loadPlays();
    plays[songId] = Date.now();
    savePlays(plays);
  }

  function musicAppUrl(videoId, startSeconds) {
    const base = `${MUSIC_WATCH_BASE}?v=${encodeURIComponent(videoId)}`;
    if (!startSeconds) return base;
    return `${base}&t=${startSeconds}s`;
  }

  function setStatus(msg, isError) {
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("error", !!isError);
  }

  function updateBoardColors() {
    board.querySelectorAll(".song").forEach((btn) => {
      const id = btn.dataset.songId;
      btn.classList.toggle("song--recent", wasPlayedWithinHour(id));
    });
  }

  function renderBoard() {
    board.innerHTML = "";
    songs.forEach((song) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "song";
      btn.dataset.songId = song.id;
      if (wasPlayedWithinHour(song.id)) btn.classList.add("song--recent");

      const label = document.createElement("span");
      label.textContent = song.name;

      const cue = document.createElement("span");
      cue.className = "song__cue";
      cue.textContent = formatCue(song.startSeconds);

      btn.append(label, cue);
      btn.addEventListener("click", () => playSong(song));
      btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        openInMusicApp(song);
      });

      board.appendChild(btn);
    });
  }

  function markPlaying(songId) {
    currentSongId = songId;
    board.querySelectorAll(".song").forEach((btn) => {
      btn.classList.toggle("song--playing", btn.dataset.songId === songId);
    });
  }

  function playSong(song) {
    if (!apiReady || !player) {
      setStatus("Player still loading…", false);
      return;
    }
    recordPlay(song.id);
    markPlaying(song.id);
    updateBoardColors();
    nowEl.textContent = song.name;
    setStatus(`Cue ${formatCue(song.startSeconds)}`, false);

    player.loadVideoById({
      videoId: song.video_id,
      startSeconds: song.startSeconds,
    });
    player.playVideo();
  }

  function openInMusicApp(song) {
    window.location.href = musicAppUrl(song.video_id, song.startSeconds);
  }

  function initPlayer() {
    player = new YT.Player("player", {
      height: "100%",
      width: "100%",
      playerVars: {
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          apiReady = true;
          setStatus("Tap a square to play.", false);
        },
        onError: () => {
          setStatus("Could not play that video (blocked or removed).", true);
        },
      },
    });
  }

  window.onYouTubeIframeAPIReady = function () {
    initPlayer();
  };

  async function loadSongs() {
    const res = await fetch(YAML_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load ${YAML_URL} (${res.status})`);
    const text = await res.text();
    const data = jsyaml.load(text);
    if (!data || !Array.isArray(data.songs)) {
      throw new Error("songs.yaml must contain a songs: list");
    }

    titleEl.textContent = data.title || "Sports Audio DJ";
    songs = data.songs.map((raw, index) => {
      const id = raw.id || `song-${index}`;
      const videoId = raw.video_id || raw.videoId;
      if (!videoId) throw new Error(`Song "${raw.name || id}" missing video_id`);
      return {
        id,
        name: raw.name || id,
        video_id: String(videoId),
        startSeconds: parseStart(raw.start ?? raw.start_seconds ?? 0),
      };
    });
    renderBoard();
  }

  document.getElementById("btn-stop").addEventListener("click", () => {
    if (player && player.stopVideo) player.stopVideo();
    markPlaying(null);
    nowEl.textContent = "—";
    setStatus("Stopped.", false);
  });

  document.getElementById("btn-open-app").addEventListener("click", () => {
    const song = songs.find((s) => s.id === currentSongId);
    if (song) openInMusicApp(song);
    else setStatus("Play a song first, or long-press a square.", false);
  });

  loadSongs().catch((err) => {
    board.innerHTML = `<p id="load-error">${err.message}</p>`;
    setStatus(err.message, true);
  });

  updateBoardColors();
  setInterval(updateBoardColors, 30_000);
})();
