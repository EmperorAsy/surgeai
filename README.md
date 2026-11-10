# SurgeAI

SurgeAI is a static site organized into Apps & Tools, Games, and Mythology & Astrology sections. The website is designed to deploy to both Cloudflare Pages and GitHub Pages. Public downloadable app/game files are hosted as assets on GitHub Releases. This setup does not use Cloudflare R2.

## Publishing an app or game

1. For a downloadable app or game, create a GitHub Release and attach the APK, EXE, MSI, or ZIP file. Each release asset must be under 2 GiB.
2. Add an entry to `public/catalog.json` with the release asset URL:

   ```json
   [
     {
       "id": "sample-game-1-0",
       "title": "Sample Game",
       "description": "A short description.",
       "category": "game",
       "platform": "Windows",
       "size": 10485760,
       "downloadUrl": "https://github.com/EmperorAsy/surgeai/releases/download/v1.0/sample-game.zip"
     }
   ]
   ```

3. For a browser game, add an entry with a relative `playUrl`, for example `"playUrl": "./games/tic-tac-toe/"`. Put the game's static files in `public/games/<game-name>/`.
4. For a browser app, add an entry with an `appUrl` under `./apps/` and put its static files in `public/apps/<app-name>/`.
5. Commit the catalog update to `main`. The GitHub Pages workflow deploys the site automatically. Deploy the same `public` directory to the separate Cloudflare Pages project with `npx wrangler pages deploy public --project-name surgeai --branch main`.

The `downloadUrl` for downloadable releases must be a GitHub Releases asset URL. Set `size` to the asset size in bytes; omit it if unknown. A `playUrl` must point to a same-site path under `/games/`; an `appUrl` must point under `/apps/`. Only trusted repository maintainers should publish catalog entries and releases. Releases and the website are public.

## Hosting

- Cloudflare Pages project: `surgeai` (separate from `amansinghyadav-in`).
- GitHub Pages site: `https://emperorasy.github.io/surgeai/`.
- Browser apps include a calculator, a daily-rate currency converter, an online land mapper, a measurement converter, and a device compass. The currency converter uses dated daily reference rates; the map can use optional device location and estimates plot measurements rather than providing a legal survey.
- The arcade includes Tic-Tac-Toe, Memory Match, Number Rush, Meteor Dash, Startup Studio, Bubble Pop, and Garden Glow.
- The [Mythology & Astrology guide](https://surgeai.si/mythology/) introduces Hindu, Greek, and ancient Egyptian traditions, astrology, and rituals. It distinguishes cultural and spiritual beliefs from scientific claims and notes that living practices vary among communities.
- The [Hindu epics and stories section](https://surgeai.si/mythology/stories/) contains original short retellings from the Mahabharata, Ramayana, and Vishnu Purana, with source links. These are not copied from the Gita Press scan or other modern editions.
- The guide's symbolic reading form processes optional name, birth date, birth time, birthplace, and color in the browser only. It does not send or save those details, calculate a formal Jyotish chart, or predict a fixed fate.
- Game pages animate plays and results, with a home-page list of each device's last 15 game scores. Scores and rewards use browser-local storage and are not shared across devices.
- Apps can add entries to a home-page recent-activity list. The most recent 15 entries are shown; entries older than seven days are pruned on the next visit or activity. Activity is stored only in browser-local storage and is not shared across devices.
- GitHub Actions deploys the `public` folder to GitHub Pages when changes are pushed to `main`.
- To use `surgeai.si`, connect the domain to the SurgeAI Cloudflare Pages project in Cloudflare's Pages custom-domain settings. Do not connect `amansinghyadav.in` to this project.
- Cloudflare Pages applies the security headers in `public/_headers`. GitHub Pages uses the in-document Content Security Policy, but static GitHub Pages cannot configure response headers such as HSTS or COOP.
- `robots.txt`, `sitemap.xml`, `llms.txt`, and `/.well-known/ard.json` provide search-engine and agent discovery metadata.

GitHub documents release assets as limited to under 2 GiB per file, with no total release-size or bandwidth limit. This design avoids R2 charges. Do not enable paid Git LFS or other paid storage add-ons for this repository.
