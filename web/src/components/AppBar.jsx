import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { api } from '../api.js';

// Download bar at the very top of the website. Links come from the latest GitHub release,
// so a new APK published on GitHub appears here without touching the site.
const HIDE_KEY = 'statgoal-appbar-hidden';

const ICON = {
  android: 'M17.6 9.48l1.84-3.18a.38.38 0 0 0-.66-.38l-1.86 3.22A11.4 11.4 0 0 0 12 8.13c-1.75 0-3.4.37-4.92 1.01L5.22 5.92a.38.38 0 0 0-.66.38L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z',
  apple: 'M16.37 12.6c-.02-2.36 1.93-3.5 2.02-3.55-1.1-1.61-2.81-1.83-3.42-1.86-1.46-.15-2.84.86-3.58.86-.74 0-1.88-.84-3.09-.82-1.59.02-3.06.93-3.88 2.35-1.65 2.87-.42 7.12 1.19 9.45.79 1.14 1.72 2.42 2.95 2.37 1.18-.05 1.63-.77 3.06-.77 1.43 0 1.83.77 3.09.74 1.27-.02 2.08-1.16 2.86-2.3.9-1.32 1.27-2.6 1.29-2.66-.03-.01-2.47-.95-2.49-3.77zM14.02 5.6c.65-.79 1.09-1.89.97-2.98-.94.04-2.08.63-2.75 1.41-.6.7-1.13 1.82-.99 2.89 1.05.08 2.12-.53 2.77-1.32z',
  github: 'M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z',
};

const Svg = ({ d }) => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d={d} /></svg>;
const mb = (b) => (b ? `${(b / 1048576).toFixed(1)} MB` : '');

export default function AppBar() {
  const [rel, setRel] = useState(null);
  const [hidden, setHidden] = useState(() => sessionStorage.getItem(HIDE_KEY) === '1');
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform() || hidden) return;
    api('/app-release').then(setRel).catch(() => setRel({ releaseUrl: 'https://github.com/Medaliboualleg/statgoal/releases', repoUrl: 'https://github.com/Medaliboualleg/statgoal' }));
  }, [hidden]);

  if (Capacitor.isNativePlatform() || hidden) return null;

  return (
    <div className="appbar">
      <div className="wrap appbar-in">
        <div className="appbar-text">
          <b>حمّل تطبيق StatGoal</b>
          <span>
            {rel?.version ? <>الإصدار <bdi dir="ltr">{rel.version.replace(/^v/, '')}</bdi>{rel.beta && ' · تجريبي'}</> : 'متوفّر على GitHub'}
          </span>
        </div>

        <div className="appbar-btns">
          <a className="store store-android" href={rel?.android?.url ?? rel?.releaseUrl ?? '#'} download={rel?.android ? 'StatGoal.apk' : undefined} rel="noreferrer">
            <Svg d={ICON.android} />
            <span><small>تحميل لـ</small>Android{rel?.android && <em dir="ltr">{mb(rel.android.size)}</em>}</span>
          </a>
          {rel?.ios ? (
            <a className="store store-ios" href={rel.ios.url} rel="noreferrer"><Svg d={ICON.apple} /><span><small>تحميل لـ</small>iPhone</span></a>
          ) : (
            <button className="store store-ios" onClick={() => setIosHelp((v) => !v)} aria-expanded={iosHelp}>
              <Svg d={ICON.apple} /><span><small>على</small>iPhone</span>
            </button>
          )}
          <a className="store store-gh" href={rel?.releaseUrl ?? '#'} target="_blank" rel="noreferrer" title="الإصدارات والكود على GitHub">
            <Svg d={ICON.github} /><span>GitHub</span>
          </a>
        </div>

        <button className="appbar-x" onClick={() => { sessionStorage.setItem(HIDE_KEY, '1'); setHidden(true); }} aria-label="إخفاء">×</button>
      </div>

      {iosHelp && (
        <div className="wrap appbar-ios">
          تطبيق iPhone قيد التحضير. حتى صدوره، ثبّت StatGoal على شاشتك الرئيسية: افتح الموقع في <b>Safari</b> ← زر <b>المشاركة</b> ← <b>إضافة إلى الشاشة الرئيسية</b>. يعمل كتطبيق كامل الشاشة.
        </div>
      )}
    </div>
  );
}
