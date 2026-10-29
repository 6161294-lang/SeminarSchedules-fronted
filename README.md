# Frontend למערכת לוח זמנים לסמינר

אפליקציית React שמתחברת ל־Backend של המערכת (`backend-project`). שלושה תפקידים, מסכים שונים לכל אחד:

| תפקיד | מה אפשר לעשות |
|---|---|
| **תלמידה** | מערכת שבועית ויומית, שיעורי בית עם הגשת קבצים, ההגשות והמשוב, מחברת אישית, התראות |
| **מורה** | מערכת שבועית ויומית, יצירת שיעורי בית לשיעור של היום, הערות אישיות, הגשות עם סינון ומשוב, שיחה עם המזכירה |
| **מזכירה** | ניהול לוח הזמנים (הוספה, העברה, ביטול), משתמשים, כיתות ומקצועות, הודעות לקבוצות, שיחות עם מורות |

## טכנולוגיות

React 19 · TypeScript (strict) · Vite · React Router · React Hook Form + Zod · React Query · Redux Toolkit · Context (הודעות קופצות) · Vitest + Testing Library

## הפעלה במחשב

נדרש Node.js 20 ומעלה, ו־Backend שרץ (ראי `backend-project/README.md`).

```bash
npm install
```

העתיקי את `.env.example` לקובץ בשם `.env`. הוא מגדיר את כתובת ה־Backend, וברירת המחדל מתאימה להרצה מקומית:

```
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev
```

האפליקציה נפתחת ב־http://localhost:5173. משתמשי הדגמה (אחרי `npm run seed` ב־Backend): `secretary@example.com`, `rachel.teacher@example.com`, `miriam.student@example.com`, וסיסמה `Password123!`.

## פקודות

| פקודה | מה היא עושה |
|---|---|
| `npm run dev` | שרת פיתוח |
| `npm run build` | בדיקת טיפוסים ובנייה לתיקיית `dist` |
| `npm run preview` | הפעלת הגרסה הבנויה (כמו בייצור) |
| `npm run typecheck` | בדיקת טיפוסים |
| `npm run lint` | בדיקת קוד (Oxlint) |
| `npm test` | בדיקות יחידה ורכיבים (198) |
| `npm run test:e2e -- <כתובת>` | בדיקות מקצה לקצה מול Backend אמיתי (ראי למטה) |

## מבנה התיקיות

```
src/
  api/          client.ts (fetch אחד לכל האפליקציה), endpoints.ts (כל הקריאות לשרת),
                queryKeys.ts, queryClient.ts, hooks/ (React Query לפי נושא)
  app/          store (Redux), providers, חיבור ה-API ל-Redux
  components/   רכיבים משותפים: ui/ (Button, QueryBoundary...), forms/, layout/, toast/
  features/     הלוגיקה והרכיבים לפי נושא: auth, schedule, homework, submissions,
                notes, messages, notifications, admin/
  hooks/        hooks כלליים (useDebouncedValue)
  pages/        עמודים דקים לכל תפקיד, שמרכיבים רכיבים מ-features
  routes/       הראוטר, הגנה על נתיבים לפי תפקיד, תפריטי ניווט
  types/        טיפוסי ה-API
  utils/        עיצוב תאריכים, הורדת קבצים, "היום" לפי שעון ישראל
e2e/            בדיקות מקצה לקצה
```

## איך ההתחברות עובדת

1. `POST /api/auth/login` מחזיר `sessionKey` (מפתח אקראי). ה־JWT עצמו נשאר בשרת.
2. המפתח נשמר ב־Redux וב־`localStorage` (כדי שרענון הדף לא ינתק), ונשלח בכל בקשה כ־`Authorization: Bearer`.
3. בעלייה של האפליקציה, מפתח שמור נבדק מול השרת (`/api/auth/me`). מפתח שנדחה מנתק, וכשל רשת לא מנתק.
4. תשובת 401 מכל בקשה מנתקת ומנקה את המטמון (`app/setupApi.ts`).
5. ההגנה על נתיבים לפי תפקיד (`RoleRoute`) היא נוחות בממשק בלבד. ההרשאות האמיתיות נבדקות בשרת.

## בדיקות

**בדיקות יחידה ורכיבים** (`npm test`): רצות עם שרת מדומה, בלי Backend. הן בודקות מסכים שלמים: ולידציות בטפסים, מצבי טעינה ושגיאה, הרשאות, העלאת והורדת קבצים, חיפוש ומיון.

**בדיקות מקצה לקצה** (`npm run test:e2e`): מריצות את אותו קוד API שה־React משתמש בו מול Backend אמיתי ומסד PostgreSQL אמיתי. הן **יוצרות** משתמשות, כיתות ושיעורים, ולכן מריצים אותן רק מול מסד נתונים נפרד לבדיקות:

1. צרי מסד ריק, למשל `seminar_e2e`.
2. ב־`backend-project`: הריצי `npx prisma migrate deploy` ואז `npm run seed`, עם `DATABASE_URL` שמצביע על המסד הזה.
3. הפעילי את ה־Backend על המסד הזה, עם `NODE_ENV=test` (מבטל את הגבלת קצב ההתחברות) ופורט פנוי, למשל `PORT=3100`.
4. ב־`frontend`: `npm run test:e2e -- http://localhost:3100`.

הבדיקות מכסות את כל הזרימות: התחברות והתנתקות, הרשאות לכל תפקיד, יצירת לוח זמנים והתנגשויות, ביטול והעברה, שיעורי בית, הגשה והורדת קבצים (כולל שם בעברית), משוב, הערות פרטיות, הודעות, שיחות והתראות. שיעורי בית אפשר ליצור רק ביום שיש בו שיעור, ולכן בשבת הבדיקות של שיעורי הבית מדולגות.

## פריסה

ה־React הוא אתר סטטי (`npm run build` יוצר את `dist`). משתנה הסביבה `VITE_API_URL` נקבע **בזמן הבנייה**, ולכן בפריסה מגדירים אותו בשירות האחסון לכתובת ה־Backend (למשל `https://seminar-schedule-backend.onrender.com`). בצד ה־Backend צריך להוסיף את כתובת האתר ל־`CORS_ORIGINS`. הוראות צעד אחר צעד נמצאות ב־[START-HERE.md](START-HERE.md), והגדרות Render ב־`render.yaml`.
