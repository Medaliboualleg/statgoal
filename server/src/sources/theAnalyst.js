// The Analyst (Opta) — public WordPress REST API: analysis articles, attached to
// competitions, teams and players as "تحليلات Opta".
import { cached, getJson } from '../cache.js';

const BASE = 'https://theanalyst.com/wp-json/wp/v2';
const FIELDS = 'id,date,link,title,excerpt,yoast_head_json.og_image';
const FOOTBALL = 13;

const decode = (s = '') =>
  s.replace(/<[^>]+>/g, '').replace(/&#8217;|&#8216;/g, '’').replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8211;|&#8212;/g, '–').replace(/&#0?38;|&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&#8230;|\[&hellip;\]/g, '…').trim();

const normalize = (p) => ({
  id: p.id,
  date: p.date,
  url: p.link,
  title: decode(p.title?.rendered),
  excerpt: decode(p.excerpt?.rendered),
  image: p.yoast_head_json?.og_image?.[0]?.url ?? null,
  source: 'theanalyst',
});

export const theAnalyst = {
  id: 'theanalyst',
  name: 'The Analyst (Opta)',
  role: 'مقالات وتحليلات Opta',
  async status() {
    try {
      await getJson(`${BASE}/posts?per_page=1&_fields=id`);
      return { ok: true, note: 'متصل — واجهة WordPress العامة' };
    } catch (e) {
      return { ok: false, note: e.message };
    }
  },
  latest(categoryId = FOOTBALL, limit = 8) {
    return cached(`ta:latest:${categoryId}:${limit}`, 900, async () =>
      (await getJson(`${BASE}/posts?per_page=${limit}&categories=${categoryId}&_fields=${FIELDS}`)).map(normalize));
  },
  search(q, limit = 6) {
    if (!q) return Promise.resolve([]);
    return cached(`ta:search:${q.toLowerCase()}:${limit}`, 3600, async () =>
      (await getJson(`${BASE}/posts?per_page=${limit}&categories=${FOOTBALL}&search=${encodeURIComponent(q)}&_fields=${FIELDS}`)).map(normalize));
  },
};
