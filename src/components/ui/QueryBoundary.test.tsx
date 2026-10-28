import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QueryBoundary } from './QueryBoundary';

type Q = Parameters<typeof QueryBoundary<string[]>>[0]['query'];

const query = (over: Partial<Q>): Q => ({
  isPending: false,
  isError: false,
  error: null,
  data: undefined,
  refetch: vi.fn(),
  ...over
}) as Q;

const renderList = (q: Q) =>
  render(
    <QueryBoundary query={q} isEmpty={(d) => d.length === 0} emptyMessage="אין פריטים" loadingLabel="טוענת פריטים...">
      {(items) => <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>}
    </QueryBoundary>
  );

describe('QueryBoundary', () => {
  it('מציג טעינה', () => {
    renderList(query({ isPending: true }));
    expect(screen.getByRole('status')).toHaveTextContent('טוענת פריטים...');
  });

  it('מציג שגיאה ומאפשר לנסות שוב', () => {
    const refetch = vi.fn();
    renderList(query({ isError: true, error: new Error('השרת לא זמין'), refetch } as Partial<Q>));
    expect(screen.getByRole('alert')).toHaveTextContent('השרת לא זמין');
    fireEvent.click(screen.getByRole('button', { name: 'נסי שוב' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('מציג הודעה כשהרשימה ריקה', () => {
    renderList(query({ data: [] }));
    expect(screen.getByText('אין פריטים')).toBeInTheDocument();
  });

  it('מציג את התוכן כשיש נתונים', () => {
    renderList(query({ data: ['א', 'ב'] }));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
