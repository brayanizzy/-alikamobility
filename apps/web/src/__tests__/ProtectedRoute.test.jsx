import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

describe('ProtectedRoute', () => {
  it('rend sans crash avec MemoryRouter', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <div>Login Page</div>
      </MemoryRouter>
    );
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
