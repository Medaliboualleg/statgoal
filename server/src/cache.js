// TTL cache (memory + disk, so restarts don't burn rate limits) and a polite, throttled fetch.
import fs from 'node:fs';
import path from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';

const FILE = path.resolve(process.cwd(), '.cache.json');
const store = new Map();
try {
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(FILE, 'utf8')))) store.set(k, v);
} catch { /* no cache yet */ }

let saveTimer;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const now = Date.now();
    const out = {};
    for (const [k, v] of store) if (v.expires > now) out[k] = v;
    fs.writeFile(FILE, JSON.stringify(out), () => {});
  }, 1000);
}

const inflight = new Map();
const failed = new Map();
export async function cached(key, ttlSeconds, loader) {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  if (inflight.has(key)) return inflight.get(key);
  const fail = failed.get(key);
  if (fail && fail.until > Date.now() && lane.getStore() !== 'low') throw fail.error; // don't hammer a failing source
  const p = (async () => {
    try {
      const value = await loader();
      store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
      persist();
      return value;
    } catch (e) {
      if (hit) return hit.value; // serve stale data rather than fail
      failed.set(key, { error: e, until: Date.now() + 60_000 });
      throw e;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

// One queue per host with a minimum gap between requests (free tiers are strict).
// Work started inside `background(...)` waits behind anything a visitor asked for.
const lane = new AsyncLocalStorage();
export const background = (fn) => lane.run('low', fn);

export function throttle(host, gapMs) {
  const high = [], low = [];
  let busy = false;
  const pump = async () => {
    if (busy) return;
    busy = true;
    while (high.length || low.length) {
      const job = high.shift() ?? low.shift();
      try { job.resolve(await job.fn()); } catch (e) { job.reject(e); }
      await new Promise((r) => setTimeout(r, gapMs));
    }
    busy = false;
  };
  return (fn) => new Promise((resolve, reject) => {
    (lane.getStore() === 'low' ? low : high).push({ fn, resolve, reject });
    pump();
  });
}

export async function getJson(url, headers = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'StatGoal/0.1', Accept: 'application/json', ...headers },
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} from ${new URL(url).host}`);
    err.status = res.status;
    throw err;
  }
  try {
    return JSON.parse(text);
  } catch {
    const err = new Error(`Non-JSON reply from ${new URL(url).host} (rate limit?)`);
    err.status = 429;
    throw err;
  }
}
