import { Link, useParams } from 'react-router-dom';
import { useApi, posAr, age } from '../api.js';
import { ArticleCard, Empty, ErrorBox, Form, Loader, MatchRow, Notes, Section, Stat } from '../components/ui.jsx';
import PlatformHub from '../components/Platforms.jsx';

export default function Team() {
  const { id } = useParams();
  const { data, error, loading } = useApi(`/teams/${id}`);
  if (loading) return <Loader />;
  if (error) return <ErrorBox error={error} />;
  const { team, standing, scorers, squad, last, next, articles, competition } = data;

  return (
    <>
      <div className="profile" style={team.colour ? { '--team': team.colour } : undefined}>
        <img className="profile-badge" src={team.badge} alt="" />
        <div className="profile-info">
          <h1 dir="ltr">{team.name}</h1>
          <p>
            {competition ? <Link to={`/competition/${competition.key}`}>{competition.nameAr}</Link> : team.league}
            {team.country && <> · {team.country}</>}
          </p>
          <div className="chips">
            {team.founded && <span>تأسس {team.founded}</span>}
            {team.stadium && <span>الملعب: {team.stadium}</span>}
            {team.capacity && <span>السعة: {team.capacity.toLocaleString('en')}</span>}
          </div>
        </div>
      </div>

      <Notes notes={data.notes} />

      {standing && (
        <div className="stats-row">
          <Stat label="الترتيب" value={standing.rank} accent />
          <Stat label="النقاط" value={standing.points} />
          <Stat label="لعب" value={standing.played} />
          <Stat label="فوز / تعادل / خسارة" value={`${standing.won}-${standing.draw}-${standing.lost}`} />
          <Stat label="الأهداف" value={`${standing.goalsFor}:${standing.goalsAgainst}`} />
          <div className="stat"><Form form={standing.form} /><span>آخر المباريات</span></div>
        </div>
      )}

      <div className="grid-2">
        <Section title="آخر نتيجة">{last.length ? last.map((m) => <MatchRow key={m.id} m={m} showDate />) : <Empty>لا نتائج.</Empty>}</Section>
        <Section title="المباراة القادمة">{next.length ? next.map((m) => <MatchRow key={m.id} m={m} showDate />) : <Empty>لا مباريات قادمة.</Empty>}</Section>
      </div>

      {scorers.length > 0 && (
        <Section title="هدافو الفريق هذا الموسم">
          <div className="mini-list">
            {scorers.map((s) => (
              <div key={s.player.name}><b>{s.player.name}</b><span>{s.goals} أهداف{s.assists != null && ` · ${s.assists} صناعة`}</span></div>
            ))}
          </div>
        </Section>
      )}

      <Section title="اللاعبون">
        {squad.length ? (
          <div className="squad">
            {squad.map((p) => (
              <Link key={p.id} to={`/player/${p.id}`} className="pcard">
                {p.thumb ? <img src={p.thumb} alt="" loading="lazy" /> : <span className="pcard-ph" />}
                <b dir="ltr">{p.name}</b>
                <span>{posAr(p.position)}{age(p.born) ? ` · ${age(p.born)} سنة` : ''}</span>
              </Link>
            ))}
          </div>
        ) : <Empty>قائمة اللاعبين غير متاحة.</Empty>}
      </Section>

      <PlatformHub kind="team" id={team.id} query={team.name} title="الفريق على المنصّات" />

      {team.description && (
        <Section title="نبذة">
          <p className="desc" dir="ltr">{team.description.split('\n')[0]}</p>
        </Section>
      )}

      <Section title="تحليلات Opta عن الفريق">
        {articles.length ? <div className="articles">{articles.map((a) => <ArticleCard key={a.id} a={a} />)}</div> : <Empty>لا تحليلات حديثة.</Empty>}
      </Section>
    </>
  );
}

