# GPWSP-MAP

A worker-led, open-source world map of platform work, made by the
**Global Platform Workers Solidarity Project (GPWSP)**. It covers gig work, content moderation,
data work, care work and transport work.

> **Status: Phase 1 prototype.** The map is public and read-only. **Every data point is FAKE
> sample data.** There are no accounts, no uploads and no real worker information.

## What Phase 1 includes

- A world map you can zoom and drag, built from country outlines.
- Three layers you can switch on and off:
  - **Crowdsourced data**: reports about wages, deactivations and company relationships (fake).
  - **Public data overlays**: figures from public sources (fake).
  - **Legislation**: laws on platform work, by country (fake).
- Tap or click any point or coloured country to see its details.
- Designed for small phone screens and slow connections. The whole page is about 120 KB compressed.
- Every word on the site is kept in a translation file, ready for more languages.

## Privacy and safety by design

- **No cookies, no analytics, no tracking, no advertising.**
- **No outside servers.** The map, fonts and code all come from this website. Visitors' devices
  don't contact Google, Mapbox, OpenStreetMap or anyone else. (The web host can still see
  visits, as with any website.)
- **Country-level map only.** You can't zoom down to streets. Points sit at city level, so
  nobody can be pinpointed. Real data must follow the same rule.
- **Strict security policy** in `index.html` stops the page from loading anything from other websites.

See [SECURITY.md](SECURITY.md) for the rules every contributor must follow.

## How the files are organised

| File or folder | What it holds |
|---|---|
| `index.html` | The page itself |
| `css/style.css` | Colours, sizes and layout |
| `js/map.js` | Draws the map, layers, popups and switches |
| `js/i18n.js` | Fills in the words from the translation files |
| `locales/en.json` | **All English text on the site** |
| `locales/languages.json` | The list of languages in the language menu |
| `data/world-countries.geojson` | Country outlines (Natural Earth, public domain) |
| `data/sample-*.json` / `.geojson` | The FAKE sample data for the three layers |
| `vendor/leaflet/` | Leaflet, the free map library (BSD licence) |
| `.github/workflows/pages.yml` | Publishes the site to GitHub Pages automatically |

## How to view it on your own computer

You need Python, which is already installed on most Mac and Linux computers.

1. Download the project (green **Code** button on GitHub → **Download ZIP**), then unzip it.
2. Open a terminal in the unzipped folder and run:

   ```bash
   python3 -m http.server 8000
   ```

3. Open <http://localhost:8000> in your browser. Press `Ctrl+C` in the terminal to stop.

(Opening `index.html` by double-clicking it won't work. Browsers block it from loading the data files.)

## How to add a language

1. Copy `locales/en.json` and name the copy after the language code, for example `locales/fr.json`.
   Codes: `es` Spanish, `pt` Portuguese, `fr` French, `ar` Arabic, `ur` Urdu, `hi` Hindi,
   `id` Bahasa Indonesia, `sw` Swahili.
2. Translate the text on the **right** side of each colon. Don't change the left side, and keep
   words in `{curly braces}` exactly as they are.
3. Add a line to `locales/languages.json`, for example:

   ```json
   { "code": "fr", "name": "Français", "dir": "ltr" }
   ```

   Use `"dir": "rtl"` for right-to-left languages such as Arabic and Urdu. The layout then flips
   automatically.
4. Once there is more than one language, a language menu appears in the top bar. The site also
   picks the visitor's phone language when it's available. A specific language can be linked
   with `?lang=fr` at the end of the address.

Any missing translation falls back to English.

## Not built yet (on purpose)

Logins, vetting, worker-to-worker connection tools, data submission and storytelling uploads.
They will be designed later, together with security experts.

## Licences

- Leaflet © Volodymyr Agafonkin and contributors: BSD 2-Clause (`vendor/leaflet/LICENSE`).
- Country outlines: [Natural Earth](https://www.naturalearthdata.com/) (public domain), through
  the `world-atlas` package (ISC licence).
- The project's own licence is still to be chosen.
