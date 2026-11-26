import { Link } from 'react-router-dom';
import { fmtTime, fmtShort, SOURCE_LABEL, STATIC_MISSING } from '../api.js';

export function Logo({ size = 34 }) {
  return (
    <span className="logo">
      <img src={`${import.meta.env.BASE_URL}icon.svg`} width={size} height={size} alt="" />
      <span className="logo-word" dir="ltr">Stat<b>Goal</b></span>
    </span>
  );
}

export function Crest({ src, name, size = 28 }) {
  if (!src) return <span className="crest crest-empty" style={{ width: size, height: size }}>{name?.[0] ?? '?'}</span>;
  return <img className="crest" src={src} alt="" width={size} height={size} loading="lazy" />;
}

export function Flag({ code, size = 28 }) {
  if (!code || code === 'eu') return <span className="flag flag-eu" style={{ width: size * 1.33, height: size }}>★</span>;
  return <img className="flag" src={`https://flagcdn.com/w80/${code}.png`} alt="" style={{ width: size * 1.33, height: size }} loading="lazy" />;
}

export function Loader({ label = 'جارٍ جلب البيانات من المصادر…' }) {
  return (
    <div className="loader" role="status">
      <span className="loader-bars"><i /><i /><i /></span>
      <span>{label}</span>
    </div>
  );
}

export function ErrorBox({ error }) {
  if (error?.message === STATIC_MISSING) {
    return (
      <div className="notice">
        هذه الصفحة غير متوفرة في النسخة التجريبية على GitHub، فهي تعرض لقطة محفوظة من البيانات وليس الخادم الكامل.
        حمّل التطبيق أو شغّل الخادم لتصفّح كل الفرق واللاعبين والبحث.
      </div>
    );
  }
  return <div className="error-box">تعذّر تحميل البيانات: {error?.message}</div>;
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export function Sources({ list }) {
  if (!list?.length) return null;
  return (
    <span className="sources" title="مصادر هذه المعطيات">
      {list.map((s) => <span key={s} className={`src src-${s}`}>{SOURCE_LABEL[s] ?? s}</span>)}
    </span>
  );
}

export function Notes({ notes, limited }) {
  return (
    <>
      {limited && (
        <div className="notice">
          بعض القوائم مختصرة لأن مصدر الإحصائيات الكاملة (football-data.org) غير مفعّل بعد. أضِف مفتاحه المجاني في ملف <code dir="ltr">.env</code> لعرض الترتيب الكامل والهدافين والنتائج المباشرة.
        </div>
      )}
      {notes?.length > 0 && <div className="notice notice-soft">بعض المصادر لم تستجب الآن، وعُرض ما توفّر: {[...new Set(notes)].join(' · ')}</div>}
    </>
  );
}

const STATUS_AR = { live: 'مباشر', finished: 'انتهت', postponed: 'مؤجلة' };

export function MatchRow({ m, showDate }) {
  const played = m.status === 'finished' || m.status === 'live';
  const team = (t, side) => {
    const body = (
      <>
        <Crest src={t.badge} name={t.name} size={26} />
        <span className="mr-name">{t.name}</span>
      </>
    );
    return t.id
      ? <Link to={`/team/${t.id}`} className={`mr-team mr-${side}`}>{body}</Link>
      : <span className={`mr-team mr-${side}`}>{body}</span>;
  };
  return (
    <div className={`match-row status-${m.status}`}>
      <div className="mr-time">
        {m.status === 'live' ? <span className="live-dot">{m.minute ? `${m.minute}′` : 'مباشر'}</span>
          : m.status === 'scheduled' ? fmtTime(m.kickoff)
          : <span className="mr-state">{STATUS_AR[m.status]}</span>}
        {showDate && <small>{fmtShort(m.kickoff)}</small>}
      </div>
      {team(m.home, 'home')}
      {(() => {
        const score = played ? <><b>{m.home.score ?? '-'}</b><span>:</span><b>{m.away.score ?? '-'}</b></> : <span className="vs">vs</span>;
        return m.id?.startsWith('tsdb-')
          ? <Link to={`/match/${m.id.slice(5)}`} className="mr-score" dir="ltr" title="تفاصيل المباراة">{score}</Link>
          : <div className="mr-score" dir="ltr">{score}</div>;
      })()}
      {team(m.away, 'away')}
      <Sources list={m.sources} />
    </div>
  );
}

export function ArticleCard({ a, compact }) {
  return (
    <a className={`article ${compact ? 'article-compact' : ''}`} href={a.url} target="_blank" rel="noreferrer">
      {a.image && <img src={a.image} alt="" loading="lazy" />}
      <div>
        <span className="article-tag">Opta Analyst</span>
        <h4 dir="ltr">{a.title}</h4>
        {!compact && <p dir="ltr">{a.excerpt}</p>}
        <time>{fmtShort(a.date)}</time>
      </div>
    </a>
  );
}

export function Section({ title, action, children }) {
  return (
    <section className="section">
      <header className="section-head">
        <h2>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

export function Stat({ label, value, accent }) {
  return (
    <div className={`stat ${accent ? 'stat-accent' : ''}`}>
      <b dir="ltr">{value ?? '—'}</b>
      <span>{label}</span>
    </div>
  );
}

export function Form({ form }) {
  if (!form) return <span className="muted">—</span>;
  const map = { W: ['ف', 'w'], D: ['ت', 'd'], L: ['خ', 'l'] };
  return (
    <span className="form">
      {form.slice(-5).split('').map((c, i) => <i key={i} className={`f-${map[c]?.[1] ?? 'x'}`}>{map[c]?.[0] ?? c}</i>)}
    </span>
  );
}
