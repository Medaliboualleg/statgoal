import { Link, useParams } from 'react-router-dom';
import { useApi, posAr, age, fmtDay } from '../api.js';
import { ArticleCard, Crest, Empty, ErrorBox, Loader, Notes, Section, Sources, Stat } from '../components/ui.jsx';
import PlatformHub from '../components/Platforms.jsx';

export default function Player() {
  const { id } = useParams();
  const { data, error, loading } = useApi(`/players/${id}`);
  if (loading) return <Loader />;
  if (error) return <ErrorBox error={error} />;
  const { player: p, team, season, articles, competition } = data;

  return (
    <>
      <div className="profile profile-player">
        {p.photo ? <img className="profile-photo" src={p.photo} alt="" /> : <span className="profile-photo pcard-ph" />}
        <div className="profile-info">
          <h1 dir="ltr">{p.name}</h1>
          <p>
            {team ? <Link to={`/team/${team.id}`}><Crest src={team.badge} name={team.name} size={20} /> {team.name}</Link> : p.team.name}
            {p.nationality && <> · {p.nationality}</>}
          </p>
          <div className="chips">
            <span>{posAr(p.position)}</span>
            {p.number && <span>القميص {p.number}</span>}
            {p.born && <span>{age(p.born)} سنة · {fmtDay(p.born, { weekday: undefined, year: 'numeric' })}</span>}
            {p.height && <span dir="ltr">{p.height}</span>}
            {p.foot && <span>القدم: {p.foot}</span>}
          </div>
        </div>
      </div>

      <Notes notes={data.notes} />

      <Section title={`أرقام الموسم${competition ? ` — ${competition.nameAr}` : ''}`} action={season && <Sources list={season.sources} />}>
        {season ? (
          <div className="stats-row">
            <Stat label="أهداف" value={season.goals} accent />
            <Stat label="صناعة" value={season.assists} />
            <Stat label="مباريات" value={season.played} />
            <Stat label="ركلات جزاء" value={season.penalties} />
            <Stat label="معدّل التهديف" value={season.played ? (season.goals / season.played).toFixed(2) : null} />
          </div>
        ) : (
          <Empty>لا أرقام موسمية لهذا اللاعب في المصادر المفعّلة (تُعرض أرقام هدافي البطولات عند تفعيل football-data.org).</Empty>
        )}
      </Section>

      <PlatformHub kind="player" id={p.id} query={p.name} title="اللاعب على المنصّات" />

      {p.description && (
        <Section title="نبذة"><p className="desc" dir="ltr">{p.description.split('\n')[0]}</p></Section>
      )}

      <Section title="تحليلات Opta عن اللاعب">
        {articles.length ? <div className="articles">{articles.map((a) => <ArticleCard key={a.id} a={a} />)}</div> : <Empty>لا تحليلات حديثة.</Empty>}
      </Section>
    </>
  );
}
