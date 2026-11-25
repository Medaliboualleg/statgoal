import { Link } from 'react-router-dom';
import { useApi } from '../api.js';
import { ErrorBox, Flag, Loader } from '../components/ui.jsx';

export default function Competitions() {
  const { data, error, loading } = useApi('/competitions');
  return (
    <>
      <div className="hero"><h1>البطولات</h1><p>الترتيب، الهدافون، النتائج والتحليلات لكل بطولة.</p></div>
      {loading && <Loader />}
      {error && <ErrorBox error={error} />}
      <div className="tiles">
        {data?.map((c) => (
          <Link key={c.key} to={`/competition/${c.key}`} className="tile">
            <Flag code={c.country} size={30} />
            <div><b>{c.nameAr}</b><span dir="ltr">{c.name}</span></div>
          </Link>
        ))}
      </div>
    </>
  );
}
