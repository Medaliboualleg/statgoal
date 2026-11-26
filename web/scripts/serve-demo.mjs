// Serves web/dist under /statgoal/ like GitHub Pages does (unknown paths → 404.html), for
// checking the demo build locally:  node web/scripts/serve-demo.mjs   → http://localhost:5190/statgoal/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const BASE = '/statgoal/';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (!url.startsWith(BASE)) { res.writeHead(302, { Location: BASE }); return res.end(); }
  let file = path.join(DIST, url.slice(BASE.length));
  if (!file.startsWith(DIST)) { res.writeHead(400); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  const found = fs.existsSync(file);
  const send = found ? file : path.join(DIST, '404.html');
  res.writeHead(found ? 200 : 404, { 'Content-Type': TYPES[path.extname(send)] ?? 'application/octet-stream' });
  fs.createReadStream(send).pipe(res);
}).listen(5190, () => console.log('demo on http://localhost:5190/statgoal/'));
