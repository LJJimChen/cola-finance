import React from 'react';
import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Define lazy-loaded components
const DashboardPageLazy = React.lazy(() => import('./pages/DashboardPage'));
const PortfolioPageLazy = React.lazy(() => import('./pages/PortfolioPage'));
const RebalancePageLazy = React.lazy(() => import('./pages/RebalancePage'));
const SettingsPageLazy = React.lazy(() => import('./pages/SettingsPage'));

// Loading component for lazy-loaded routes
const LoadingComponent = () => (
  <div className="flex justify-center items-center h-screen">
    <p>Loading...</p>
  </div>
);

// Define routes with lazy loading
const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <React.Suspense fallback={<LoadingComponent />}>
          {rootRoute.children}
        </React.Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    React.useEffect(() => {
      // Redirect to dashboard on initial load
      window.location.href = '/dashboard';
    }, []);
    return null;
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPageLazy,
});

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/portfolio',
  component: PortfolioPageLazy,
});

const rebalanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rebalance',
  component: RebalancePageLazy,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPageLazy,
});

// Add routes to the router
const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  portfolioRoute,
  rebalanceRoute,
  settingsRoute,
]);

// Create the router
const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export { router };