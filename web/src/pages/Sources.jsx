import { useApi } from '../api.js';
import { ErrorBox, Loader } from '../components/ui.jsx';

export default function SourcesPage() {
  const { data, error, loading } = useApi('/sources');
  return (
    <>
      <div className="hero">
        <h1>المصادر</h1>
        <p>يدمج StatGoal معطيات من عدّة مصادر مفتوحة أو مرخّصة. كل نتيجة وجدول ورقم في الموقع يحمل اسم مصدره.</p>
      </div>
      {loading && <Loader label="جارٍ فحص المصادر…" />}
      {error && <ErrorBox error={error} />}
      <div className="sources-list">
        {data?.map((s) => (
          <div key={s.id} className={`source-card ${s.ok ? 'ok' : s.unavailable ? 'off' : 'warn'}`}>
            <span className="dot" />
            <div>
              <b dir="ltr">{s.name}</b>
              <span>{s.role}</span>
              <small>{s.note}</small>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
