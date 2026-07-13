/* Kaleb Klipper website + update feed.
   - /            the site (static, in public/)
   - /download    always hands out the newest installer
   - /updates/*   the electron-updater generic feed (latest.yml + installer + blockmap)
   - /api/latest  version + size for the page to display

   Everything it serves comes from ./downloads, which tools/sync-site.js
   fills after every build. Deploy this folder anywhere Node runs and
   point the app's build.publish url at https://<your-domain>/updates. */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4800;
const DL = path.join(__dirname, 'downloads');

function latestInstaller() {
  try {
    const yml = fs.readFileSync(path.join(DL, 'latest.yml'), 'utf8');
    const version = (yml.match(/^version:\s*(.+)\s*$/m) || [])[1];
    const file = (yml.match(/^path:\s*(.+)\s*$/m) || [])[1];
    if (!version || !file) return null;
    const full = path.join(DL, file);
    if (!fs.existsSync(full)) return null;
    return { version, file, size: fs.statSync(full).size };
  } catch {
    return null;
  }
}

// The update feed electron-updater polls. No caching: a stale latest.yml
// is the difference between "updates work" and "updates silently don't".
app.use('/updates', express.static(DL, { etag: false, lastModified: false, cacheControl: false, setHeaders: (res) => res.set('Cache-Control', 'no-store') }));

app.get('/api/latest', (_req, res) => {
  const info = latestInstaller();
  if (!info) return res.status(404).json({ error: 'no build published yet' });
  res.json(info);
});

app.get('/download', (_req, res) => {
  const info = latestInstaller();
  if (!info) return res.status(404).send('No build published yet. Run tools/sync-site.js after a build.');
  res.download(path.join(DL, info.file), info.file);
});

app.get('/changelog', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'changelog.html')));

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  const info = latestInstaller();
  console.log(`Kaleb Klipper site -> http://localhost:${PORT}`);
  console.log(info ? `serving v${info.version} (${Math.round(info.size / 1048576)} MB)` : 'no build in downloads/ yet');
});
