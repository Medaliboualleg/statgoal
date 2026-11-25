import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useApi } from '../api.js';
import { ErrorBox, Flag, Loader } from '../components/ui.jsx';

export default function National() {
  const { data, error, loading } = useApi('/national-teams');
  const [busy, setBusy] = useState(null);
  const [fail, setFail] = useState(null);
  const nav = useNavigate();

  const open = async (t) => {
    setBusy(t.name); setFail(null);
    try {
      const { id } = await api(`/teams/by-name/${encodeURIComponent(t.name)}`);
      nav(`/team/${id}`);
    } catch (e) {
      setFail(`${t.nameAr}: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="hero"><h1>المنتخبات</h1><p>آخر النتائج، المباريات القادمة، اللاعبون وتحليلات Opta لكل منتخب.</p></div>
      {loading && <Loader />}
      {error && <ErrorBox error={error} />}
      {fail && <ErrorBox error={{ message: fail }} />}
      <div className="tiles tiles-nat">
        {data?.map((t) => (
          <button key={t.name} className="tile" onClick={() => open(t)} disabled={busy === t.name}>
            <Flag code={t.flag} size={30} />
            <div><b>{t.nameAr}</b><span dir="ltr">{busy === t.name ? '…' : t.name}</span></div>
          </button>
        ))}
      </div>
    </>
  );
}
