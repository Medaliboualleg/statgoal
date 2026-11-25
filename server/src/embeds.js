// Official embed widgets (Sofascore "Embed", Flashscore widgets…) linked by the site owner to a
// StatGoal match / team / player. We store only the widget URL; the visitor's browser loads it
// straight from the platform, under the platform's own terms. No data is fetched server-side.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.resolve(process.cwd(), 'data', 'embeds.json');
const PLATFORMS = [
  ['sofascore', /(^|\.)sofascore\.com$/],
  ['flashscore', /(^|\.)flashscore\.[a-z.]+$/],
  ['whoscored', /(^|\.)whoscored\.com$/],
  ['theanalyst', /(^|\.)theanalyst\.com$/],
];
export const KINDS = ['match', 'team', 'player', 'competition'];

let db = {};
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { /* empty */ }
const save = () => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
};

/** Accepts a pasted <iframe …> embed code or a bare widget URL. Returns {platform, src} or throws. */
export function parseEmbed(code) {
  const raw = String(code ?? '').trim();
  const src = (raw.match(/src\s*=\s*["']([^"']+)["']/i)?.[1] ?? raw).replace(/&amp;/g, '&');
  let url;
  try { url = new URL(src); } catch { throw new Error('لم أجد رابطًا صالحًا في الكود الملصق'); }
  if (url.protocol !== 'https:') throw new Error('يجب أن يبدأ الرابط بـ https');
  const platform = PLATFORMS.find(([, re]) => re.test(url.hostname))?.[0];
  if (!platform) throw new Error('المسموح فقط أدوات Sofascore وFlashscore وWhoScored وThe Analyst الرسمية');
  const height = Number(raw.match(/height\s*=\s*["']?(\d+)/i)?.[1]) || null;
  return { platform, src: url.toString(), height };
}

export const list = (kind, id) => db[`${kind}:${id}`] ?? [];

export function add(kind, id, code, title) {
  const e = { ...parseEmbed(code), title: String(title ?? '').slice(0, 80) || null, addedAt: new Date().toISOString() };
  const key = `${kind}:${id}`;
  db[key] = [...(db[key] ?? []).filter((x) => x.src !== e.src), e];
  save();
  return db[key];
}

export function remove(kind, id, index) {
  const key = `${kind}:${id}`;
  db[key] = (db[key] ?? []).filter((_, i) => i !== Number(index));
  if (!db[key].length) delete db[key];
  save();
  return db[key] ?? [];
}
