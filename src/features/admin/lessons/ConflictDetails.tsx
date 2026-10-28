import type { ApiError } from '@/api/client';
import { conflictReasons } from './conflictReasons';

/** הודעת השגיאה, ובהתנגשות בלוח גם רשימת הסיבות (מורה, כיתה או חדר תפוסים) */
export function ConflictDetails({ error }: { error: ApiError }) {
  const reasons = conflictReasons(error);
  return (
    <>
      {error.message}
      {reasons.length > 0 && (
        <ul>
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
    </>
  );
}
