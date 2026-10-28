import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import {
  AdminAnnouncementsPage,
  AdminCatalogPage,
  AdminMessagesPage,
  AdminSchedulePage,
  AdminUsersPage
} from '@/pages/admin/AdminPages';
import {
  TeacherDayPage,
  TeacherHomeworkPage,
  TeacherLessonPage,
  TeacherMessagesPage,
  TeacherNotebookPage,
  TeacherSubmissionsPage,
  TeacherWeekPage
} from '@/pages/teacher/TeacherPages';
import {
  DaySchedulePage,
  HomeworkDetailPage,
  HomeworkListPage,
  MySubmissionsPage,
  StudentNotebookPage,
  WeekSchedulePage
} from '@/pages/student/StudentPages';
import { paths } from './paths';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleHomeRedirect } from './RoleHomeRedirect';
import { RoleRoute } from './RoleRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={paths.login} element={<LoginPage />} />
      <Route path={paths.register} element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RoleHomeRedirect />} />
          <Route path={paths.forbidden} element={<ForbiddenPage />} />
          <Route path={paths.notifications} element={<NotificationsPage />} />

          <Route element={<RoleRoute allowed={['STUDENT']} />}>
            <Route path={paths.student}>
              <Route index element={<WeekSchedulePage />} />
              <Route path="day/:dayOfWeek" element={<DaySchedulePage />} />
              <Route path="homework" element={<HomeworkListPage />} />
              <Route path="homework/:id" element={<HomeworkDetailPage />} />
              <Route path="submissions" element={<MySubmissionsPage />} />
              <Route path="notebook" element={<StudentNotebookPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowed={['TEACHER']} />}>
            <Route path={paths.teacher}>
              <Route index element={<TeacherWeekPage />} />
              <Route path="day/:dayOfWeek" element={<TeacherDayPage />} />
              <Route path="lesson/:id" element={<TeacherLessonPage />} />
              <Route path="homework" element={<TeacherHomeworkPage />} />
              <Route path="submissions" element={<TeacherSubmissionsPage />} />
              <Route path="notebook" element={<TeacherNotebookPage />} />
              <Route path="messages" element={<TeacherMessagesPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowed={['ADMIN']} />}>
            <Route path={paths.admin}>
              <Route index element={<AdminSchedulePage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="catalog" element={<AdminCatalogPage />} />
              <Route path="announcements" element={<AdminAnnouncementsPage />} />
              <Route path="messages" element={<AdminMessagesPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
