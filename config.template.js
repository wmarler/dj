/** Copy to config.js and adjust (config.js is not committed). */
window.SPORTS_AUDIO_DJ_CONFIG = {
  /** Playlist file served alongside this page */
  songsUrl: "songs.yaml",

  /** Base URL for “Open in YT Music” / long-press (no login stored here — use the app on your phone) */
  musicWatchBase: "https://music.youtube.com/watch",

  /** localStorage key for “played in the last hour” */
  playHistoryKey: "sports-audio-dj-plays",

  /** How long a square stays red after play (milliseconds) */
  recentPlayWindowMs: 60 * 60 * 1000,
};
