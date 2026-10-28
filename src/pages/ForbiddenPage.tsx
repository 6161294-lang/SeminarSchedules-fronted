import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';

export function ForbiddenPage() {
  return (
    <>
      <PageHeader title="אין לך הרשאה" subtitle="המסך הזה אינו זמין לתפקיד שלך." />
      <Link to="/">חזרה למסך הבית</Link>
    </>
  );
}
