import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';

// Create a test query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Don't retry failed queries in tests
    },
  },
});

// Mock the useDashboardData hook
jest.mock('../hooks/useDashboardData', () => ({
  useDashboardData: jest.fn(() => ({
    data: {
      totalValue: 125000.50,
      dailyProfit: 1250.75,
      annualReturn: 12.5,
      currency: 'USD',
      lastUpdated: new Date(),
      allocationByCategory: [
        {
          categoryName: 'US Equities',
          percentage: 62.5,
          value: 78125.31,
        },
        {
          categoryName: 'International Equities',
          percentage: 20.0,
          value: 25000.10,
        },
        {
          categoryName: 'Fixed Income',
          percentage: 10.0,
          value: 12500.05,
        },
        {
          categoryName: 'Commodities',
          percentage: 5.0,
          value: 6250.02,
        },
        {
          categoryName: 'Cash',
          percentage: 2.5,
          value: 3125.01,
        },
      ],
      topPerformingAssets: [
        {
          id: 'asset-1',
          userId: 'user-1',
          portfolioId: 'portfolio-1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          quantity: 10,
          costBasis: 150.25,
          dailyProfit: 250.5,
          currentPrice: 175.75,
          currency: 'USD',
          brokerSource: 'BrokerA',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
    isLoading: false,
    error: null,
  })),
}));

// Mock the i18n hook
jest.mock('../lib/i18n', () => ({
  useI18n: jest.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'dashboard.title': 'Dashboard',
        'dashboard.totalValue': 'Total Value',
        'dashboard.dailyProfit': 'Daily Profit',
        'dashboard.annualReturn': 'Annual Return',
        'dashboard.allocationChart': 'Allocation Chart',
        'dashboard.topPerformers': 'Top Performers',
        'common.symbol': 'Symbol',
        'common.name': 'Name',
        'common.dailyProfit': 'Daily Profit',
        'settings.currency': 'Display Currency',
      };
      return translations[key] || key;
    },
    language: 'en',
    changeLanguage: jest.fn(),
    supportedLanguages: ['en', 'zh'] as const,
  })),
}));

describe('DashboardPage Component', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          {ui}
        </QueryClientProvider>
      </MemoryRouter>
    );
  };

  it('renders dashboard title', async () => {
    renderWithProviders(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('displays summary cards with correct values', async () => {
    renderWithProviders(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/\$125,000\.50/)).toBeInTheDocument(); // Total value
      expect(screen.getByText(/\$1,250\.75/)).toBeInTheDocument(); // Daily profit
      expect(screen.getByText(/12\.50%/)).toBeInTheDocument(); // Annual return
    });
  });

  it('shows allocation chart section', async () => {
    renderWithProviders(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Allocation Chart')).toBeInTheDocument();
    });
  });

  it('displays top performing assets table', async () => {
    renderWithProviders(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Top Performers')).toBeInTheDocument();
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    });
  });

  it('includes currency selector', async () => {
    renderWithProviders(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Display Currency:')).toBeInTheDocument();
    });
  });
});