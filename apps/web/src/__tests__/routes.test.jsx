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

describe('Navigation', () => {
  it('/login rend sans crash', async () => {
    const LoginPage = (await import('@/pages/LoginPage.jsx')).default;
    const { container } = renderWithProviders(<LoginPage />);
    expect(container).toBeInTheDocument();
  });

  it('HomePage rend sans crash', async () => {
    const HomePage = (await import('@/pages/HomePage.jsx')).default;
    const { container } = renderWithProviders(<HomePage />);
    expect(container).toBeInTheDocument();
  });
});
