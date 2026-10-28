import { PageHeader } from '@/components/ui/PageHeader';
import { AnnouncementForm } from '@/features/admin/announcements/AnnouncementForm';
import { AnnouncementHistory } from '@/features/admin/announcements/AnnouncementHistory';
import { CatalogView } from '@/features/admin/catalog/CatalogView';
import { AdminLessonsView } from '@/features/admin/lessons/AdminLessonsView';
import { AdminMessagesView } from '@/features/admin/messages/AdminMessagesView';
import { UsersView } from '@/features/admin/users/UsersView';

// כל עמוד של המזכירה: כותרת, ואז הרכיב שמטפל בתוכן. הלוגיקה נמצאת ב-features/admin

export function AdminSchedulePage() {
  return (
    <>
      <PageHeader
        title="לוח זמנים"
        subtitle="כל השיעורים. כל שינוי שולח התראה לתלמידות ולמורה הרלוונטיות"
      />
      <AdminLessonsView />
    </>
  );
}

export function AdminUsersPage() {
  return (
    <>
      <PageHeader title="משתמשים" subtitle="פתיחת חשבונות, עריכה, השבתה ואיפוס סיסמה" />
      <UsersView />
    </>
  );
}

export function AdminCatalogPage() {
  return (
    <>
      <PageHeader title="כיתות ומקצועות" subtitle="הרשימות שמהן בוחרים בלוח הזמנים ובחשבונות" />
      <CatalogView />
    </>
  );
}

export function AdminAnnouncementsPage() {
  return (
    <>
      <PageHeader title="הודעות" subtitle="הודעה לכל התלמידות, לכל המורות, למחזור או לכיתה" />
      <AnnouncementForm />
      <h2>הודעות שנשלחו</h2>
      <AnnouncementHistory />
    </>
  );
}

export function AdminMessagesPage() {
  return (
    <>
      <PageHeader title="שיחות עם מורות" subtitle="שיחה פרטית עם כל מורה" />
      <AdminMessagesView />
    </>
  );
}
