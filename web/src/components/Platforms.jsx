import { useEffect, useState } from 'react';
import { API, STATIC, api } from '../api.js';

// The StatGoal way to browse other platforms: every item gets one-click jumps to the same item
// on each platform (opened in the visitor's own browser), plus any official embed widget the
// site owner linked. Nothing is fetched from those platforms by our server.
export const PLATFORMS = [
  { id: 'sofascore', name: 'Sofascore', site: 'sofascore.com', color: '#374DF5' },
  { id: 'flashscore', name: 'Flashscore', site: 'flashscore.com', color: '#FF0046' },
  { id: 'whoscored', name: 'WhoScored', site: 'whoscored.com', color: '#7AB648' },
  { id: 'theanalyst', name: 'Opta Analyst', site: 'theanalyst.com', color: '#C0262D' },
];

// "\" in DuckDuckGo jumps straight to the first result: the item's own page on that platform.
export const platformUrl = (p, query) =>
  `https://duckduckgo.com/?q=${encodeURIComponent(`\\${query} site:${p.site}`)}`;

const TOKEN_KEY = 'statgoal-admin';

export function PlatformLinks({ query, compact }) {
  return (
    <div className={`plinks ${compact ? 'plinks-compact' : ''}`}>
      {PLATFORMS.map((p) => (
        <a key={p.id} href={platformUrl(p, query)} target="_blank" rel="noreferrer" style={{ '--pc': p.color }} title={`افتح «${query}» في ${p.name}`}>
          <i />{p.name}
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
        </a>
      ))}
    </div>
  );
}

export default function PlatformHub({ kind, id, query, title = 'تصفّح المنصّات' }) {
  const [embeds, setEmbeds] = useState([]);
  const [tab, setTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '');
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let alive = true;
    api(`/embeds/${kind}/${id}`).then((d) => alive && Array.isArray(d) && setEmbeds(d)).catch(() => {});
    return () => { alive = false; };
  }, [kind, id]);

  const call = async (method, path, body) => {
    const res = await fetch(`${API}/embeds/${kind}/${id}${path}`, {
      method, headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: body && JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem(TOKEN_KEY, token);
    return data;
  };

  const addEmbed = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const list = await call('POST', '', { code, title: label });
      setEmbeds(list); setTab(list.length - 1); setCode(''); setLabel('');
      setMsg({ ok: true, text: 'أُضيفت الأداة.' });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  };

  const removeEmbed = async (i) => {
    try {
      const list = await call('DELETE', `/${i}`);
      setEmbeds(list); setTab(0);
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  };

  const current = embeds[tab];
  const pinfo = (pid) => PLATFORMS.find((p) => p.id === pid);

  return (
    <section className="section hub">
      <header className="section-head">
        <h2>{title}</h2>
        {!STATIC && <button className="linkbtn" onClick={() => setEditing((v) => !v)}>{editing ? 'إغلاق' : 'ربط أداة رسمية'}</button>}
      </header>

      <p className="hub-lead">افتح «<b dir="ltr">{query}</b>» مباشرة في:</p>
      <PlatformLinks query={query} />

      {embeds.length > 0 && (
        <div className="hub-embeds">
          <div className="tabs tabs-sm" role="tablist">
            {embeds.map((e, i) => (
              <button key={e.src} role="tab" aria-selected={tab === i} className={tab === i ? 'on' : ''} onClick={() => setTab(i)} style={{ '--pc': pinfo(e.platform)?.color }}>
                <i className="pdot" />{e.title || pinfo(e.platform)?.name}
              </button>
            ))}
          </div>
          {current && (
            <div className="embed-frame">
              <iframe
                key={current.src}
                src={current.src}
                title={current.title || current.platform}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-popups"
                style={{ height: current.height || 560 }}
              />
              <small>أداة رسمية من {pinfo(current.platform)?.name}، تُعرض كما يقدّمها الموقع.</small>
              {editing && <button className="linkbtn danger" onClick={() => removeEmbed(tab)}>إزالة هذه الأداة</button>}
            </div>
          )}
        </div>
      )}

      {editing && (
        <form className="embed-form" onSubmit={addEmbed}>
          <p>
            في صفحة هذا العنصر على Sofascore اضغط <b>Embed</b> (أو استعمل أداة Flashscore الرسمية)، انسخ الكود وألصقه هنا.
            يُقبل فقط كود من نطاقات المنصات الرسمية.
          </p>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} dir="ltr" rows={3} placeholder='<iframe src="https://widgets.sofascore.com/…"></iframe>' required />
          <div className="embed-form-row">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="اسم التبويب (مثلًا: التشكيلة)" />
            <input value={token} onChange={(e) => setToken(e.target.value)} type="password" placeholder="رمز الإدارة" dir="ltr" required />
            <button>ربط</button>
          </div>
          {msg && <div className={msg.ok ? 'notice' : 'error-box'}>{msg.text}</div>}
        </form>
      )}
    </section>
  );
}
