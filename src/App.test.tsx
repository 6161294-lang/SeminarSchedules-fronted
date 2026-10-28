import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { renderWithProviders } from './test/utils';

describe('App', () => {
  it('משתמשת לא מחוברת רואה את מסך ההתחברות', () => {
    renderWithProviders(<App />, { route: '/' });
    expect(screen.getByRole('heading', { name: 'כניסה למערכת' })).toBeInTheDocument();
    expect(screen.getByLabelText('אימייל')).toBeInTheDocument();
    expect(screen.getByLabelText('סיסמה')).toBeInTheDocument();
  });
});
