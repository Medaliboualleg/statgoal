// TheSportsDB — open football database (free public key "123", or your own key in
// THESPORTSDB_KEY). Teams, players, photos, badges, daily matches, league tables.
import { cached, getJson, throttle } from '../cache.js';
import { byTsdb } from '../competitions.js';

const key = () => process.env.THESPORTSDB_KEY || '123';
const base = () => `https://www.thesportsdb.com/api/v1/json/${key()}`;
const queue = throttle('thesportsdb', 4000); // free tier is strict (≈ 20-30 req/min)

// On a rate-limit reply, wait 20 s and try once more (still inside the queue).
const fetchRetry = async (url) => {
  try {
    return await getJson(url);
  } catch (e) {
    if (e.status !== 429) throw e;
    await new Promise((r) => setTimeout(r, 20000));
    return getJson(url);
  }
};
const call = (path, ttl) => cached(`tsdb:${path}`, ttl, () => queue(() => fetchRetry(`${base()}/${path}`)));
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

export function normMatch(e) {
  const comp = byTsdb(e.idLeague);
  const ts = e.strTimestamp ? `${e.strTimestamp}${e.strTimestamp.endsWith('Z') ? '' : 'Z'}` : `${e.dateEvent}T${e.strTime || '00:00:00'}Z`;
  const status = e.strStatus || (num(e.intHomeScore) !== null ? 'FT' : 'NS');
  return {
    id: `tsdb-${e.idEvent}`,
    kickoff: ts,
    status: /FT|AET|PEN|Match Finished/i.test(status) ? 'finished' : /NS|Not Started|TBD/i.test(status) ? 'scheduled' : /PST|Postponed|CANC/i.test(status) ? 'postponed' : 'live',
    minute: e.strProgress || null,
    competition: { key: comp?.key ?? null, id: e.idLeague, name: e.strLeague, badge: e.strLeagueBadge ? `${e.strLeagueBadge}/tiny` : null },
    round: e.intRound ?? null,
    venue: e.strVenue || null,
    home: { id: e.idHomeTeam, name: e.strHomeTeam, badge: e.strHomeTeamBadge ? `${e.strHomeTeamBadge}/tiny` : null, score: num(e.intHomeScore) },
    away: { id: e.idAwayTeam, name: e.strAwayTeam, badge: e.strAwayTeamBadge ? `${e.strAwayTeamBadge}/tiny` : null, score: num(e.intAwayScore) },
    sources: ['thesportsdb'],
  };
}

const normTeam = (t) => t && ({
  id: t.idTeam,
  name: t.strTeam,
  short: t.strTeamShort,
  alternate: t.strTeamAlternate,
  founded: num(t.intFormedYear),
  league: t.strLeague,
  leagueId: t.idLeague,
  country: t.strCountry,
  stadium: t.strStadium,
  capacity: num(t.intStadiumCapacity),
  location: t.strLocation,
  badge: t.strBadge,
  banner: t.strBanner || t.strFanart1 || null,
  colour: t.strColour1 || null,
  description: t.strDescriptionEN,
  website: t.strWebsite,
  national: /national/i.test(`${t.strTeam} ${t.strLeague} ${t.strKeywords}`) || t.strLeague === '_No League',
});

export const normPlayer = (p) => p && ({
  id: p.idPlayer,
  name: p.strPlayer,
  team: { id: p.idTeam, name: p.strTeam },
  nationality: p.strNationality,
  position: p.strPosition,
  number: p.strNumber || null,
  born: p.dateBorn,
  birthplace: p.strBirthLocation,
  height: p.strHeight || null,
  weight: p.strWeight || null,
  foot: p.strSide || null,
  photo: p.strCutout || p.strThumb || p.strRender || null,
  thumb: p.strThumb || p.strCutout || null,
  description: p.strDescriptionEN,
  signed: p.strSigning || null,
});

export const theSportsDb = {
  id: 'thesportsdb',
  name: 'TheSportsDB',
  role: 'الفرق، اللاعبون، الصور، المباريات والترتيب',
  async status() {
    try {
      await call('lookupleague.php?id=4328', 3600);
      return { ok: true, note: key() === '123' ? 'متصل — المفتاح المجاني (قوائم محدودة)' : 'متصل — مفتاح خاص' };
    } catch (e) {
      return { ok: false, note: e.message };
    }
  },
  async matchesOn(date) {
    const j = await call(`eventsday.php?d=${date}&s=Soccer`, 300);
    return (j.events ?? []).map(normMatch);
  },
  async season(comp) {
    const j = await call(`lookupleague.php?id=${comp.tsdb}`, 86400);
    return j.leagues?.[0]?.strCurrentSeason || comp.season;
  },
  async currentRound(comp) {
    const past = await this.pastLeague(comp);
    const r = Number(past.at(-1)?.round);
    return Number.isFinite(r) && r > 0 ? r : null;
  },
  async round(comp, r) {
    const j = await call(`eventsround.php?id=${comp.tsdb}&r=${r}&s=${await this.season(comp)}`, 1500);
    return (j.events ?? []).map(normMatch);
  },
  // Current + next round of a league (free key returns whole rounds, unlike day lists).
  async aroundNow(comp) {
    const r = await this.currentRound(comp);
    if (!r) return [];
    const [a, b] = await Promise.all([this.round(comp, r), this.round(comp, r + 1)]);
    return [...a, ...b];
  },
  async table(comp) {
    const j = await call(`lookuptable.php?l=${comp.tsdb}&s=${await this.season(comp)}`, 1800);
    return (j.table ?? []).map((r) => ({
      rank: num(r.intRank),
      team: { id: r.idTeam, name: r.strTeam, badge: r.strBadge },
      played: num(r.intPlayed), won: num(r.intWin), draw: num(r.intDraw), lost: num(r.intLoss),
      goalsFor: num(r.intGoalsFor), goalsAgainst: num(r.intGoalsAgainst), goalDiff: num(r.intGoalDifference),
      points: num(r.intPoints), form: r.strForm || null, group: r.strGroup || null,
      sources: ['thesportsdb'],
    }));
  },
  async pastLeague(comp) {
    const j = await call(`eventspastleague.php?id=${comp.tsdb}`, 1800);
    return (j.events ?? []).map(normMatch);
  },
  async nextLeague(comp) {
    const j = await call(`eventsnextleague.php?id=${comp.tsdb}`, 900);
    return (j.events ?? []).map(normMatch);
  },
  async team(id) {
    const j = await call(`lookupteam.php?id=${id}`, 86400);
    return normTeam(j.teams?.[0]);
  },
  async teamByName(name) {
    const j = await call(`searchteams.php?t=${encodeURIComponent(name)}`, 86400);
    const soccer = (j.teams ?? []).filter((t) => t.strSport === 'Soccer');
    return normTeam(soccer.find((t) => t.strTeam.toLowerCase() === name.toLowerCase()) ?? soccer[0]);
  },
  async searchTeams(q) {
    const j = await call(`searchteams.php?t=${encodeURIComponent(q)}`, 86400);
    return (j.teams ?? []).filter((t) => t.strSport === 'Soccer').map(normTeam);
  },
  async searchPlayers(q) {
    const j = await call(`searchplayers.php?p=${encodeURIComponent(q)}`, 86400);
    return (j.player ?? []).filter((p) => !p.strSport || p.strSport === 'Soccer').map(normPlayer);
  },
  async squad(teamId) {
    const j = await call(`lookup_all_players.php?id=${teamId}`, 86400);
    return (j.player ?? []).map(normPlayer);
  },
  async player(id) {
    const j = await call(`lookupplayer.php?id=${id}`, 86400);
    return normPlayer(j.players?.[0]);
  },
  async match(id) {
    const j = await call(`lookupevent.php?id=${id}`, 300);
    const e = j.events?.[0];
    return e ? { ...normMatch(e), spectators: num(e.intSpectators), city: e.strCity || null, country: e.strCountry || null, poster: e.strThumb || e.strPoster || null } : null;
  },
  async teamLast(id) {
    const j = await call(`eventslast.php?id=${id}`, 900);
    return (j.results ?? []).map(normMatch);
  },
  async teamNext(id) {
    const j = await call(`eventsnext.php?id=${id}`, 900);
    return (j.events ?? []).map(normMatch);
  },
};
