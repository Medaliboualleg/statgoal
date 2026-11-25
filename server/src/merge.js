// Merging records that describe the same match / team / table row from different sources.
// Records are matched on a normalised team-name key; each merged record keeps `sources`.

const STRIP = /\b(fc|cf|afc|sc|ac|as|ss|ssc|rc|rcd|cd|ud|sd|fk|sk|club|calcio|de|futbol|football|1\.)\b/g;
export function teamKey(name) {
  return String(name ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9 ]/g, ' ')
    .replace(STRIP, ' ').replace(/\s+/g, ' ').trim()
    .replace(/^manchester united$/, 'man united').replace(/^manchester city$/, 'man city')
    .replace(/^paris saint germain$/, 'paris sg').replace(/^internazionale milano$|^inter milan$/, 'inter')
    .replace(/^wolverhampton wanderers$/, 'wolves').replace(/^tottenham hotspur$/, 'tottenham')
    .replace(/^brighton and hove albion$/, 'brighton').replace(/^nottingham forest$/, 'nottm forest');
}

// Keys match if equal, or if one is a whole-word prefix of the other ("arsenal" vs "arsenal london").
export function sameTeam(a, b) {
  const x = teamKey(a), y = teamKey(b);
  if (!x || !y) return false;
  return x === y || x.startsWith(`${y} `) || y.startsWith(`${x} `);
}

const pick = (...vals) => vals.find((v) => v !== null && v !== undefined && v !== '') ?? null;
const union = (a = [], b = []) => [...new Set([...a, ...b])];

function mergeSide(a, b) {
  return {
    ...b, ...a,
    id: pick(a.id, b.id),
    name: pick(a.name, b.name),
    badge: pick(a.badge, b.badge),
    score: pick(b.score, a.score), // live providers listed later win for scores
  };
}

/** Merge match lists. `lists` ordered from base (profile-rich) to live (score-authoritative). */
export function mergeMatches(...lists) {
  const out = [];
  for (const list of lists) {
    for (const m of list) {
      const day = m.kickoff?.slice(0, 10);
      const twin = out.find((o) => o.kickoff?.slice(0, 10) === day && sameTeam(o.home.name, m.home.name) && sameTeam(o.away.name, m.away.name));
      if (!twin) { out.push({ ...m }); continue; }
      Object.assign(twin, {
        status: m.status !== 'scheduled' ? m.status : twin.status,
        minute: pick(m.minute, twin.minute),
        kickoff: pick(m.kickoff, twin.kickoff),
        venue: pick(twin.venue, m.venue),
        referee: pick(m.referee, twin.referee),
        halfTime: pick(m.halfTime, twin.halfTime),
        competition: { ...m.competition, ...twin.competition, key: pick(twin.competition.key, m.competition.key) },
        home: mergeSide(twin.home, m.home),
        away: mergeSide(twin.away, m.away),
        sources: union(twin.sources, m.sources),
      });
    }
  }
  return out.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}

/** Merge standings: richer provider (b) wins numbers; ids/badges kept from both. */
export function mergeTables(base, rich) {
  if (!rich.length) return base;
  if (!base.length) return rich;
  return rich.map((r) => {
    const twin = base.find((b) => sameTeam(b.team.name, r.team.name));
    if (!twin) return r;
    return { ...twin, ...r, team: { ...r.team, id: twin.team.id, badge: pick(r.team.badge, twin.team.badge) }, sources: union(twin.sources, r.sources) };
  });
}
