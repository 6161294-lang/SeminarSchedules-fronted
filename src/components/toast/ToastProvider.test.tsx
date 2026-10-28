import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from './ToastProvider';
import { useToast } from './useToast';

function Trigger() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.success('נשמר')}>הצלחה</button>
      <button onClick={() => toast.error('נכשל')}>שגיאה</button>
    </>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('ToastProvider', () => {
  it('מציג הודעת הצלחה ומסיר אותה אחרי 4 שניות', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('הצלחה'));
    expect(screen.getByRole('status')).toHaveTextContent('נשמר');

    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(screen.getByText('נשמר')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(screen.queryByText('נשמר')).not.toBeInTheDocument();
  });

  it('הודעת שגיאה היא alert ונשארת 6 שניות', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('שגיאה'));
    expect(screen.getByRole('alert')).toHaveTextContent('נכשל');
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('נכשל')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByText('נכשל')).not.toBeInTheDocument();
  });

  it('אפשר להציג כמה הודעות יחד', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('הצלחה'));
    fireEvent.click(screen.getByText('שגיאה'));
    expect(screen.getByText('נשמר')).toBeInTheDocument();
    expect(screen.getByText('נכשל')).toBeInTheDocument();
  });

  it('useToast מחוץ ל-Provider זורק שגיאה ברורה', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Trigger />)).toThrow('useToast חייב לרוץ בתוך ToastProvider');
    spy.mockRestore();
  });
});
