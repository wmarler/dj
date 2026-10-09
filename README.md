# Sports Audio DJ (web)

Mobile-friendly cue board: tap a square to play a YouTube track from a configured start time. Squares turn **red** if that song was played in the last hour (stored in the browser on your phone).

## Setup (first time)

```bash
cp config.template.js config.js
cp songs.example.yaml songs.yaml
cp deploy.config.example deploy.config   # set DEST to your nginx web root
```

Edit `songs.yaml` for your tracks. Optional: tweak `config.js` (playlist path, YT Music URL prefix, localStorage key). **No YouTube login belongs in these files** — Premium uses the YouTube Music app session on your device.

## YouTube Music

Google does not offer a public “play in YouTube Music from my website” API. This app uses the **same video ID** as YouTube Music (share link → `v=…`) and plays via the **YouTube IFrame Player** on the page.

For **YouTube Music Premium** (app, background audio): tap **Open in YT Music** or **long-press** a square.

## Deploy

```bash
./deploy.sh
```

Copies `index.html`, `app.js`, `styles.css`, `config.js`, and `songs.yaml` to `DEST` from `deploy.config`.

## Song file format

```yaml
title: My Board
songs:
  - id: unique-key
    name: Label on the square
    video_id: dQw4w9WgXcQ
    start: "1:30"   # or start_seconds: 90
```

Share link example: `…/watch?v=btPJPFnesV4` → `video_id: btPJPFnesV4`

## Add to home screen (iOS)

Safari → Share → Add to Home Screen.
