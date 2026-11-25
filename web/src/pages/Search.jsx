import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi, posAr } from '../api.js';
import { Crest, Empty, ErrorBox, Loader, Notes, Section } from '../components/ui.jsx';
import { PLATFORMS, PlatformLinks } from '../components/Platforms.jsx';

const SUGGEST = ['Hakimi', 'Real Madrid', 'Morocco', 'Mohamed Salah', 'Al Hilal', 'Lamine Yamal'];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [text, setText] = useState(q);
  const { data, error, loading } = useApi(q.length >= 2 ? `/search?q=${encodeURIComponent(q)}` : null);
  const go = (v) => { setText(v); setParams({ q: v.trim() }); };

  return (
    <>
      <div className="hero">
        <h1>تصفّح</h1>
        <p>ابحث مرة واحدة: نتائج StatGoal المدمجة هنا، وبضغطة تنتقل إلى الشيء نفسه في <span dir="ltr">{PLATFORMS.map((p) => p.name).join(' · ')}</span>.</p>
      </div>
      <form className="bigsearch" onSubmit={(e) => { e.preventDefault(); go(text); }}>
        <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Salah, Real Madrid, Morocco…" dir="ltr" />
        <button>بحث</button>
      </form>

      {q.length < 2 && (
        <div className="suggest">
          <span>جرّب:</span>
          {SUGGEST.map((s) => <button key={s} onClick={() => go(s)} dir="ltr">{s}</button>)}
        </div>
      )}

      {q.length >= 2 && (
        <Section title={<>«<span dir="ltr">{q}</span>» على المنصّات</>}>
          <PlatformLinks query={q} />
        </Section>
      )}

      {q.length >= 2 && loading && <Loader />}
      {error && <ErrorBox error={error} />}
      {data && (
        <>
          <Notes notes={data.notes} />
          <Section title="الفرق والمنتخبات في StatGoal">
            {data.teams.length ? (
              <div className="tiles">
                {data.teams.map((t) => (
                  <Link key={t.id} to={`/team/${t.id}`} className="tile">
                    <Crest src={t.badge} name={t.name} size={34} />
                    <div><b dir="ltr">{t.name}</b><span dir="ltr">{t.league}</span></div>
                  </Link>
                ))}
              </div>
            ) : <Empty>لا فرق مطابقة.</Empty>}
          </Section>
          <Section title="اللاعبون في StatGoal">
            {data.players.length ? (
              <div className="squad">
                {data.players.map((p) => (
                  <Link key={p.id} to={`/player/${p.id}`} className="pcard">
                    {p.thumb ? <img src={p.thumb} alt="" loading="lazy" /> : <span className="pcard-ph" />}
                    <b dir="ltr">{p.name}</b>
                    <span>{posAr(p.position)} · <span dir="ltr">{p.team.name}</span></span>
                  </Link>
                ))}
              </div>
            ) : <Empty>لا لاعبين مطابقين.</Empty>}
          </Section>
        </>
      )}
    </>
  );
}
