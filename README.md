# SurgeAI

SurgeAI is a static catalog of apps and games. The website is designed to deploy to both Cloudflare Pages and GitHub Pages. Public app/game files are hosted as assets on GitHub Releases. This setup does not use Cloudflare R2.

## Publishing an app or game

1. In the public `EmperorAsy/surgeai` repository, create a GitHub Release and attach the APK, EXE, MSI, or ZIP file. Each release asset must be under 2 GiB.
2. Copy the asset's release download URL.
3. Add an entry to `public/catalog.json`:

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

4. Commit the catalog update to `main`. The GitHub Pages workflow deploys the site automatically. Deploy the same `public` directory to the separate Cloudflare Pages project with `npx wrangler pages deploy public --project-name surgeai --branch main`.

The `downloadUrl` must be a GitHub Releases asset URL. Set `size` to the asset size in bytes; omit it if unknown. Only trusted repository maintainers should publish catalog entries and releases. Releases and the website are public.

## Hosting

- Cloudflare Pages project: `surgeai` (separate from `amansinghyadav-in`).
- GitHub Pages site: `https://emperorasy.github.io/surgeai/`.
- GitHub Actions deploys the `public` folder to GitHub Pages when changes are pushed to `main`.
- To use `surgeai.si`, connect the domain to the SurgeAI Cloudflare Pages project in Cloudflare's Pages custom-domain settings. Do not connect `amansinghyadav.in` to this project.
- Cloudflare Pages applies the security headers in `public/_headers`. GitHub Pages uses the in-document Content Security Policy, but static GitHub Pages cannot configure response headers such as HSTS or COOP.
- `robots.txt`, `sitemap.xml`, `llms.txt`, and `/.well-known/ard.json` provide search-engine and agent discovery metadata.

GitHub documents release assets as limited to under 2 GiB per file, with no total release-size or bandwidth limit. This design avoids R2 charges. Do not enable paid Git LFS or other paid storage add-ons for this repository.
