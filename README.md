# StatGoal

موقع وتطبيق (PWA) لنتائج وإحصائيات كرة القدم: المباريات، الترتيب، الهدافون، الفرق، اللاعبون والمنتخبات، مع تحليلات Opta. الواجهة عربية (RTL) بألوان الهوية: كحلي `#001D39`، أزرق `#0A4174`، سماوي `#7BBDE8`، ورقي `#F1F0EC`، أحمر للمباشر `#C0262D`.

## التشغيل

```powershell
npm run install:all     # مرة واحدة
npm run dev:api         # الخادم على http://localhost:4100
npm run dev:web         # الواجهة على http://localhost:5180
```

النشر: `npm run build` ثم `npm start`، فيخدم الخادم الواجهة المبنية والـ API معًا على المنفذ 4100.

## المصادر

| المصدر | ما يقدّمه | الحالة |
|---|---|---|
| TheSportsDB | الفرق، اللاعبون وصورهم، المباريات بالجولة، الترتيب | يعمل بالمفتاح المجاني `123` (قوائم مختصرة وحدّ صارم للطلبات) |
| football-data.org | نتائج مباشرة، ترتيب كامل، هدافون (أهداف/صناعة/جزاء) | يحتاج مفتاحًا مجانيًا في `.env` → `FOOTBALL_DATA_KEY` |
| The Analyst (Opta) | مقالات وتحليلات مرتبطة بكل بطولة وفريق ولاعب | يعمل (واجهة WordPress العامة) |
| Sofascore / Flashscore / WhoScored | — | غير مستعملة: تحجب الوصول الآلي وشروطها تمنع إعادة النشر. تُضاف فقط عبر ترخيص بيانات رسمي |

كل مباراة وجدول تحمل وسوم مصادرها. الدمج في `server/src/merge.js` يطابق الفرق بالاسم بعد توحيده، ويأخذ النتائج الحيّة من المصدر الأحدث والصور والمعرّفات من TheSportsDB.

## البنية

- `server/src/sources/*` محوّل لكل مصدر، و`competitions.js` البطولات المتابَعة والمنتخبات.
- `server/src/cache.js` تخزين مؤقت في الذاكرة وعلى القرص (`.cache.json`)، وطابور طلبات لكل مصدر يُقدّم طلبات الزوّار على التسخين الخلفي.
- `web/` تطبيق React (Vite)؛ `public/manifest.webmanifest` و`public/sw.js` يجعلانه قابلًا للتثبيت ويعمل دون اتصال بآخر بيانات.

## ملاحظات

- الحدّ المجاني لـ TheSportsDB صارم: بعد تشغيل الخادم يملأ الذاكرة خلال دقيقتين تقريبًا، وقد تظهر رسالة «قيد التحميل» حتى ذلك الحين. مفتاح خاص (`THESPORTSDB_KEY`) يرفع الحدّ ويعطي قوائم كاملة.
- لإضافة بطولة: أضف سطرًا في `competitions.js` (معرّف TheSportsDB، رمز football-data إن وُجد، تصنيف The Analyst).

## تصفّح المنصّات (Sofascore · Flashscore · WhoScored · Opta)

- كل مباراة وفريق ولاعب وبطولة فيها قسم «على المنصّات»: أزرار تفتح العنصر نفسه في كل منصة، في متصفح الزائر. صفحة «تصفّح» تفعل الشيء نفسه لأي بحث.
- **ربط أداة رسمية:** في صفحة العنصر على Sofascore اضغط Embed، انسخ الكود، ثم في StatGoal اضغط «ربط أداة رسمية» وألصقه مع رمز الإدارة (`ADMIN_TOKEN` في `.env`). تُعرض الأداة داخل الصفحة وتُحمَّل مباشرة من المنصة. تُقبل فقط نطاقات المنصات الرسمية، وتُحفظ الروابط في `server/data/embeds.json`.
- لا يجلب الخادم أي بيانات من Sofascore أو Flashscore أو WhoScored.

## تطبيق Android وiOS (Capacitor)

التطبيقان يستعملان نفس واجهة React. المشروعان الأصليان في `web/android` و`web/ios`، والمعرّف `com.statgoal.app`.

1. **عنوان الخادم:** التطبيق يتصل بالعنوان في `web/.env.mobile` (انسخه من `web/.env.mobile.example`) (`VITE_API_BASE`). للتجربة على هاتف في نفس شبكة الـ Wi-Fi: `http://192.168.100.3:4100` (عنوان هذا الحاسوب، مع تشغيل `npm run dev:api` والسماح للمنفذ 4100 في جدار حماية Windows). للنشر: عنوان HTTPS لخادمك المنشور، وأضف أصل موقعك في `CORS_ORIGINS` إن لزم.
2. **مزامنة بعد أي تعديل في الواجهة:** `npm --prefix web run cap:sync`
3. **Android:** ثبّت Android Studio (يأتي بـ JDK وAndroid SDK)، ثم `npm --prefix web run android` لفتح المشروع وتشغيله على هاتف أو محاكي، أو `npm --prefix web run apk` لبناء `web/android/app/build/outputs/apk/debug/app-debug.apk`. للنشر على Google Play: Build → Generate Signed Bundle في Android Studio.
4. **iOS:** يتطلب جهاز Mac مع Xcode (قيد من Apple). انسخ المجلد إلى الـ Mac، ثم `npm --prefix web install` و`npm --prefix web run ios`، وشغّل من Xcode. النشر على App Store يتطلب حساب Apple Developer.
5. **الأيقونات وشاشة البداية:** مصادرها في `web/assets/`؛ بعد تعديلها: `npm --prefix web run icons`. (الأداة تعيد كتابة `public/manifest.webmanifest`؛ أرجع قائمة `icons` بعدها.)

## الربط بـ GitHub

- **شريط التحميل أعلى الموقع** يقرأ آخر إصدار من `github.com/Medaliboualleg/statgoal` (عبر `/api/app-release`، مخزّن 15 دقيقة)، فزر Android يحمّل الـ APK المرفق بأحدث إصدار تلقائيًا. لتغيير المستودع: `GITHUB_REPO` في `.env`.
- **بناء التطبيق على GitHub:** `.github/workflows/android-release.yml` يبني الـ APK ويرفقه بإصدار عند دفع وسم مثل `v0.2.0-beta` (`git tag v0.2.0-beta` ثم `git push origin v0.2.0-beta`)، أو يدويًا من تبويب Actions. اضبط متغيّر المستودع `STATGOAL_API_BASE` على عنوان خادمك المنشور.

## الموقع التجريبي على GitHub Pages

`.github/workflows/pages.yml` يشغّل خادم StatGoal على GitHub، ويحفظ إجاباته ملفات JSON (`server/scripts/snapshot.js`)، وينشر الموقع ثابتًا على `https://medaliboualleg.github.io/statgoal/`. يعمل عند كل دفع إلى `main` ومرة يوميًا ويدويًا من Actions (حوالي ساعة بسبب حدّ الطلبات المجاني). الصفحات المتوفرة: المباريات (±4 أيام)، البطولات، المنتخبات، وصفحات الفرق والمباريات الأبرز؛ البحث الحي وصفحات اللاعبين تتطلب الخادم الكامل. أضف السرّ `FOOTBALL_DATA_KEY` في إعدادات المستودع لترتيب كامل وهدّافين.

تجربة محليًا: `node server/scripts/snapshot.js web/public/data http://localhost:4100`، ثم البناء بـ `VITE_STATIC=1 VITE_BASE=/statgoal/`، ثم `node web/scripts/serve-demo.mjs`.
