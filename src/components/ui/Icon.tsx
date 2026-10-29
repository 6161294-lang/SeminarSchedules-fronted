// אייקוני קו פשוטים לתפריט ולכותרת. הצבע נלקח מהטקסט שמסביב
const PATHS = {
  calendar: 'M5.5 4.5h13A2.5 2.5 0 0 1 21 7v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18V7a2.5 2.5 0 0 1 2.5-2.5zM3 9.5h18M8 2.5v4M16 2.5v4',
  homework:
    'M9 4h6M8 4H6.5A2.5 2.5 0 0 0 4 6.5v12A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-12A2.5 2.5 0 0 0 17.5 4H16M8.5 12.5l2.2 2.2 4.8-4.8',
  upload: 'M12 15V3M7.5 7.5 12 3l4.5 4.5M4 14v4.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V14',
  notebook: 'M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 7.5h6M9 11h4',
  messages: 'M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18.5 20a6.5 6.5 0 0 0-3-5.5',
  catalog: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  megaphone: 'M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1zM18 9a4 4 0 0 1 0 6',
  bell: 'M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9M10 20a2.2 2.2 0 0 0 4 0'
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
