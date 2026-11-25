import { useEffect, useState } from 'react';

const memo = new Map();

// Web: same origin. Android/iOS app: the server address set in `.env.mobile` (VITE_API_BASE).
export const API = `${import.meta.env.VITE_API_BASE ?? ''}/api`;

export async function api(path) {
  if (memo.has(path) && Date.now() - memo.get(path).at < 60_000) return memo.get(path).data;
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  const data = await res.json();
  memo.set(path, { data, at: Date.now() });
  return data;
}

export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  useEffect(() => {
    if (!path) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState({ data: null, error, loading: false }));
    return () => { alive = false; };
  }, [path]);
  return state;
}

const latn = { numberingSystem: 'latn' };
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString('ar', { ...latn, hour: '2-digit', minute: '2-digit', hour12: false });
export const fmtDay = (iso, opts = {}) => new Date(iso).toLocaleDateString('ar', { ...latn, weekday: 'long', day: 'numeric', month: 'long', ...opts });
export const fmtShort = (iso) => new Date(iso).toLocaleDateString('ar', { ...latn, day: 'numeric', month: 'short' });
export const isoDay = (d) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
export const age = (born) => {
  if (!born) return null;
  const b = new Date(born), n = new Date();
  return n.getFullYear() - b.getFullYear() - (n < new Date(n.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
};

export const SOURCE_LABEL = { thesportsdb: 'TheSportsDB', 'football-data': 'football-data', theanalyst: 'Opta Analyst' };
export const POSITION_AR = {
  Goalkeeper: 'حارس مرمى', Defender: 'مدافع', Midfielder: 'وسط', Forward: 'مهاجم',
  'Centre-Back': 'قلب دفاع', 'Left-Back': 'ظهير أيسر', 'Right-Back': 'ظهير أيمن', 'Defensive Midfield': 'وسط دفاعي',
  'Central Midfield': 'وسط', 'Attacking Midfield': 'وسط هجومي', 'Left Wing': 'جناح أيسر', 'Right Wing': 'جناح أيمن',
  'Centre-Forward': 'رأس حربة', Offence: 'هجوم', Midfield: 'وسط', Defence: 'دفاع', Manager: 'مدرب',
};
export const posAr = (p) => (p && (POSITION_AR[p] ?? p)) || '—';
