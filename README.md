# Kilimanjaro — Lemosho in Seven Days

A day-by-day site for the 24–30 June 2026 Lemosho climb.

## Run it

```sh
./start.sh          # → http://127.0.0.1:4173
./start.sh 8080     # or pick a port
```

Plain HTML/CSS/JS — no build step, no dependencies. It must be served over
HTTP rather than opened as a file, because the galleries `fetch()` a manifest.

## Editing the trip

**`data/trip.js` is the only file you need to touch for content.** Everything
on the page — the day sections, the elevation profile, the route points, the
stat tiles, the closing ledger — is rendered from it.

Each day looks like this:

```js
{
  n: 5,                          // day number
  date: "2026-06-28",            // also picks which photos appear
  label: "The Wall — and then we didn't stop",
  from: "Barranco Camp",
  to:   "Barafu Camp",
  sleepAt: 4673,                 // metres; null if not a camp night
  distanceKm: 9,
  hours: "10–11",
  zone: "Alpine desert",
  highlight: "the day we skipped a camp",   // the amber pull-quote
  firstFrame: "07:57",           // from the photo EXIF
  lastFrame:  "19:58",
  blurb: "…",
  points: [
    { name: "Barranco Wall", m: 4200, km: 32.5, note: "…" },
    { name: "Karanga Camp",  m: 3995, km: 36,   note: "…", skipped: true },
    { name: "Barafu Camp",   m: 4673, km: 40,   note: "…", camp: true },
  ],
}
```

Point flags: `camp`, `peak`, `summit`, `skipped`. `m` is metres, `km` is
cumulative distance from the trailhead — that pair is what positions the point
on the elevation profile, so keep `km` increasing down the list.

Ascent and descent totals are computed from the points, not typed in. If you
change an elevation, the stats and the ledger follow automatically.

## Photos

`build-photos.sh` converts the HEIC/JPG/PNG stills in the parent folder into
web-sized JPEGs under `assets/photos/` (1800 px `full/`, 640 px `thumb/`).
It skips anything already converted, so re-running it is cheap.

`data/photos.json` maps each converted file to a capture date and time. It was
generated from EXIF capture times. To rebuild it after adding photos, re-run
`build-photos.sh` and regenerate the manifest.

A photo appears under whichever day has a matching `date`.

## Dates

The itinerary dates and the "on the move" windows were read from the EXIF
capture times on the phone photos and the drone clips, which agree with each
other. Note that Spotlight (`mdls`) reports these four hours ahead of the
camera clock on this library — `sips -g creation` gives the true capture time.

## Not done yet

- Drone video. 60+ DJI clips (~33 GB) are in the parent folder, untouched.
- The Millennium Camp night on 29 June is inferred, not confirmed by a photo.
