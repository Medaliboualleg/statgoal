// Competitions StatGoal follows. tsdb = TheSportsDB league id, fd = football-data.org code,
// analyst = The Analyst category id (see sources/theAnalyst.js).
export const COMPETITIONS = [
  { key: 'PL', nameAr: 'الدوري الإنجليزي', name: 'Premier League', country: 'gb-eng', tsdb: 4328, fd: 'PL', analyst: 23, season: '2025-2026' },
  { key: 'PD', nameAr: 'الدوري الإسباني', name: 'La Liga', country: 'es', tsdb: 4335, fd: 'PD', analyst: 21, season: '2025-2026' },
  { key: 'SA', nameAr: 'الدوري الإيطالي', name: 'Serie A', country: 'it', tsdb: 4332, fd: 'SA', analyst: 24, season: '2025-2026' },
  { key: 'BL1', nameAr: 'الدوري الألماني', name: 'Bundesliga', country: 'de', tsdb: 4331, fd: 'BL1', analyst: 19, season: '2025-2026' },
  { key: 'FL1', nameAr: 'الدوري الفرنسي', name: 'Ligue 1', country: 'fr', tsdb: 4334, fd: 'FL1', analyst: 22, season: '2025-2026' },
  { key: 'CL', nameAr: 'دوري أبطال أوروبا', name: 'Champions League', country: 'eu', tsdb: 4480, fd: 'CL', analyst: 20, season: '2025-2026' },
  { key: 'SPL', nameAr: 'الدوري السعودي', name: 'Saudi Pro League', country: 'sa', tsdb: 4668, fd: null, analyst: null, season: '2025-2026' },
  { key: 'BOT', nameAr: 'البطولة المغربية', name: 'Botola Pro', country: 'ma', tsdb: 4500, fd: null, analyst: null, season: '2025-2026' },
];

export const byKey = (k) => COMPETITIONS.find((c) => c.key === k);
export const byTsdb = (id) => COMPETITIONS.find((c) => String(c.tsdb) === String(id));
export const byFd = (code) => COMPETITIONS.find((c) => c.fd === code);

// National teams shown on the منتخبات page (name as TheSportsDB knows it, flag iso2).
export const NATIONAL_TEAMS = [
  ['المغرب', 'Morocco', 'ma'], ['تونس', 'Tunisia', 'tn'], ['الجزائر', 'Algeria', 'dz'], ['مصر', 'Egypt', 'eg'],
  ['السعودية', 'Saudi Arabia', 'sa'], ['قطر', 'Qatar', 'qa'], ['الأردن', 'Jordan', 'jo'], ['العراق', 'Iraq', 'iq'],
  ['السنغال', 'Senegal', 'sn'], ['نيجيريا', 'Nigeria', 'ng'], ['فرنسا', 'France', 'fr'], ['إسبانيا', 'Spain', 'es'],
  ['إنجلترا', 'England', 'gb-eng'], ['ألمانيا', 'Germany', 'de'], ['البرتغال', 'Portugal', 'pt'], ['إيطاليا', 'Italy', 'it'],
  ['هولندا', 'Netherlands', 'nl'], ['بلجيكا', 'Belgium', 'be'], ['البرازيل', 'Brazil', 'br'], ['الأرجنتين', 'Argentina', 'ar'],
  ['أوروغواي', 'Uruguay', 'uy'], ['الولايات المتحدة', 'USA', 'us'], ['المكسيك', 'Mexico', 'mx'], ['اليابان', 'Japan', 'jp'],
].map(([nameAr, name, flag]) => ({ nameAr, name, flag }));
