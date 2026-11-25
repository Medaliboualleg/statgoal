import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './components/ui.jsx';
import Home from './pages/Home.jsx';
import Competitions from './pages/Competitions.jsx';
import Competition from './pages/Competition.jsx';
import Team from './pages/Team.jsx';
import Player from './pages/Player.jsx';
import National from './pages/National.jsx';
import Search from './pages/Search.jsx';
import SourcesPage from './pages/Sources.jsx';
import Match from './pages/Match.jsx';

const NAV = [
  ['/', 'المباريات', 'M4 6h16M4 12h16M4 18h10'],
  ['/competitions', 'البطولات', 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3'],
  ['/national', 'المنتخبات', 'M5 21V4M5 4h11l-2 4 2 4H5'],
  ['/search', 'تصفّح','M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3'],
];

function Icon({ d }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

export default function App() {
  const nav = useNavigate();
  const loc = useLocation();
  const [q, setQ] = useState('');
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="wrap topbar-in">
          <NavLink to="/" className="brand" aria-label="StatGoal"><Logo /></NavLink>
          <nav className="topnav">
            {NAV.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
          </nav>
          <form className="topsearch" onSubmit={(e) => { e.preventDefault(); if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`); }}>
            <Icon d={NAV[3][2]} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن لاعب أو فريق (بالإنجليزية)" />
          </form>
        </div>
      </header>

      <main className="wrap main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/competition/:key" element={<Competition />} />
          <Route path="/team/:id" element={<Team />} />
          <Route path="/player/:id" element={<Player />} />
          <Route path="/match/:id" element={<Match />} />
          <Route path="/national" element={<National />} />
          <Route path="/search" element={<Search />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="*" element={<div className="empty">الصفحة غير موجودة.</div>} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="wrap footer-in">
          <Logo size={26} />
          <p>معطيات مدمجة من TheSportsDB وfootball-data.org، وتحليلات من The Analyst (Opta). كل رقم يحمل اسم مصدره.</p>
          <NavLink to="/sources">المصادر وحالتها</NavLink>
        </div>
      </footer>

      <nav className="tabbar">
        {NAV.map(([to, label, d]) => (
          <NavLink key={to} to={to} end={to === '/'}><Icon d={d} /><span>{label}</span></NavLink>
        ))}
      </nav>
    </div>
  );
}
