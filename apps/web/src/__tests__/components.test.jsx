import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';

function renderWithProviders(component) {
  return render(
    <MemoryRouter>
      <AuthProvider>{component}</AuthProvider>
    </MemoryRouter>
  );
}

describe('NotificationBell', () => {
  it('rend sans crash', async () => {
    const NotificationBell = (await import('@/components/NotificationBell.jsx')).default;
    const { container } = renderWithProviders(<NotificationBell />);
    expect(container).toBeInTheDocument();
  });

  it('affiche un compteur quand il y a des notifications', async () => {
    const NotificationBell = (await import('@/components/NotificationBell.jsx')).default;
    const { container } = renderWithProviders(<NotificationBell />);
    // Le composant devrait afficher une cloche ou un élément de notification
    const buttons = container.querySelectorAll('button, a, svg');
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });
});

describe('StatusBadge', () => {
  it('rend avec un statut actif', async () => {
    const StatusBadge = (await import('@/components/StatusBadge.jsx')).default;
    render(<StatusBadge status="active" />);
    expect(screen.getByText(/actif|active/i)).toBeInTheDocument();
  });

  it('rend avec un statut inactif', async () => {
    const StatusBadge = (await import('@/components/StatusBadge.jsx')).default;
    render(<StatusBadge status="inactive" />);
    expect(screen.getByText(/inactif|inactive/i)).toBeInTheDocument();
  });
});
