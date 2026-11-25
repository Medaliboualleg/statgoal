import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi, posAr } from '../api.js';
import { ArticleCard, Crest, Empty, ErrorBox, Flag, Form, Loader, MatchRow, Notes, Section, Sources } from '../components/ui.jsx';
import PlatformHub from '../components/Platforms.jsx';

const TABS = [['table', 'الترتيب'], ['scorers', 'الهدافون'], ['results', 'النتائج'], ['upcoming', 'القادمة'], ['articles', 'تحليلات'], ['platforms', 'المنصّات']];

export function Table({ rows, highlight }) {
  if (!rows?.length) return <Empty>الترتيب غير متاح حاليًا.</Empty>;
  const groups = [...new Set(rows.map((r) => r.group ?? ''))];
  return groups.map((g) => (
    <div key={g} className="table-wrap">
      {groups.length > 1 && g && <h3 className="table-group">{g}</h3>}
      <table className="table">
        <thead>
          <tr><th>#</th><th className="t-team">الفريق</th><th>لعب</th><th>ف</th><th>ت</th><th>خ</th><th className="hide-sm">له</th><th className="hide-sm">عليه</th><th>فارق</th><th>نقاط</th><th className="hide-sm">آخر 5</th></tr>
        </thead>
        <tbody>
          {rows.filter((r) => (r.group ?? '') === g).map((r) => (
            <tr key={r.team.name} className={String(r.team.id) === String(highlight) ? 'hl' : ''}>
              <td><span className="rank">{r.rank}</span></td>
              <td className="t-team">
                {r.team.id ? <Link to={`/team/${r.team.id}`}><Crest src={r.team.badge} name={r.team.name} size={22} />{r.team.short || r.team.name}</Link>
                  : <span><Crest src={r.team.badge} name={r.team.name} size={22} />{r.team.short || r.team.name}</span>}
              </td>
              <td>{r.played}</td><td>{r.won}</td><td>{r.draw}</td><td>{r.lost}</td>
              <td className="hide-sm">{r.goalsFor}</td><td className="hide-sm">{r.goalsAgainst}</td>
              <td dir="ltr">{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</td>
              <td><b>{r.points}</b></td>
              <td className="hide-sm"><Form form={r.form} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ));
}

export function Scorers({ rows }) {
  if (!rows?.length) return <Empty>قائمة الهدافين تحتاج تفعيل مصدر football-data.org (مفتاح مجاني).</Empty>;
  const max = Math.max(...rows.map((r) => r.goals));
  return (
    <table className="table scorers">
      <thead><tr><th>#</th><th className="t-team">اللاعب</th><th className="hide-sm">المركز</th><th>مباريات</th><th>أهداف</th><th>صناعة</th><th className="hide-sm">ركلات جزاء</th></tr></thead>
      <tbody>
        {rows.map((s, i) => (
          <tr key={s.player.name}>
            <td><span className="rank">{i + 1}</span></td>
            <td className="t-team">
              <Link to={`/search?q=${encodeURIComponent(s.player.name)}`}><Crest src={s.team.badge} name={s.team.name} size={22} />
                <span><b>{s.player.name}</b><small>{s.team.name}</small></span>
              </Link>
            </td>
            <td className="hide-sm">{posAr(s.player.position)}</td>
            <td>{s.played ?? '—'}</td>
            <td><span className="bar" style={{ '--w': `${(s.goals / max) * 100}%` }}><b>{s.goals}</b></span></td>
            <td>{s.assists ?? '—'}</td>
            <td className="hide-sm">{s.penalties ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Competition() {
  const { key } = useParams();
  const [tab, setTab] = useState('table');
  const { data, error, loading } = useApi(`/competitions/${key}`);
  const c = data?.competition;

  return (
    <>
      <div className="hero hero-row">
        {c && <Flag code={c.country} size={40} />}
        <div>
          <h1>{c?.nameAr ?? '…'}</h1>
          {c && <p dir="ltr" className="muted">{c.name}</p>}
        </div>
      </div>
      {loading && <Loader />}
      {error && <ErrorBox error={error} />}
      {data && (
        <>
          <Notes notes={data.notes} limited={data.limited} />
          <div className="tabs" role="tablist">
            {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
          </div>
          {tab === 'table' && (
            <Section title="جدول الترتيب" action={<Sources list={[...new Set(data.table.flatMap((r) => r.sources))]} />}>
              <Table rows={data.table} />
            </Section>
          )}
          {tab === 'scorers' && <Section title="ترتيب الهدافين"><Scorers rows={data.scorers} /></Section>}
          {tab === 'results' && (
            <Section title="آخر النتائج">
              {data.results.length ? data.results.map((m) => <MatchRow key={m.id} m={m} showDate />) : <Empty>لا نتائج.</Empty>}
            </Section>
          )}
          {tab === 'upcoming' && (
            <Section title="المباريات القادمة">
              {data.upcoming.length ? data.upcoming.map((m) => <MatchRow key={m.id} m={m} showDate />) : <Empty>لا مباريات قادمة مسجّلة.</Empty>}
            </Section>
          )}
          {tab === 'platforms' && <PlatformHub kind="competition" id={c.key} query={c.name} title="البطولة على المنصّات" />}
          {tab === 'articles' && (
            <Section title="تحليلات Opta">
              <div className="articles">{data.articles.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
              {!data.articles.length && <Empty>لا تحليلات.</Empty>}
            </Section>
          )}
        </>
      )}
    </>
  );
}
