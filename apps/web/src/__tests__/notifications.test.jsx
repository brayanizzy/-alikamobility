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

describe('NotificationsPage', () => {
  it('rend sans crash', async () => {
    const NotificationsPage = (await import('@/pages/NotificationsPage.jsx')).default;
    const { container } = renderWithProviders(<NotificationsPage />);
    expect(container).toBeInTheDocument();
  });
});

describe('NotificationSendPage', () => {
  it('rend sans crash', async () => {
    const NotificationSendPage = (await import('@/pages/NotificationSendPage.jsx')).default;
    const { container } = renderWithProviders(<NotificationSendPage />);
    expect(container).toBeInTheDocument();
  });
});
