import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Login from '../features/auth/Login';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import { useApp } from '../app/AppContext';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock useApp hook to control authentication states easily
vi.mock('../app/AppContext', () => {
  return {
    useApp: vi.fn(),
    AppProvider: ({ children }: any) => <div>{children}</div>
  };
});

describe('Authentication Module Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Component', () => {
    test('renders login fields and quick access portals', () => {
      render(<Login onLogin={vi.fn()} />);

      expect(screen.getByLabelText(/OPERATIONAL EMAIL/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/OPERATIONS PASSPHRASE/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /AUTHENTICATE & ENTER/i })).toBeInTheDocument();
      expect(screen.getByText(/TACTICAL ROLES QUICK PORTAL/i)).toBeInTheDocument();
    });

    test('calls onLogin with custom credentials on form submission', async () => {
      const mockOnLogin = vi.fn();
      render(<Login onLogin={mockOnLogin} />);

      const emailInput = screen.getByLabelText(/OPERATIONAL EMAIL/i);
      const passwordInput = screen.getByLabelText(/OPERATIONS PASSPHRASE/i);
      const submitBtn = screen.getByRole('button', { name: /AUTHENTICATE & ENTER/i });

      fireEvent.change(emailInput, { target: { value: 'security.chief@fifapulse.ai' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith('admin', 'Security Chief Elena');
      }, { timeout: 1000 });
    });

    test('validates required fields on submit', async () => {
      render(<Login onLogin={vi.fn()} />);
      const submitBtn = screen.getByRole('button', { name: /AUTHENTICATE & ENTER/i });
      
      // Submit empty form
      await act(async () => {
        fireEvent.click(submitBtn);
      });
      
      // Checking for validation error message
      expect(screen.getByTestId('login-error')).toBeInTheDocument();
      expect(screen.getByText(/Please fill in all fields./i)).toBeInTheDocument();
    });

    test('calls onLogin with correct roles when quick portals are selected', () => {
      const mockOnLogin = vi.fn();
      render(<Login onLogin={mockOnLogin} />);

      const adminButton = screen.getByRole('button', { name: /admin Security Chief Elena/i });
      fireEvent.click(adminButton);

      expect(mockOnLogin).toHaveBeenCalledWith('admin', 'Security Chief Elena');
    });
  });

  describe('ProtectedRoute Router Guard', () => {
    test('renders loading pulse indicator when app context is loading', () => {
      vi.mocked(useApp).mockReturnValue({
        currentUser: null,
        loading: true,
      } as any);

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<ProtectedRoute />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/SYNCHRONIZING OPERATIONAL TRUST CREDENTIALS.../i)).toBeInTheDocument();
    });

    test('redirects to login path if currentUser is unauthorized', () => {
      vi.mocked(useApp).mockReturnValue({
        currentUser: null,
        loading: false,
      } as any);

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<ProtectedRoute />} />
            <Route path="/login" element={<div>MOCK LOGIN SCREEN</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('MOCK LOGIN SCREEN')).toBeInTheDocument();
    });

    test('renders protected sub-routes when user is authenticated', () => {
      vi.mocked(useApp).mockReturnValue({
        currentUser: { id: 'u1', email: 'director@fifapulse.ai', role: 'operations', name: 'Operations Director' },
        loading: false,
      } as any);

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route index element={<div>SECURE TACTICAL OPERATIONS HUB</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('SECURE TACTICAL OPERATIONS HUB')).toBeInTheDocument();
    });
  });
});
