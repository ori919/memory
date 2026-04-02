# Memory — 60s promo (Remotion)

פרויקט [Remotion](https://www.remotion.dev/) נפרד מהאפליקציה ב־Next, כדי לערוך וידאו של **60 שניות** ב־`1920×1080` @ 30fps.

## דרישות

- Node 18+
- בפעם הראשונה שמריצים `render`, Remotion יוריד Chromium לרינדור (נורמלי).

## פקודות

```bash
cd memory-video
npm install
```

**סטודיו (תצוגה מקדימה + טיימליין):**

```bash
npm run dev
```

נפתח דפדפן עם Remotion Studio — שם אפשר לנגן את הקומפוזיציה `MemoryPromo` ולראות את כל 60 השניות.

**ייצוא קובץ וידאו (MP4):**

```bash
npm run render
```

הקובץ יישמר ב־`out/memory-promo.mp4` (התיקייה `out/` נוצרת אוטומטית).

**WebM (אופציונלי):**

```bash
npm run render:webm
```

## מה לערוך

- **`src/MemoryPromo.tsx`** — טקסטים, משכי `Section` (בפריימים: שניות × 30), צבעים, כתובת הדמו בסוף.
- **`src/Root.tsx`** — `fps`, משך בשניות, רזולוציה.

## טיפים להאקתון

1. להחליף את ה־URL בסוף לכתובת הסופית של הדמו.
2. להוסיף **צילומי מסך**: קבצי `public/` בתוך `memory-video` או `staticFile()` מ־Remotion — ראו [Images](https://www.remotion.dev/docs/assets/).
3. להוסיף **מוזיקת רקע**: ראו [Audio](https://www.remotion.dev/docs/audio/).
4. משך שונה מ־60 שניות: עדכן `DURATION_SECONDS` ב־`Root.tsx` ואת ה־`Section` ב־`MemoryPromo.tsx` כך שהסכום יתאים.

## למה לא `create-video` בשורש הריפו?

הפקודה `npx create-video` נכשלת אם כבר בתוך ריפו Git. לכן התיקייה `memory-video/` נוצרה ידנית ועצמאית.
