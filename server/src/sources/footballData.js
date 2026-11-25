// football-data.org v4 — free API key (FOOTBALL_DATA_KEY in .env). Adds full fixtures,
// live scores, standings with goal stats, top scorers (goals, assists, penalties) and squads
// for the top European leagues, Champions League, World Cup and Euro.
import { cached, getJson, throttle } from '../cache.js';
import { byFd } from '../competitions.js';

const BASE = 'https://api.football-data.org/v4';
const queue = throttle('football-data', 6500); // free tier: 10 req/min
const enabled = () => Boolean(process.env.FOOTBALL_DATA_KEY);
const call = (path, ttl) =>
  cached(`fd:${path}`, ttl, () => queue(() => getJson(`${BASE}/${path}`, { 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY })));

const STATUS = { SCHEDULED: 'scheduled', TIMED: 'scheduled', IN_PLAY: 'live', PAUSED: 'live', FINISHED: 'finished', POSTPONED: 'postponed', SUSPENDED: 'postponed', CANCELLED: 'postponed' };

const normMatch = (m) => ({
  id: `fd-${m.id}`,
  kickoff: m.utcDate,
  status: STATUS[m.status] ?? 'scheduled',
  minute: m.status === 'PAUSED' ? 'HT' : m.minute ?? null,
  competition: { key: byFd(m.competition?.code)?.key ?? null, name: m.competition?.name, badge: m.competition?.emblem },
  round: m.matchday ?? null,
  venue: m.venue ?? null,
  home: { name: m.homeTeam?.name, short: m.homeTeam?.shortName, badge: m.homeTeam?.crest, score: m.score?.fullTime?.home ?? null, fdId: m.homeTeam?.id },
  away: { name: m.awayTeam?.name, short: m.awayTeam?.shortName, badge: m.awayTeam?.crest, score: m.score?.fullTime?.away ?? null, fdId: m.awayTeam?.id },
  halfTime: m.score?.halfTime ?? null,
  referee: m.referees?.[0]?.name ?? null,
  sources: ['football-data'],
});

export const footballData = {
  id: 'football-data',
  name: 'football-data.org',
  role: 'النتائج المباشرة، الهدافون، التشكيلات',
  enabled,
  async status() {
    if (!enabled()) return { ok: false, note: 'يحتاج مفتاحًا مجانيًا: FOOTBALL_DATA_KEY في ملف .env' };
    try {
      await call('competitions/PL', 86400);
      return { ok: true, note: 'متصل' };
    } catch (e) {
      return { ok: false, note: e.message };
    }
  },
  async matchesOn(date) {
    if (!enabled()) return [];
    const next = new Date(`${date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    const j = await call(`matches?dateFrom=${date}&dateTo=${next.toISOString().slice(0, 10)}`, 120);
    return (j.matches ?? []).filter((m) => m.utcDate.startsWith(date)).map(normMatch);
  },
  async standings(comp) {
    if (!enabled() || !comp.fd) return [];
    const j = await call(`competitions/${comp.fd}/standings`, 1800);
    const total = j.standings?.filter((s) => s.type === 'TOTAL') ?? [];
    return total.flatMap((s) => s.table.map((r) => ({
      rank: r.position,
      team: { name: r.team.name, short: r.team.shortName, badge: r.team.crest, fdId: r.team.id },
      played: r.playedGames, won: r.won, draw: r.draw, lost: r.lost,
      goalsFor: r.goalsFor, goalsAgainst: r.goalsAgainst, goalDiff: r.goalDifference,
      points: r.points, form: r.form?.replace(/,/g, '') ?? null, group: s.group ?? null,
      sources: ['football-data'],
    })));
  },
  async scorers(comp, limit = 20) {
    if (!enabled() || !comp.fd) return [];
    const j = await call(`competitions/${comp.fd}/scorers?limit=${limit}`, 3600);
    return (j.scorers ?? []).map((s) => ({
      player: { name: s.player.name, nationality: s.player.nationality, position: s.player.section ?? s.player.position ?? null, fdId: s.player.id },
      team: { name: s.team.name, badge: s.team.crest },
      played: s.playedMatches ?? null, goals: s.goals ?? 0, assists: s.assists ?? null, penalties: s.penalties ?? null,
      sources: ['football-data'],
    }));
  },
  async compMatches(comp, status) {
    if (!enabled() || !comp.fd) return [];
    const j = await call(`competitions/${comp.fd}/matches?status=${status}`, 600);
    return (j.matches ?? []).map(normMatch);
  },
};
