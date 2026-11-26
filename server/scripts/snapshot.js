// Saves StatGoal API answers as static JSON files for the GitHub Pages demo.
// Usage: start the API (ideally with SETTLE_MS=120000 NO_WARM=1), then
//   node server/scripts/snapshot.js <outDir> [apiBase]
// The file name of each answer is derived from the exact request path the front end uses
// (see web/src/api.js → staticFile), so the static site reads the same paths it would call.
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] ?? 'web/public/data');
const API = (process.argv[3] ?? 'http://localhost:4100') + '/api';
const MAX_TEAMS = Number(process.env.SNAPSHOT_MAX_TEAMS) || 40;
const MAX_MATCHES = Number(process.env.SNAPSHOT_MAX_MATCHES) || 40;

export const fileFor = (p) => `${p.replace(/^\//, '').replace(/[^\w.-]+/g, '_')}.json`;

fs.mkdirSync(OUT, { recursive: true });
const saved = new Set();
let failed = 0;

async function grab(p, retry = true) {
  if (retry && saved.has(p)) return null;
  saved.add(p);
  const t = Date.now();
  try {
    const res = await fetch(API + p, { signal: AbortSignal.timeout(300_000) });
    if (res.status >= 500 && retry) {
      // Usually a source rate limit: wait it out once.
      console.log(`wait ${p} (HTTP ${res.status}), retrying in 60s`);
      await new Promise((r) => setTimeout(r, 60_000));
      return grab(p, false);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    fs.writeFileSync(path.join(OUT, fileFor(p)), JSON.stringify(data));
    console.log(`ok   ${p} (${((Date.now() - t) / 1000).toFixed(1)}s)`);
    return data;
  } catch (e) {
    failed++;
    console.log(`fail ${p}: ${e.message}`);
    return null;
  }
}

async function waitForApi() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${API}/competitions`)).ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('API did not start');
}

const day = (offset) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

await waitForApi();
const comps = (await grab('/competitions')) ?? [];
const nationals = (await grab('/national-teams')) ?? [];
await grab('/articles');
await grab('/app-release');
await grab('/sources');

const teamIds = new Set();
const matchIds = new Set();
const noteTeam = (t) => t?.id && teamIds.size < MAX_TEAMS && teamIds.add(String(t.id));

for (let o = -4; o <= 4; o++) {
  const m = await grab(`/matches?date=${day(o)}`);
  for (const g of m?.groups ?? []) {
    for (const x of g.matches) {
      if (!g.key) continue; // only followed competitions get team/match pages
      noteTeam(x.home); noteTeam(x.away);
      if (x.id?.startsWith('tsdb-') && matchIds.size < MAX_MATCHES) matchIds.add(x.id.slice(5));
    }
  }
}

for (const c of comps) {
  const d = await grab(`/competitions/${c.key}`);
  for (const r of (d?.table ?? []).slice(0, 6)) noteTeam(r.team);
}

for (const t of nationals.slice(0, Number(process.env.SNAPSHOT_MAX_NATIONALS) || nationals.length)) {
  const r = await grab(`/teams/by-name/${encodeURIComponent(t.name)}`);
  if (r?.id) teamIds.add(String(r.id));
}

for (const id of matchIds) await grab(`/match/${id}`);
for (const id of teamIds) await grab(`/teams/${id}`);

fs.writeFileSync(path.join(OUT, '_snapshot.json'), JSON.stringify({ at: new Date().toISOString(), files: saved.size - failed, failed }));
console.log(`\nsnapshot: ${saved.size - failed} saved, ${failed} failed → ${OUT}`);
