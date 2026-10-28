const TIME_ZONE = 'Asia/Jerusalem';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** התאריך (YYYY-MM-DD) והיום בשבוע (0 = ראשון) כפי שהם עכשיו בישראל */
export function israelToday(now: Date = new Date()): { dateString: string; dayOfWeek: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    dateString: `${get('year')}-${get('month')}-${get('day')}`,
    dayOfWeek: WEEKDAYS.indexOf(get('weekday'))
  };
}

/** האם תאריך ההגשה (YYYY-MM-DD) כבר עבר */
export function isPastDue(dueDate: string, now: Date = new Date()): boolean {
  return israelToday(now).dateString > dueDate;
}
