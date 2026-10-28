import { useState } from 'react';
import { Button } from './Button';

interface ConfirmButtonProps {
  children: string;
  onConfirm: () => void;
  loading?: boolean;
}

/** כפתור מחיקה בשני שלבים: לחיצה ראשונה מבקשת אישור, והשנייה מבצעת. מונע מחיקה בטעות */
export function ConfirmButton({ children, onConfirm, loading = false }: ConfirmButtonProps) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <Button variant="secondary" onClick={() => setAsking(true)} loading={loading}>
        {children}
      </Button>
    );
  }
  return (
    <span className="confirm">
      <span>בטוחה?</span>
      <Button
        variant="danger"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        כן, {children}
      </Button>
      <Button variant="secondary" onClick={() => setAsking(false)}>
        ביטול
      </Button>
    </span>
  );
}
