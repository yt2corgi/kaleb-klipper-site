# Kaleb Klipper website

The landing page and download hub for Kaleb Klipper. Deployed on Vercel as a static site; the installers live on this repo's GitHub Releases because they are far too big for git or Vercel.

## How the pieces fit

| Piece | Where it lives |
|---|---|
| The site | `public/`, served by Vercel (or `npm start` locally on port 4800) |
| Installers | GitHub Releases on this repo, one release per version |
| Auto updates | The app polls this repo's latest release (electron-updater GitHub provider) |
| Download button | Resolves the newest `.exe` from the GitHub API in the browser |

## Deploy on Vercel

1. Go to vercel.com, Add New Project, import `yt2corgi/kaleb-klipper-site`
2. Leave everything default (`vercel.json` already sets the output folder and redirects) and hit Deploy

That is the whole thing. Every `git push` redeploys automatically.

If the Vercel project ends up with a name other than `kaleb-klipper-site`, update the `og:image` URL in `public/index.html` to the real domain so Discord embeds show the screenshot.

## Shipping a new app version

From the app repo (`C:\Users\liamb\kaleb-klipper`):

1. Bump `version` in `package.json`
2. `npx electron-builder --win` (use a fresh `-c.directories.output=dist-vX.Y.Z` if a folder is file-locked)
3. Publish the release (installer + blockmap + latest.yml):

```
gh release create vX.Y.Z --repo yt2corgi/kaleb-klipper-site --title "Kaleb Klipper X.Y.Z" \
  "dist-vX.Y.Z/Kaleb Klipper Setup X.Y.Z.exe" \
  "dist-vX.Y.Z/Kaleb Klipper Setup X.Y.Z.exe.blockmap" \
  "dist-vX.Y.Z/latest.yml"
```

Every installed copy notices the new release within a few hours (or on next launch), downloads it in the background, and installs it on the next full shutdown. The site's download button starts handing out the new installer immediately, no site deploy needed.

## Local preview

```
npm install
npm start
```

Open http://localhost:4800. Locally the Express server also serves `/download` and `/updates` from `downloads/` (filled by `node ../tools/sync-site.js` after a build), which is handy for testing the update flow end to end with `KK_UPDATE_URL=http://localhost:4800/updates`.
