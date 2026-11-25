import { Link, useParams } from 'react-router-dom';
import { useApi, fmtDay, fmtTime } from '../api.js';
import { ArticleCard, Crest, Empty, ErrorBox, Form, Loader, Notes, Section, Sources, Stat } from '../components/ui.jsx';
import PlatformHub from '../components/Platforms.jsx';

const STATUS_AR = { live: 'مباشر', finished: 'انتهت', postponed: 'مؤجلة', scheduled: 'لم تبدأ' };

function Side({ t }) {
  const body = (
    <>
      <Crest src={t.badge?.replace(/\/tiny$/, '')} name={t.name} size={84} />
      <b dir="ltr">{t.name}</b>
    </>
  );
  return t.id ? <Link to={`/team/${t.id}`} className="mh-team">{body}</Link> : <span className="mh-team">{body}</span>;
}

export default function Match() {
  const { id } = useParams();
  const { data, error, loading } = useApi(`/match/${id}`);
  if (loading) return <Loader />;
  if (error) return <ErrorBox error={error} />;
  const { match: m, standing, articles, competition } = data;
  const played = m.status === 'finished' || m.status === 'live';

  return (
    <>
      <div className={`match-hero status-${m.status}`}>
        <div className="mh-meta">
          {competition ? <Link to={`/competition/${competition.key}`}>{competition.nameAr}</Link> : <span>{m.competition.name}</span>}
          {m.round && <span>الجولة {m.round}</span>}
          <span>{fmtDay(m.kickoff)} · {fmtTime(m.kickoff)}</span>
        </div>
        <div className="mh-main">
          <Side t={m.home} />
          <div className="mh-score" dir="ltr">
            {played ? <><b>{m.home.score ?? '-'}</b><i>:</i><b>{m.away.score ?? '-'}</b></> : <b className="mh-time">{fmtTime(m.kickoff)}</b>}
            <span className="mh-status">{m.status === 'live' && m.minute ? `${m.minute}′` : STATUS_AR[m.status]}</span>
            {m.halfTime?.home != null && <small>الشوط الأول {m.halfTime.home}:{m.halfTime.away}</small>}
          </div>
          <Side t={m.away} />
        </div>
        <div className="mh-meta mh-foot">
          {m.venue && <span>الملعب: {m.venue}{m.city ? ` · ${m.city}` : ''}</span>}
          {m.referee && <span>الحكم: {m.referee}</span>}
          {m.spectators && <span>الجمهور: {m.spectators.toLocaleString('en')}</span>}
          <Sources list={m.sources} />
        </div>
      </div>

      <Notes notes={data.notes} />

      <PlatformHub kind="match" id={m.id} query={`${m.home.name} vs ${m.away.name}`} title="هذه المباراة على المنصّات" />

      {(standing.home || standing.away) && (
        <Section title="مقارنة في الترتيب">
          <div className="versus">
            {[standing.home, standing.away].map((r, i) => (
              <div key={i}>
                {r ? (
                  <>
                    <div className="stats-row">
                      <Stat label="الترتيب" value={r.rank} accent />
                      <Stat label="النقاط" value={r.points} />
                      <Stat label="الأهداف" value={`${r.goalsFor}:${r.goalsAgainst}`} />
                    </div>
                    <Form form={r.form} />
                  </>
                ) : <Empty>غير متاح</Empty>}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="تحليلات Opta">
        {articles.length ? <div className="articles">{articles.map((a) => <ArticleCard key={a.id} a={a} />)}</div> : <Empty>لا تحليلات لهذه المباراة.</Empty>}
      </Section>
    </>
  );
}
