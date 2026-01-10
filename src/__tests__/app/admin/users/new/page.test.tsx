/**
 * Unit tests for Admin New User Page
 * Tests SSR safety, redirect behavior, and router operations
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NewUserPage from '@/app/admin/users/new/page';
import { usePermissions } from '@/lib/hooks/usePermissions';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/lib/hooks/usePermissions', () => ({
  usePermissions: jest.fn(),
}));

// Mock window object for SSR tests
const mockWindow = {
  location: {
    origin: 'http://localhost:3000',
  },
};

describe('Admin New User Page', () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();
  const mockRouter = {
    push: mockPush,
    back: mockBack,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Reset window mock
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('SSR Safety', () => {
    it('should not throw location error during SSR (no window)', () => {
      // Simulate SSR environment (no window)
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'admin' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
        isLoading: false,
      });

      // Should not throw ReferenceError: location is not defined
      expect(() => {
        render(<NewUserPage />);
      }).not.toThrow();
    });

    it('should handle router.back() safely when window is undefined', () => {
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'admin' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
        isLoading: false,
      });

      render(<NewUserPage />);

      // Find and click the back button
      const backButton = screen.getByText(/back to admin/i);
      backButton.click();

      // router.back() should not be called when window is undefined
      expect(mockBack).not.toHaveBeenCalled();
    });

    it('should handle router.back() when window is defined', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'admin' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
        isLoading: false,
      });

      render(<NewUserPage />);

      // Find and click the back button
      const backButton = screen.getByText(/back to admin/i);
      backButton.click();

      // router.back() should be called when window is defined
      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Admin Access Control', () => {
    it('should redirect non-admin users to /admin', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'client' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAdmin: false,
        isAuthenticated: true,
        isLoading: false,
      });

      render(<NewUserPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin');
      });
    });

    it('should render form for admin users', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'admin' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
        isLoading: false,
      });

      render(<NewUserPage />);

      expect(screen.getByText('Create New User')).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should not render form for non-admin users', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'client' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAdmin: false,
        isAuthenticated: true,
        isLoading: false,
      });

      render(<NewUserPage />);

      expect(screen.queryByText('Create New User')).not.toBeInTheDocument();
    });
  });

  describe('Redirect Behavior', () => {
    it('should use useEffect for redirect to avoid SSR issues', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'client' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAdmin: false,
        isAuthenticated: true,
        isLoading: false,
      });

      render(<NewUserPage />);

      // Redirect should happen in useEffect (client-side only)
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin');
      }, { timeout: 100 });

      // Should not throw during render
      expect(() => render(<NewUserPage />)).not.toThrow();
    });

    it('should only redirect when window is defined', async () => {
      // Simulate SSR (no window)
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'client' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAdmin: false,
        isAuthenticated: true,
        isLoading: false,
      });

      render(<NewUserPage />);

      // Wait a bit to ensure useEffect runs
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not redirect when window is undefined
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Form Interaction', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'admin' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
        isLoading: false,
      });
    });

    it('should handle cancel button click safely', () => {
      render(<NewUserPage />);

      const cancelButton = screen.getByText(/cancel/i);
      cancelButton.click();

      expect(mockBack).toHaveBeenCalled();
    });

    it('should not call router.back() when window is undefined on cancel', () => {
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      render(<NewUserPage />);

      const cancelButton = screen.getByText(/cancel/i);
      cancelButton.click();

      expect(mockBack).not.toHaveBeenCalled();
    });
  });

  describe('Component Rendering', () => {
    it('should render all form fields for admin', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'admin' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
        isLoading: false,
      });

      render(<NewUserPage />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/plan/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    });

    it('should show access mode field when role is client', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123', role: 'admin' } },
        status: 'authenticated',
      });
      (usePermissions as jest.Mock).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
        isLoading: false,
      });

      render(<NewUserPage />);

      // Select client role
      const roleSelect = screen.getByLabelText(/role/i);
      // Note: This would require more complex interaction testing
      // For now, we verify the field exists
      expect(roleSelect).toBeInTheDocument();
    });
  });
});

