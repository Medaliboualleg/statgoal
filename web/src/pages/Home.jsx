import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, isoDay, fmtDay } from '../api.js';
import { ArticleCard, Crest, Empty, ErrorBox, Flag, Loader, MatchRow, Notes, Section } from '../components/ui.jsx';

export default function Home() {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i - 3); return isoDay(d);
  }), []);
  const [date, setDate] = useState(days[3]);
  const [liveOnly, setLiveOnly] = useState(false);
  const { data, error, loading } = useApi(`/matches?date=${date}`);
  const articles = useApi('/articles');

  const groups = (data?.groups ?? [])
    .map((g) => ({ ...g, matches: liveOnly ? g.matches.filter((m) => m.status === 'live') : g.matches }))
    .filter((g) => g.matches.length);
  const total = groups.reduce((n, g) => n + g.matches.length, 0);

  return (
    <div className="grid-home">
      <div>
        <div className="hero">
          <h1>مباريات {date === days[3] ? 'اليوم' : fmtDay(date)}</h1>
          <p>نتائج ومواعيد مدمجة من عدّة مصادر، مع تحليلات Opta.</p>
        </div>

        <div className="daystrip" role="tablist">
          {days.map((d, i) => (
            <button key={d} role="tab" aria-selected={d === date} className={d === date ? 'on' : ''} onClick={() => setDate(d)}>
              <span>{i === 3 ? 'اليوم' : i === 2 ? 'أمس' : i === 4 ? 'غدًا' : fmtDay(d, { day: undefined, month: undefined })}</span>
              <b>{new Date(d).getDate()}</b>
            </button>
          ))}
          <label className="toggle">
            <input type="checkbox" checked={liveOnly} onChange={(e) => setLiveOnly(e.target.checked)} />
            <span>المباشر فقط</span>
          </label>
        </div>

        {loading && <Loader />}
        {error && <ErrorBox error={error} />}
        {data && <Notes notes={data.notes} />}
        {data && !total && <Empty>{liveOnly ? 'لا مباريات مباشرة الآن.' : 'لا مباريات مسجّلة في هذا اليوم ضمن المصادر المتاحة.'}</Empty>}

        {groups.map((g) => (
          <section key={g.key ?? g.name} className="comp-block">
            <header className="comp-head">
              {g.country ? <Flag code={g.country} size={16} /> : <Crest src={g.badge} name={g.name} size={20} />}
              {g.key ? <Link to={`/competition/${g.key}`}>{g.name}</Link> : <span>{g.name}</span>}
              <small>{g.matches.length}</small>
            </header>
            {g.matches.map((m) => <MatchRow key={m.id} m={m} />)}
          </section>
        ))}
      </div>

      <aside className="side">
        <Section title="أحدث تحليلات Opta">
          {articles.loading && <Loader label="جارٍ جلب التحليلات…" />}
          {articles.data?.slice(0, 6).map((a) => <ArticleCard key={a.id} a={a} compact />)}
        </Section>
      </aside>
    </div>
  );
}
