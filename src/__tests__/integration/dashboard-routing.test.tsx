/**
 * Integration Tests for Dashboard Page Routing
 * Tests the dashboard page routing logic for different user roles and access modes
 */

/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/app/dashboard/page';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/dashboard'),
}));

// Mock usePermissions hook
jest.mock('@/lib/hooks/usePermissions', () => ({
  usePermissions: jest.fn(),
}));

// Mock dashboard components
jest.mock('@/components/dashboard/hands-off-dashboard', () => {
  return function HandsOffDashboard() {
    return <div data-testid="hands-off-dashboard">Hands-Off Dashboard</div>;
  };
});

jest.mock('@/components/dashboard/ai-only-dashboard', () => {
  return function AIOnlyDashboard() {
    return <div data-testid="ai-only-dashboard">AI-Only Dashboard</div>;
  };
});

jest.mock('@/components/auth/route-guard', () => {
  return function RouteGuard({ children, requiredPermission }: any) {
    return <div data-testid="route-guard">{children}</div>;
  };
});

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('@/components/dashboard/theme-toggle', () => {
  return function ThemeToggle() {
    return <div>Theme Toggle</div>;
  };
});

// Mock chart components
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const { usePermissions } = require('@/lib/hooks/usePermissions');

describe('Dashboard Page Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any);
  });

  describe('AI-Only Client', () => {
    it('should redirect AI-only client to /messages', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'client-123',
            role: 'client',
            accessMode: 'ai-only',
            username: 'aionly_test',
            plan: 'basic',
          },
        },
        status: 'authenticated',
      } as any);

      usePermissions.mockReturnValue({
        isHandsOff: false,
        isAIOnly: true,
        isAgent: false,
        isAdmin: false,
        role: 'client',
        accessMode: 'ai-only',
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/messages');
      });

      // Should show loading state
      expect(screen.getByText('Redirecting...')).toBeInTheDocument();
    });
  });

  describe('Agent User', () => {
    it('should redirect agent user to /workflows', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'agent-123',
            role: 'agent',
            username: 'agent_test',
            plan: 'premium',
          },
        },
        status: 'authenticated',
      } as any);

      usePermissions.mockReturnValue({
        isHandsOff: false,
        isAIOnly: false,
        isAgent: true,
        isAdmin: false,
        role: 'agent',
        accessMode: undefined,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/workflows');
      });

      // Should show loading state
      expect(screen.getByText('Redirecting...')).toBeInTheDocument();
    });
  });

  describe('Hands-Off Client', () => {
    it('should render hands-off dashboard', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'client-123',
            role: 'client',
            accessMode: 'hands-off',
            username: 'handsoff_test',
            plan: 'basic',
          },
        },
        status: 'authenticated',
      } as any);

      usePermissions.mockReturnValue({
        isHandsOff: true,
        isAIOnly: false,
        isAgent: false,
        isAdmin: false,
        role: 'client',
        accessMode: 'hands-off',
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('hands-off-dashboard')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Self-Service Client', () => {
    it('should render self-service dashboard', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'client-123',
            role: 'client',
            accessMode: 'self-service',
            username: 'selfservice_test',
            plan: 'premium',
            name: 'Test User',
          },
        },
        status: 'authenticated',
      } as any);

      usePermissions.mockReturnValue({
        isHandsOff: false,
        isAIOnly: false,
        isAgent: false,
        isAdmin: false,
        role: 'client',
        accessMode: 'self-service',
      });

      // Mock fetch for dashboard data
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          portfolio: { totalValue: 50000, totalGainLoss: 5000, gainLossPercent: 10 },
          expenses: { monthlyTotal: 3000, budgetRemaining: 2000, categories: [] },
          health: { upcomingAppointments: 2, prescriptionAlerts: 1 },
          insurance: { activeClaims: 0, upcomingRenewals: 1 },
        }),
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should not redirect
      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Admin User', () => {
    it('should render self-service dashboard for admin', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'admin-123',
            role: 'admin',
            username: 'admin_test',
            plan: 'elite',
            name: 'Admin User',
          },
        },
        status: 'authenticated',
      } as any);

      usePermissions.mockReturnValue({
        isHandsOff: false,
        isAIOnly: false,
        isAgent: false,
        isAdmin: true,
        role: 'admin',
        accessMode: undefined,
      });

      // Mock fetch for dashboard data
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          portfolio: { totalValue: 50000, totalGainLoss: 5000, gainLossPercent: 10 },
          expenses: { monthlyTotal: 3000, budgetRemaining: 2000, categories: [] },
          health: { upcomingAppointments: 2, prescriptionAlerts: 1 },
          insurance: { activeClaims: 0, upcomingRenewals: 1 },
        }),
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should not redirect
      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Unauthenticated User', () => {
    it('should return null when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      usePermissions.mockReturnValue({
        isHandsOff: false,
        isAIOnly: false,
        isAgent: false,
        isAdmin: false,
        role: 'client',
        accessMode: undefined,
        isAuthenticated: false,
      });

      const { container } = render(<DashboardPage />);

      expect(container.firstChild).toBeNull();
    });
  });
});

