import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { COMPETITIONS, NATIONAL_TEAMS, byKey } from './competitions.js';
import { theSportsDb } from './sources/theSportsDb.js';
import { footballData } from './sources/footballData.js';
import { theAnalyst } from './sources/theAnalyst.js';
import { mergeMatches, mergeTables, sameTeam } from './merge.js';
import { background } from './cache.js';
import * as embeds from './embeds.js';
import { latestRelease } from './sources/github.js';

const app = express();
const PORT = Number(process.env.PORT) || 4100;

// Settled: never let one source's failure break a page; report it in `notes` instead.
// Also capped in time: a slow source is reported as loading and keeps filling the cache.
async function settle(label, promise, fallback, notes, ms = 8000) {
  let timer;
  const late = new Promise((r) => { timer = setTimeout(() => { notes.push(`${label}: قيد التحميل، حدّث الصفحة بعد قليل`); r(fallback); }, ms); });
  try {
    return await Promise.race([promise, late]);
  } catch (e) {
    notes.push(`${label}: ${e.message}`);
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

const api = express.Router();
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => res.status(500).json({ error: e.message }));

// Sites the user asked for that block automated access: listed honestly, not scraped.
const UNAVAILABLE = [
  { id: 'sofascore', name: 'Sofascore', role: 'نتائج وإحصائيات', note: 'يحجب الوصول الآلي — يتطلب ترخيص بيانات' },
  { id: 'flashscore', name: 'Flashscore', role: 'نتائج مباشرة', note: 'يحجب الوصول الآلي — يتطلب ترخيص بيانات' },
  { id: 'whoscored', name: 'WhoScored', role: 'تقييمات Opta', note: 'محمي ضد الروبوتات — يتطلب ترخيص بيانات' },
];

api.get('/sources', wrap(async (_req, res) => {
  const live = await Promise.all([theSportsDb, footballData, theAnalyst].map(async (s) => ({ id: s.id, name: s.name, role: s.role, ...(await s.status()) })));
  res.json([...live, ...UNAVAILABLE.map((s) => ({ ...s, ok: false, unavailable: true }))]);
}));

api.get('/competitions', (_req, res) => res.json(COMPETITIONS.map(({ key, nameAr, name, country }) => ({ key, nameAr, name, country }))));
api.get('/national-teams', (_req, res) => res.json(NATIONAL_TEAMS));

api.get('/matches', wrap(async (req, res) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date) ? req.query.date : new Date().toISOString().slice(0, 10);
  const notes = [];
  // Answer within a few seconds; slower sources keep filling the cache for the next visit.
  let pending = 0;
  const soon = (p) => Promise.race([p, new Promise((r) => setTimeout(() => { pending++; r([]); }, 6000))]);
  const [a, rounds, b] = await Promise.all([
    soon(settle('TheSportsDB', theSportsDb.matchesOn(date), [], notes)),
    Promise.all(COMPETITIONS.map((c) => soon(settle('TheSportsDB', theSportsDb.aroundNow(c), [], notes)))),
    soon(settle('football-data', footballData.matchesOn(date), [], notes)),
  ]);
  if (pending) notes.push(`ما زال ${pending} من المصادر قيد التحميل — حدّث الصفحة بعد قليل`);
  const ofDay = rounds.flat().filter((m) => m.kickoff.startsWith(date));
  const matches = mergeMatches(ofDay, a, b);
  // Followed competitions first, in our order; everything else after.
  const order = (m) => { const i = COMPETITIONS.findIndex((c) => c.key === m.competition.key); return i < 0 ? 99 : i; };
  const groups = new Map();
  for (const m of matches.sort((x, y) => order(x) - order(y))) {
    const k = m.competition.key ?? m.competition.name;
    if (!groups.has(k)) {
      const c = byKey(m.competition.key);
      groups.set(k, { key: m.competition.key, name: c?.nameAr ?? m.competition.name, badge: m.competition.badge, country: c?.country ?? null, matches: [] });
    }
    groups.get(k).matches.push(m);
  }
  res.json({ date, groups: [...groups.values()], notes });
}));

api.get('/competitions/:key', wrap(async (req, res) => {
  const comp = byKey(req.params.key);
  if (!comp) return res.status(404).json({ error: 'competition not found' });
  const notes = [];
  const [baseTable, fdTable, scorers, around, next, fdPast, articles] = await Promise.all([
    settle('TheSportsDB', theSportsDb.table(comp), [], notes),
    settle('football-data', footballData.standings(comp), [], notes),
    settle('football-data', footballData.scorers(comp), [], notes),
    settle('TheSportsDB', theSportsDb.aroundNow(comp), [], notes),
    settle('TheSportsDB', theSportsDb.nextLeague(comp), [], notes),
    settle('football-data', footballData.compMatches(comp, 'FINISHED'), [], notes),
    comp.analyst ? settle('The Analyst', theAnalyst.latest(comp.analyst, 6), [], notes) : settle('The Analyst', theAnalyst.search(comp.name, 6), [], notes),
  ]);
  const table = mergeTables(baseTable, fdTable);
  // Give scorers the TheSportsDB team id so their club links to a team page.
  for (const s of scorers) s.team.id = table.find((r) => sameTeam(r.team.name, s.team.name))?.team.id ?? null;
  const all = mergeMatches(around, next, fdPast.slice(-10));
  const results = all.filter((m) => m.status === 'finished').reverse().slice(0, 10);
  const upcoming = all.filter((m) => m.status !== 'finished').slice(0, 10);
  res.json({ competition: comp, table, scorers, results, upcoming, articles, notes, limited: !footballData.enabled() });
}));

api.get('/teams/by-name/:name', wrap(async (req, res) => {
  const team = await theSportsDb.teamByName(req.params.name);
  if (!team) return res.status(404).json({ error: 'team not found' });
  res.json({ id: team.id });
}));

api.get('/teams/:id', wrap(async (req, res) => {
  const notes = [];
  const team = await theSportsDb.team(req.params.id);
  if (!team) return res.status(404).json({ error: 'team not found' });
  // Standing + scorers come from the competition this team plays in, when we follow it.
  const comp = COMPETITIONS.find((c) => String(c.tsdb) === String(team.leagueId));
  const [squad, last, next, articles, baseTable, fdTable, compScorers] = await Promise.all([
    settle('TheSportsDB', theSportsDb.squad(team.id), [], notes),
    settle('TheSportsDB', theSportsDb.teamLast(team.id), [], notes),
    settle('TheSportsDB', theSportsDb.teamNext(team.id), [], notes),
    settle('The Analyst', theAnalyst.search(team.name, 6), [], notes),
    comp ? settle('TheSportsDB', theSportsDb.table(comp), [], notes) : [],
    comp ? settle('football-data', footballData.standings(comp), [], notes) : [],
    comp ? settle('football-data', footballData.scorers(comp), [], notes) : [],
  ]);
  const standing = mergeTables(baseTable, fdTable).find((r) => String(r.team.id) === String(team.id) || sameTeam(r.team.name, team.name)) ?? null;
  const scorers = compScorers.filter((s) => sameTeam(s.team.name, team.name));
  res.json({ team, competition: comp ? { key: comp.key, nameAr: comp.nameAr } : null, standing, scorers, squad, last, next, articles, notes });
}));

api.get('/players/:id', wrap(async (req, res) => {
  const notes = [];
  const player = await theSportsDb.player(req.params.id);
  if (!player) return res.status(404).json({ error: 'player not found' });
  const team = player.team.id ? await settle('TheSportsDB', theSportsDb.team(player.team.id), null, notes) : null;
  const comp = team && COMPETITIONS.find((c) => String(c.tsdb) === String(team.leagueId));
  const [articles, compScorers] = await Promise.all([
    settle('The Analyst', theAnalyst.search(player.name, 6), [], notes),
    comp ? settle('football-data', footballData.scorers(comp, 50), [], notes) : [],
  ]);
  const last = (s) => s.split(' ').pop().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const season = compScorers.find((s) => last(s.player.name) === last(player.name) && sameTeam(s.team.name, team.name)) ?? null;
  res.json({ player, team, competition: comp ? { key: comp.key, nameAr: comp.nameAr } : null, season, articles, notes });
}));

api.get('/search', wrap(async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 2) return res.json({ teams: [], players: [] });
  const notes = [];
  const [teams, players] = await Promise.all([
    settle('TheSportsDB', theSportsDb.searchTeams(q), [], notes),
    settle('TheSportsDB', theSportsDb.searchPlayers(q), [], notes),
  ]);
  res.json({ teams: teams.slice(0, 10), players: players.slice(0, 12), notes });
}));

api.get('/match/:id', wrap(async (req, res) => {
  const notes = [];
  const tsdbId = String(req.params.id).replace(/^tsdb-/, '');
  if (!/^\d+$/.test(tsdbId)) return res.status(404).json({ error: 'match not found' });
  const m = await theSportsDb.match(tsdbId);
  if (!m) return res.status(404).json({ error: 'match not found' });
  const day = m.kickoff.slice(0, 10);
  const comp = byKey(m.competition.key);
  const [fdDay, articles, baseTable, fdTable] = await Promise.all([
    settle('football-data', footballData.matchesOn(day), [], notes),
    settle('The Analyst', theAnalyst.search(`${m.home.name} ${m.away.name}`, 4), [], notes),
    comp ? settle('TheSportsDB', theSportsDb.table(comp), [], notes) : [],
    comp ? settle('football-data', footballData.standings(comp), [], notes) : [],
  ]);
  const [match] = mergeMatches([m], fdDay.filter((x) => sameTeam(x.home.name, m.home.name) && sameTeam(x.away.name, m.away.name)));
  const table = mergeTables(baseTable, fdTable);
  const row = (t) => table.find((r) => String(r.team.id) === String(t.id) || sameTeam(r.team.name, t.name)) ?? null;
  res.json({ match: { ...m, ...match }, competition: comp ? { key: comp.key, nameAr: comp.nameAr } : null, standing: { home: row(m.home), away: row(m.away) }, articles, notes });
}));

// Official platform widgets linked to an item. Reading is public; changes need ADMIN_TOKEN.
const admin = (req, res, next) =>
  process.env.ADMIN_TOKEN && req.get('x-admin-token') === process.env.ADMIN_TOKEN ? next() : res.status(401).json({ error: 'رمز الإدارة غير صحيح' });
const validKind = (req, res, next) => (embeds.KINDS.includes(req.params.kind) && /^[\w-]{1,40}$/.test(req.params.id) ? next() : res.status(400).json({ error: 'bad target' }));
api.get('/embeds/:kind/:id', validKind, (req, res) => res.json(embeds.list(req.params.kind, req.params.id)));
api.post('/embeds/:kind/:id', validKind, admin, express.json({ limit: '20kb' }), (req, res) => {
  try {
    res.json(embeds.add(req.params.kind, req.params.id, req.body?.code, req.body?.title));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
api.delete('/embeds/:kind/:id/:index', validKind, admin, (req, res) => res.json(embeds.remove(req.params.kind, req.params.id, req.params.index)));
api.get('/admin/check', admin, (_req, res) => res.json({ ok: true }));

api.get('/app-release', wrap(async (_req, res) => res.json(await latestRelease())));

api.get('/articles', wrap(async (_req, res) => res.json(await theAnalyst.latest(undefined, 9))));

// CORS for the Android/iOS apps (Capacitor origins) and any origin listed in CORS_ORIGINS.
const ALLOWED = new Set(['https://localhost', 'http://localhost', 'capacitor://localhost', 'ionic://localhost',
  ...(process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)]);
app.use('/api', (req, res, next) => {
  const origin = req.get('origin');
  if (origin && ALLOWED.has(origin)) {
    res.set({ 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Headers': 'Content-Type, x-admin-token', 'Access-Control-Allow-Methods': 'GET, POST, DELETE' });
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});
app.use('/api', api);

// Production: serve the built React app.
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h' }));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// Keep the followed competitions warm so visitors rarely wait on rate-limited sources.
const warm = () => background(async () => {
  for (const c of COMPETITIONS) {
    await theSportsDb.aroundNow(c).catch(() => {});
    await theSportsDb.table(c).catch(() => {});
    await footballData.standings(c).catch(() => {});
  }
  console.log('cache warm', new Date().toISOString());
});

app.listen(PORT, () => {
  console.log(`StatGoal API on http://localhost:${PORT}`);
  warm();
  setInterval(warm, 20 * 60 * 1000);
});
