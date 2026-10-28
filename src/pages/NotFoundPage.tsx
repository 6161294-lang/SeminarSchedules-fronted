import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="auth-page">
      <section className="card auth-card">
        <h1>הדף לא נמצא</h1>
        <p>הכתובת שהוזנה אינה קיימת במערכת.</p>
        <Link to="/">חזרה למסך הבית</Link>
      </section>
    </main>
  );
}
